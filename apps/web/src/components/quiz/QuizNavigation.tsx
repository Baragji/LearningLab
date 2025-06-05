import React, { useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  LinearProgress,
  Typography,
  Chip,
  Stack,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface QuizNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  userAnswers: Record<number, number | string>;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToQuestion: (index: number) => void;
  isSubmitting: boolean;
  showReviewMode?: boolean;
  onToggleReviewMode?: () => void;
  isReviewMode?: boolean;
  progress?: number;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  userAnswers,
  onPrevious,
  onNext,
  onJumpToQuestion,
  isSubmitting,
  showReviewMode = false,
  onToggleReviewMode,
  isReviewMode = false,
  progress,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredCount = Object.keys(userAnswers).length;
  const allQuestionsAnswered = answeredCount === totalQuestions;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isSubmitting) return;

      switch (event.key) {
        case "ArrowLeft":
          if (!isFirstQuestion) onPrevious();
          break;
        case "ArrowRight":
          if (!isLastQuestion) onNext();
          break;
        case "Enter":
          if (isLastQuestion && allQuestionsAnswered) onNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentQuestionIndex,
    isFirstQuestion,
    isLastQuestion,
    allQuestionsAnswered,
    isSubmitting,
    onPrevious,
    onNext,
  ]);

  return (
    <Box sx={{ mt: 4 }}>
      {/* Progress Section */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Typography>
          <Chip
            label={`${answeredCount}/${totalQuestions} answered`}
            size="small"
            color={allQuestionsAnswered ? "success" : "default"}
            variant={allQuestionsAnswered ? "filled" : "outlined"}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: theme.palette.grey[200],
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              transition: "transform 0.3s ease-in-out",
            },
          }}
        />
      </Box>

      {/* Question Navigation Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(5, 1fr)" : "repeat(10, 1fr)",
          gap: 1,
          mb: 3,
          justifyItems: "center",
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const questionId = index + 1;
          const isCurrentQuestion = index === currentQuestionIndex;
          const isAnswered = userAnswers[questionId] !== undefined;

          return (
            <Tooltip
              key={index}
              title={`Question ${index + 1}${isAnswered ? " (Answered)" : " (Not answered)"}`}
              arrow
              placement="top"
            >
              <IconButton
                onClick={() => onJumpToQuestion(index)}
                disabled={isSubmitting}
                sx={{
                  width: isMobile ? 32 : 40,
                  height: isMobile ? 32 : 40,
                  borderRadius: "50%",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease-in-out",
                  border: "2px solid transparent",
                  ...(isCurrentQuestion && {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: `2px solid ${theme.palette.primary.dark}`,
                    transform: "scale(1.1)",
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                      transform: "scale(1.15)",
                    },
                  }),
                  ...(isAnswered &&
                    !isCurrentQuestion && {
                      bgcolor: theme.palette.success.main,
                      color: theme.palette.success.contrastText,
                      "&:hover": {
                        bgcolor: theme.palette.success.dark,
                        transform: "scale(1.05)",
                      },
                    }),
                  ...(!isAnswered &&
                    !isCurrentQuestion && {
                      bgcolor: theme.palette.grey[100],
                      color: theme.palette.text.secondary,
                      border: `2px solid ${theme.palette.grey[300]}`,
                      "&:hover": {
                        bgcolor: theme.palette.grey[200],
                        border: `2px solid ${theme.palette.grey[400]}`,
                        transform: "scale(1.05)",
                      },
                    }),
                }}
              >
                {isAnswered && !isCurrentQuestion ? (
                  <CheckCircleIcon sx={{ fontSize: isMobile ? 16 : 20 }} />
                ) : isCurrentQuestion ? (
                  <FiberManualRecordIcon sx={{ fontSize: isMobile ? 8 : 10 }} />
                ) : (
                  index + 1
                )}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Navigation Controls */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? "100%" : 120,
            order: isMobile ? 2 : 1,
          }}
        >
          Previous
        </Button>

        {/* Review Mode Toggle (if available) */}
        {onToggleReviewMode && (
          <Button
            variant={showReviewMode ? "contained" : "outlined"}
            onClick={onToggleReviewMode}
            disabled={isSubmitting}
            size={isMobile ? "small" : "medium"}
            sx={{ order: isMobile ? 1 : 2 }}
          >
            {showReviewMode ? "Exit Review" : "Review Answers"}
          </Button>
        )}

        <Button
          endIcon={isLastQuestion ? <CheckIcon /> : <ArrowForwardIcon />}
          onClick={onNext}
          disabled={isSubmitting || (isLastQuestion && !allQuestionsAnswered)}
          variant={isLastQuestion ? "contained" : "outlined"}
          color={isLastQuestion ? "success" : "primary"}
          size={isMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? "100%" : 140,
            order: isMobile ? 3 : 3,
          }}
        >
          {isLastQuestion
            ? isSubmitting
              ? "Submitting..."
              : allQuestionsAnswered
                ? "Finish Quiz"
                : "Complete All Questions"
            : "Next"}
        </Button>
      </Stack>

      {/* Keyboard Shortcuts Hint */}
      {!isMobile && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2,
            opacity: 0.7,
          }}
        >
          Use ← → arrow keys to navigate • Enter to finish quiz
        </Typography>
      )}
    </Box>
  );
};

export default QuizNavigation;
