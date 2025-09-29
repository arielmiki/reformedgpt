import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';


// Configure the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
interface PdfViewerProps {
  file: string;
  pageNumber: number;
  highlight: string;
}

export function PdfViewer({ file, pageNumber, highlight }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const textRenderer = (textItem: any) => {
    if (!highlight || !textItem.str) {
      return textItem.str;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = textItem.str.split(regex);

    return parts.map((part: string, index: number) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  return (
    <div>
      <Document file={`http://localhost:8000/static/${file}`} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          pageNumber={pageNumber}
          customTextRenderer={textRenderer}
        />
      </Document>
      <p>
        Page {pageNumber} of {numPages}
      </p>
    </div>
  );
}
