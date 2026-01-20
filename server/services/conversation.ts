import type { Session, SessionData } from 'express-session'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
	role: ChatRole
	content: string
	timestamp: number
	meta?: Record<string, unknown>
}

export interface ConversationState {
	history: ChatMessage[]
	lastUpdated: number
}

export type ConversationSession = Session & Partial<SessionData> & {
	conversation?: ConversationState
}

export const MAX_HISTORY = 30
const DEFAULT_CONTEXT_LIMIT = 12
const now = () => Date.now()

export function ensureConversation(session: ConversationSession): ConversationState {
	if (!session.conversation) {
		session.conversation = { history: [], lastUpdated: now() }
	}
	return session.conversation
}

export function appendMessage(
	session: ConversationSession,
	msg: Omit<ChatMessage, 'timestamp'> & { timestamp?: number },
): ConversationState {
	const conversation = ensureConversation(session)
	const timestamp = msg.timestamp ?? now()
	conversation.history.push({ ...msg, timestamp })
	if (conversation.history.length > MAX_HISTORY) {
		conversation.history = conversation.history.slice(-MAX_HISTORY)
	}
	conversation.lastUpdated = now()
	session.conversation = conversation
	return conversation
}

export function getRecentHistory(session: ConversationSession, limit = DEFAULT_CONTEXT_LIMIT): ChatMessage[] {
	const conversation = ensureConversation(session)
	return conversation.history.slice(-limit)
}

export function resetConversation(session: ConversationSession): void {
	session.conversation = { history: [], lastUpdated: now() }
}

export function buildContext(session: ConversationSession, limit = DEFAULT_CONTEXT_LIMIT): ChatMessage[] {
	return getRecentHistory(session, limit)
}
