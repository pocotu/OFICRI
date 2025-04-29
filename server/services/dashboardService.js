const pool = require('../config/database');
const { formatError } = require('../utils/errorHandler');

/**
 * Obtiene las estadísticas generales del dashboard
 */
async function getDashboardStats(filters = {}) {
  const { timeRange, areaId, startDate, endDate } = filters;
  
  try {
    // Construir la cláusula WHERE según los filtros
    let whereClause = '';
    let params = [];
    
    if (timeRange || startDate) {
      const dateFilter = getDateFilter(timeRange, startDate, endDate);
      whereClause = dateFilter.whereClause;
      params = dateFilter.params;
    }

    if (areaId) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'AreaID = ?';
      params.push(areaId);
    }

    // Obtener estadísticas de documentos
    const documentStats = await pool.query(`
      SELECT 
        Estado,
        COUNT(*) as total
      FROM Documentos
      ${whereClause}
      GROUP BY Estado
    `, params);

    // Obtener total de usuarios activos
    const [userStats] = await pool.query(`
      SELECT COUNT(*) as total
      FROM Usuarios
      WHERE Estado = 'ACTIVO'
    `);

    // Obtener total de áreas activas
    const [areaStats] = await pool.query(`
      SELECT COUNT(*) as total
      FROM Areas
      WHERE Estado = 'ACTIVO'
    `);

    // Obtener documentos pendientes
    const [pendingStats] = await pool.query(`
      SELECT COUNT(*) as total
      FROM Documentos
      WHERE Estado = 'PENDIENTE'
      ${whereClause}
    `, params);

    return {
      documents: documentStats[0],
      users: userStats[0].total,
      areas: areaStats[0].total,
      pending: pendingStats[0].total
    };
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Obtiene los KPIs del dashboard
 */
async function getDashboardKPIs(filters = {}) {
  const { timeRange, areaId, startDate, endDate } = filters;
  
  try {
    // Construir la cláusula WHERE según los filtros
    let whereClause = '';
    let params = [];
    
    if (timeRange || startDate) {
      const dateFilter = getDateFilter(timeRange, startDate, endDate);
      whereClause = dateFilter.whereClause;
      params = dateFilter.params;
    }

    if (areaId) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'AreaID = ?';
      params.push(areaId);
    }

    // Obtener KPIs de documentos procesados
    const [processedDocs] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(TIMESTAMPDIFF(HOUR, FechaCreacion, FechaActualizacion)) as avgProcessTime
      FROM Documentos
      WHERE Estado = 'COMPLETADO'
      ${whereClause}
    `, params);

    // Obtener KPIs de documentos por tipo
    const docTypes = await pool.query(`
      SELECT 
        TipoDocumento,
        COUNT(*) as total
      FROM Documentos
      ${whereClause}
      GROUP BY TipoDocumento
    `, params);

    // Obtener tendencias comparando con el período anterior
    const previousStats = await getPreviousStats(timeRange, areaId);

    return [
      {
        id: 'docs-procesados',
        title: 'Documentos Procesados',
        value: processedDocs[0].total,
        trend: calculateTrend(processedDocs[0].total, previousStats.processed),
        icon: 'fas fa-file-alt'
      },
      {
        id: 'tiempo-promedio',
        title: 'Tiempo Promedio de Proceso',
        value: Math.round(processedDocs[0].avgProcessTime || 0),
        trend: calculateTrend(processedDocs[0].avgProcessTime, previousStats.avgTime),
        icon: 'fas fa-clock'
      },
      ...docTypes.map(type => ({
        id: \`tipo-\${type.TipoDocumento.toLowerCase()}\`,
        title: \`Documentos \${type.TipoDocumento}\`,
        value: type.total,
        trend: calculateTrend(type.total, previousStats.byType[type.TipoDocumento] || 0),
        icon: getDocumentIcon(type.TipoDocumento)
      }))
    ];
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Obtiene las alertas del dashboard
 */
async function getDashboardAlerts(filters = {}) {
  const { timeRange, areaId, startDate, endDate } = filters;
  
  try {
    // Construir la cláusula WHERE según los filtros
    let whereClause = 'WHERE Estado = "ACTIVO"';
    let params = [];
    
    if (timeRange || startDate) {
      const dateFilter = getDateFilter(timeRange, startDate, endDate);
      whereClause += ' AND ' + dateFilter.whereClause.replace('WHERE', '');
      params = dateFilter.params;
    }

    if (areaId) {
      whereClause += ' AND AreaID = ?';
      params.push(areaId);
    }

    // Obtener alertas activas
    const alerts = await pool.query(`
      SELECT 
        a.AlertaID,
        a.Tipo,
        a.Mensaje,
        a.Severidad,
        a.FechaCreacion,
        a.Estado,
        a.Confirmada,
        u.NombreCompleto as Usuario,
        ar.NombreArea as Area
      FROM Alertas a
      LEFT JOIN Usuarios u ON a.UsuarioID = u.UsuarioID
      LEFT JOIN Areas ar ON a.AreaID = ar.AreaID
      ${whereClause}
      ORDER BY 
        CASE Severidad
          WHEN 'CRITICA' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MEDIA' THEN 3
          WHEN 'BAJA' THEN 4
        END,
        FechaCreacion DESC
    `, params);

    return alerts.map(alert => ({
      id: alert.AlertaID,
      type: alert.Tipo,
      message: alert.Mensaje,
      severity: alert.Severidad.toLowerCase(),
      createdAt: alert.FechaCreacion,
      acknowledged: alert.Confirmada === 1,
      user: alert.Usuario,
      area: alert.Area
    }));
  } catch (error) {
    throw formatError(error);
  }
}

// Funciones auxiliares

function getDateFilter(timeRange, startDate, endDate) {
  let whereClause = '';
  let params = [];

  if (startDate && endDate) {
    whereClause = 'WHERE FechaCreacion BETWEEN ? AND ?';
    params = [startDate, endDate];
  } else if (timeRange) {
    whereClause = 'WHERE FechaCreacion >= ?';
    const date = new Date();
    
    switch (timeRange) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    
    params = [date];
  }

  return { whereClause, params };
}

async function getPreviousStats(timeRange, areaId) {
  // Implementar lógica para obtener estadísticas del período anterior
  // para calcular tendencias
  return {
    processed: 0,
    avgTime: 0,
    byType: {}
  };
}

function calculateTrend(currentValue, previousValue) {
  if (!previousValue) return { value: 0, direction: 'neutral' };
  
  const difference = currentValue - previousValue;
  const percentage = Math.round((difference / previousValue) * 100);
  
  return {
    value: Math.abs(percentage),
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
  };
}

function getDocumentIcon(documentType) {
  const icons = {
    'INFORME': 'fas fa-file-alt',
    'OFICIO': 'fas fa-envelope',
    'MEMORANDO': 'fas fa-sticky-note',
    'SOLICITUD': 'fas fa-file-invoice',
    'OTROS': 'fas fa-file'
  };
  
  return icons[documentType] || icons['OTROS'];
}

module.exports = {
  getDashboardStats,
  getDashboardKPIs,
  getDashboardAlerts
}; 