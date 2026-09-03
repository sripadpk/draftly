import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
)

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

app.post('/api/documents', async (req, res) => {
  const { title, ownerId } = req.body

  if (!title || !ownerId) {
    return res.status(400).json({
      message: 'title and ownerId are required',
    })
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      owner_id: ownerId,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      message: error.message,
    })
  }

  return res.status(201).json(data)
})

app.get('/api/documents', async (req, res) => {
  const ownerId = req.query.ownerId as string

  if (!ownerId) {
    return res.status(400).json({
      message: 'ownerId is required',
    })
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      message: error.message,
    })
  }

  return res.json(data)
})

app.get('/api/documents/:id', async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return res.status(404).json({
      message: 'Document not found',
    })
  }

  return res.json(data)
})

app.patch('/api/documents/:id', async (req, res) => {
  const { id } = req.params
  const { title, content } = req.body

  if (!title && !content) {
    return res.status(400).json({
      message: 'title or content is required',
    })
  }

  const updates: {
    title?: string
    content?: unknown
    updated_at: string
  } = {
    updated_at: new Date().toISOString(),
  }

  if (title !== undefined) {
    updates.title = title
  }

  if (content !== undefined) {
    updates.content = content
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      message: error.message,
    })
  }

  return res.json(data)
})

app.post('/api/documents/:id/share', async (req, res) => {
  const { id } = req.params
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      message: 'email is required',
    })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .single()

  if (userError || !user) {
    return res.status(404).json({
      message: 'User not found',
    })
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (documentError || !document) {
    return res.status(404).json({
      message: 'Document not found',
    })
  }

  if (document.owner_id === user.id) {
    return res.status(400).json({
      message: 'The owner already has access',
    })
  }

  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: id,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Document is already shared with this user',
      })
    }

    return res.status(500).json({
      message: error.message,
    })
  }

  return res.status(201).json({
    message: `Document shared with ${user.name}`,
    share: data,
  })
})

app.get('/api/shared-documents', async (req, res) => {
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({
      message: 'userId is required',
    })
  }

  const { data, error } = await supabase
    .from('document_shares')
    .select(`
      id,
      created_at,
      documents (
        id,
        title,
        updated_at,
        owner_id,
        users!documents_owner_id_fkey (
          name,
          email
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      message: error.message,
    })
  }

  return res.json(data)
})

app.listen(PORT, () => {
  console.log(`Draftly API running at http://localhost:${PORT}`)
})