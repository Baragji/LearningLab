// apps/api/src/routes/questionBank.routes.ts

import { Router } from 'express';
import * as questionBankController from '../controllers/questionBank.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router: Router = Router();

// Beskyttede ruter (kræver autentificering)
router.get('/', authenticateJWT, questionBankController.getAllQuestionBanks);
router.get('/:id', authenticateJWT, questionBankController.getQuestionBankById);
router.post('/', authenticateJWT, questionBankController.createQuestionBank);
router.put('/:id', authenticateJWT, questionBankController.updateQuestionBank);
router.delete(
  '/:id',
  authenticateJWT,
  questionBankController.deleteQuestionBank,
);

// Spørgsmål i spørgsmålsbank
router.post(
  '/questions',
  authenticateJWT,
  questionBankController.createQuestionBankItem,
);
router.put(
  '/questions/:id',
  authenticateJWT,
  questionBankController.updateQuestionBankItem,
);
router.delete(
  '/questions/:id',
  authenticateJWT,
  questionBankController.deleteQuestionBankItem,
);

// Import og tilføjelse af spørgsmål
router.post('/import', authenticateJWT, questionBankController.importQuestions);
router.post(
  '/add-to-quiz',
  authenticateJWT,
  questionBankController.addQuestionsFromBank,
);

export default router;
