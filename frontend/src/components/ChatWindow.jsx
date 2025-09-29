import { useRef, useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import Message from './Message';

const { Content, Footer } = Layout;

export default function ChatWindow({ messages, onSend, sending, onShowPdf }) {
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit() {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  }

  return (
    <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ padding: '24px', overflowY: 'auto', flex: '1 1 auto' }}>
        <div ref={listRef}>
          {messages.length === 0 && <Empty description="No messages yet. Start the conversation!" />}
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} source={m.source} onShowPdf={onShowPdf} />
          ))}
        </div>
      </Content>
      <Footer style={{ padding: '16px', backgroundColor: '#fff', flexShrink: 0 }}>
        <Form onFinish={handleSubmit}>
          <Form.Item style={{ margin: 0 }}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 5 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              onPressEnter={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              disabled={sending}
              suffix={
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} />
              }
            />
          </Form.Item>
        </Form>
      </Footer>
    </Layout>
  );
}
