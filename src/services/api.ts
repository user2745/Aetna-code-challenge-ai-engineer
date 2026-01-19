import type { ChatRequest, ChatResponse } from '../types'

const API_BASE = '/api'

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
	const response = await fetch(`${API_BASE}/chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	})

	if (!response.ok) {
		const detail = await safeParseError(response)
		throw new Error(detail ?? `Chat request failed with ${response.status}`)
	}

	return response.json() as Promise<ChatResponse>
}

async function safeParseError(response: Response) {
	try {
		const data = (await response.json()) as { error?: string }
		return data.error
	} catch (_err) {
		return undefined
	}
}
