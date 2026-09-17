import { NextFunction, Request, Response } from 'express'
import { AppError } from './AppError'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error)

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    })
  }

  return res.status(500).json({
    message: 'Something went wrong',
  })
}