import { Router } from 'express'
import { generateAIController, editAIController } from '../controllers/aiController'

const router = Router()

router.post('/generate', generateAIController)
router.post('/edit', editAIController)

export default router