import { useEffect, useRef, useState } from 'react';
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
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Resize observer to make the page fit the available width (great for mobile)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        // Add small padding allowance
        setContainerWidth(Math.max(0, Math.floor(cr.width)));
      }
    });
    ro.observe(el);
    // Initialize immediately
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const textRenderer = (textItem: any) => {
    const raw = String(textItem?.str ?? '');
    if (!highlight || !raw) return raw;

    // Simple containment: mark if this text item exists within the highlight string
    const contains = highlight.toLowerCase().includes(raw.toLowerCase());
    return contains ? `<mark>${raw}</mark>` : raw;
  };

  // Normalize page number: ensure 1-based and within bounds
  const normalizedPage = Math.max(1, pageNumber  || 1);
  const pageWidth = containerWidth > 0 ? containerWidth : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflow: 'auto',
        padding: 0,
        display: 'block',
      }}
    >
      <Document
        file={`http://localhost:8000/static/${file}`}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(e) => setError((e as Error)?.message || 'Failed to load PDF')}
        loading={null}
      >
        <div style={{ position: 'relative', display: 'block', width: '100%', margin: 0 }}>
          <Page
            pageNumber={normalizedPage}
            customTextRenderer={textRenderer}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            width={pageWidth}
            loading={null}
            className="pdf-page"
          />
        </div>
      </Document>
      {error && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {`Error: ${error}`}
        </div>
      )}
    </div>
  );
}

