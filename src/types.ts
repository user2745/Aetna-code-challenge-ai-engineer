export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessageStatus = 'complete' | 'pending' | 'error'

export interface ChatMessage {
	id: string
	role: ChatRole
	content: string
	status?: ChatMessageStatus
}

export interface ChatRequest {
	message: string
	conversationId?: string
}

export interface ChatResponse {
	message: ChatMessage
	conversationId?: string
}
