// apps/web/pages/quiz/[id].tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  useGetQuizByIdQuery,
  useStartQuizAttemptMutation,
  useSubmitAnswerMutation,
  useCompleteQuizAttemptMutation,
} from "../../src/store/services/api";

// Define types for our quiz state
interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, number[]>; // questionId -> selected answer ids
  attemptId?: number;
  isSubmitting: boolean;
  isCompleted: boolean;
  result?: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    xpEarned: number;
    feedback: string;
  };
}

const QuizPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Convert id to number
  const quizId = id ? parseInt(id as string) : undefined;

  // Fetch quiz data
  const {
    data: quiz,
    isLoading: isLoadingQuiz,
    error: quizError,
  } = useGetQuizByIdQuery(quizId as number, {
    skip: !quizId,
  });

  // Mutations for quiz flow
  const [startQuizAttempt, { isLoading: isStartingAttempt }] =
    useStartQuizAttemptMutation();
  const [submitAnswer, { isLoading: isSubmittingAnswer }] =
    useSubmitAnswerMutation();
  const [completeQuizAttempt, { isLoading: isCompletingAttempt }] =
    useCompleteQuizAttemptMutation();

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    isSubmitting: false,
    isCompleted: false,
  });

  // Start quiz attempt when quiz data is loaded
  useEffect(() => {
    const initializeQuiz = async () => {
      if (quiz && !quizState.attemptId && !isStartingAttempt) {
        try {
          const result = await startQuizAttempt({
            quizId: quiz.id,
          }).unwrap();

          setQuizState((prev) => ({
            ...prev,
            attemptId: result.id,
          }));
        } catch (error) {
          console.error("Failed to start quiz attempt:", error);
        }
      }
    };

    initializeQuiz();
  }, [quiz, quizState.attemptId, isStartingAttempt, startQuizAttempt]);

  // Get current question
  const currentQuestion = quiz?.questions[quizState.currentQuestionIndex];

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answerId: number) => {
    // If quiz is completed, don't allow changes
    if (quizState.isCompleted) return;

    const question = quiz?.questions.find((q) => q.id === questionId);

    // For single choice questions, replace the answer
    // For multiple choice, toggle the answer
    if (question?.type === "SINGLE_CHOICE") {
      setQuizState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: [answerId],
        },
      }));
    } else {
      // Multiple choice
      const currentAnswers = quizState.answers[questionId] || [];
      const newAnswers = currentAnswers.includes(answerId)
        ? currentAnswers.filter((id) => id !== answerId)
        : [...currentAnswers, answerId];

      setQuizState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: newAnswers,
        },
      }));
    }
  };

  // Check if an answer is selected
  const isAnswerSelected = (questionId: number, answerId: number) => {
    const selectedAnswers = quizState.answers[questionId] || [];
    return selectedAnswers.includes(answerId);
  };

  // Navigate to next question
  const handleNextQuestion = async () => {
    // If there's a current question and it has been answered
    if (
      currentQuestion &&
      quizState.answers[currentQuestion.id] &&
      quizState.attemptId
    ) {
      // Submit the answer to the backend
      try {
        await submitAnswer({
          attemptId: quizState.attemptId,
          questionId: currentQuestion.id,
          selectedAnswerIds: quizState.answers[currentQuestion.id],
        }).unwrap();

        // Move to next question
        if (
          quizState.currentQuestionIndex <
          (quiz?.questions.length || 0) - 1
        ) {
          setQuizState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
          }));
        }
      } catch (error) {
        console.error("Failed to submit answer:", error);
      }
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  // Submit the quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !quizState.attemptId) return;

    // Check if all questions have been answered
    const allQuestionsAnswered = quiz.questions.every(
      (question) =>
        quizState.answers[question.id] &&
        quizState.answers[question.id].length > 0,
    );

    if (!allQuestionsAnswered) {
      alert("Besvar venligst alle spørgsmål før du indsender quizzen.");
      return;
    }

    setQuizState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Submit the current question's answer if not already submitted
      if (currentQuestion && quizState.answers[currentQuestion.id]) {
        await submitAnswer({
          attemptId: quizState.attemptId,
          questionId: currentQuestion.id,
          selectedAnswerIds: quizState.answers[currentQuestion.id],
        }).unwrap();
      }

      // Complete the quiz attempt
      const result = await completeQuizAttempt({
        attemptId: quizState.attemptId,
      }).unwrap();

      // Update quiz state with results
      setQuizState((prev) => ({
        ...prev,
        isSubmitting: false,
        isCompleted: true,
        result: {
          score: result.score,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions,
          xpEarned: result.xpEarned,
          feedback: result.feedback,
        },
      }));
    } catch (error) {
      console.error("Failed to complete quiz:", error);
      setQuizState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Loading state
  if (isLoadingQuiz || isStartingAttempt) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (quizError || !quiz) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>Der opstod en fejl ved indlæsning af quizzen. Prøv igen senere.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tilbage
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{quiz.title} | Quiz | LearningLab</title>
      </Head>
      <div>
        {/* Quiz header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quiz.title}
            </h1>

            {!quizState.isCompleted && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Spørgsmål {quizState.currentQuestionIndex + 1} af{" "}
                {quiz.questions.length}
              </div>
            )}
          </div>

          {!quizState.isCompleted && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 mt-4 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2"
                style={{
                  width: `${((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Quiz completed view */}
        {quizState.isCompleted && quizState.result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Quiz Gennemført!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Du har besvaret {quizState.result.correctAnswers} ud af{" "}
                {quizState.result.totalQuestions} spørgsmål korrekt.
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    className="dark:stroke-gray-600"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeDasharray={`${quizState.result.score}, 100`}
                    className="dark:stroke-blue-500"
                  />
                  <text
                    x="18"
                    y="20.5"
                    className="text-5xl font-bold fill-gray-900 dark:fill-white text-center"
                    textAnchor="middle"
                  >
                    {quizState.result.score}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                  Score
                </p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {quizState.result.score}%
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                  XP Optjent
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {quizState.result.xpEarned} XP
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                  Korrekte Svar
                </p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {quizState.result.correctAnswers}/
                  {quizState.result.totalQuestions}
                </p>
              </div>
            </div>

            {quizState.result.feedback && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Feedback
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {quizState.result.feedback}
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Link
                href={`/courses/${quiz.courseId}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
              >
                Tilbage til kurset
              </Link>

              <Link
                href="/statistics"
                className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded-md shadow hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Se statistik
              </Link>
            </div>
          </div>
        )}

        {/* Quiz question view */}
        {!quizState.isCompleted && currentQuestion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion.answerOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() =>
                    handleAnswerSelect(currentQuestion.id, option.id)
                  }
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isAnswerSelected(currentQuestion.id, option.id)
                      ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500"
                      : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                        isAnswerSelected(currentQuestion.id, option.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isAnswerSelected(currentQuestion.id, option.id) && (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-gray-800 dark:text-gray-200">
                      {option.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={quizState.currentQuestionIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md shadow hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forrige
              </button>

              {quizState.currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={
                    !quizState.answers[currentQuestion.id] || isSubmittingAnswer
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAnswer ? "Gemmer..." : "Næste"}
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={
                    !quizState.answers[currentQuestion.id] ||
                    quizState.isSubmitting
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quizState.isSubmitting ? "Indsender..." : "Afslut Quiz"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizPage;
