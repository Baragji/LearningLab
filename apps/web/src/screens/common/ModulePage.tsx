// apps/web/src/screens/common/ModulePage.tsx
import React, { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Breadcrumbs, 
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid
} from '@mui/material';
import { 
  useGetModuleByIdQuery, 
  useGetLessonsByModuleIdQuery,
  useGetCourseByIdQuery,
  useGetSubjectAreaByIdQuery,
  useGetUserProgressQuery
} from '../../store/services/api';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import LinearProgress from '@mui/material/LinearProgress';

const ModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  
  const { 
    data: module, 
    isLoading: isModuleLoading, 
    error: moduleError 
  } = useGetModuleByIdQuery(Number(moduleId));
  
  const { 
    data: lessons, 
    isLoading: isLessonsLoading 
  } = useGetLessonsByModuleIdQuery(Number(moduleId));
  
  const { 
    data: course, 
    isLoading: isCourseLoading 
  } = useGetCourseByIdQuery(
    module?.courseId || 0, 
    { skip: !module?.courseId }
  );
  
  const { 
    data: subjectArea 
  } = useGetSubjectAreaByIdQuery(
    course?.subjectAreaId || 0, 
    { skip: !course?.subjectAreaId }
  );
  
  const {
    data: userProgress,
    isLoading: isProgressLoading
  } = useGetUserProgressQuery(
    course?.id || 0,
    { skip: !course?.id }
  );
  
  const isLoading = isModuleLoading || isLessonsLoading || isCourseLoading || isProgressLoading;
  
  // Sort lessons by order
  const sortedLessons = React.useMemo(() => {
    if (!lessons) return [];
    return [...lessons].sort((a, b) => a.order - b.order);
  }, [lessons]);
  
  // Check if a lesson is completed - wrapped in useCallback to avoid dependency issues
  const isLessonCompleted = useCallback((lessonId: number) => {
    if (!userProgress) return false;
    return userProgress.completedLessons.includes(lessonId);
  }, [userProgress]);
  
  // Calculate module progress
  const moduleProgress = React.useMemo(() => {
    if (!userProgress || !lessons || lessons.length === 0) return 0;
    
    const completedCount = lessons.filter(lesson => 
      isLessonCompleted(lesson.id)
    ).length;
    
    return (completedCount / lessons.length) * 100;
  }, [userProgress, lessons, isLessonCompleted]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (moduleError || !module) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Error loading module. Please try again later.
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
        {subjectArea && (
          <Link 
            to={`/subject-area/${subjectArea.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {subjectArea.name}
          </Link>
        )}
        {course && (
          <Link 
            to={`/course/${course.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {course.title}
          </Link>
        )}
        <Typography color="text.primary">{module.title}</Typography>
      </Breadcrumbs>
      
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {module.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {module.description}
        </Typography>
        
        {/* Module Progress */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Module Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(moduleProgress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={moduleProgress} 
            sx={{ height: 8, borderRadius: 4 }} 
          />
        </Box>
        
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          Lessons
        </Typography>
        
        <Grid container spacing={3}>
          {sortedLessons.map((lesson) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={lesson.id}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  ...(isLessonCompleted(lesson.id) && {
                    borderLeft: '4px solid',
                    borderColor: 'success.main',
                  }),
                }}
              >
                {isLessonCompleted(lesson.id) && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10,
                      color: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                    <Typography variant="caption">Completed</Typography>
                  </Box>
                )}
                
                <CardActionArea 
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MenuBookIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        {lesson.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {lesson.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/course/${course?.id}`)}
        >
          Back to Course
        </Button>
        
        {sortedLessons.length > 0 && (
          <Button 
            endIcon={<NavigateNextIcon />} 
            variant="contained"
            onClick={() => navigate(`/lesson/${sortedLessons[0].id}`)}
          >
            Start First Lesson
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default ModulePage;