import { useMemo, useState } from 'react'
import ChatInput from './components/ChatInput'
import ChatMessage from './components/ChatMessage'
import EnrichmentStatus from './components/EnrichmentStatus'
import type { ChatMessage as ChatMessageModel } from './types'
import './App.css'

const seedMessages: ChatMessageModel[] = [
  {
    id: 'seed-1',
    role: 'assistant',
    content: 'Hi there! Ask a question and I will respond.',
    status: 'complete',
  },
]

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function App() {
  const [messages, setMessages] = useState<ChatMessageModel[]>(seedMessages)
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()

  const hasMessages = useMemo(() => messages.length > 0, [messages])

  const sendToBackend = async (prompt: string, pendingId: string) => {
    // TODO: replace with real API call. Keep this stub so the UI is wired.
    // Example: const { message, conversationId } = await postChat({ prompt })
    await new Promise((resolve) => setTimeout(resolve, 900))

    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              content: `Placeholder response for: "${prompt}"`,
              status: 'complete',
            }
          : m
      )
    )

    // setConversationId(nextConversationId)
  }

  const handleSend = async (text: string) => {
    const userMessage: ChatMessageModel = {
      id: newId(),
      role: 'user',
      content: text,
      status: 'complete',
    }

    const pendingAssistant: ChatMessageModel = {
      id: newId(),
      role: 'assistant',
      content: 'Thinking...',
      status: 'pending',
    }

    setMessages((prev) => [...prev, userMessage, pendingAssistant])
    setIsSending(true)

    try {
      await sendToBackend(text, pendingAssistant.id)
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id
            ? { ...m, status: 'error', content: 'Something went wrong.' }
            : m
        )
      )
      console.error('chat send failed', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="chat-card">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Aetna AI Workspace</p>
            <h1>Chat Assistant</h1>
            <p className="subhead">
              Ask product or clinical questions. Backend wiring comes next.
            </p>
          </div>
          <EnrichmentStatus
            active={isSending}
            label={conversationId ? 'Continuing conversation...' : 'Thinking...'}
          />
        </header>

        <main className="chat-window">
          <div className={`message-list ${hasMessages ? '' : 'empty'}`}>
            {hasMessages ? (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            ) : (
              <div className="empty-state">
                <p>No messages yet</p>
                <p>Start typing to begin a conversation.</p>
              </div>
            )}
          </div>
        </main>

        <div className="composer">
          <ChatInput
            onSend={handleSend}
            disabled={isSending}
            placeholder="Ask anything about benefits, clinical guidance, or tooling"
          />
        </div>
      </div>
    </div>
  )
}

export default App
