import { NextFunction, Request, Response } from 'express'
import {
  generateDocument,
  editDocument,
} from '../services/aiService'

export async function generateAIController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { prompt } = req.body

    if (
      typeof prompt !== 'string' ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        message: 'A prompt is required',
      })
    }

    const document = await generateDocument(
      prompt.trim()
    )

    return res.json(document)
  } catch (error) {
    next(error)
  }
}

export async function editAIController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { content, instruction } = req.body

    if (typeof content !== 'string') {
      return res.status(400).json({
        message: 'Document content must be text',
      })
    }

    if (
      typeof instruction !== 'string' ||
      !instruction.trim()
    ) {
      return res.status(400).json({
        message: 'An instruction is required',
      })
    }

    const text = await editDocument(
      content.trim(),
      instruction.trim()
    )

    return res.json({
      text,
    })
  } catch (error) {
    next(error)
  }
}