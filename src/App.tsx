import { useEffect, useState } from 'react'
import DocumentEditor from './DocumentEditor'
import { documentsApi } from './lib/api'
import type { DocumentSummary } from './types'
import { supabase } from './lib/supabase'
import type { SharedDocumentResponse } from './types'

type User = {
  id: string
  name: string
  email: string
}

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
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState<'owned' | 'shared'>('owned')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<DocumentSummary[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function restoreSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setAuthLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!error && profile) {
        setCurrentUser(profile)
      }

      setAuthLoading(false)
    }

    restoreSession()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadDocuments()
    }
  }, [currentUser])

  async function loadDocuments() {
  if (!currentUser) return

  setLoading(true)

  try {
    const ownedData = await documentsApi.listMine()
    setDocuments(ownedData)

    const sharedData: SharedDocumentResponse[] = await documentsApi.listShared()

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
      'Untitled Document'
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
      uniqueTitle
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

async function handleSignup(
  name: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    alert(error.message)
    return
  }

  if (!data.user || !data.session) {
  alert('Account creation failed. No active session was created.')
  return
}

  const { data: profile, error: profileError } =
    await supabase
      .from('users')
      .insert({
        name,
        email,
        auth_user_id: data.user.id,
      })
      .select('id, name, email')
      .single()

  if (profileError || !profile) {
    alert(
      profileError?.message ||
        'Failed to create Draftly profile'
    )
    return
  }

  setCurrentUser(profile)
}

if (authLoading) {
  return null
}

// Login / signup
if (!currentUser) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">
          <span className="auth-logo-mark">D</span>
          Draftly
        </div>

        <div className="auth-content">
          <div className="auth-eyebrow">
            YOUR IDEAS, IN ONE PLACE
          </div>

          <h1>
            Write.
            <br />
            Share.
            <br />
            <span>Build together.</span>
          </h1>

          <p>
            Create, edit and share documents
            without the clutter.
          </p>

          <div className="document-visual">
            <div className="visual-window">
              <div className="visual-toolbar">
                <span />
                <span />
                <span />
              </div>

              <div className="visual-content">
                <div className="visual-title" />
                <div className="visual-line long" />
                <div className="visual-line medium" />
                <div className="visual-line short" />

                <div className="visual-line long" />
                <div className="visual-line medium" />
                <div className="visual-line short" />
              </div>

              <div className="visual-cursor" />
            </div>

            <div className="visual-card">
              <strong>Shared with you</strong>
              <span>Alex is viewing this document</span>
            </div>
          </div>
        </div>

        <div className="auth-footer">
        Designed & built by Sripad
        </div>
      </div>

      <div className="auth-panel">
        <div className="login-card">
          <div className="mobile-logo">
            <span className="auth-logo-mark">D</span>
            Draftly
          </div>

          <div className="auth-heading">
            <h2>
              {authMode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p>
              {authMode === 'login'
                ? 'Sign in to continue to your workspace.'
                : 'Start creating documents with Draftly.'}
            </p>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault()

              const form = event.currentTarget

              const nameInput =
                form.elements.namedItem('name') as
                  | HTMLInputElement
                  | null

              const email = (
                form.elements.namedItem('email') as
                  HTMLInputElement
              ).value

              const password = (
                form.elements.namedItem('password') as
                  HTMLInputElement
              ).value

              if (authMode === 'signup') {
                const name = nameInput?.value || ''

                await handleSignup(
                  name,
                  email,
                  password
                )
              } else {
                await handleLogin(
                  email,
                  password
                )
              }
            }}
          >
            {authMode === 'signup' && (
              <div className="input-group">
                <label>Full name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              className="auth-submit"
              type="submit"
            >
              {authMode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode('signup')
                  }
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode('login')
                  }
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {authMode === 'login' && (
            <div className="demo-accounts">
              <div className="demo-title">
                Or try a demo account
              </div>

              <button
                type="button"
                className="demo-account"
                onClick={() => {
                  const emailInput =
                    document.querySelector(
                      'input[name="email"]'
                    ) as HTMLInputElement

                  const passwordInput =
                    document.querySelector(
                      'input[name="password"]'
                    ) as HTMLInputElement

                  emailInput.value =
                    'alex@example.com'

                  passwordInput.value =
                    'alexalex'
                }}
              >
                <strong>Alex Johnson</strong>
                <span>alex@example.com</span>
              </button>

              <button
                type="button"
                className="demo-account"
                onClick={() => {
                  const emailInput =
                    document.querySelector(
                      'input[name="email"]'
                    ) as HTMLInputElement

                  const passwordInput =
                    document.querySelector(
                      'input[name="password"]'
                    ) as HTMLInputElement

                  emailInput.value =
                    'demo@draftly.app'

                  passwordInput.value =
                    'draftlydemo'
                }}
              >
                <strong>Demo User</strong>
                <span>demo@draftly.app</span>
              </button>
            </div>
          )}
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
            onClick={async () => {
              await supabase.auth.signOut()
              setCurrentUser(null)
            }}
          >
            Sign Out
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

  async function handleLogin(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) {
    alert(error.message)
    return
  }

  if (!data.user) {
    alert('Login failed')
    return
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('users')
      .select('id, name, email')
      .eq('auth_user_id', data.user.id)
      .single()

  if (profileError || !profile) {
    alert('Draftly profile not found')
    return
  }

  setCurrentUser(profile)
}
}

export default App