import React from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip, 
  useTheme 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

interface QuizNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  userAnswers: Record<number, number | string>;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToQuestion: (index: number) => void;
  isSubmitting: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  userAnswers,
  onPrevious,
  onNext,
  onJumpToQuestion,
  isSubmitting
}) => {
  const theme = useTheme();
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;

  return (
    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onPrevious}
        disabled={isFirstQuestion || isSubmitting}
        variant="outlined"
      >
        Previous
      </Button>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const questionId = index + 1;
          const isCurrentQuestion = index === currentQuestionIndex;
          const isAnswered = userAnswers[questionId] !== undefined;

          return (
            <Tooltip 
              key={index} 
              title={isAnswered ? "Answered" : "Not answered yet"}
              arrow
            >
              <IconButton
                onClick={() => onJumpToQuestion(index)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  ...(isCurrentQuestion && {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }),
                  ...(isAnswered && !isCurrentQuestion && {
                    bgcolor: theme.palette.success.main,
                    color: theme.palette.success.contrastText,
                    '&:hover': {
                      bgcolor: theme.palette.success.dark,
                    },
                  }),
                  ...(!isAnswered && !isCurrentQuestion && {
                    bgcolor: theme.palette.grey[300],
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: theme.palette.grey[400],
                    },
                  }),
                }}
              >
                {index + 1}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      <Button
        endIcon={isLastQuestion ? <CheckIcon /> : <ArrowForwardIcon />}
        onClick={onNext}
        disabled={isSubmitting}
        variant={isLastQuestion ? "contained" : "outlined"}
        color={isLastQuestion ? "success" : "primary"}
      >
        {isLastQuestion ? (isSubmitting ? 'Submitting...' : 'Finish Quiz') : 'Next'}
      </Button>
    </Box>
  );
};

export default QuizNavigation;