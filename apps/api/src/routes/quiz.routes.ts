// apps/api/src/routes/quiz.routes.ts

import express from 'express';
import * as quizController from '../controllers/quiz.controller';
import * as quizAttemptController from '../controllers/quizAttempt.controller';
import * as userProgressController from '../controllers/userProgress.controller';
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

// User Progress routes
// Original routes with '/progress' prefix
router.get(
  '/progress',
  authenticateJWT,
  userProgressController.getUserProgress,
);
router.get(
  '/progress/users/:userId',
  authenticateJWT,
  userProgressController.getUserProgressById,
);
router.get(
  '/progress/lessons/:lessonId',
  authenticateJWT,
  userProgressController.getLessonProgress,
);
router.put(
  '/progress/lessons/:lessonId',
  authenticateJWT,
  userProgressController.updateLessonProgress,
);
router.patch(
  '/progress',
  authenticateJWT,
  userProgressController.updateUserProgress,
);
router.get(
  '/progress/courses/:courseId',
  authenticateJWT,
  userProgressController.getCourseProgress,
);

// Alias routes with '/user-progress' prefix for backward compatibility
router.get(
  '/user-progress',
  authenticateJWT,
  userProgressController.getUserProgress,
);
router.get(
  '/user-progress/users/:userId',
  authenticateJWT,
  userProgressController.getUserProgressById,
);
router.get(
  '/user-progress/lessons/:lessonId',
  authenticateJWT,
  userProgressController.getLessonProgress,
);
router.put(
  '/user-progress/lessons/:lessonId',
  authenticateJWT,
  userProgressController.updateLessonProgress,
);
router.patch(
  '/user-progress',
  authenticateJWT,
  userProgressController.updateUserProgress,
);
router.get(
  '/user-progress/courses/:courseId',
  authenticateJWT,
  userProgressController.getCourseProgress,
);

export default router;
