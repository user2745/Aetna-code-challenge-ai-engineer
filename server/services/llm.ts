import axios from 'axios'

export type LLMRole = 'system' | 'user' | 'assistant'

export interface LLMMessage {
	role: LLMRole
	content: string
}

export interface ChatOptions {
	model?: string
	temperature?: number
	maxTokens?: number
	systemPrompt?: string
}

export interface ChatResponse {
	content: string
	raw: unknown
}

export interface ChatJsonOptions extends ChatOptions {
	schemaDescription?: string
}

const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'ibm/granite4:1b-h'
const API_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat'

export async function chat(messages: LLMMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
	const mergedMessages: LLMMessage[] = options.systemPrompt
		? [{ role: 'system', content: options.systemPrompt }, ...messages]
		: messages

	try {
		const response = await axios.post(
			API_URL,
			{
				model: options.model ?? DEFAULT_MODEL,
				messages: mergedMessages,
				temperature: options.temperature ?? 0.2,
				num_predict: options.maxTokens ?? 512,
				stream: false,
			},
			{
				headers: {
					'Content-Type': 'application/json',
				},
				timeout: 30_000,
			},
		)

		const content = response.data?.message?.content?.trim() ?? ''
		return { content, raw: response.data }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown LLM error'
		throw new Error(`LLM request failed: ${message}`)
	}
}

export async function chatJson<T>(messages: LLMMessage[], options: ChatJsonOptions = {}): Promise<ChatResponse & { parsed: T }> {
	const jsonGuard =
		'You are a strict JSON generator. Respond with ONLY valid JSON, no prose. Do not include code fences.' +
		(options.schemaDescription ? ` Expected JSON shape: ${options.schemaDescription}` : '')

	const response = await chat(messages, {
		...options,
		systemPrompt: options.systemPrompt
			? `${jsonGuard}\n${options.systemPrompt}`
			: jsonGuard,
	})

	try {
		const parsed = JSON.parse(response.content) as T
		return { ...response, parsed }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown JSON parse error'
		throw new Error(`Failed to parse LLM JSON: ${message}\nContent: ${response.content}`)
	}
}


// TODO : Add personalized movie recommendations, user preference summaries, & comparative analyses
// TODO : Demonstrate prompting techniques to generate specific structured outputs (e.g., provide 5-10 example ratings or movie details for prediction tasks). Test with varied inputs 