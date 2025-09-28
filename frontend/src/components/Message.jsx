export default function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-1`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 whitespace-pre-wrap ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
      }`}>
        {content}
      </div>
    </div>
  )
}
