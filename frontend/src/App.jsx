import { useEffect, useState } from 'react';
import { Layout, Spin } from 'antd';
import ChatWindow from './components/ChatWindow';
import PdfViewer from './components/PdfViewer';
import { sendMessage } from './api';

const { Content, Sider } = Layout;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState(null);
  const [pdfState, setPdfState] = useState({ visible: false, file: null, page: null, highlight: null });

  // Load messages from localStorage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  function handleShowPdf(source) {
    if (!source) return;
    setPdfState({
      visible: true,
      file: source.metadata.source,
      page: source.metadata.page,
      highlight: source.content,
    });
  }

  async function handleSendMessage(content) {
    const userMessage = { role: 'user', content };
    const newHistory = [...messages, userMessage];

    // Add a placeholder for the assistant's response
    setMessages([...newHistory, { role: 'assistant', content: [] }]);
    setSending(true);
    setContext(null);

    // Transform the history for the backend, excluding the current user message
    const transformedHistory = messages.map(msg => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        return { ...msg, content: msg.content.map(seg => seg.value).join('') };
      }
      return msg;
    });
    transformedHistory.push(userMessage);

    try {
      await sendMessage(transformedHistory, (data) => {
        if (data.type === 'context') {
          setContext(data.data);
        } else {
          setMessages(prev => {
            // Perform a deep copy to prevent state mutation issues
            const newMessages = JSON.parse(JSON.stringify(prev));
            const lastMessage = newMessages[newMessages.length - 1];

            if (data.type === 'delta') {
              let lastSegment = lastMessage.content[lastMessage.content.length - 1];
              if (lastSegment && lastSegment.type === 'text') {
                lastSegment.value += data.data;
              } else {
                lastMessage.content.push({ type: 'text', value: data.data });
              }
            } else if (data.type === 'citation_start') {
              lastMessage.content.push({ type: 'citation', value: '', source: data.data.source });
            } else if (data.type === 'citation_delta') {
              let lastSegment = lastMessage.content[lastMessage.content.length - 1];
              if (lastSegment && lastSegment.type === 'citation') {
                lastSegment.value += data.data;
              }
            } else if (data.type === 'citation_end') {
              lastMessage.content.push({ type: 'text', value: '' });
            }

            return newMessages;
          });
        }
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          ) : (
            <ChatWindow
              messages={messages}
              onSend={handleSendMessage}
              sending={sending}
              onShowPdf={handleShowPdf}
            />
          )}
        </Content>
        {pdfState.visible && (
          <Sider width={"50%"} theme="light" style={{ height: '100vh', overflow: 'auto', borderLeft: '1px solid #f0f0f0' }}>
            <PdfViewer
              file={pdfState.file}
              page={pdfState.page}
              highlight={pdfState.highlight}
              onClose={() => setPdfState({ ...pdfState, visible: false })}
            />
          </Sider>
        )}
      </Layout>
    </Layout>
  );
}
