import express from 'express'
import { chat } from './services/llm'
import type { ChatRequest, ChatResponse, ChatMessage } from './types'

const router = express.Router()

const systemPrompt =
	process.env.SYSTEM_PROMPT ??
	'You are a concise, helpful assistant for Aetna teammates. Provide clear, actionable answers.'

const newId = () =>
	typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2)

router.post('/chat', async (req, res) => {
	const body = req.body as ChatRequest

	if (!body?.message || !body.message.trim()) {
		res.status(400).json({ error: 'message is required' })
		return
	}

	const conversationId = body.conversationId ?? `conv-${Date.now()}`

	try {
		const llmResponse = await chat(
			[
				{
					role: 'user',
					content: body.message,
				},
			],
			{
				systemPrompt,
			}
		)

		const message: ChatMessage = {
			id: newId(),
			role: 'assistant',
			content: llmResponse.content,
			status: 'complete',
		}

		const payload: ChatResponse = {
			message,
			conversationId,
		}

		res.json(payload)
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'Unknown error'
		console.error('chat handler error', detail)
		res.status(500).json({ error: detail })
	}
})

export default router
