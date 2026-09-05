import type { Document, DocumentSummary, SharedDocumentResponse, ShareResponse } from '../types'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
  listMine(userId: string) {
  return request<DocumentSummary[]>(
    `/api/documents?ownerId=${userId}`
  )
},

  listShared(userId: string) {
    return request<SharedDocumentResponse[]>(
      `/api/shared-documents?userId=${userId}`
    )
  },

  get(id: string) {
  return request<Document>(
    `/api/documents/${id}`
  )
},

  create(title: string, ownerId: string) {
  return request<DocumentSummary>(
    '/api/documents',
    {
      method: 'POST',
      body: JSON.stringify({
        title,
        ownerId,
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