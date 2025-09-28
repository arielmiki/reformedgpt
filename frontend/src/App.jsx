import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { listSessions, createSession } from './api'

export default function App() {
  const [currentId, setCurrentId] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    async function boot() {
      try {
        const sessions = await listSessions()
        if (sessions.length === 0) {
          const s = await createSession('New Chat')
          setCurrentId(s.id)
        } else {
          setCurrentId(sessions[0].id)
        }
      } finally {
        setBooting(false)
      }
    }
    boot()
  }, [])

  return (
    <div className="h-screen flex">
      <Sidebar currentId={currentId} onSelect={setCurrentId} onCreated={(s)=>{}} />
      {booting ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <ChatWindow sessionId={currentId} />
      )}
    </div>
  )
}
