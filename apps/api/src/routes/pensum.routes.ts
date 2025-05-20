// apps/api/src/routes/pensum.routes.ts

import express from 'express';
import * as subjectAreaController from '../controllers/subjectArea.controller';
import * as courseController from '../controllers/course.controller';
import * as moduleController from '../controllers/module.controller';
import * as lessonController from '../controllers/lesson.controller';
import * as contentBlockController from '../controllers/contentBlock.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Subject Area routes
router.get('/subject-areas', subjectAreaController.getAllSubjectAreas);
router.get('/subject-areas/:id', subjectAreaController.getSubjectAreaById);
router.get(
  '/subject-areas/slug/:slug',
  subjectAreaController.getSubjectAreaBySlug,
);
router.post(
  '/subject-areas',
  authenticateJWT,
  authorizeAdmin,
  subjectAreaController.createSubjectArea,
);
router.put(
  '/subject-areas/:id',
  authenticateJWT,
  authorizeAdmin,
  subjectAreaController.updateSubjectArea,
);
router.delete(
  '/subject-areas/:id',
  authenticateJWT,
  authorizeAdmin,
  subjectAreaController.deleteSubjectArea,
);

// Course routes
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);
router.get('/courses/slug/:slug', courseController.getCourseBySlug);
router.get(
  '/subject-areas/:subjectAreaId/courses',
  courseController.getCoursesBySubjectArea,
);
router.post(
  '/courses',
  authenticateJWT,
  authorizeAdmin,
  courseController.createCourse,
);
router.put(
  '/courses/:id',
  authenticateJWT,
  authorizeAdmin,
  courseController.updateCourse,
);
router.delete(
  '/courses/:id',
  authenticateJWT,
  authorizeAdmin,
  courseController.deleteCourse,
);

// Module routes
router.get('/courses/:courseId/modules', moduleController.getModulesByCourse);
router.get('/modules/:id', moduleController.getModuleById);
router.post(
  '/modules',
  authenticateJWT,
  authorizeAdmin,
  moduleController.createModule,
);
router.put(
  '/modules/:id',
  authenticateJWT,
  authorizeAdmin,
  moduleController.updateModule,
);
router.put(
  '/courses/:courseId/modules/order',
  authenticateJWT,
  authorizeAdmin,
  moduleController.updateModulesOrder,
);
router.delete(
  '/modules/:id',
  authenticateJWT,
  authorizeAdmin,
  moduleController.deleteModule,
);

// Lesson routes
router.get('/modules/:moduleId/lessons', lessonController.getLessonsByModule);
router.get('/lessons/:id', lessonController.getLessonById);
router.post(
  '/lessons',
  authenticateJWT,
  authorizeAdmin,
  lessonController.createLesson,
);
router.put(
  '/lessons/:id',
  authenticateJWT,
  authorizeAdmin,
  lessonController.updateLesson,
);
router.put(
  '/modules/:moduleId/lessons/order',
  authenticateJWT,
  authorizeAdmin,
  lessonController.updateLessonsOrder,
);
router.delete(
  '/lessons/:id',
  authenticateJWT,
  authorizeAdmin,
  lessonController.deleteLesson,
);

// Content Block routes
router.get(
  '/lessons/:lessonId/content-blocks',
  contentBlockController.getContentBlocksByLesson,
);
router.get('/content-blocks/:id', contentBlockController.getContentBlockById);
router.post(
  '/content-blocks',
  authenticateJWT,
  authorizeAdmin,
  contentBlockController.createContentBlock,
);
router.put(
  '/content-blocks/:id',
  authenticateJWT,
  authorizeAdmin,
  contentBlockController.updateContentBlock,
);
router.put(
  '/lessons/:lessonId/content-blocks/order',
  authenticateJWT,
  authorizeAdmin,
  contentBlockController.updateContentBlocksOrder,
);
router.delete(
  '/content-blocks/:id',
  authenticateJWT,
  authorizeAdmin,
  contentBlockController.deleteContentBlock,
);

export default router;
