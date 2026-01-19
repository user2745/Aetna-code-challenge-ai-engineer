import type { FormEvent } from 'react'
import { useState } from 'react'

type Props = {
	onSend: (text: string) => void
	disabled?: boolean
	placeholder?: string
}

function ChatInput({ onSend, disabled, placeholder }: Props) {
	const [text, setText] = useState('')

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault()
		const trimmed = text.trim()
		if (!trimmed) return
		onSend(trimmed)
		setText('')
	}

	return (
		<form className="chat-input" onSubmit={handleSubmit}>
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={placeholder ?? 'Send a message'}
				disabled={disabled}
				rows={2}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault()
						handleSubmit(e)
					}
				}}
			/>
			<button type="submit" disabled={disabled || !text.trim()}>
				Send
			</button>
		</form>
	)
}

export default ChatInput
