import type { JSONContent } from '@tiptap/core'

export type DocumentSummary = {
  id: string
  title: string
  updated_at: string
}

export type Document = DocumentSummary & {
  content: JSONContent
}

export type SharedDocumentResponse = {
  documents: DocumentSummary | null
}

export type ShareResponse = {
  message: string
}