// Filsti: apps/web/src/store/services/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  Quiz, 
  Question, 
  AnswerOption, 
  QuizAttempt,
  StartQuizAttemptInput,
  SubmitAnswerInput,
  CompleteQuizAttemptInput,
  QuizResult,
  Course,
  Module,
  Lesson,
  ContentBlock,
  SubjectArea,
  ContentBlockType
} from "@repo/core";
import { User } from "@repo/core";

// Hent API URL fra miljøvariabler.
// NEXT_PUBLIC_ foran navnet gør den tilgængelig i browseren for Next.js.
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

// Detekter om vi er i et test-miljø
const isTestEnvironment = process.env.NODE_ENV === 'test';

// I test-miljø, brug en mock URL eller /api som fallback
// I produktions- eller udviklingsmiljø, log en advarsel hvis URL'en mangler
if (!baseUrl && !isTestEnvironment) {
  console.warn("ADVARSEL: NEXT_PUBLIC_API_URL er ikke sat. Bruger /api som fallback.");
}

// Definer en custom fetch funktion der kan bruges i test-miljø
const customFetch = (...args: Parameters<typeof fetch>) => {
  // Hvis vi er i et test-miljø og global.fetch ikke er tilgængelig,
  // returner en mock response eller brug en fetch polyfill
  if (isTestEnvironment && typeof fetch === 'undefined') {
    return Promise.resolve(new Response(JSON.stringify({ message: "Mock response for tests" })));
  }

  // Ellers brug den normale fetch
  return fetch(...args);
};

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    // Brug den hentede baseUrl med fallback baseret på miljø
    baseUrl: baseUrl || (isTestEnvironment ? "http://mock-api-for-tests" : "/api"),
    // Brug custom fetch funktion for at håndtere test-miljøer
    fetchFn: customFetch,
    credentials: 'include', // Inkluder cookies i requests
    prepareHeaders: (headers, { getState }) => {
      // Tilføj authorization header med JWT token hvis brugeren er logget ind
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Quiz', 
    'QuizAttempt', 
    'UserProgress', 
    'Course', 
    'Module', 
    'Lesson', 
    'ContentBlock',
    'SubjectArea',
    'User'
  ],
  endpoints: (builder) => ({
    // Endpoint for at hente "Hello World" fra API'ets rod (/)
    hello: builder.query<{ message: string }, void>({
      query: () => ({
        url: "/", // Dette vil blive tilføjet til baseUrl, f.eks. http://localhost:5002/api/
      }),
    }),

    // Course endpoints
    getCourses: builder.query<Course[], { subjectAreaId?: number }>({
      query: (params) => ({
        url: "/courses",
        params: params.subjectAreaId ? { subjectAreaId: params.subjectAreaId } : undefined,
      }),
      providesTags: ['Course'],
    }),

    getCourseById: builder.query<Course, number>({
      query: (id) => ({
        url: `/courses/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),

    // Module endpoints
    getModulesByCourseId: builder.query<Module[], number>({
      query: (courseId) => ({
        url: `/modules`,
        params: { courseId },
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Module' as const, id })),
              { type: 'Module', id: 'LIST' },
            ]
          : [{ type: 'Module', id: 'LIST' }],
    }),

    getModuleById: builder.query<Module, number>({
      query: (id) => ({
        url: `/modules/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Module', id }],
    }),

    // Lesson endpoints
    getLessonsByModuleId: builder.query<Lesson[], number>({
      query: (moduleId) => ({
        url: `/lessons`,
        params: { moduleId },
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Lesson' as const, id })),
              { type: 'Lesson', id: 'LIST' },
            ]
          : [{ type: 'Lesson', id: 'LIST' }],
    }),

    getLessonById: builder.query<Lesson, number>({
      query: (id) => ({
        url: `/lessons/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Lesson', id }],
    }),

    // Content Block endpoints
    getContentBlocksByLessonId: builder.query<ContentBlock[], number>({
      query: (lessonId) => ({
        url: `/content-blocks`,
        params: { lessonId },
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'ContentBlock' as const, id })),
              { type: 'ContentBlock', id: 'LIST' },
            ]
          : [{ type: 'ContentBlock', id: 'LIST' }],
    }),

    // Subject Area endpoints
    getSubjectAreas: builder.query<SubjectArea[], void>({
      query: () => ({
        url: "/subject-areas",
      }),
      providesTags: ['SubjectArea'],
    }),

    getSubjectAreaById: builder.query<SubjectArea, number>({
      query: (id) => ({
        url: `/subject-areas/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'SubjectArea', id }],
    }),

    // Quiz endpoints
    getQuizzes: builder.query<Quiz[], void>({
      query: () => ({
        url: "/quizzes",
      }),
      providesTags: ['Quiz'],
    }),

    getQuizById: builder.query<
      { quiz: Quiz; questions: Question[]; answerOptions: Record<number, AnswerOption[]> },
      number
    >({
      query: (id) => ({
        url: `/quizzes/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Quiz', id }],
    }),

    // Quiz attempt endpoints
    startQuizAttempt: builder.mutation<QuizAttempt, StartQuizAttemptInput>({
      query: (data) => ({
        url: "/quiz-attempts/start",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['QuizAttempt'],
    }),

    submitAnswer: builder.mutation<void, SubmitAnswerInput>({
      query: (data) => ({
        url: "/quiz-attempts/submit-answer",
        method: "POST",
        body: data,
      }),
    }),

    completeQuizAttempt: builder.mutation<
      { score: number; passed: boolean },
      CompleteQuizAttemptInput
    >({
      query: (data) => ({
        url: "/quiz-attempts/complete",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['QuizAttempt', 'UserProgress'],
    }),

    // User progress endpoints
    getUserProgress: builder.query<
      { courseProgress: number; completedLessons: number[]; quizResults: any[] },
      number
    >({
      query: (courseId) => ({
        url: `/user-progress/${courseId}`,
      }),
      providesTags: ['UserProgress'],
    }),

    // User courses endpoints
    getUserCourses: builder.query<
      { courses: Course[]; progress: Record<number, number> },
      void
    >({
      query: () => ({
        url: `/user-progress/courses`,
      }),
      providesTags: ['UserProgress', 'Course'],
    }),

    // User statistics endpoints
    getUserStatistics: builder.query<
      { totalXp: number; quizResults: QuizResult[] },
      void
    >({
      query: () => ({
        url: `/user-progress/statistics`,
      }),
      providesTags: ['UserProgress'],
    }),

    // User settings endpoints
    getCurrentUser: builder.query<User, void>({
      query: () => ({
        url: `/users/me`,
      }),
      providesTags: ['User'],
    }),

    updateUserProfile: builder.mutation<User, { name?: string; email?: string }>({
      query: (data) => ({
        url: `/users/profile`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (data) => ({
        url: `/users/change-password`,
        method: "POST",
        body: data,
      }),
    }),

    requestPasswordReset: builder.mutation<void, { email: string }>({
      query: (data) => ({
        url: `/auth/request-password-reset`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { 
  useHelloQuery,
  // Course hooks
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  // Module hooks
  useGetModulesByCourseIdQuery,
  useGetModuleByIdQuery,
  // Lesson hooks
  useGetLessonsByModuleIdQuery,
  useGetLessonByIdQuery,
  // Content Block hooks
  useGetContentBlocksByLessonIdQuery,
  // Subject Area hooks
  useGetSubjectAreasQuery,
  useGetSubjectAreaByIdQuery,
  // Quiz hooks
  useGetQuizzesQuery,
  useGetQuizByIdQuery,
  // Quiz attempt hooks
  useStartQuizAttemptMutation,
  useSubmitAnswerMutation,
  useCompleteQuizAttemptMutation,
  // User progress hooks
  useGetUserProgressQuery,
  useGetUserCoursesQuery,
  useGetUserStatisticsQuery,
  // User settings hooks
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation
} = api;
