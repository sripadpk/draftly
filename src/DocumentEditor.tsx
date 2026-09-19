import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { documentsApi } from './lib/api'

type DocumentEditorProps = {
  documentId: string
  onBack: () => void
}

function DocumentEditor({
  documentId,
  onBack,
}: DocumentEditorProps) {
  const [title, setTitle] =
    useState('Loading...')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false)

  const [showUnsavedModal, setShowUnsavedModal] =
    useState(false)

  const [leavingAfterSave, setLeavingAfterSave] =
    useState(false)

  const [sharing, setSharing] =
    useState(false)

  const [shareEmail, setShareEmail] =
    useState('')

  const [shareMessage, setShareMessage] =
    useState('')

  const [showAIAssistant, setShowAIAssistant] =
    useState(false)

  const [aiInstruction, setAIInstruction] =
    useState('')

  const [aiEditing, setAIEditing] =
    useState(false)

  const [showDeleteModal, setShowDeleteModal] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  const [deleteError, setDeleteError] =
    useState('')

  const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
  ],
  content: '',
  onUpdate: () => {
    setHasUnsavedChanges(true)
  },
})

  useEffect(() => {
    loadDocument()
  }, [documentId, editor])

  async function loadDocument() {
    try {
      const document =
        await documentsApi.get(documentId)

      setTitle(document.title)

      if (editor) {
        editor.commands.setContent(
          document.content
        )
      }
      setHasUnsavedChanges(false)
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
      await documentsApi.update(
        documentId,
        {
          title,
          content: editor.getJSON(),
        }
      )
      setHasUnsavedChanges(false)
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save document'
      )
    } finally {
      setSaving(false)
    }
  }

  async function shareDocument() {
    if (!shareEmail.trim()) {
      setShareMessage(
        'Please enter an email address'
      )
      return
    }

    setSharing(true)
    setShareMessage('')

    try {
      const data =
        await documentsApi.share(
          documentId,
          shareEmail.trim()
        )

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

  async function moveToTrash() {
    setDeleting(true)
    setDeleteError('')

    try {
      await documentsApi.moveToTrash(
        documentId
      )

      setShowDeleteModal(false)

      onBack()
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to move document to Trash'
      )
    } finally {
      setDeleting(false)
    }
  }

  async function handleAIEdit() {
    if (!editor || !aiInstruction.trim()) {
      return
    }

    setAIEditing(true)

    try {
      const currentText =
        editor.getText()

      const result =
        await documentsApi.editAI(
          currentText,
          aiInstruction.trim()
        )

      const paragraphs =
        result.text
          .split(/\n\s*\n/)
          .map((paragraph) =>
            paragraph.trim()
          )
          .filter(Boolean)
          .map((paragraph) => {
            const content = []

            const boldPattern =
              /\*\*(.+?)\*\*/g

            let lastIndex = 0
            let match

            while (
              (match =
                boldPattern.exec(
                  paragraph
                )) !== null
            ) {
              if (
                match.index > lastIndex
              ) {
                content.push({
                  type: 'text',
                  text: paragraph.slice(
                    lastIndex,
                    match.index
                  ),
                })
              }

              content.push({
                type: 'text',
                text: match[1],
                marks: [
                  {
                    type: 'bold',
                  },
                ],
              })

              lastIndex =
                match.index +
                match[0].length
            }

            if (
              lastIndex <
              paragraph.length
            ) {
              content.push({
                type: 'text',
                text: paragraph.slice(
                  lastIndex
                ),
              })
            }

            return {
              type: 'paragraph',
              content:
                content.length > 0
                  ? content
                  : undefined,
            }
          })

      const tipTapContent = {
        type: 'doc',
        content:
          paragraphs.length > 0
            ? paragraphs
            : [
                {
                  type: 'paragraph',
                },
              ],
      }

      editor.commands.setContent(
        tipTapContent
      )

      await documentsApi.update(
        documentId,
        {
          title,
          content: tipTapContent,
        }
      )
      setHasUnsavedChanges(false)
      setShowAIAssistant(false)
      setAIInstruction('')
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to edit document with AI'
      )
    } finally {
      setAIEditing(false)
    }
  }

  if (!editor || loading) {
    return (
      <div className="editor-loading">
        <div className="editor-loading-header">
          <div className="loading-back">
            ← Documents
          </div>

          <div className="loading-title" />

          <div className="loading-actions">
            <div className="loading-button" />
            <div className="loading-share" />
            <div className="loading-share-button" />
          </div>
        </div>

        <div className="editor-loading-toolbar">
          <div />
          <div />
          <div />
          <span />
          <div />
          <div />
          <span />
          <div />
          <div />
        </div>

        <main className="editor-loading-container">
          <div className="editor-loading-paper">
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />

            <div className="skeleton-gap" />

            <div className="skeleton-line long" />
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </main>
      </div>
    )
  }

  async function saveAndLeave() {
  if (!editor) return

  setLeavingAfterSave(true)

  try {
    await documentsApi.update(documentId, {
      title,
      content: editor.getJSON(),
    })

    setHasUnsavedChanges(false)
    setShowUnsavedModal(false)

    onBack()
  } catch (error) {
    console.error(error)

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to save document'
    )
  } finally {
    setLeavingAfterSave(false)
  }
}

  return (
    <div className="editor-page">
      <header className="editor-header">
        <button
  className="back-button"
  onClick={() => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true)
      return
    }

    onBack()
  }}
>
  ← Documents
