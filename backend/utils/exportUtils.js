const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const stream = require('stream');

function exportToCSV(data) {
  const parser = new Parser();
  return parser.parse(data);
}

async function exportToExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');
  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    worksheet.addRows(data);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function exportToPDF(data, tipo) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const passThrough = new stream.PassThrough();
  doc.pipe(passThrough);
  doc.fontSize(18).text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, { align: 'center' });
  doc.moveDown();
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    doc.fontSize(10);
    // Header
    headers.forEach(h => doc.text(h, { continued: true, width: 100, align: 'left' }));
    doc.moveDown();
    // Rows
    data.forEach(row => {
      headers.forEach(h => doc.text(String(row[h] ?? ''), { continued: true, width: 100, align: 'left' }));
      doc.moveDown();
    });
  } else {
    doc.text('No hay datos para mostrar.');
  }
  doc.end();
  const chunks = [];
  for await (const chunk of passThrough) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = { exportToCSV, exportToExcel, exportToPDF }; 