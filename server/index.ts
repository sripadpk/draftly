import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { supabase } from './lib/supabase'
import documentRoutes from './routes/documentRoutes'
import { errorHandler } from './middleware/errorHandler'
import { requireAuth } from './middleware/auth'
import aiRoutes from './routes/aiRoutes'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const { error } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    })
  }

  return res.json({
    status: 'ok',
    message: 'Draftly API is connected to Supabase',
  })
})

app.use('/api', requireAuth, documentRoutes)

app.use('/api/ai', requireAuth, aiRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Draftly API running at http://localhost:${PORT}`)
})