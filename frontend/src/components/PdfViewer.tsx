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
  url: string;
  pageNumber: number;
  highlight: string;
}

export function PdfViewer({ file, pageNumber, highlight, url }: PdfViewerProps) {

  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pageAspect, setPageAspect] = useState<number | null>(null); // width / height at scale=1
  const [availableHeight, setAvailableHeight] = useState<number>(0);

  function onDocumentLoadSuccess(_: { numPages: number }) {
    // no-op for now
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
        const top = el.getBoundingClientRect().top;
        setAvailableHeight(Math.max(0, Math.floor(window.innerHeight - top - 8))); // small padding
      }
    });
    ro.observe(el);
    // Initialize immediately
    setContainerWidth(el.clientWidth);
    const top = el.getBoundingClientRect().top;
    setAvailableHeight(Math.max(0, Math.floor(window.innerHeight - top - 8)));

    const onWinResize = () => {
      const t = el.getBoundingClientRect().top;
      setAvailableHeight(Math.max(0, Math.floor(window.innerHeight - t - 8)));
    };
    window.addEventListener('resize', onWinResize);
    window.addEventListener('orientationchange', onWinResize as any);
    return () => ro.disconnect();
  }, []);

  // When on small containers, start zoomed-in for readability
  useEffect(() => {
    if (containerWidth > 0 && availableHeight > 0 && pageAspect) {
      // Fit whole page in view by default (width constrained by both container and height)
      const fitWidthFromHeight = availableHeight * pageAspect;
      // Set zoom so base calculation (with zoom=1) fits page exactly; user can adjust afterward
      setZoom(1);
    }
  }, [containerWidth, availableHeight, pageAspect]);

  const textRenderer = (textItem: any) => {
    const raw = String(textItem?.str ?? '');
    if (!highlight || !raw) return raw;

    // Simple containment: mark if this text item exists within the highlight string
    const contains = highlight.toLowerCase().includes(raw.toLowerCase());
    return contains ? `<mark>${raw}</mark>` : raw;
  };

  // Normalize page number: ensure 1-based and within bounds
  const normalizedPage = Math.max(1, pageNumber  || 1);
  const baseWidth = (() => {
    if (containerWidth <= 0) return 0;
    if (availableHeight > 0 && pageAspect) {
      const fitWidthFromHeight = availableHeight * pageAspect;
      return Math.min(containerWidth, fitWidthFromHeight);
    }
    return containerWidth;
  })();
  const pageWidth = baseWidth > 0 ? Math.min(1600, Math.floor(baseWidth * zoom)) : undefined;

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
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(e) => setError((e as Error)?.message || 'Failed to load PDF')}
        loading={null}
      >
        <div style={{ position: 'relative', display: 'block', width: '100%', margin: 0 }}>
          {/* Zoom controls */}
          <div
            style={{
              position: 'sticky',
              top: 8,
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              padding: '4px 0',
              zIndex: 1,
            }}
          >
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', background: 'white' }}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', background: 'white' }}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          <Page
            pageNumber={normalizedPage}
            customTextRenderer={textRenderer}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            width={pageWidth}
            loading={null}
            className="pdf-page"
            onLoadSuccess={(page) => {
              try {
                const vp = page.getViewport({ scale: 1 });
                if (vp && vp.width && vp.height) setPageAspect(vp.width / vp.height);
              } catch {}
            }}
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

