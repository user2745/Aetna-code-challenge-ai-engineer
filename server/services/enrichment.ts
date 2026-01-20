import fs from 'node:fs'
import path from 'node:path'
import { db, type Movie } from './db.js'
import { chatJson, type LLMMessage } from './llm.js'

export interface EnrichedMovie extends Movie {
	sentimentScore: number // -1 to 1
	budgetTier: 'low' | 'medium' | 'high' | 'unknown'
	revenueTier: 'low' | 'medium' | 'high' | 'unknown'
	productionEffectiveness: number // revenue / budget
	popularityCategory: 'niche' | 'moderate' | 'blockbuster' | 'unknown'
}

const ENRICHED_DATA_PATH = path.resolve(process.cwd(), 'data/enriched-movies.json')

function ensureDataDir() {
	const dir = path.dirname(ENRICHED_DATA_PATH)
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}
}

function tierFromValue(value: number | null, buckets: [number, number]): 'low' | 'medium' | 'high' | 'unknown' {
	if (value == null || Number.isNaN(value)) return 'unknown'
	if (value < buckets[0]) return 'low'
	if (value < buckets[1]) return 'medium'
	return 'high'
}

function computeDerived(movie: Movie) {
	const budgetTier = tierFromValue(movie.budget, [10_000_000, 50_000_000])
	const revenueTier = tierFromValue(movie.revenue, [50_000_000, 200_000_000])

	const productionEffectiveness =
		movie.budget && movie.revenue && movie.budget > 0 ? movie.revenue / movie.budget : 0

	const popularityCategory: EnrichedMovie['popularityCategory'] = (() => {
		const revenue = movie.revenue ?? 0
		if (revenue <= 0) return 'unknown'
		if (revenue < 10_000_000) return 'niche'
		if (revenue < 100_000_000) return 'moderate'
		return 'blockbuster'
	})()

	return { budgetTier, revenueTier, productionEffectiveness, popularityCategory }
}

async function analyzeSentiment(overview: string | null): Promise<number> {
	if (!overview) return 0

	const messages: LLMMessage[] = [
		{
			role: 'user',
			content:
				'Analyze the sentiment of this movie overview. Return a JSON object with a single numeric field "score" between -1 and 1. Overview: ' +
				overview,
		},
	]

	try {
		const response = await chatJson<{ score: number }>(messages, {
			schemaDescription: '{ "score": number between -1 and 1 }',
		})
		const rawScore = response.parsed.score
		if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) return 0
		return Math.max(-1, Math.min(1, rawScore))
	} catch (error) {
		console.warn('Sentiment analysis failed, defaulting to 0:', error)
		return 0
	}
}

async function enrichMovie(movie: Movie): Promise<EnrichedMovie> {
	const derived = computeDerived(movie)
	const sentimentScore = await analyzeSentiment(movie.overview)

	return {
		...movie,
		sentimentScore,
		...derived,
	}
}

export async function loadOrEnrichMovies(): Promise<EnrichedMovie[]> {
	if (fs.existsSync(ENRICHED_DATA_PATH)) {
		const cached = fs.readFileSync(ENRICHED_DATA_PATH, 'utf8')
		try {
			const parsed = JSON.parse(cached) as EnrichedMovie[]
			console.log(`📦 Loaded ${parsed.length} enriched movies from cache`)
			return parsed
		} catch (error) {
			console.warn('Failed to parse enriched cache, regenerating:', error)
		}
	}

	console.log('🔄 Enriching movies (this may take a moment)...')
	// The dataset is ~9k entries; pull a generous upper bound to fetch all.
	const movies = db.getRandomMovies(10_000)
	const enriched: EnrichedMovie[] = []
	const total = movies.length
	const startTime = Date.now()

	console.log(`📊 Total movies to process: ${total}`)
	console.log('⏱️  Estimating ~1-2 seconds per movie with LLM sentiment analysis\n')

	for (let i = 0; i < movies.length; i += 1) {
		const movie = movies[i]
		const movieNum = i + 1
		const percent = ((movieNum / total) * 100).toFixed(1)
		
		try {
			const enrichedMovie = await enrichMovie(movie)
			enriched.push(enrichedMovie)
			
			// Show progress every 10 movies or on the last one
			if (movieNum % 10 === 0 || i === movies.length - 1) {
				const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
				const rate = movieNum / parseFloat(elapsed)
				const remaining = (total - movieNum) / rate
				const eta = remaining > 60 ? `${(remaining / 60).toFixed(1)}m` : `${remaining.toFixed(0)}s`
				
				console.log(`  [${percent}%] ${movieNum}/${total} | "${movie.title.substring(0, 40)}" | Elapsed: ${elapsed}s | ETA: ${eta}`)
			}
		} catch (error) {
			console.warn(`  ⚠️  Failed to enrich movieId=${movie.movieId} (${movie.title})`, error)
		}
	}

	ensureDataDir()
	fs.writeFileSync(ENRICHED_DATA_PATH, JSON.stringify(enriched, null, 2), 'utf8')
	console.log(`✅ Enriched ${enriched.length} movies and cached to data/enriched-movies.json`)

	return enriched
}