</button>

        <input
  className="document-title"
  value={title}
  onChange={(event) => {
    setTitle(event.target.value)
    setHasUnsavedChanges(true)
  }}
/>

        <button
          className="new-button"
          onClick={saveDocument}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          className="ai-editor-button"
          onClick={() =>
            setShowAIAssistant(true)
          }
          disabled={aiEditing}
        >
          ✨ AI
        </button>

        <button
          className="editor-delete-button"
          onClick={() => {
            setDeleteError('')
            setShowDeleteModal(true)
          }}
          disabled={deleting}
        >
          Delete
        </button>

        <div className="share-controls">
          <input
            type="email"
            placeholder="Share with email..."
            value={shareEmail}
            onChange={(event) =>
              setShareEmail(
                event.target.value
              )
            }
          />

          <button
            className="share-button"
            onClick={shareDocument}
            disabled={sharing}
          >
            {sharing
              ? 'Sharing...'
              : 'Share'}
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
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          className={
            editor.isActive('bold')
              ? 'toolbar-button active'
              : 'toolbar-button'
          }
        >
          B
        </button>

        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          className={
            editor.isActive('italic')
              ? 'toolbar-button active'
              : 'toolbar-button'
          }
        >
          <i>I</i>
        </button>

        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
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
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 1,
              })
              .run()
          }
          className="toolbar-button"
        >
          H1
        </button>

        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
          className="toolbar-button"
        >
          H2
        </button>

        <span className="toolbar-divider" />

        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className="toolbar-button"
        >
          • List
        </button>

        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          className="toolbar-button"
        >
          1. List
        </button>
      </div>

      <main className="editor-container">
        <div className="editor-paper">
          <EditorContent
            editor={editor}
          />
        </div>
      </main>

      {showAIAssistant && (
        <div className="ai-editor-modal-overlay">
          <div className="ai-editor-modal">
            <div className="ai-editor-modal-header">
              <div>
                <h2>
                  ✨ AI Assistant
                </h2>

                <p>
                  Tell AI what you'd like
                  to write or change.
                </p>
              </div>

              <button
                className="ai-editor-modal-close"
                onClick={() => {
                  setShowAIAssistant(
                    false
                  )
                  setAIInstruction('')
                }}
              >
                ×
              </button>
            </div>

            <div className="ai-editor-actions">
              <button
                onClick={() =>
                  setAIInstruction(
                    'Rewrite this document to sound more professional and polished.'
                  )
                }
              >
                Rewrite
              </button>

              <button
                onClick={() =>
                  setAIInstruction(
                    'Improve the clarity and readability of this document.'
                  )
                }
              >
                Improve writing
              </button>

              <button
                onClick={() =>
                  setAIInstruction(
                    'Make this document shorter while preserving the important information.'
                  )
                }
              >
                Make shorter
              </button>

              <button
                onClick={() =>
                  setAIInstruction(
                    'Fix grammar, spelling, punctuation, and awkward wording.'
                  )
                }
              >
                Fix grammar
              </button>
            </div>

            <textarea
              value={aiInstruction}
              onChange={(event) =>
                setAIInstruction(
                  event.target.value
                )
              }
              placeholder="Tell AI exactly what you'd like to write or change..."
            />

            <div className="ai-editor-modal-footer">
              <button
                onClick={() => {
                  setShowAIAssistant(false)
                  setAIInstruction('')
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleAIEdit}
                disabled={
                  !aiInstruction.trim() ||
                  aiEditing
                }
              >
                {aiEditing
                  ? 'Working...'
                  : '✨ Ask AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="editor-delete-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!deleting) {
                setShowDeleteModal(false)
                setDeleteError('')
              }
            }
          }}
        >
          <div className="editor-delete-modal">
            <div className="editor-delete-icon">
              🗑
            </div>

            <div className="editor-delete-content">
              <h2>
                Move to Trash?
              </h2>

              <p>
                <strong>
                  "{title}"
                </strong>{' '}
                will be moved to Trash.
                You can restore it later.
              </p>

              {deleteError && (
                <div className="editor-delete-error">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="editor-delete-actions">
              <button
                className="editor-delete-cancel"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteError('')
                }}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="editor-delete-confirm"
                onClick={moveToTrash}
                disabled={deleting}
              >
                {deleting
                  ? 'Moving...'
                  : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showUnsavedModal && (
  <div
    className="unsaved-modal-overlay"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !leavingAfterSave
      ) {
        setShowUnsavedModal(false)
      }
    }}
  >
    <div className="unsaved-modal">
      <div className="unsaved-modal-icon">
        ✎
      </div>

      <div className="unsaved-modal-content">
        <h2>Unsaved changes</h2>

        <p>
          You have changes that haven't been
          saved yet. What would you like to do?
        </p>
      </div>

      <div className="unsaved-modal-actions">
        <button
          className="unsaved-cancel-button"
          onClick={() =>
            setShowUnsavedModal(false)
          }
          disabled={leavingAfterSave}
        >
          Cancel
        </button>

        <button
          className="unsaved-discard-button"
          onClick={() => {
            setShowUnsavedModal(false)
            setHasUnsavedChanges(false)
            onBack()
          }}
          disabled={leavingAfterSave}
        >
          Leave without saving
        </button>

        <button
          className="unsaved-save-button"
          onClick={saveAndLeave}
          disabled={leavingAfterSave}
        >
          {leavingAfterSave
            ? 'Saving...'
            : 'Save & leave'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default DocumentEditor