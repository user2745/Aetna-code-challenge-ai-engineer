import { OllamaEmbeddings } from '@langchain/ollama'
import type { EnrichedMovie } from './enrichment.js'

interface VectorDoc {
	content: string
	embedding: number[]
}

export interface SimpleVectorStore {
	search(query: string, k?: number): Promise<string[]>
}

function buildSchemaContent(): string {
	return `movies table columns: movieId (primary key), imdbId, title, overview, productionCompanies, releaseDate, budget (USD), revenue (USD), runtime (minutes), language, genres (pipe-separated), status.
ratings table columns: ratingId (primary key), userId, movieId (FK to movies.movieId), rating (0-5), timestamp (unix seconds).
Typical joins: movies.movieId = ratings.movieId.`
}

function buildMovieContent(movie: EnrichedMovie): string {
	const parts = [
		`Title: ${movie.title}`,
		movie.overview ? `Overview: ${movie.overview}` : null,
		movie.genres ? `Genres: ${movie.genres}` : null,
		movie.releaseDate ? `Release date: ${movie.releaseDate}` : null,
		`Budget: ${movie.budget ?? 'unknown'}`,
		`Revenue: ${movie.revenue ?? 'unknown'}`,
		`Budget tier: ${movie.budgetTier}`,
		`Revenue tier: ${movie.revenueTier}`,
		`Effectiveness: ${movie.productionEffectiveness.toFixed(2)}`,
		`Popularity: ${movie.popularityCategory}`,
		`Language: ${movie.language ?? 'unknown'}`,
	]

	return parts.filter(Boolean).join('\n')
}

function cosineSimilarity(a: number[], b: number[]): number {
	const minLength = Math.min(a.length, b.length)
	let dot = 0
	let magA = 0
	let magB = 0
	for (let i = 0; i < minLength; i += 1) {
		dot += a[i] * b[i]
		magA += a[i] * a[i]
		magB += b[i] * b[i]
	}
	if (magA === 0 || magB === 0) return 0
	return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export async function buildVectorStore(enrichedMovies: EnrichedMovie[]): Promise<SimpleVectorStore> {
	const embedder = new OllamaEmbeddings({ model: process.env.OLLAMA_MODEL ?? 'ibm/granite4:1b-h' })
	const contents = [buildSchemaContent(), ...enrichedMovies.map(buildMovieContent)]
	const embeddings = await embedder.embedDocuments(contents)

	const docs: VectorDoc[] = contents.map((content, idx) => ({ content, embedding: embeddings[idx] }))

	return {
		async search(query: string, k = 4) {
			const queryEmbedding = await embedder.embedQuery(query)
			const scored = docs.map(doc => ({
				score: cosineSimilarity(queryEmbedding, doc.embedding),
				content: doc.content,
			}))
			scored.sort((a, b) => b.score - a.score)
			return scored.slice(0, k).map(item => item.content)
		},
	}
}
