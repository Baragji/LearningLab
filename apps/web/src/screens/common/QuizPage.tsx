// apps/web/src/screens/common/QuizPage.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Breadcrumbs,
  Link,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import {
  useGetQuizByIdQuery,
  useStartQuizAttemptMutation,
  useSubmitAnswerMutation,
  useCompleteQuizAttemptMutation,
} from "../../store/services/api";
import QuizQuestion from "../../components/quiz/QuizQuestion";
import QuizNavigation from "../../components/quiz/QuizNavigation";
import QuizProgress from "../../components/quiz/QuizProgress";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TimerIcon from "@mui/icons-material/Timer";
import QuizIcon from "@mui/icons-material/Quiz";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const QuizPage: React.FC = () => {
  const router = useRouter();
  const { quizId } = router.query;

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<
    Record<number, number | string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers?: number;
    totalQuestions?: number;
    timeTaken?: number;
    detailedResults?: Array<{
      questionId: number;
      correct: boolean;
      userAnswer: number;
      correctAnswer: number;
    }>;
  } | null>(null);
  const [startTime] = useState(Date.now());

  // API Hooks
  const {
    data: quizData,
    isLoading: isQuizLoading,
    error: quizError,
  } = useGetQuizByIdQuery(Number(quizId));

  const [startQuizAttempt, { isLoading: isStartingQuiz }] =
    useStartQuizAttemptMutation();
  const [submitAnswer, { isLoading: isSubmittingAnswer }] =
    useSubmitAnswerMutation();
  const [completeQuizAttempt, { isLoading: isCompletingQuiz }] =
    useCompleteQuizAttemptMutation();

  // Start quiz attempt when component mounts
  useEffect(() => {
    const initQuiz = async () => {
      if (quizId) {
        try {
          const response = await startQuizAttempt({
            quizId: Number(quizId),
          }).unwrap();
          setQuizAttemptId(response.id);
        } catch (error) {
          console.error("Failed to start quiz attempt:", error);
        }
      }
    };

    initQuiz();
  }, [quizId, startQuizAttempt]);

  // Derived state
  const questions = quizData?.questions || [];
  const answerOptions = quizData?.answerOptions || {};
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Handle answer selection
  const handleAnswerSelect = async (questionId: number, answerId: number) => {
    // Update local state
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));

    // Submit to backend
    if (quizAttemptId) {
      try {
        await submitAnswer({
          quizAttemptId,
          questionId,
          selectedAnswerOptionId: answerId,
        });
      } catch (error) {
        console.error("Failed to submit answer:", error);
      }
    }
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

  // Handle quiz completion confirmation
  const handleQuizComplete = () => {
    setShowCompletionConfirm(true);
  };

  // Handle final quiz submission
  const handleFinalSubmit = async () => {
    if (!quizAttemptId) return;

    setIsSubmitting(true);
    setShowCompletionConfirm(false);

    try {
      const results = await completeQuizAttempt({ quizAttemptId }).unwrap();
      const timeTaken = Math.round((Date.now() - startTime) / 1000 / 60); // minutes

      setQuizResults({
        ...results,
        timeTaken,
        totalQuestions: questions.length,
        correctAnswers: results.score
          ? Math.round((results.score / 100) * questions.length)
          : 0,
      });
      setShowResults(true);
    } catch (error) {
      console.error("Failed to complete quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle review mode
  const handleReviewMode = () => {
    setIsReviewMode(true);
    setShowResults(false);
    setCurrentQuestionIndex(0);
  };

  // Handle closing results dialog
  const handleCloseResults = () => {
    setShowResults(false);
    setIsReviewMode(false);
    // Navigate back to the course or module page
    router.back();
  };

  // Calculate completion statistics
  const answeredQuestions = Object.keys(userAnswers).length;
  const unansweredQuestions = questions.length - answeredQuestions;
  const completionPercentage =
    questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;

  // Loading state
  if (isQuizLoading || isStartingQuiz) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (quizError || !quizData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Error loading quiz. Please try again later.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link color="inherit" href="/" underline="hover">
          Home
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={() => router.back()}
          underline="hover"
        >
          Back
        </Link>
        <Typography color="text.primary">
          Quiz: {quizData.quiz.title}
        </Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {quizData.quiz.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {quizData.quiz.description}
        </Typography>

        {/* Quiz Progress */}
        <QuizProgress
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          answeredQuestions={Object.keys(userAnswers).length}
        />

        {/* Review Mode Indicator */}
        {isReviewMode && (
          <Alert
            severity="info"
            sx={{ mt: 2, mb: 2 }}
            icon={<VisibilityIcon />}
          >
            Review Mode - You can see correct answers and explanations
          </Alert>
        )}

        {/* Current Question */}
        {currentQuestion && (
          <Box sx={{ mt: 4 }}>
            <QuizQuestion
              question={currentQuestion}
              answerOptions={answerOptions[currentQuestion.id] || []}
              selectedAnswerId={userAnswers[currentQuestion.id] as number}
              onAnswerSelect={(answerId) =>
                handleAnswerSelect(currentQuestion.id, answerId)
              }
              isReviewMode={isReviewMode}
              correctAnswerId={
                isReviewMode
                  ? answerOptions[currentQuestion.id]?.find(
                      (option) => option.isCorrect,
                    )?.id
                  : undefined
              }
            />
          </Box>
        )}

        {/* Navigation */}
        <QuizNavigation
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          userAnswers={userAnswers}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onJumpToQuestion={handleJumpToQuestion}
          isSubmitting={isSubmitting || isSubmittingAnswer || isCompletingQuiz}
          isReviewMode={isReviewMode}
          progress={completionPercentage}
        />
      </Paper>

      {/* Completion Confirmation Dialog */}
      <Dialog
        open={showCompletionConfirm}
        onClose={() => setShowCompletionConfirm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuizIcon color="primary" />
            Complete Quiz
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you ready to submit your quiz? Please review your progress
            below:
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {answeredQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Answered
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color={
                        unansweredQuestions > 0
                          ? "warning.main"
                          : "success.main"
                      }
                    >
                      {unansweredQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unanswered
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {Math.round(completionPercentage)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complete
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={completionPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {unansweredQuestions > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have {unansweredQuestions} unanswered question
              {unansweredQuestions !== 1 ? "s" : ""}. You can still submit, but
              consider reviewing them first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompletionConfirm(false)}>
            Continue Quiz
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Results Dialog */}
      <Dialog
        open={showResults}
        onClose={handleCloseResults}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {quizResults?.passed ? (
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32 }} />
            ) : (
              <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
            )}
            Quiz Results
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
              {quizResults?.passed
                ? "Congratulations! 🎉"
                : "Keep Learning! 📚"}
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: "center" }}>
                      <TrendingUpIcon
                        color="primary"
                        sx={{ fontSize: 40, mb: 1 }}
                      />
                      <Typography variant="h4" color="primary">
                        {quizResults?.score}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Final Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: "center" }}>
                      <CheckCircleOutlineIcon
                        color="success"
                        sx={{ fontSize: 40, mb: 1 }}
                      />
                      <Typography variant="h4" color="success.main">
                        {quizResults?.correctAnswers || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correct
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: "center" }}>
                      <ErrorOutlineIcon
                        color="error"
                        sx={{ fontSize: 40, mb: 1 }}
                      />
                      <Typography variant="h4" color="error.main">
                        {(quizResults?.totalQuestions || 0) -
                          (quizResults?.correctAnswers || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Incorrect
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: "center" }}>
                      <TimerIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        {quizResults?.timeTaken || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Minutes
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
              {quizResults?.passed
                ? "Excellent work! You have successfully completed this quiz and demonstrated your understanding of the material."
                : `You scored ${quizResults?.score}% but need a higher score to pass. Review the material and try again when you're ready.`}
            </Typography>

            {quizResults?.passed && (
              <Alert severity="success" sx={{ mb: 2 }}>
                🏆 Quiz completed successfully! Your progress has been saved.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack
            direction="row"
            spacing={1}
            sx={{ width: "100%", justifyContent: "space-between" }}
          >
            <Button startIcon={<VisibilityIcon />} onClick={handleReviewMode}>
              Review Answers
            </Button>
            <Box>
              <Button onClick={handleCloseResults} sx={{ mr: 1 }}>
                Close
              </Button>
              {!quizResults?.passed && (
                <Button
                  variant="contained"
                  startIcon={<RestartAltIcon />}
                  onClick={() => {
                    handleCloseResults();
                    window.location.reload();
                  }}
                >
                  Try Again
                </Button>
              )}
            </Box>
          </Stack>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizPage;
