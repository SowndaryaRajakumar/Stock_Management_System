import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export structured data to Excel (.xlsx)
 */
export const exportToExcel = (data, fileName = 'Report', title = 'Stock Report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Create heading rows
  const headerInfo = [
    ['CENTRAL STORE & INVENTORY RECORD'],
    ['Consumable Stock Management System'],
    [title.toUpperCase()],
    [`Generated Date: ${new Date().toLocaleString()}`],
    [] // blank row
  ];

  const ws = XLSX.utils.aoa_to_sheet(headerInfo);

  // Append data table starting from row 6
  XLSX.utils.sheet_add_json(ws, data, { origin: 'A6' });

  // Append sheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Save file
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export structured data to formatted PDF (.pdf)
 */
export const exportToPDF = (data, columns, fileName = 'Report', title = 'Stock Report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: columns.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header styling
  doc.setFontSize(14);
  doc.setTextColor(11, 37, 69); // Navy 900
  doc.text('CENTRAL CONSUMABLE STORE', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(60, 74, 92);
  doc.text('Consumable Stock Management System — Official Stock Ledger', 14, 21);

  doc.setFontSize(12);
  doc.setTextColor(20, 80, 140);
  doc.text(title, 14, 28);

  doc.setFontSize(8);
  doc.setTextColor(140, 150, 160);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  // Format table rows
  const tableRows = data.map((item) =>
    columns.map((col) => {
      const val = item[col.dataKey];
      return val !== undefined && val !== null ? String(val) : '—';
    })
  );

  autoTable(doc, {
    startY: 38,
    head: [columns.map((c) => c.header)],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [22, 32, 46],
      lineColor: [221, 227, 236]
    },
    headStyles: {
      fillColor: [11, 37, 69],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [242, 247, 252]
    }
  });

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
