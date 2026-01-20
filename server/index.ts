import express from 'express'
import cors from 'cors'
import session from 'express-session'
import router from './chatHandler.js'
import { loadOrEnrichMovies, type EnrichedMovie } from './services/enrichment.js'
import { buildVectorStore, type SimpleVectorStore } from './services/vectorStore.js'

declare module 'express-serve-static-core' {
	interface Locals {
		enrichedMovies?: EnrichedMovie[]
		vectorStore?: SimpleVectorStore
	}
}

const app = express()
const PORT = Number(process.env.PORT ?? 5174)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(
	session({
		secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false },
	}),
)

app.use('/api', router)

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

async function start() {
	try {
		console.log('🚀 Initializing application...')
		const enrichedMovies = await loadOrEnrichMovies()
		const vectorStore = await buildVectorStore(enrichedMovies)
		app.locals.enrichedMovies = enrichedMovies
		app.locals.vectorStore = vectorStore
		console.log('✅ Initialization complete')

		app.listen(PORT, () => {
			console.log(`Server listening on port ${PORT}`)
		})
	} catch (error) {
		console.error('❌ Failed to start server:', error)
		process.exit(1)
	}
}

start()
