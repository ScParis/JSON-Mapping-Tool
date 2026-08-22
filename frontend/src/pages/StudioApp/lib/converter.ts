// Converter utilities with zero external npm dependency constraints

// Docx / File import fallback
export const convertDocxToContent = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    return text;
  } catch (err) {
    console.error("Erro ao ler conteúdo do arquivo:", err);
    return "";
  }
};

// Exportar Conteúdo para PDF via Browser Native Print / PDF Stream
export const exportToPDF = async (content: string): Promise<void> => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Documento Exportado</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            padding: 40px; 
            line-height: 1.6; 
            color: #1a202c; 
            max-width: 800px; 
            margin: 0 auto; 
          }
          h1, h2, h3 { color: #0f172a; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};

// Exportar HTML Renderizado para DOCX / DOC MHTML nativo
export const exportToDocx = async (content: string): Promise<void> => {
  const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="UTF-8">
    <title>Documento Exportado</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 1in;
            color: #1a202c;
        }
        h1, h2, h3 {
            font-family: Arial, sans-serif;
            color: #1a202c;
        }
        h1 { font-size: 24pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        h2 { font-size: 18pt; margin-top: 18pt; }
        h3 { font-size: 14pt; margin-top: 14pt; }
        p { font-size: 11pt; margin-bottom: 10pt; }
        ul, ol { margin-left: 20pt; }
        code { font-family: monospace; background-color: #f7fafc; padding: 2px 4px; border-radius: 4px; }
        pre { background-color: #f7fafc; padding: 10px; font-family: monospace; margin-bottom: 10pt; word-wrap: break-word; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
  const blob = new Blob([wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'documento.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};
