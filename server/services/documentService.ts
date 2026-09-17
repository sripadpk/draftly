import { supabase } from '../lib/supabase'

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
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getDocumentById(id: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateDocument(
  id: string,
  updates: {
    title?: string
    content?: unknown
  }
) {
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
    throw new Error(error.message)
  }

  return data
}

export async function shareDocument(
  documentId: string,
  email: string
) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  const { data: document, error: documentError } =
    await supabase
      .from('documents')
      .select('id, owner_id')
      .eq('id', documentId)
      .single()

  if (documentError || !document) {
    throw new Error('Document not found')
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