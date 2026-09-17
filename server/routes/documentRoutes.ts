import { Router } from 'express'
import { supabase } from '../lib/supabase'
import { createDocument, getDocuments, getDocument, updateDocumentController, shareDocument, getSharedDocumentsController } from '../controllers/documentController'

const router = Router()

router.post('/documents', createDocument)

router.get('/documents', getDocuments)

router.get('/documents/:id', getDocument)

router.patch('/documents/:id', updateDocumentController)

router.post('/documents/:id/share', shareDocument)

router.get('/shared-documents', getSharedDocumentsController)

export default router