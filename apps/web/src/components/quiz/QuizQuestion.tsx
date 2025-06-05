import React, { useState } from "react";
import { Question, AnswerOption } from "@repo/core";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Card,
  CardContent,
  useTheme,
  alpha,
  Fade,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface QuizQuestionProps {
  question: Question;
  answerOptions: AnswerOption[];
  selectedAnswerId?: number;
  onAnswerSelect: (answerId: number) => void;
  showCorrectAnswer?: boolean;
  isReviewMode?: boolean;
  correctAnswerId?: number;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  answerOptions,
  selectedAnswerId,
  onAnswerSelect,
  showCorrectAnswer = false,
  isReviewMode = false,
  correctAnswerId,
}) => {
  const theme = useTheme();
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isReviewMode) {
      onAnswerSelect(Number(event.target.value));
    }
  };

  const handleOptionClick = (optionId: number) => {
    if (!isReviewMode) {
      onAnswerSelect(optionId);
    }
  };

  const getOptionStatus = (option: AnswerOption) => {
    if (showCorrectAnswer) {
      if (option.isCorrect) return "correct";
      if (selectedAnswerId === option.id && !option.isCorrect)
        return "incorrect";
      return "neutral";
    }
    if (selectedAnswerId === option.id) return "selected";
    return "unselected";
  };

  const getOptionStyles = (option: AnswerOption, status: string) => {
    const isHovered = hoveredOption === option.id;
    const baseStyles = {
      transition: "all 0.2s ease-in-out",
      cursor: isReviewMode ? "default" : "pointer",
      border: "2px solid transparent",
      borderRadius: 2,
      mb: 2,
      position: "relative" as const,
      overflow: "hidden",
    };

    switch (status) {
      case "correct":
        return {
          ...baseStyles,
          bgcolor: alpha(theme.palette.success.main, 0.1),
          border: `2px solid ${theme.palette.success.main}`,
          "&:hover": {
            bgcolor: alpha(theme.palette.success.main, 0.15),
          },
        };
      case "incorrect":
        return {
          ...baseStyles,
          bgcolor: alpha(theme.palette.error.main, 0.1),
          border: `2px solid ${theme.palette.error.main}`,
          "&:hover": {
            bgcolor: alpha(theme.palette.error.main, 0.15),
          },
        };
      case "selected":
        return {
          ...baseStyles,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `2px solid ${theme.palette.primary.main}`,
          transform: isHovered ? "translateY(-2px)" : "none",
          boxShadow: isHovered ? theme.shadows[4] : theme.shadows[1],
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.15),
          },
        };
      case "unselected":
        return {
          ...baseStyles,
          bgcolor: theme.palette.background.paper,
          border: `2px solid ${theme.palette.divider}`,
          transform: isHovered ? "translateY(-2px)" : "none",
          boxShadow: isHovered ? theme.shadows[4] : theme.shadows[1],
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          },
        };
      default:
        return {
          ...baseStyles,
          bgcolor: theme.palette.background.paper,
          border: `2px solid ${theme.palette.divider}`,
        };
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          {question.text}
        </Typography>
        {isReviewMode && (
          <Chip
            label="Review Mode"
            size="small"
            color="info"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <FormControl component="fieldset" sx={{ width: "100%" }}>
        <RadioGroup value={selectedAnswerId || ""} onChange={handleChange}>
          {answerOptions.map((option, index) => {
            const status = getOptionStatus(option);
            const optionStyles = getOptionStyles(option, status);

            return (
              <Fade in={true} timeout={300 + index * 100} key={option.id}>
                <Card
                  sx={optionStyles}
                  onMouseEnter={() =>
                    !isReviewMode && setHoveredOption(option.id)
                  }
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => handleOptionClick(option.id)}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <FormControlLabel
                      value={option.id}
                      control={
                        <Radio
                          icon={<RadioButtonUncheckedIcon />}
                          checkedIcon={<CheckCircleIcon />}
                          disabled={isReviewMode}
                          sx={{
                            color:
                              status === "correct"
                                ? theme.palette.success.main
                                : status === "incorrect"
                                  ? theme.palette.error.main
                                  : status === "selected"
                                    ? theme.palette.primary.main
                                    : theme.palette.text.secondary,
                            "&.Mui-checked": {
                              color:
                                status === "correct"
                                  ? theme.palette.success.main
                                  : status === "incorrect"
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                            },
                          }}
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight:
                                selectedAnswerId === option.id ? 600 : 400,
                              color:
                                status === "correct"
                                  ? theme.palette.success.dark
                                  : status === "incorrect"
                                    ? theme.palette.error.dark
                                    : theme.palette.text.primary,
                            }}
                          >
                            {option.text}
                          </Typography>
                          {showCorrectAnswer && (
                            <Box>
                              {option.isCorrect && (
                                <Chip
                                  label="Correct"
                                  size="small"
                                  color="success"
                                  variant="filled"
                                />
                              )}
                              {selectedAnswerId === option.id &&
                                !option.isCorrect && (
                                  <Chip
                                    label="Your Answer"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                  />
                                )}
                            </Box>
                          )}
                        </Box>
                      }
                      sx={{
                        m: 0,
                        width: "100%",
                        alignItems: "flex-start",
                        "& .MuiFormControlLabel-label": {
                          width: "100%",
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Fade>
            );
          })}
        </RadioGroup>
      </FormControl>

      {question.explanation && (showCorrectAnswer || isReviewMode) && (
        <Fade in={true} timeout={500}>
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            }}
          >
            <Typography
              variant="subtitle1"
              color="info.dark"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              💡 Explanation
            </Typography>
            <Typography
              variant="body2"
              color="info.dark"
              sx={{ lineHeight: 1.6 }}
            >
              {question.explanation}
            </Typography>
          </Box>
        </Fade>
      )}
    </Paper>
  );
};

export default QuizQuestion;
