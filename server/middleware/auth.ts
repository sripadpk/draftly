import { NextFunction, Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    const token = authorization.replace('Bearer ', '')

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
  return res.status(401).json({
    message: 'Invalid or expired token',
  })
}

const { data: profile, error: profileError } =
  await supabase
    .from('users')
    .select('id, name, email, auth_user_id')
    .eq('auth_user_id', user.id)
    .single()

if (profileError || !profile) {
  return res.status(401).json({
    message: 'Draftly user profile not found',
  })
}

req.user = profile

next()
  } catch (error) {
    next(error)
  }
}