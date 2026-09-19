import { supabase } from '../lib/supabase'
import { AppError } from '../middleware/AppError'

export async function createDocument(
  title: string,
  ownerId: string
) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      owner_id: ownerId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getDocumentsByOwner(
  ownerId: string
) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getDocumentById(
  id: string,
  userId: string
) {
  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !document) {
    throw new AppError('Document not found', 404)
  }

  // Owner always has access
  if (document.owner_id === userId) {
    return document
  }

  // Check whether the user has been granted access
  const { data: share, error: shareError } = await supabase
    .from('document_shares')
    .select('id')
    .eq('document_id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (shareError) {
    throw new AppError(
      'Failed to check document access',
      500
    )
  }

  if (!share) {
    throw new AppError('Document not found', 404)
  }

  return document
}

export async function updateDocument(
  id: string,
  userId: string,
  updates: { title?: string; content?: unknown }
) {
  const { data: document, error: documentError } =
    await supabase
      .from('documents')
      .select('id, owner_id, deleted_at')
      .eq('id', id)
      .single()

  if (documentError || !document) {
    throw new AppError('Document not found', 404)
  }

  if (document.owner_id !== userId) {
    throw new AppError(
      'You do not have permission to edit this document',
      403
    )
  }

  if (document.deleted_at) {
    throw new AppError(
      'Cannot edit a document in Trash',
      400
    )
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new AppError(error.message, 500)
  }

  return data
}

/*
 * Move a document to Trash.
 * This is a soft delete — the document row remains in the database.
 */
export async function moveDocumentToTrash(
  id: string,
  userId: string
) {
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, owner_id, deleted_at')
    .eq('id', id)
    .single()

  if (error || !document) {
    throw new AppError('Document not found', 404)
  }

  if (document.owner_id !== userId) {
    throw new AppError(
      'You do not have permission to move this document to Trash',
      403
    )
  }

  if (document.deleted_at) {
    throw new AppError(
      'Document is already in Trash',
      400
    )
  }

  const { data, error: updateError } = await supabase
    .from('documents')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new AppError(updateError.message, 500)
  }

  return data
}

/*
 * Restore a document from Trash.
 */
export async function restoreDocument(
  id: string,
  userId: string
) {
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, owner_id, deleted_at')
    .eq('id', id)
    .single()

  if (error || !document) {
    throw new AppError('Document not found', 404)
  }

  if (document.owner_id !== userId) {
    throw new AppError(
      'You do not have permission to restore this document',
      403
    )
  }

  if (!document.deleted_at) {
    throw new AppError(
      'Document is not in Trash',
      400
    )
  }

  const { data, error: updateError } = await supabase
    .from('documents')
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new AppError(updateError.message, 500)
  }

  return data
}

/*
 * Permanently delete a document.
 * This should only be called from the Trash.
 */
export async function permanentlyDeleteDocument(
  id: string,
  userId: string
) {
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, owner_id, deleted_at')
    .eq('id', id)
    .single()

  if (error || !document) {
    throw new AppError('Document not found', 404)
  }

  if (document.owner_id !== userId) {
    throw new AppError(
      'You do not have permission to delete this document',
      403
    )
  }

  if (!document.deleted_at) {
    throw new AppError(
      'Only documents in Trash can be permanently deleted',
      400
    )
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new AppError(deleteError.message, 500)
  }

  return {
    message: 'Document permanently deleted',
  }
}

export async function getTrashDocuments(
  userId: string
) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function shareDocument(
  documentId: string,
  userId: string,
  email: string
) {
  const { data: document, error: documentError } =
    await supabase
      .from('documents')
      .select('id, owner_id, deleted_at')
      .eq('id', documentId)
      .single()

  if (documentError || !document) {
    throw new Error('Document not found')
  }

  if (document.owner_id !== userId) {
    throw new Error(
      'You do not have permission to share this document'
    )
  }

  if (document.deleted_at) {
    throw new Error(
      'Cannot share a document in Trash'
    )
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  if (document.owner_id === user.id) {
    throw new Error('The owner already has access')
  }

  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: documentId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'Document is already shared with this user'
      )
    }

    throw new Error(error.message)
  }

  return {
    message: `Document shared with ${user.name}`,
    share: data,
  }
}

export async function getSharedDocuments(
  userId: string
) {
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
        deleted_at,
        users!documents_owner_id_fkey (
          name,
          email
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}