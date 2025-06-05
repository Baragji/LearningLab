"use client";

import React, { useState } from "react";
import { Button } from "ui";
import { Card, CardContent, CardHeader } from "@mui/material";
import { TextField } from "ui";
import { FormControlLabel, Typography } from "@mui/material";
import { Select } from "ui";
import { Checkbox } from "ui";
import { Chip } from "@mui/material";
import {
  CircularProgress,
  Alert,
  AlertTitle,
  LinearProgress,
  Box,
} from "@mui/material";
import { Divider } from "@mui/material";

interface GeneratedQuestion {
  text: string;
  type: "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "ESSAY" | "CODE" | "DRAG_DROP";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  points: number;
  answerOptions?: {
    text: string;
    isCorrect: boolean;
  }[];
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  qualityScore: number;
  reasoning: string;
}

interface QuestionGeneratorProps {
  lessonId?: number;
  topicId?: number;
  onQuestionsGenerated?: (questions: GeneratedQuestion[]) => void;
}

const questionTypeLabels = {
  MULTIPLE_CHOICE: "Multiple Choice",
  FILL_IN_BLANK: "Udfyld blanke felter",
  ESSAY: "Essay",
  CODE: "Kode",
  DRAG_DROP: "Træk og slip",
};

const difficultyLabels = {
  BEGINNER: "Begynder",
  INTERMEDIATE: "Mellem",
  ADVANCED: "Avanceret",
};

