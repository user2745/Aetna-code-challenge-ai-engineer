import type { ChatMessage as ChatMessageModel } from '../types'

type Props = {
	message: ChatMessageModel
}

function ChatMessage({ message }: Props) {
	const isUser = message.role === 'user'

	return (
		<div className={`message-row ${isUser ? 'from-user' : 'from-assistant'}`}>
			<div className="message-meta">
				<span className="pill">{isUser ? 'You' : 'AI'}</span>
				{message.status === 'pending' && (
					<span className="status">typing...</span>
				)}
				{message.status === 'error' && (
					<span className="status error">error</span>
				)}
			</div>
			<div className="message-bubble">{message.content}</div>
		</div>
	)
}

export default ChatMessage
