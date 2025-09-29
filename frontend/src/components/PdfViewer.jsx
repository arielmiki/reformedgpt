import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button, Spin } from 'antd';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ file, page, highlight, onClose }) {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const textRenderer = (textItem) => {
    if (highlight && textItem.str.includes(highlight)) {
      const parts = textItem.str.split(new RegExp(`(${highlight})`, 'gi'));
      return parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} style={{ backgroundColor: 'yellow' }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    }
    return textItem.str;
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4>{file}</h4>
        <Button onClick={onClose}>Close</Button>
      </div>
      <Document
        file={`${API_BASE_URL}/api/static/${file}`}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<Spin size="large" />}
      >
        <Page
          pageNumber={page || 1}
          customTextRenderer={textRenderer}
        />
      </Document>
    </div>
  );
}
