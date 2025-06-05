import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { Quiz, Question, AnswerOption } from "@repo/core";
import QuizQuestion from "./QuizQuestion";
import QuizNavigation from "./QuizNavigation";
import QuizProgress from "./QuizProgress";
import OfflineQuizNotification from "./OfflineQuizNotification";

interface QuizContainerProps {
  quiz: Quiz;
  questions: Question[];
  answerOptions: Record<number, AnswerOption[]>;
  onComplete?: (score: number, passed: boolean) => void;
  isOffline?: boolean;
}

const QuizContainer: React.FC<QuizContainerProps> = ({
  quiz,
  questions,
  answerOptions,
  onComplete,
  isOffline = false,
}) => {
  const router = useRouter();

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  // Derived state
  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = currentQuestion
    ? answerOptions[currentQuestion.id] || []
    : [];
  const selectedAnswerId = currentQuestion
    ? userAnswers[currentQuestion.id]
    : undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered =
    Object.keys(userAnswers).length === questions.length;

  // Handle answer selection
  const handleAnswerSelect = (answerId: number) => {
    if (!currentQuestion) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerId,
    }));
  };

  // Handle navigation
  const handleNext = () => {
    if (isLastQuestion) {
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Handle quiz completion
  const handleQuizComplete = () => {
    setIsSubmitting(true);

    // Calculate score (simplified for demo)
    const totalQuestions = questions.length;
    const correctAnswers = Object.entries(userAnswers).filter(
      ([questionId, answerId]) => {
        const questionOptions = answerOptions[Number(questionId)] || [];
        const selectedOption = questionOptions.find(
          (option) => option.id === answerId,
        );
        return selectedOption?.isCorrect;
      },
    ).length;

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= (quiz.passingScore || 70); // Default passing score is 70%

    // Set results
    setQuizResults({ score, passed });
    setShowResults(true);
    setIsSubmitting(false);

    // Call onComplete callback
    if (onComplete) {
      onComplete(score, passed);
    }
  };

  // Handle closing results
  const handleCloseResults = () => {
    setShowResults(false);
    router.back(); // Go back to previous page
  };

  // Loading state
  if (!currentQuestion || questions.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Loading quiz...
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          If the quiz doesn&apos;t load, try refreshing the page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      {isOffline && (
        <OfflineQuizNotification
          isOffline={isOffline}
          onRetry={() => window.location.reload()}
        />
      )}

      <Typography variant="h4" component="h1" gutterBottom>
        {quiz.title}
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        {quiz.description}
      </Typography>

      {/* Quiz Progress */}
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        answeredQuestions={Object.keys(userAnswers).length}
      />

      {/* Current Question */}
      <QuizQuestion
        question={currentQuestion}
        answerOptions={currentOptions}
        selectedAnswerId={selectedAnswerId}
        onAnswerSelect={handleAnswerSelect}
      />

      {/* Navigation */}
      <QuizNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        userAnswers={userAnswers}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onJumpToQuestion={handleJumpToQuestion}
        isSubmitting={isSubmitting}
      />

      {/* Results Snackbar */}
      <Snackbar
        open={showResults}
        autoHideDuration={6000}
        onClose={handleCloseResults}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseResults}
          severity={quizResults?.passed ? "success" : "warning"}
          sx={{ width: "100%" }}
        >
          {quizResults?.passed
            ? `Congratulations! You scored ${quizResults.score}%`
            : `You scored ${quizResults?.score}%. Try again to improve your score.`}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default QuizContainer;
