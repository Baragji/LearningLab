import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Quiz, Question, AnswerOption, UserAnswer } from "@repo/core";
import RadialProgress from "../../../../../src/components/quiz/RadialProgress";
import IncorrectAnswersList from "../../../../../src/components/quiz/IncorrectAnswersList";
import OfflineQuizNotification from "../../../../../src/components/quiz/OfflineQuizNotification";
import { getQuizResults } from "../../../../../src/services/userProgressApi";

// Mock data for development - will be replaced with API call
const getMockQuizData = (
  id: string,
): {
  quiz: Quiz;
  questions: Question[];
  answerOptions: Record<number, AnswerOption[]>;
  userAnswers: UserAnswer[];
  score: number;
} => {
  // This is a simplified version - in a real app, this would come from the API
  // or be passed from the quiz page via state management

  // Mock quiz
  const quiz: Quiz = {
    id: parseInt(id),
    title: "React Fundamentals Quiz",
    description: "Test din viden om React grundbegreber",
    moduleId: 1,
    passingScore: 70,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock questions
  const questions: Question[] = [
    {
      id: 1,
      text: "Hvad er React?",
      type: "MULTIPLE_CHOICE" as any,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation:
        "React er et JavaScript-bibliotek til at bygge brugergrænseflader, udviklet af Facebook.",
    },
    {
      id: 2,
      text: "Hvad er JSX?",
      type: "MULTIPLE_CHOICE" as any,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation:
        "JSX er en syntaksudvidelse til JavaScript, der ligner HTML og gør det lettere at skrive React-elementer.",
    },
    {
      id: 3,
      text: "Hvad er en React-komponent?",
      type: "MULTIPLE_CHOICE" as any,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation:
        "En React-komponent er en genbrugelig kodeblok, der returnerer React-elementer som beskriver, hvad der skal vises på skærmen.",
    },
    {
      id: 4,
      text: "Hvad er forskellen mellem state og props i React?",
      type: "MULTIPLE_CHOICE" as any,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation:
        "Props er data, der sendes til en komponent fra dens forælder, mens state er data, der administreres internt i komponenten.",
    },
    {
      id: 5,
      text: "Hvad er en React Hook?",
      type: "MULTIPLE_CHOICE" as any,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation:
        'Hooks er funktioner, der lader dig "hooke ind i" React-funktioner som state og livscyklus fra funktionelle komponenter.',
    },
  ];

  // Mock answer options
  const answerOptions: Record<number, AnswerOption[]> = {
    1: [
      {
        id: 101,
        text: "Et JavaScript-bibliotek til at bygge brugergrænseflader",
        isCorrect: true,
        questionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 102,
        text: "Et komplet framework som Angular",
        isCorrect: false,
        questionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 103,
        text: "Et programmeringssprog",
        isCorrect: false,
        questionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 104,
        text: "En database",
        isCorrect: false,
        questionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    2: [
      {
        id: 201,
        text: "En ny programmeringssprog",
        isCorrect: false,
        questionId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 202,
        text: "En syntaksudvidelse til JavaScript, der ligner HTML",
        isCorrect: true,
        questionId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 203,
        text: "Et værktøj til at style komponenter",
        isCorrect: false,
        questionId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 204,
        text: "En JavaScript-compiler",
        isCorrect: false,
        questionId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    3: [
      {
        id: 301,
        text: "En HTML-fil",
        isCorrect: false,
        questionId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 302,
        text: "En CSS-klasse",
        isCorrect: false,
        questionId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 303,
        text: "En genbrugelig kodeblok, der returnerer React-elementer",
        isCorrect: true,
        questionId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 304,
        text: "En JavaScript-variabel",
        isCorrect: false,
        questionId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    4: [
      {
        id: 401,
        text: "Der er ingen forskel, de er det samme",
        isCorrect: false,
        questionId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 402,
        text: "Props er for styling, state er for data",
        isCorrect: false,
        questionId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 403,
        text: "Props sendes til komponenten, state administreres internt i komponenten",
        isCorrect: true,
        questionId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 404,
        text: "State kan ikke ændres, props kan ændres",
        isCorrect: false,
        questionId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    5: [
      {
        id: 501,
        text: "En måde at tilføje HTML til React",
        isCorrect: false,
        questionId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 502,
        text: "En funktion, der lader dig bruge React-funktioner i funktionelle komponenter",
        isCorrect: true,
        questionId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 503,
        text: "Et værktøj til at forbinde React med en database",
        isCorrect: false,
        questionId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 504,
        text: "En måde at style komponenter på",
        isCorrect: false,
        questionId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  // Mock user answers - in a real app, this would come from the quiz state
  const userAnswers: UserAnswer[] = [
    {
      id: 1,
      quizAttemptId: 1,
      questionId: 1,
      selectedAnswerOptionId: 101,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      quizAttemptId: 1,
      questionId: 2,
      selectedAnswerOptionId: 201,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, // Incorrect
    {
      id: 3,
      quizAttemptId: 1,
      questionId: 3,
      selectedAnswerOptionId: 303,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      quizAttemptId: 1,
      questionId: 4,
      selectedAnswerOptionId: 403,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 5,
      quizAttemptId: 1,
      questionId: 5,
      selectedAnswerOptionId: 504,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, // Incorrect
  ];

  // Calculate score
  const score = Math.round((3 / 5) * 100); // 3 correct out of 5 = 60%

  return { quiz, questions, answerOptions, userAnswers, score };
};

const QuizResultPage: React.FC = () => {
  const router = useRouter();
  const { slug, id } = router.query;
  const [quizData, setQuizData] = useState<ReturnType<
    typeof getMockQuizData
  > | null>(null);
  const [incorrectAnswers, setIncorrectAnswers] = useState<
    Array<{
      question: Question;
      selectedOption: AnswerOption;
      correctOption: AnswerOption;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady && id) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // In a real app, we would fetch the quiz results from the API
          // For now, we'll use mock data
          const data = getMockQuizData(id as string);

          // Try to fetch real results from API (this will likely fail in development)
          try {
            const quizId = parseInt(id as string);
            const apiResults = await getQuizResults(quizId);
            console.log("API results:", apiResults);
            // If we got results, we could use them instead of mock data
            // This is just for demonstration
          } catch (apiError) {
            console.log("Using mock data instead of API results");
          }

          setQuizData(data);

          // Process incorrect answers
          const incorrect = data.userAnswers
            .filter((answer) => {
              const question = data.questions.find(
                (q) => q.id === answer.questionId,
              );
              if (!question || !answer.selectedAnswerOptionId) return false;

              const selectedOption = data.answerOptions[question.id]?.find(
                (opt) => opt.id === answer.selectedAnswerOptionId,
              );
              return selectedOption && !selectedOption.isCorrect;
            })
            .map((answer) => {
              const question = data.questions.find(
                (q) => q.id === answer.questionId,
              )!;
              const selectedOption = data.answerOptions[question.id]?.find(
                (opt) => opt.id === answer.selectedAnswerOptionId,
              )!;
              const correctOption = data.answerOptions[question.id]?.find(
                (opt) => opt.isCorrect,
              )!;

              return { question, selectedOption, correctOption };
            });

          setIncorrectAnswers(incorrect);
        } catch (err) {
          console.error("Error fetching quiz results:", err);
          setError("Der opstod en fejl ved indlæsning af quizresultater.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [router.isReady, id]);

  // Show loading state while router is not ready or data is loading
  if (!router.isReady || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
            Fejl
          </h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-6">
            <Link
              href={`/courses/${slug}`}
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Tilbage til kursus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
            Ingen resultater fundet
          </h2>
          <p className="text-yellow-600 dark:text-yellow-400">
            Vi kunne ikke finde resultaterne for denne quiz.
          </p>
          <div className="mt-6">
            <Link
              href={`/courses/${slug}/quizzes/${id}`}
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mr-4"
            >
              Tag quizzen
            </Link>
            <Link
              href={`/courses/${slug}`}
              className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Tilbage til kursus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { quiz, score } = quizData;
  const passed = score >= (quiz.passingScore || 70);

  return (
    <>
      <Head>
        <title>Quiz Results | {quiz.title} | LearningLab</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/courses"
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            Kurser
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/courses/${slug}`}
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            {slug}
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/courses/${slug}/quizzes/${id}`}
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            Quiz
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-200">Resultater</span>
        </nav>

        {/* Offline notification */}
        <OfflineQuizNotification className="mb-4" isOffline={false} />

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {quiz.title} - Resultater
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {passed
                ? "Tillykke! Du har bestået quizzen."
                : "Du har ikke bestået quizzen. Prøv igen!"}
            </p>

            {/* Radial Progress */}
            <div className="flex justify-center mb-6">
              <RadialProgress percentage={score} size={180} passed={passed} />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href={`/courses/${slug}/quizzes/${id}`}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Prøv igen
              </Link>
              <Link
                href={`/courses/${slug}`}
                className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                Tilbage til kursus
              </Link>
            </div>
          </div>

          {/* Incorrect Answers List */}
          {incorrectAnswers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Forkerte svar
              </h3>
              <IncorrectAnswersList incorrectAnswers={incorrectAnswers} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizResultPage;
