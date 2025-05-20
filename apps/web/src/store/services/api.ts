// Filsti: apps/web/src/store/services/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  Quiz, 
  Question, 
  AnswerOption, 
  QuizAttempt,
  StartQuizAttemptInput,
  SubmitAnswerInput,
  CompleteQuizAttemptInput
} from "@repo/core/src/types/quiz.types";

// Hent API URL fra miljøvariabler.
// NEXT_PUBLIC_ foran navnet gør den tilgængelig i browseren for Next.js.
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
  console.error("FEJL: NEXT_PUBLIC_API_URL er ikke sat. API-kald vil fejle.");
  // Du kan vælge at kaste en fejl her eller have en fallback,
  // men det er bedst at sikre, at den altid er sat.
}

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    // Brug den hentede baseUrl.
    // Hvis baseUrl er undefined (ikke sat), vil kald relativt til nuværende host:port (f.eks. localhost:3003/hello)
    // hvilket er forkert, da API'et kører på localhost:5002.
    baseUrl: baseUrl || "/api", // Fallback til /api hvis den ikke er sat, men det bør den være.
    prepareHeaders: (headers, { getState }) => {
      // Tilføj authorization header med JWT token hvis brugeren er logget ind
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Quiz', 'QuizAttempt', 'UserProgress'],
  endpoints: (builder) => ({
    // Endpoint for at hente "Hello World" fra API'ets rod (/)
    hello: builder.query<{ message: string }, void>({
      query: () => ({
        url: "/", // Dette vil blive tilføjet til baseUrl, f.eks. http://localhost:5002/api/
      }),
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
  }),
});

export const { 
  useHelloQuery,
  useGetQuizzesQuery,
  useGetQuizByIdQuery,
  useStartQuizAttemptMutation,
  useSubmitAnswerMutation,
  useCompleteQuizAttemptMutation,
  useGetUserProgressQuery
} = api;
