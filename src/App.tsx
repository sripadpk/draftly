import { useEffect, useState } from 'react'
import DocumentEditor from './DocumentEditor'
import { documentsApi } from './lib/api'
import type { DocumentSummary } from './types'

type User = {
  id: string
  name: string
  email: string
}

const USERS: User[] = [
  {
    id: 'cf01d087-6bda-48dc-a21d-6dfc75832988',
    name: 'Sripad PK',
    email: 'sripad2602@gmail.com',
  },
  {
    id: '755e3d83-2454-457a-a821-47a86f903873',
    name: 'Alex Johnson',
    email: 'alex@example.com',
  },
]

function getUniqueFileTitle(
  fileName: string,
  existingDocuments: DocumentSummary[]
) {
  const normalizedName = fileName.replace(
    /(\.(txt|md))+$/i,
    (match) => `.${match.split('.').pop()?.toLowerCase()}`
  )

  const lastDot = normalizedName.lastIndexOf('.')

  const baseName =
    lastDot > 0
      ? normalizedName.substring(0, lastDot)
      : normalizedName

  const extension =
    lastDot > 0
      ? normalizedName.substring(lastDot)
      : ''

  const existingTitles = new Set(
    existingDocuments.map((document) => document.title)
  )

  let title = `${baseName}${extension}`
  let counter = 1

  while (existingTitles.has(title)) {
    title = `${baseName} (${counter})${extension}`
    counter += 1
  }

  return title
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState<'owned' | 'shared'>('owned')
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<DocumentSummary[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      loadDocuments()
    }
  }, [currentUser])

  async function loadDocuments() {
  if (!currentUser) return

  setLoading(true)

  try {
    const ownedData = await documentsApi.listMine(currentUser.id)
    setDocuments(ownedData)

    const sharedData = await documentsApi.listShared(currentUser.id)

    const shared = sharedData
      .filter((item) => item.documents)
      .map((item) => ({
        id: item.documents!.id,
        title: item.documents!.title,
        updated_at: item.documents!.updated_at,
      }))

    setSharedDocuments(shared)
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}

  async function createDocument() {
  if (!currentUser) return

  try {
    const document = await documentsApi.create(
      'Untitled Document',
      currentUser.id
    )

    setDocuments((current) => [document, ...current])
    setSelectedDocumentId(document.id)
  } catch (error) {
    console.error(error)
  }
}

  async function handleFileUpload(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0]

  if (!file || !currentUser) return

  const allowedTypes = ['.txt', '.md']

  const extension = file.name
    .substring(file.name.lastIndexOf('.'))
    .toLowerCase()

  if (!allowedTypes.includes(extension)) {
    alert('Only .txt and .md files are supported.')
    event.target.value = ''
    return
  }

  setUploading(true)

  try {
    const content = await file.text()

    const uniqueTitle = getUniqueFileTitle(
      file.name,
      documents
    )

    const document = await documentsApi.create(
      uniqueTitle,
      currentUser.id
    )

    const paragraphs = content
      .split(/\r?\n/)
      .map((line) => ({
        type: 'paragraph',
        content: line
          ? [{ type: 'text', text: line }]
          : undefined,
      }))

    const editorContent = {
      type: 'doc',
      content:
        paragraphs.length > 0
          ? paragraphs
          : [{ type: 'paragraph' }],
    }

    await documentsApi.update(
      document.id,
      {
        title: document.title,
        content: editorContent,
      }
    )

    setDocuments((current) => [
      {
        id: document.id,
        title: document.title,
        updated_at: new Date().toISOString(),
      },
      ...current,
    ])

    setSelectedDocumentId(document.id)
  } catch (error) {
    console.error(error)
    alert('Failed to import the file.')
  } finally {
    setUploading(false)
    event.target.value = ''
  }
}

  // Login / user selection
  if (!currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo">Draftly</div>

          <h1>Welcome</h1>
          <p>Choose an account to continue.</p>

          <div className="user-options">
            {USERS.map((user) => (
              <button
                key={user.id}
                className="user-option"
                onClick={() => {
                  setCurrentUser(user)
                  setView('owned')
                }}
              >
                <div className="avatar">
                  {user.name.charAt(0)}
                </div>

                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Editor
  if (selectedDocumentId) {
    return (
      <DocumentEditor
        documentId={selectedDocumentId}
        onBack={() => {
          setSelectedDocumentId(null)
          loadDocuments()
        }}
      />
    )
  }

  const visibleDocuments =
    view === 'owned' ? documents : sharedDocuments

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Draftly</div>

        <div className="user">
          <span>{currentUser.name}</span>

          <button
            className="switch-user-button"
            onClick={() => {
              setCurrentUser(null)
              setSelectedDocumentId(null)
            }}
          >
            Switch user
          </button>

          <div className="avatar">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">Documents</div>

          <button
            className={
              view === 'owned'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setView('owned')}
          >
            My Documents
          </button>

          <button
            className={
              view === 'shared'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setView('shared')}
          >
            Shared with Me
          </button>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>
                {view === 'owned'
                  ? 'My Documents'
                  : 'Shared with Me'}
              </h1>

              <p>
                {view === 'owned'
                  ? 'Your documents and drafts.'
                  : 'Documents shared with you.'}
              </p>
            </div>

            {view === 'owned' && (
  <div className="header-actions">
    <label className="upload-button">
      {uploading ? 'Uploading...' : '↑ Import File'}
      <input
        type="file"
        accept=".txt,.md"
        onChange={handleFileUpload}
        disabled={uploading}
        hidden
      />
    </label>

    <button
      className="new-button"
      onClick={createDocument}
    >
      + New Document
    </button>
  </div>
)}
          </div>

          <section>
            <div className="section-title">
              {view === 'owned'
                ? 'My Documents'
                : 'Shared Documents'}
            </div>

            {loading ? (
              <p>Loading documents...</p>
            ) : visibleDocuments.length === 0 ? (
              <p>
                {view === 'owned'
                  ? 'No documents yet. Create your first one.'
                  : 'No documents have been shared with you yet.'}
              </p>
            ) : (
              <div className="document-grid">
                {visibleDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="document-card"
                    onClick={() =>
                      setSelectedDocumentId(document.id)
                    }
                  >
                    <h2>{document.title}</h2>

                    <p>
                      Updated{' '}
                      {new Date(
                        document.updated_at
                      ).toLocaleString()}
                    </p>

                    {view === 'shared' && (
                      <span className="shared-badge">
                        Shared
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default App