import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type DocumentEditorProps = {
  documentId: string
  onBack: () => void
}

function DocumentEditor({ documentId, onBack }: DocumentEditorProps) {
  const [title, setTitle] = useState('Loading...')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: '',
  })

  useEffect(() => {
    loadDocument()
  }, [documentId])

  async function loadDocument() {
    try {
      const response = await fetch(
        `${API_URL}/api/documents/${documentId}`
      )

      if (!response.ok) {
        throw new Error('Failed to load document')
      }

      const document = await response.json()

      setTitle(document.title)

      if (editor) {
        editor.commands.setContent(document.content)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function saveDocument() {
    if (!editor) return

    setSaving(true)

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${documentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content: editor.getJSON(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save document')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

    async function shareDocument() {
    if (!shareEmail.trim()) {
      setShareMessage('Please enter an email address')
      return
    }

    setSharing(true)
    setShareMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${documentId}/share`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: shareEmail.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share document')
      }

      setShareMessage(data.message)
      setShareEmail('')
    } catch (error) {
      setShareMessage(
        error instanceof Error
          ? error.message
          : 'Failed to share document'
      )
    } finally {
      setSharing(false)
    }
  }

  if (!editor || loading) {
    return <div>Loading document...</div>
  }

  return (
    <div className="editor-page">
      <header className="editor-header">
        <button className="back-button" onClick={onBack}>
          ← Documents
        </button>

        <input
          className="document-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <button
          className="new-button"
          onClick={saveDocument}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <div className="share-controls">
  <input
    type="email"
    placeholder="Share with email..."
    value={shareEmail}
    onChange={(event) => setShareEmail(event.target.value)}
  />

  <button
    className="share-button"
    onClick={shareDocument}
    disabled={sharing}
  >
    {sharing ? 'Sharing...' : 'Share'}
  </button>
</div>
      </header>

      {shareMessage && (
  <div className="share-message">
    {shareMessage}
  </div>
)}

      <div className="editor-toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={
            editor.isActive('bold')
              ? 'toolbar-button active'
              : 'toolbar-button'
          }
        >
          B
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={
            editor.isActive('italic')
              ? 'toolbar-button active'
              : 'toolbar-button'
          }
        >
          <i>I</i>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={
            editor.isActive('underline')
              ? 'toolbar-button active'
              : 'toolbar-button'
          }
        >
          <u>U</u>
        </button>

        <span className="toolbar-divider" />

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className="toolbar-button"
        >
          H1
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className="toolbar-button"
        >
          H2
        </button>

        <span className="toolbar-divider" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="toolbar-button"
        >
          • List
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="toolbar-button"
        >
          1. List
        </button>
      </div>

      <main className="editor-container">
        <div className="editor-paper">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  )
}

export default DocumentEditor