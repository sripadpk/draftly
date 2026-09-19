import { Router } from 'express'

import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocumentController,
  shareDocument,
  getSharedDocumentsController,
  moveDocumentToTrashController,
  restoreDocumentController,
  permanentlyDeleteDocumentController,
  getTrashDocumentsController,
} from '../controllers/documentController'

const router = Router()

router.post('/documents', createDocument)

router.get('/documents', getDocuments)

router.get('/documents/:id', getDocument)

router.patch(
  '/documents/:id',
  updateDocumentController
)

router.post(
  '/documents/:id/share',
  shareDocument
)

/*
 * Trash
 */

router.get(
  '/trash',
  getTrashDocumentsController
)

router.patch(
  '/documents/:id/trash',
  moveDocumentToTrashController
)

router.patch(
  '/documents/:id/restore',
  restoreDocumentController
)

router.delete(
  '/documents/:id',
  permanentlyDeleteDocumentController
)

router.get(
  '/shared-documents',
  getSharedDocumentsController
)

export default router