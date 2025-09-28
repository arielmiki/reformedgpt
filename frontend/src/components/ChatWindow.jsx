import { useEffect, useRef, useState } from 'react'
import { listMessages, sendMessage } from '../api'
import Message from './Message'

export default function ChatWindow({ sessionId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  async function load() {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await listMessages(sessionId)
      setMessages(data)
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  useEffect(() => {
    load()
  }, [sessionId])

  async function onSubmit(e) {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userText = input;
    setInput('');

    const tempUserMessage = {
      id: `tmp-u-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const tempAssistantMessage = {
      id: `tmp-a-${Date.now()}`,
      session_id: sessionId,
      role: 'assistant',
      content: '▋',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage, tempAssistantMessage]);
    scrollToBottom();

    try {
      await sendMessage(sessionId, userText, (data) => {
        if (data.type === 'delta') {
          setMessages(prev => prev.map(m => 
            m.id === tempAssistantMessage.id 
              ? { ...m, content: m.content === '▋' ? data.content : m.content + data.content } 
              : m
          ));
        } else if (data.type === 'final') {
          setMessages(prev => prev.map(m => 
            m.id === tempAssistantMessage.id 
              ? data.message 
              : m
          ));
          load(); // Re-load to get correct IDs
        }
      });
    } catch (e) {
      setMessages(prev => prev.map(m => 
        m.id === tempAssistantMessage.id 
          ? { ...m, content: 'Error: failed to send' } 
          : m
      ));
    } finally {
      scrollToBottom();
    }
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a chat to start.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map(m => (
          <Message key={m.id} role={m.role} content={m.content} />
        ))}
        {loading && <div className="text-sm text-gray-500">Loading…</div>}
      </div>
      <form onSubmit={onSubmit} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>
      </form>
    </div>
  )
}
