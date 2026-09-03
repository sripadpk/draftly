# Draftly

Draftly is a lightweight Google Docs-inspired document editor built as a full-stack product engineering take-home assignment.

## Live Demo

Frontend: https://draftly-53u9j11rt-sripad-pks-projects.vercel.app

Backend API: https://draftly-2iua.onrender.com

## Features

- Create documents
- Rename documents
- Rich-text editing
- Bold, italic, underline
- H1 and H2 headings
- Bulleted and numbered lists
- Save and reopen documents
- Persistent storage with Supabase Postgres
- Import `.txt` and `.md` files into editable documents
- Share documents with another seeded user
- Owned documents and "Shared with Me" views
- Mocked authentication with two seeded users
- Basic validation and error handling
- Automated validation tests

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- TipTap

### Backend
- Node.js
- Express
- TypeScript

### Database
- Supabase Postgres

### Deployment
- Vercel for frontend
- Render for backend

## Seeded Users

The assignment uses mocked authentication rather than production authentication.

- Sripad PK — sripad2602@gmail.com
- Alex Johnson — alex@example.com

## File Import

Draftly supports `.txt` and `.md` files.

Imported files are converted into editable plain-text paragraphs. Markdown syntax is intentionally not parsed into rich formatting in this version.

## Local Setup

### Frontend

```bash
npm install
npm run dev