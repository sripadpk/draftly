import type {
  Document,
  DocumentSummary,
  SharedDocumentResponse,
  ShareResponse,
} from '../types'
import { supabase } from './supabase'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let {
    data: { session },
  } = await supabase.auth.getSession()

  async function makeRequest(accessToken?: string) {
    return fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',

        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),

        ...(options?.headers || {}),
      },

      ...options,
    })
  }

  let response = await makeRequest(
    session?.access_token
  )

  // If the access token has expired, refresh the session
  // and retry the request once.
  if (response.status === 401) {
    const {
      data: refreshed,
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (!refreshError && refreshed.session) {
      session = refreshed.session

      response = await makeRequest(
        session.access_token
      )
    }
  }

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

  listTrash() {
    return request<DocumentSummary[]>(
      '/api/trash'
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

  moveToTrash(id: string) {
    return request<DocumentSummary>(
      `/api/documents/${id}/trash`,
      {
        method: 'PATCH',
      }
    )
  },

  restore(id: string) {
    return request<DocumentSummary>(
      `/api/documents/${id}/restore`,
      {
        method: 'PATCH',
      }
    )
  },

  permanentlyDelete(id: string) {
    return request<{ message: string }>(
      `/api/documents/${id}`,
      {
        method: 'DELETE',
      }
    )
  },

  generateAI(prompt: string) {
    return request<{
      title: string
      content: string
    }>('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
      }),
    })
  },

  editAI(content: string, instruction: string) {
    return request<{ text: string }>(
      '/api/ai/edit',
      {
        method: 'POST',
        body: JSON.stringify({
          content,
          instruction,
        }),
      }
    )
  },
}