export function QuestionGenerator({
  lessonId,
  topicId,
  onQuestionsGenerated,
}: QuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Form state
  const [content, setContent] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [targetDifficulty, setTargetDifficulty] = useState<
    "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  >("INTERMEDIATE");
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    "MULTIPLE_CHOICE",
    "FILL_IN_BLANK",
  ]);
  const [focusAreas, setFocusAreas] = useState("");

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionTypes([...selectedQuestionTypes, type]);
    } else {
      setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== type));
    }
  };

  const generateQuestionsFromContent = async () => {
    if (!content.trim()) {
      setError("Indtast venligst noget indhold at generere spørgsmål fra");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/ai/questions/generate-advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          contentType: "lesson",
          contentId: "manual",
          targetDifficulty,
          questionTypes: selectedQuestionTypes,
          numberOfQuestions,
          focusAreas: focusAreas
            ? focusAreas.split(",").map((area) => area.trim())
            : undefined,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedQuestions(data.questions);
        onQuestionsGenerated?.(data.questions);
      } else {
        throw new Error(data.message || "Fejl ved generering af spørgsmål");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl opstod");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generateQuestionsFromLesson = async () => {
    if (!lessonId) {
      setError("Ingen lesson ID angivet");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `/api/ai/questions/generate/lesson/${lessonId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numberOfQuestions,
            questionTypes: selectedQuestionTypes,
            targetDifficulty,
          }),
        },
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedQuestions(data.questions);
        onQuestionsGenerated?.(data.questions);
      } else {
        throw new Error(data.message || "Fejl ved generering af spørgsmål");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl opstod");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generateQuestionsFromTopic = async () => {
    if (!topicId) {
      setError("Ingen topic ID angivet");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `/api/ai/questions/generate/topic/${topicId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numberOfQuestions,
            questionTypes: selectedQuestionTypes,
            targetDifficulty,
          }),
        },
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedQuestions(data.questions);
        onQuestionsGenerated?.(data.questions);
      } else {
        throw new Error(data.message || "Fejl ved generering af spørgsmål");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl opstod");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">AI Spørgsmålsgenerator</Typography>
            </Box>
          }
          subheader="Generer automatisk spørgsmål baseret på indhold ved hjælp af avanceret AI-analyse"
        />
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Generation Options */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {!lessonId && !topicId && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fra Indhold
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Indsæt dit eget indhold
                  </Typography>
                  <Button
                    onClick={generateQuestionsFromContent}
                    disabled={isGenerating || !content.trim()}
                    variant="contained"
                    fullWidth
                    isLoading={isGenerating}
                    loadingText="Genererer..."
                  >
                    Generer
                  </Button>
                </Card>
              )}

              {lessonId && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fra Lesson
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Generer fra lesson #{lessonId}
                  </Typography>
                  <Button
                    onClick={generateQuestionsFromLesson}
                    disabled={isGenerating}
                    variant="contained"
                    fullWidth
                    isLoading={isGenerating}
                    loadingText="Genererer..."
                  >
                    Generer
                  </Button>
                </Card>
              )}

              {topicId && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fra Topic
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Generer fra topic #{topicId}
                  </Typography>
                  <Button
                    onClick={generateQuestionsFromTopic}
                    disabled={isGenerating}
                    variant="contained"
                    fullWidth
                    isLoading={isGenerating}
                    loadingText="Genererer..."
                  >
                    Generer
                  </Button>
                </Card>
              )}
            </Box>

            {/* Content Input (only show if no lessonId or topicId) */}
            {!lessonId && !topicId && (
              <TextField
                label="Indhold"
                placeholder="Indsæt det indhold du vil generere spørgsmål fra..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={6}
                fullWidth
              />
            )}

            {/* Configuration */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Antal spørgsmål"
                  type="number"
                  inputProps={{ min: 1, max: 20 }}
                  value={numberOfQuestions}
                  onChange={(e) =>
                    setNumberOfQuestions(parseInt(e.target.value) || 5)
                  }
                  fullWidth
                />

                <Select
                  label="Sværhedsgrad"
                  value={targetDifficulty}
                  onChange={(value) => setTargetDifficulty(value as any)}
                  options={[
                    { value: "BEGINNER", label: "Begynder" },
                    { value: "INTERMEDIATE", label: "Mellem" },
                    { value: "ADVANCED", label: "Avanceret" },
                  ]}
                  fullWidth
                />

                <TextField
                  label="Fokusområder (valgfrit)"
                  placeholder="f.eks. funktioner, variabler, loops"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  helperText="Adskil med komma for at specificere fokusområder"
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Spørgsmålstyper</Typography>
                {Object.entries(questionTypeLabels).map(([type, label]) => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Checkbox
                        checked={selectedQuestionTypes.includes(type)}
                        onChange={(e) =>
                          handleQuestionTypeChange(type, e.target.checked)
                        }
                      />
                    }
                    label={label}
                  />
                ))}
              </Box>
            </Box>

            {/* Progress */}
            {isGenerating && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    Genererer spørgsmål...
                  </Typography>
                  <Typography variant="body2">{progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}

            {/* Error */}
            {error && (
              <Alert severity="error">
                <AlertTitle>Fejl</AlertTitle>
                {error}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader
            title={`Genererede Spørgsmål (${generatedQuestions.length})`}
            subheader="Spørgsmålene er sorteret efter kvalitetsscore"
          />
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {generatedQuestions.map((question, index) => (
                <Card key={index} sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          label={questionTypeLabels[question.type]}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          label={difficultyLabels[question.difficulty]}
                          size="small"
                          color={
                            question.difficulty === "BEGINNER"
                              ? "success"
                              : question.difficulty === "INTERMEDIATE"
                                ? "warning"
                                : "error"
                          }
                        />
                        <Chip
                          label={`${question.points} point${question.points !== 1 ? "er" : ""}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {question.text}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        ml: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "medium",
                          color:
                            question.qualityScore >= 80
                              ? "success.main"
                              : question.qualityScore >= 60
                                ? "warning.main"
                                : "error.main",
                        }}
                      >
                        {question.qualityScore}%
                      </Typography>
                    </Box>
                  </Box>

                  {/* Answer Options for Multiple Choice */}
                  {question.type === "MULTIPLE_CHOICE" &&
                    question.answerOptions && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "medium", mb: 1 }}
                        >
                          Svarmuligheder:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {question.answerOptions.map((option, optionIndex) => (
                            <Box
                              key={optionIndex}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: option.isCorrect
                                  ? "success.main"
                                  : "grey.300",
                                bgcolor: option.isCorrect
                                  ? "success.light"
                                  : "grey.50",
                                color: option.isCorrect
                                  ? "success.dark"
                                  : "text.primary",
                              }}
                            >
                              <Typography variant="body2">
                                {option.isCorrect && "✓ "}
                                {option.text}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                  {/* Essay Requirements */}
                  {question.type === "ESSAY" && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      Ordkrav: {question.essayMinWords}-{question.essayMaxWords}{" "}
                      ord
                    </Typography>
                  )}

                  {/* Code Template */}
                  {question.type === "CODE" && question.codeTemplate && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "medium", mb: 1 }}
                      >
                        Kode template ({question.codeLanguage}):
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "grey.100",
                          p: 2,
                          borderRadius: 1,
                          overflow: "auto",
                        }}
                      >
                        <Typography
                          component="pre"
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {question.codeTemplate}
                        </Typography>
                      </Box>
                      {question.expectedOutput && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium", mb: 1 }}
                          >
                            Forventet output:
                          </Typography>
                          <Box
                            sx={{ bgcolor: "grey.100", p: 1, borderRadius: 1 }}
                          >
                            <Typography
                              component="pre"
                              variant="body2"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {question.expectedOutput}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Reasoning */}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>AI Begrundelse:</strong> {question.reasoning}
                  </Typography>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
