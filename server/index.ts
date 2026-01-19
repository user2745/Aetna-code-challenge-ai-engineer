import express from 'express'
import cors from 'cors'
import router from './chatHandler'

const app = express()
const PORT = Number(process.env.PORT ?? 5174)

app.use(cors())
app.use(express.json())
app.use('/api', router)

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`)
})
