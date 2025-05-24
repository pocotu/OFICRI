const fs = require('fs').promises;
const path = require('path');

class FileService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
  }

  async getFileMetadata(filePath) {
    try {
      if (!filePath) return null;
      
      const fullPath = path.join(this.uploadsDir, filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        name: path.basename(filePath),
        type: this.getMimeType(filePath),
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async getFileStream(filePath) {
    try {
      if (!filePath) return null;
      const fullPath = path.join(this.uploadsDir, filePath);
      return fs.readFile(fullPath);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }
}

module.exports = new FileService(); 