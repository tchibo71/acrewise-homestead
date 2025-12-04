// Simplified export helpers using only browser built-in functionality

export const exportToPDF = (element, filename) => {
  // Use browser's print functionality
  window.print();
};

export const exportToWord = (element, filename) => {
  // For Word export, we'll create a simple HTML download
  if (!element) return;
  
  const htmlContent = element.innerHTML;
  const blob = new Blob([`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${filename.replace('.docx', '').replace(/-/g, ' ')}</h1>
      ${htmlContent}
    </body>
    </html>
  `], { type: 'text/html' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.docx', '.html');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getComponentHTML = (element) => {
  return element?.innerHTML || '';
};