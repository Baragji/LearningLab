// apps/api/src/routes/quiz.routes.ts

import express from 'express';
import * as quizController from '../controllers/quiz.controller';
import * as quizAttemptController from '../controllers/quizAttempt.controller';
// Fjern import af userProgressController, da disse ruter håndteres af NestJS UserProgressController
// import * as userProgressController from '../controllers/userProgress.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Quiz routes
router.get('/quizzes', quizController.getAllQuizzes);
router.get('/lessons/:lessonId/quizzes', quizController.getQuizzesByLesson);
router.get('/modules/:moduleId/quizzes', quizController.getQuizzesByModule);
router.get('/quizzes/:id', quizController.getQuizById);
router.post(
  '/quizzes',
  authenticateJWT,
  authorizeAdmin,
  quizController.createQuiz,
);
router.put(
  '/quizzes/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.updateQuiz,
);
router.delete(
  '/quizzes/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.deleteQuiz,
);

// Question routes
router.post(
  '/questions',
  authenticateJWT,
  authorizeAdmin,
  quizController.createQuestion,
);
router.put(
  '/questions/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.updateQuestion,
);
router.delete(
  '/questions/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.deleteQuestion,
);

// Answer Option routes
router.post(
  '/questions/:questionId/answer-options',
  authenticateJWT,
  authorizeAdmin,
  quizController.createAnswerOption,
);
router.put(
  '/answer-options/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.updateAnswerOption,
);
router.delete(
  '/answer-options/:id',
  authenticateJWT,
  authorizeAdmin,
  quizController.deleteAnswerOption,
);

// Quiz Attempt routes
router.get(
  '/quiz-attempts',
  authenticateJWT,
  quizAttemptController.getUserQuizAttempts,
);
router.get(
  '/quiz-attempts/:id',
  authenticateJWT,
  quizAttemptController.getQuizAttemptById,
);
router.post(
  '/quiz-attempts/start',
  authenticateJWT,
  quizAttemptController.startQuizAttempt,
);
router.post(
  '/quiz-attempts/submit-answer',
  authenticateJWT,
  quizAttemptController.submitAnswer,
);
router.post(
  '/quiz-attempts/complete',
  authenticateJWT,
  quizAttemptController.completeQuizAttempt,
);

// User Progress routes er fjernet herfra - de håndteres af UserProgressController i NestJS

export default router;
