import { useEffect, useState } from 'react'
import { listSessions, createSession } from '../api'

export default function Sidebar({ currentId, onSelect, onCreated }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const data = await listSessions()
      setSessions(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function newChat() {
    const session = await createSession('New Chat')
    await refresh()
    onCreated?.(session)
    onSelect?.(session.id)
  }

  return (
    <div className="h-full w-72 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold">Chats</h2>
        <button onClick={newChat} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">New</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect?.(s.id)}
            className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 ${currentId === s.id ? 'bg-blue-50' : ''}`}
          >
            <div className="text-sm font-medium truncate">{s.title}</div>
            <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</div>
          </button>
        ))}
        {!loading && sessions.length === 0 && (
          <div className="p-3 text-sm text-gray-500">No chats yet. Create one.</div>
        )}
      </div>
    </div>
  )
}
