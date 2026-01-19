import path from 'node:path'
import Database from 'better-sqlite3'

export interface Movie {
	movieId: number
	imdbId: string
	title: string
	overview: string | null
	productionCompanies: string | null
	releaseDate: string | null
	budget: number | null
	revenue: number | null
	runtime: number | null
	language: string | null
	genres: string | null
	status: string | null
}

export interface Rating {
	ratingId: number
	userId: number
	movieId: number
	rating: number
	timestamp: number
}

const moviesDbPath = path.resolve(process.cwd(), 'db/movies.db')
const ratingsDbPath = path.resolve(process.cwd(), 'db/ratings.db')

const moviesDb = new Database(moviesDbPath, { readonly: true })
const ratingsDb = new Database(ratingsDbPath, { readonly: true })

function mapMovie(row: any): Movie {
	return {
		movieId: row.movieId,
		imdbId: row.imdbId,
		title: row.title,
		overview: row.overview ?? null,
		productionCompanies: row.productionCompanies ?? null,
		releaseDate: row.releaseDate ?? null,
		budget: row.budget ?? null,
		revenue: row.revenue ?? null,
		runtime: row.runtime ?? null,
		language: row.language ?? null,
		genres: row.genres ?? null,
		status: row.status ?? null,
	}
}

function mapRating(row: any): Rating {
	return {
		ratingId: row.ratingId,
		userId: row.userId,
		movieId: row.movieId,
		rating: row.rating,
		timestamp: row.timestamp,
	}
}

export const db = {
	getMovieById(movieId: number): Movie | null {
		const stmt = moviesDb.prepare(
			'SELECT movieId, imdbId, title, overview, productionCompanies, releaseDate, budget, revenue, runtime, language, genres, status FROM movies WHERE movieId = ?',
		)
		const row = stmt.get(movieId)
		return row ? mapMovie(row) : null
	},

	getRandomMovies(limit: number): Movie[] {
		const stmt = moviesDb.prepare(
			'SELECT movieId, imdbId, title, overview, productionCompanies, releaseDate, budget, revenue, runtime, language, genres, status FROM movies ORDER BY RANDOM() LIMIT ?',
		)
		const rows = stmt.all(limit)
		return rows.map(mapMovie)
	},

	getRatingsForMovie(movieId: number): Rating[] {
		const stmt = ratingsDb.prepare(
			'SELECT ratingId, userId, movieId, rating, timestamp FROM ratings WHERE movieId = ? ORDER BY timestamp DESC',
		)
		const rows = stmt.all(movieId)
		return rows.map(mapRating)
	},

	getUserRatings(userId: number): Rating[] {
		const stmt = ratingsDb.prepare(
			'SELECT ratingId, userId, movieId, rating, timestamp FROM ratings WHERE userId = ? ORDER BY timestamp DESC',
		)
		const rows = stmt.all(userId)
		return rows.map(mapRating)
	},

	getTopRatedMovies(limit: number): { movieId: number; avgRating: number; count: number }[] {
		const stmt = ratingsDb.prepare(
			'SELECT movieId, AVG(rating) AS avgRating, COUNT(*) AS count FROM ratings GROUP BY movieId HAVING count > 5 ORDER BY avgRating DESC LIMIT ?',
		)
		return stmt.all(limit).map((row: any) => ({
			movieId: row.movieId,
			avgRating: row.avgRating,
			count: row.count,
		}))
	},
}
