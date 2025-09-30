import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';




// Configure the PDF.js worker
// Use Vite-friendly worker bundling instead of remote CDN to avoid CORS/issues
// Vite will turn this into a URL at build time
// IMPORTANT: Load worker from react-pdf's own pdfjs-dist to ensure versions match
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  file: string;
  pageNumber: number;
  highlight: string;
}

export function PdfViewer({ file, pageNumber, highlight }: PdfViewerProps) {

  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const textRenderer = (textItem: any) => {
    const raw = String(textItem?.str ?? '');
    if (!highlight || !raw) return raw;


    // Simple containment: mark if this text item exists within the highlight string
    const contains = highlight.toLowerCase().includes(raw.toLowerCase());
    return contains ? `<mark>${raw}</mark>` : raw;
  };

  // Normalize page number: ensure 1-based and within bounds
  const normalizedPage = Math.max(1, pageNumber  || 1);

  return (
    <div>
      <Document
        file={`http://localhost:8000/static/${file}`}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(e) => setError((e as Error)?.message || 'Failed to load PDF')}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
        <Page
            pageNumber={normalizedPage}
            customTextRenderer={textRenderer}
            renderTextLayer={true}
            renderAnnotationLayer={false}
          />    
        </div>
      </Document>
      <p>
        {error ? `Error: ${error}` : `Page ${normalizedPage} of ${numPages ?? '?'}`}
      </p>
    </div>
  );
}

