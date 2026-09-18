import { createDocument as createDocumentService, getDocumentsByOwner, getDocumentById, updateDocument, shareDocument as shareDocumentService, getSharedDocuments } from '../services/documentService'
import { Request, Response } from 'express'

export async function createDocument(
  req: Request,
  res: Response
) {
  try {
    const { title } = req.body

    if (!title) {
      return res.status(400).json({
        message: 'Title is required',
      })
    }

    const ownerId = req.user!.id

    const data = await createDocumentService(
      title,
      ownerId
    )

    return res.status(201).json({
      id: data.id,
      title: data.title,
      updated_at: data.updated_at,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Failed to create document',
    })
  }
}

export async function listDocuments(
  req: Request,
  res: Response
) {
  try {
    const { ownerId } = req.query

    // We'll connect this to the service in the next step.
    return res.status(200).json({
      ownerId,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Failed to load documents',
    })
  }
}

export async function getDocuments(
  req: Request,
  res: Response
) {
  try {
    const ownerId = req.user!.id

    const data = await getDocumentsByOwner(ownerId)

    return res.json(data)
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : 'Something went wrong',
    })
  }
}

export async function getDocument(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string

    const data = await getDocumentById(id, req.user!.id)

    return res.json(data)
  } catch {
    return res.status(404).json({
      message: 'Document not found',
    })
  }
}

export async function updateDocumentController(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string
    const { title, content } = req.body

    if (!title && !content) {
      return res.status(400).json({
        message: 'title or content is required',
      })
    }

    const updates: {
      title?: string
      content?: unknown
    } = {}

    if (title !== undefined) {
      updates.title = title
    }

    if (content !== undefined) {
      updates.content = content
    }

    const data = await updateDocument(id, req.user!.id, updates)

    return res.json(data)
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : 'Something went wrong',
    })
  }
}

export async function shareDocument(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: 'email is required',
      })
    }

    const result = await shareDocumentService(id, req.user!.id, email)

    return res.status(201).json(result)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong'

    if (
      message === 'User not found' ||
      message === 'Document not found'
    ) {
      return res.status(404).json({ message })
    }

    if (
  message === 'The owner already has access' ||
  message ===
    'Document is already shared with this user'
) {
  return res.status(409).json({ message })
}

if (
  message ===
  'You do not have permission to share this document'
) {
  return res.status(403).json({ message })
}

    return res.status(500).json({ message })
  }
}

export async function getSharedDocumentsController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user!.id

    const data = await getSharedDocuments(userId)

    return res.json(data)
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : 'Something went wrong',
    })
  }
}