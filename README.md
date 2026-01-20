# Movie Systems Design 

## Pre-requisites

* An IDE or text editor of your choice
* [Sqlite3](http://www.sqlitetutorial.net/)
* Node.js v20.19+ or v22.12+ (recommended)
* [Ollama](https://ollama.ai/) running locally with a model (e.g., `ibm/granite4:1b-h` or `mistral`)
* npm or yarn package manager


## Overview
This assessment is designed for a Senior AI Engineer role and should take approximately 2-3 hours to complete. It focuses on testing your problem-solving skills, coding proficiency (in either Python or TypeScript with Node.js), data handling, SQL querying, and expertise in integrating and leveraging large language models (LLMs) for AI applications, with a strong emphasis on prompt engineering, LLM output generation, and evaluation. You'll work with a provided SQLite database containing movie-related data. The emphasis is on using LLMs to enrich data, generate outputs, and build intelligent systems through effective prompting.

**The Databases**
- The databases are provided as a SQLite3 database in `db/`.  It does not require any credentials to login.  You can run SQL queries directly against the database using:

The movies table has the following columns:

* movieid: Unique identifier for each movie.
* title: Movie title.
* imdbid: IMDb identifier.
* overview: Brief description of the movie.
* productioncompanies: Pipe-separated list of production companies.
* releasedate: Release date of the movie.
* budget: Production budget in USD.
* revenue: Box office revenue in USD.
* runtime: Movie runtime in minutes.
* language: Primary language of the movie.
* genres: Pipe-separated list of genres (e.g., "Action|Drama").
* status: Release status (e.g., "Released").

## Tasks

#### Data Preparation & data enrichment
For a sample of 50-100 movies, Use prompts to generate additional 5 additional attributes for the provided movies data. 
Examples include:
* Sentiment analysis of movie overview (positive/negative/neutral).
* Categorize budget and revenue into tiers (e.g., low/medium/high) via LLM reasoning.
* Production Effectiveness Score using rating, budget, revenue

#### Movie System Design
Develop an LLM-integrated system for movie-related tasks (e.g., recommendations, rating predictions, or natural language querying)

* Design a system that leverages the prepared movie data and LLMs to generate outputs like personalized movie recommendations, user preference summaries, & comparative analyses (e.g., comparing movies based on budget, revenue, or runtime).
* Demonstrate prompting techniques to generate specific structured outputs (e.g., provide 5-10 example ratings or movie details for prediction tasks). Test with varied inputs (e.g., "Recommend action movies with high revenue and positive sentiment" or "Summarize preferences for user based on their ratings and movie overviews").


## Submission
We prefer you upload your project to GitHub and send us a link to your repo but you can also zip up the source and send it back to us. 

---

## Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express & session middleware
- LangChain & Ollama integration
- SQLite3 database drivers
- TypeScript and development tools

### 2. Start Ollama

Make sure Ollama is running locally on port 11434:

```bash
ollama serve
```

Pull the required model (if not already available):

```bash
ollama pull ibm/granite4:1b-h
# or use another model and set OLLAMA_MODEL environment variable
```

### 3. Environment Configuration (Optional)

Create a `.env` file in the project root to customize settings:

```env
OLLAMA_MODEL=ibm/granite4:1b-h
OLLAMA_URL=http://localhost:11434/api/chat
SESSION_SECRET=your-secret-key-here
PORT=5174
```

All settings have sensible defaults and are optional for local development.

## Running the Application

### Development Mode

**Run backend only:**
```bash
npm run dev:backend
```

**Run both frontend and backend:**
```bash
npm run dev:all
```

The backend will:
1. **Enrich the database** (first run only, ~5-10 minutes depending on dataset size)
   - Load all movies from SQLite
   - Generate sentiment scores, budget/revenue tiers, effectiveness scores
   - Cache results to `data/enriched-movies.json`
2. **Build vector store** (every startup)
   - Create embeddings for movie schemas and enriched data
   - Enable semantic search for SQL query generation
3. **Start the server** on port 5174 (default)

**Note:** On first startup, enrichment may take several minutes as it processes all movies through the LLM. Subsequent startups load from cache and are much faster.

### Production Build

```bash
npm run build
npm run preview
```

## Architecture

### SQL RAG System

This implementation adapts the **PDF RAG (Retrieval-Augmented Generation)** pattern to SQL databases:

1. **Enrichment Pipeline** ([server/services/enrichment.ts](server/services/enrichment.ts))
   - Generates 5 computed attributes per movie using LLM analysis
   - Caches results to disk for fast reloads
   - Attributes: sentiment score, budget tier, revenue tier, production effectiveness, popularity category

2. **Vector Store** ([server/services/vectorStore.ts](server/services/vectorStore.ts))
   - Embeds database schema descriptions and enriched movie data
   - Custom cosine similarity search using Ollama embeddings
   - Rebuilt fresh on every startup from cached enrichment data

3. **SQL Generation** ([server/services/llm.ts](server/services/llm.ts))
   - Retrieves relevant schema context via vector similarity search
   - Prompts LLM to generate safe SELECT-only SQL queries
   - Validates generated SQL (blocks mutations, requires SELECT, single statement)

4. **Chat Handler** ([server/chatHandler.ts](server/chatHandler.ts))
   - Detects data queries in user messages
   - Generates and executes SQL using vector-augmented context
   - Grounds LLM responses in actual database results
   - Maintains conversation history via Express sessions

### Key Features

- **Natural language to SQL**: Ask questions like "Show me high-budget action movies" and get SQL-backed answers
- **Semantic search**: Vector store retrieves relevant schema context for accurate query generation
- **Safe execution**: SQL validation prevents data modification or injection attacks
- **Session-based memory**: Maintains conversation context across multiple turns
- **Graceful degradation**: Falls back to conversational mode if SQL generation fails

## Project Structure

```
server/
  ├── index.ts              # Startup initialization & Express config
  ├── chatHandler.ts        # Chat endpoint with SQL RAG integration
  ├── types.ts              # Shared TypeScript interfaces
  └── services/
      ├── db.ts             # SQLite query interface
      ├── llm.ts            # Ollama LLM client & SQL generation
      ├── enrichment.ts     # Movie enrichment pipeline
      ├── vectorStore.ts    # Embedding-based semantic search
      └── conversation.ts   # Session-based chat history

src/                        # React frontend
data/                       # Generated enrichment cache
db/                         # SQLite databases (movies.db, ratings.db)
```

## Usage Examples

**Natural language queries:**
- "What are the top 5 highest-grossing movies?"
- "Show me action movies with budgets over $100 million"
- "Which movies have the best production effectiveness scores?"
- "Find science fiction movies with positive sentiment"

**Conversational:**
- "Tell me about The Matrix"
- "Recommend similar movies"
- "What genres are most popular?"

The system automatically detects data queries and grounds responses in actual database results when appropriate. 

