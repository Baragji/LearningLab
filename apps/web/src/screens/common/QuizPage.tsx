// apps/web/src/screens/common/QuizPage.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Link
} from '@mui/material';
import { 
  useGetQuizByIdQuery,
  useStartQuizAttemptMutation,
  useSubmitAnswerMutation,
  useCompleteQuizAttemptMutation
} from '../../store/services/api';
import QuizQuestion from '../../components/quiz/QuizQuestion';
import QuizNavigation from '../../components/quiz/QuizNavigation';
import QuizProgress from '../../components/quiz/QuizProgress';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const QuizPage: React.FC = () => {
  const router = useRouter();
  const { quizId } = router.query;
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<{ score: number; passed: boolean } | null>(null);
  
  // API Hooks
  const { 
    data: quizData, 
    isLoading: isQuizLoading, 
    error: quizError 
  } = useGetQuizByIdQuery(Number(quizId));
  
  const [startQuizAttempt, { isLoading: isStartingQuiz }] = useStartQuizAttemptMutation();
  const [submitAnswer, { isLoading: isSubmittingAnswer }] = useSubmitAnswerMutation();
  const [completeQuizAttempt, { isLoading: isCompletingQuiz }] = useCompleteQuizAttemptMutation();
  
  // Start quiz attempt when component mounts
  useEffect(() => {
    const initQuiz = async () => {
      if (quizId) {
        try {
          const response = await startQuizAttempt({ quizId: Number(quizId) }).unwrap();
          setQuizAttemptId(response.id);
        } catch (error) {
          console.error('Failed to start quiz attempt:', error);
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
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
    
    // Submit to backend
    if (quizAttemptId) {
      try {
        await submitAnswer({
          quizAttemptId,
          questionId,
          selectedAnswerOptionId: answerId
        });
      } catch (error) {
        console.error('Failed to submit answer:', error);
      }
    }
  };
  
  // Handle navigation
  const handleNext = () => {
    if (isLastQuestion) {
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };
  
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  // Handle quiz completion
  const handleQuizComplete = async () => {
    if (!quizAttemptId) return;
    
    setIsSubmitting(true);
    
    try {
      const results = await completeQuizAttempt({ quizAttemptId }).unwrap();
      setQuizResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to complete quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle closing results dialog
  const handleCloseResults = () => {
    setShowResults(false);
    // Navigate back to the course or module page
    router.back();
  };
  
  // Loading state
  if (isQuizLoading || isStartingQuiz) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
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
        <Link 
          color="inherit" 
          href="/"
          underline="hover"
        >
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
        <Typography color="text.primary">Quiz: {quizData.quiz.title}</Typography>
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
        
        {/* Current Question */}
        {currentQuestion && (
          <Box sx={{ mt: 4 }}>
            <QuizQuestion
              question={currentQuestion}
              answerOptions={answerOptions[currentQuestion.id] || []}
              selectedAnswerId={userAnswers[currentQuestion.id] as number}
              onAnswerSelect={(answerId) => handleAnswerSelect(currentQuestion.id, answerId)}
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
        />
      </Paper>
      
      {/* Results Dialog */}
      <Dialog
        open={showResults}
        onClose={handleCloseResults}
        aria-labelledby="quiz-results-dialog-title"
      >
        <DialogTitle id="quiz-results-dialog-title">
          Quiz Results
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            {quizResults?.passed ? (
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
            ) : (
              <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
            )}
            
            <Typography variant="h5" sx={{ mt: 2 }}>
              {quizResults?.passed ? 'Congratulations!' : 'Better luck next time!'}
            </Typography>
            
            <Typography variant="body1" sx={{ mt: 1 }}>
              Your score: {quizResults?.score}%
            </Typography>
            
            <DialogContentText sx={{ mt: 2, textAlign: 'center' }}>
              {quizResults?.passed 
                ? 'You have successfully completed this quiz!' 
                : 'You did not pass this quiz. Feel free to review the material and try again.'}
            </DialogContentText>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Close</Button>
          {!quizResults?.passed && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleCloseResults();
                window.location.reload();
              }}
            >
              Try Again
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizPage;