import { Router } from 'express'
import type { Request, Response } from 'express'
import { appendMessage, buildContext } from './services/conversation.js'
import { chat, generateSql } from './services/llm.js'
import { db } from './services/db.js'

export async function chatHandler(req: Request, res: Response) {
	try {
		const message = req.body?.message
		if (typeof message !== 'string' || !message.trim()) {
			res.status(400).json({ error: 'message is required' })
			return
		}

		appendMessage((req as any).session, { role: 'user', content: message })

		const context = buildContext((req as any).session, 12)
		const llmMessages = context.map(m => ({ role: m.role, content: m.content }))

		let sql = ''
		let rows: any[] | null = null
		try {
			const vectorStore = req.app.locals.vectorStore
			if (vectorStore) {
				const vectorContext = await vectorStore.search(message, 5)
				sql = await generateSql(message, vectorContext)
				rows = db.runSelect(sql)
			}
		} catch (error) {
			console.warn('SQL generation or execution failed, falling back to chat only:', error)
		}

		const dataBlock = rows ? JSON.stringify(rows).slice(0, 4000) : null
		const userTurn = dataBlock
			? `User question: ${message}\nGrounding data (SQL: ${sql || 'n/a'}):\n${dataBlock}`
			: message

		const response = await chat([...llmMessages, { role: 'user', content: userTurn }], {
			systemPrompt:
				'You are a helpful movie assistant. Use provided data when available. If data is present, ground your answer in it and avoid speculation. Be concise and actionable.',
			temperature: 0.3,
			maxTokens: 400,
		})

		const reply = response.content
		appendMessage((req as any).session, { role: 'assistant', content: reply })

		res.json({ reply })
	} catch (_error) {
		res.status(500).json({ error: 'Internal Server Error' })
	}
}

const router = Router()
router.post('/chat', chatHandler)
export default router
