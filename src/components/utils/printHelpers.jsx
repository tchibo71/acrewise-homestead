import { format } from "date-fns";

export const printReport = ({ title, subtitle, data, columns, fileName }) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print reports');
    return;
  }

  const tableRows = data.map((item, idx) => {
    const cells = columns.map(col => {
      const value = item[col.key];
      let displayValue = value;
      
      if (value === null || value === undefined) {
        displayValue = '-';
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }
      
      return `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">${displayValue}</td>`;
    }).join('');
    
    return `<tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}">${cells}</tr>`;
  }).join('');

  const tableHeaders = columns.map(col => 
    `<th style="padding: 12px; text-align: left; background: #f3f4f6; border-bottom: 2px solid #d1d5db; font-weight: 600;">${col.label}</th>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          color: #1f2937;
        }
        h1 {
          color: #059669;
          margin-bottom: 8px;
          font-size: 28px;
        }
        .subtitle {
          color: #6b7280;
          margin-bottom: 24px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated from Homestead Acres on ${format(new Date(), 'PPP')}</p>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};