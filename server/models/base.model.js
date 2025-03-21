/**
 * Base Model Class
 * Provides common database operations with security controls
 * ISO/IEC 27001 compliant data access patterns
 */

const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

class BaseModel {
  /**
   * @param {string} tableName - Database table name
   * @param {Object} options - Additional options
   */
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.primaryKey = options.primaryKey || 'ID' + tableName;
    this.softDelete = options.softDelete || false;
    this.auditChanges = options.auditChanges !== false; // Default to true
    this.sensitiveFields = options.sensitiveFields || [];
    this.requiredFields = options.requiredFields || [];
    this.uniqueFields = options.uniqueFields || [];
    this.defaultValues = options.defaultValues || {};
    this.relations = options.relations || [];
  }

  /**
   * Find record by primary key
   * @param {number|string} id - Primary key value
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Found record or null
   */
  async findById(id, options = {}) {
    try {
      const fields = options.fields || '*';
      
      let query = `SELECT ${fields} FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      
      // Add soft delete condition if enabled
      if (this.softDelete && !options.includeSoftDeleted) {
        query += ' AND IsActive = TRUE';
      }
      
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? this._sanitizeOutput(results[0]) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findById`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find all records matching criteria
   * @param {Object} criteria - Where conditions
   * @param {Object} options - Query options (limit, offset, orderBy, fields)
   * @returns {Promise<Array>} - Array of found records
   */
  async findAll(criteria = {}, options = {}) {
    try {
      const fields = options.fields || '*';
      const limit = options.limit ? parseInt(options.limit, 10) : null;
      const offset = options.offset ? parseInt(options.offset, 10) : 0;
      const orderBy = options.orderBy || this.primaryKey;
      const orderDir = options.orderDir || 'ASC';
      
      // Build query parts
      let query = `SELECT ${fields} FROM ${this.tableName}`;
      const params = [];
      
      // Add WHERE conditions
      if (Object.keys(criteria).length > 0 || (this.softDelete && !options.includeSoftDeleted)) {
        const conditions = [];
        
        // Process criteria
        Object.keys(criteria).forEach(key => {
          if (criteria[key] !== undefined) {
            conditions.push(`${key} = ?`);
            params.push(criteria[key]);
          }
        });
        
        // Add soft delete condition
        if (this.softDelete && !options.includeSoftDeleted) {
          conditions.push('IsActive = TRUE');
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // Add ORDER BY
      query += ` ORDER BY ${orderBy} ${orderDir}`;
      
      // Add LIMIT and OFFSET
      if (limit !== null) {
        query += ` LIMIT ${limit}`;
        
        if (offset > 0) {
          query += ` OFFSET ${offset}`;
        }
      }
      
      const results = await executeQuery(query, params);
      return results.map(record => this._sanitizeOutput(record));
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findAll`, { 
        criteria, 
        options, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Created record
   */
  async create(data, options = {}) {
    try {
      // Validate required fields
      this._validateRequiredFields(data);
      
      // Validate unique fields
      if (this.uniqueFields.length > 0) {
        await this._validateUniqueFields(data);
      }
      
      // Apply default values
      const recordData = {
        ...this.defaultValues,
        ...data
      };
      
      // Sanitize input data (remove sensitive or not allowed fields)
      const sanitizedData = this._sanitizeInput(recordData);
      
      // Build query
      const fields = Object.keys(sanitizedData);
      const placeholders = fields.map(() => '?');
      const values = fields.map(field => sanitizedData[field]);
      
      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      const result = await executeQuery(query, values);
      
      // Fetch and return the created record
      if (result.insertId) {
        return this.findById(result.insertId);
      }
      
      return null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.create`, { 
        data: this._sanitizeLog(data), 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update existing record
   * @param {number|string} id - Primary key value
   * @param {Object} data - Record data to update
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Updated record
   */
  async update(id, data, options = {}) {
    try {
      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        const error = new Error(`Record with ID ${id} not found in ${this.tableName}`);
        error.statusCode = 404;
        throw error;
      }
      
      // Validate unique fields
      if (this.uniqueFields.length > 0) {
        await this._validateUniqueFields(data, id);
      }
      
      // Sanitize input data
      const sanitizedData = this._sanitizeInput(data);
      
      // If no data to update, return existing record
      if (Object.keys(sanitizedData).length === 0) {
        return existingRecord;
      }
      
      // Build query
      const setClause = Object.keys(sanitizedData)
        .map(field => `${field} = ?`)
        .join(', ');
      const values = [
        ...Object.keys(sanitizedData).map(field => sanitizedData[field]),
        id
      ];
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = ?
      `;
      
      await executeQuery(query, values);
      
      // Fetch and return the updated record
      return this.findById(id);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.update`, {
        id, 
        data: this._sanitizeLog(data), 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete record (hard or soft delete)
   * @param {number|string} id - Primary key value
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id, options = {}) {
    try {
      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        const error = new Error(`Record with ID ${id} not found in ${this.tableName}`);
        error.statusCode = 404;
        throw error;
      }
      
      let query;
      const params = [id];
      
      // Use soft delete if enabled
      if (this.softDelete) {
        query = `UPDATE ${this.tableName} SET IsActive = FALSE WHERE ${this.primaryKey} = ?`;
      } else {
        query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      }
      
      const result = await executeQuery(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.delete`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Count records matching criteria
   * @param {Object} criteria - Where conditions
   * @param {Object} options - Additional options
   * @returns {Promise<number>} - Count of matching records
   */
  async count(criteria = {}, options = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params = [];
      
      // Add WHERE conditions
      if (Object.keys(criteria).length > 0 || (this.softDelete && !options.includeSoftDeleted)) {
        const conditions = [];
        
        // Process criteria
        Object.keys(criteria).forEach(key => {
          if (criteria[key] !== undefined) {
            conditions.push(`${key} = ?`);
            params.push(criteria[key]);
          }
        });
        
        // Add soft delete condition
        if (this.softDelete && !options.includeSoftDeleted) {
          conditions.push('IsActive = TRUE');
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const results = await executeQuery(query, params);
      return results[0].count;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.count`, {
        criteria,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sanitize input data
   * @param {Object} data - Input data
   * @returns {Object} - Sanitized data
   * @private
   */
  _sanitizeInput(data) {
    // Make a copy to avoid modifying the original
    const sanitized = { ...data };
    
    // Remove sensitive fields
    this.sensitiveFields.forEach(field => {
      delete sanitized[field];
    });
    
    return sanitized;
  }

  /**
   * Sanitize output data
   * @param {Object} data - Output data
   * @returns {Object} - Sanitized data
   * @private
   */
  _sanitizeOutput(data) {
    // Make a copy to avoid modifying the original
    const sanitized = { ...data };
    
    // Remove sensitive fields
    this.sensitiveFields.forEach(field => {
      delete sanitized[field];
    });
    
    return sanitized;
  }

  /**
   * Sanitize data for logging
   * @param {Object} data - Data to sanitize
   * @returns {Object} - Sanitized data
   * @private
   */
  _sanitizeLog(data) {
    // Make a copy to avoid modifying the original
    const sanitized = { ...data };
    
    // Mask sensitive fields
    this.sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @throws {Error} If required fields are missing
   * @private
   */
  _validateRequiredFields(data) {
    const missingFields = this.requiredFields.filter(field => {
      return data[field] === undefined || data[field] === null || data[field] === '';
    });
    
    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Validate unique fields
   * @param {Object} data - Data to validate
   * @param {number|string} excludeId - ID to exclude from uniqueness check
   * @returns {Promise<void>}
   * @throws {Error} If unique constraint is violated
   * @private
   */
  async _validateUniqueFields(data, excludeId = null) {
    const uniqueFieldsToCheck = this.uniqueFields.filter(field => data[field] !== undefined);
    
    for (const field of uniqueFieldsToCheck) {
      const query = `
        SELECT ${this.primaryKey} FROM ${this.tableName}
        WHERE ${field} = ?
        ${excludeId ? `AND ${this.primaryKey} != ?` : ''}
      `;
      
      const params = [data[field]];
      if (excludeId) {
        params.push(excludeId);
      }
      
      const results = await executeQuery(query, params);
      
      if (results.length > 0) {
        const error = new Error(`Value '${data[field]}' for field '${field}' already exists`);
        error.statusCode = 409; // Conflict
        throw error;
      }
    }
  }
}

module.exports = BaseModel; 