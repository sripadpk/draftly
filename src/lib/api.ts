import type { Document, DocumentSummary, SharedDocumentResponse, ShareResponse } from '../types'
import { supabase } from './supabase'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',

      ...(session?.access_token
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : {}),

      ...(options?.headers || {}),
    },

    ...options,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))

    throw new Error(
      data.message || 'Something went wrong'
    )
  }

  return response.json()
}

export const documentsApi = {
  listMine() {
  return request<DocumentSummary[]>(
    '/api/documents'
  )
},

  listShared() {
  return request<SharedDocumentResponse[]>(
    '/api/shared-documents'
  )
},

  get(id: string) {
  return request<Document>(
    `/api/documents/${id}`
  )
},

  create(title: string) {
  return request<DocumentSummary>(
    '/api/documents',
    {
      method: 'POST',
      body: JSON.stringify({
        title,
      }),
    }
  )
},

  update(
    id: string,
    data: {
      title?: string
      content?: unknown
    }
  ) {
    return request<Document>(
      `/api/documents/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  },

  share(id: string, email: string) {
  return request<ShareResponse>(
    `/api/documents/${id}/share`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    }
  )
},
}