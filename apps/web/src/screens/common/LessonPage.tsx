// apps/web/src/screens/common/LessonPage.tsx
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  useGetLessonByIdQuery,
  useGetContentBlocksByLessonIdQuery,
  useGetModuleByIdQuery,
  useGetCourseByIdQuery,
  useGetSubjectAreaByIdQuery,
} from "../../store/services/api";
import ContentBlockRenderer from "../../components/content/ContentBlockRenderer";
import { ContentBlockType } from "@repo/core/src/types/pensum.types";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const LessonPage: React.FC = () => {
  const router = useRouter();
  const { lessonId } = router.query;

  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError,
  } = useGetLessonByIdQuery(Number(lessonId));

  const { data: contentBlocks, isLoading: isContentBlocksLoading } =
    useGetContentBlocksByLessonIdQuery(Number(lessonId));

  const { data: module, isLoading: isModuleLoading } = useGetModuleByIdQuery(
    lesson?.moduleId || 0,
    { skip: !lesson?.moduleId },
  );

  const { data: course, isLoading: isCourseLoading } = useGetCourseByIdQuery(
    module?.courseId || 0,
    { skip: !module?.courseId },
  );

  const { data: subjectArea } = useGetSubjectAreaByIdQuery(
    course?.subjectAreaId || 0,
    { skip: !course?.subjectAreaId },
  );

  // Sort content blocks by order
  const sortedContentBlocks = React.useMemo(() => {
    if (!contentBlocks) return [];
    return [...contentBlocks].sort((a, b) => a.order - b.order);
  }, [contentBlocks]);

  // Find quiz reference if any
  const quizRef = React.useMemo(() => {
    if (!contentBlocks) return null;
    const quizBlock = contentBlocks.find(
      (block) => block.type === ContentBlockType.QUIZ_REF,
    );
    return quizBlock ? Number(quizBlock.content) : null;
  }, [contentBlocks]);

  const isLoading =
    isLessonLoading ||
    isContentBlocksLoading ||
    isModuleLoading ||
    isCourseLoading;

  if (isLoading) {
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

  if (lessonError || !lesson) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Error loading lesson. Please try again later.
        </Typography>
      </Container>
    );
  }

  const handleQuizStart = () => {
    if (quizRef) {
      router.push(`/quiz/${quizRef}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        {subjectArea && (
          <Link
            color="inherit"
            href={`/subject-area/${subjectArea.id}`}
            underline="hover"
          >
            {subjectArea.name}
          </Link>
        )}
        {course && (
          <Link color="inherit" href={`/course/${course.id}`} underline="hover">
            {course.title}
          </Link>
        )}
        {module && (
          <Link color="inherit" href={`/module/${module.id}`} underline="hover">
            {module.title}
          </Link>
        )}
        <Typography color="text.primary">{lesson.title}</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {lesson.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {lesson.description}
        </Typography>

        <Box sx={{ mt: 4 }}>
          {sortedContentBlocks.map((block) => (
            <ContentBlockRenderer key={block.id} contentBlock={block} />
          ))}
        </Box>

        {quizRef && (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleQuizStart}
            >
              Start Quiz
            </Button>
          </Box>
        )}
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/module/${module?.id}`)}
        >
          Back to Module
        </Button>

        {/* This would need to be enhanced with actual next lesson logic */}
        <Button
          endIcon={<ArrowForwardIcon />}
          variant="contained"
          onClick={() =>
            quizRef
              ? router.push(`/quiz/${quizRef}`)
              : router.push(`/module/${module?.id}`)
          }
        >
          {quizRef ? "Continue to Quiz" : "Back to Module"}
        </Button>
      </Box>
    </Container>
  );
};

export default LessonPage;
