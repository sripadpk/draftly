
---

### `ARCHITECTURE.md`

```md
# Draftly Architecture

## Overview

Draftly uses a simple three-layer architecture:

React frontend → Express API → Supabase Postgres

## Frontend

The React + TypeScript frontend is responsible for:

- User selection / mocked authentication
- Document dashboard
- Owned and shared document views
- Rich-text editing using TipTap
- File import
- Sharing UI
- Save/reopen workflows

The editor stores document content using TipTap's JSON document format.

## Backend

The Express + TypeScript API provides endpoints for:

- Health checking
- Creating documents
- Listing owned documents
- Reading documents
- Updating documents
- Sharing documents
- Listing documents shared with a user

The backend uses the Supabase server client with the server-only secret key.

## Database

The database contains three primary tables:

### users

Stores the seeded application users.

### documents

Stores:

- title
- TipTap JSON content
- owner
- creation timestamp
- update timestamp

### document_shares

Connects documents with users who have been granted access.

A unique constraint prevents duplicate shares.

## Data Flow

### Create

Frontend → POST `/api/documents` → Supabase → document returned to frontend

### Save

Frontend → PATCH `/api/documents/:id` → Supabase → updated document

### Load

Frontend → GET `/api/documents/:id` → Supabase → TipTap editor

### Share

Frontend → POST `/api/documents/:id/share` → user lookup → document_shares insert

### Import

The frontend reads `.txt` or `.md` files using the browser File API, creates a document through the API, converts the file into TipTap paragraph JSON, and saves the resulting document.

## Deployment

Frontend:
Vercel

Backend:
Render

Database:
Supabase Postgres

The frontend receives the backend URL through `VITE_API_URL`.

## Simplifications

Authentication is intentionally mocked with seeded users because production authentication was not required for demonstrating the core collaboration workflow.

Real-time collaboration and advanced permissions were intentionally excluded to keep the implementation focused on the required product surface.