// apps/web/src/screens/common/CoursePage.tsx
import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Breadcrumbs, 
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  useGetCourseByIdQuery, 
  useGetModulesByCourseIdQuery,
  useGetSubjectAreaByIdQuery,
  useGetUserProgressQuery,
  useGetCourseEnrollmentStatusQuery,
  useEnrollInCourseMutation,
  useUnenrollFromCourseMutation
} from '../../store/services/api';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { toast } from 'react-hot-toast';

const CoursePage: React.FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  
  const { 
    data: course, 
    isLoading: isCourseLoading, 
    error: courseError 
  } = useGetCourseByIdQuery(Number(courseId));
  
  const { 
    data: modules, 
    isLoading: isModulesLoading 
  } = useGetModulesByCourseIdQuery(Number(courseId));
  
  const { 
    data: subjectArea 
  } = useGetSubjectAreaByIdQuery(
    course?.subjectAreaId || 0, 
    { skip: !course?.subjectAreaId }
  );
  
  const {
    data: userProgress,
    isLoading: isProgressLoading
  } = useGetUserProgressQuery(Number(courseId));
  
  const {
    data: enrollmentStatus,
    isLoading: isEnrollmentLoading,
    refetch: refetchEnrollmentStatus
  } = useGetCourseEnrollmentStatusQuery(Number(courseId));
  
  const [enrollInCourse, { isLoading: isEnrolling }] = useEnrollInCourseMutation();
  const [unenrollFromCourse, { isLoading: isUnenrolling }] = useUnenrollFromCourseMutation();
  
  const isLoading = isCourseLoading || isModulesLoading || isProgressLoading || isEnrollmentLoading;
  
  // Sort modules by order
  const sortedModules = React.useMemo(() => {
    if (!modules) return [];
    return [...modules].sort((a, b) => a.order - b.order);
  }, [modules]);
  
  // Handle enrollment
  const handleEnroll = async () => {
    try {
      await enrollInCourse(Number(courseId)).unwrap();
      toast.success('Du er nu tilmeldt kurset!');
      refetchEnrollmentStatus();
    } catch (error) {
      toast.error('Fejl ved tilmelding til kurset');
    }
  };
  
  const handleUnenroll = async () => {
    if (window.confirm('Er du sikker på, at du vil framelde dig dette kursus? Al din fremgang vil gå tabt.')) {
      try {
        await unenrollFromCourse(Number(courseId)).unwrap();
        toast.success('Du er nu frameldt kurset');
        refetchEnrollmentStatus();
      } catch (error) {
        toast.error('Fejl ved framelding fra kurset');
      }
    }
  };
  
  // Check if a module is unlocked (first module is always unlocked)
  const isModuleUnlocked = (moduleIndex: number) => {
    if (!enrollmentStatus?.enrolled) return false;
    if (moduleIndex === 0) return true;
    if (!userProgress) return false;
    
    // A module is unlocked if the previous module has at least one completed lesson
    const previousModuleId = sortedModules[moduleIndex - 1]?.id;
    if (!previousModuleId) return false;
    
    // This is a simplified logic - in a real app, you might want to check if all required lessons
    // in the previous module are completed
    return true; // For demo purposes, all modules are unlocked
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (courseError || !course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Error loading course. Please try again later.
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
            href={`/subject-area/${subjectArea.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {subjectArea.name}
          </Link>
        )}
        <Typography color="text.primary">{course.title}</Typography>
      </Breadcrumbs>
      
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {course.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {course.description}
        </Typography>
        
        {/* Enrollment Status and Actions */}
        <Box sx={{ mt: 3, mb: 3 }}>
          {enrollmentStatus?.enrolled ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Tilmeldt" 
                color="success" 
                variant="filled"
              />
              <Button
                startIcon={<PersonRemoveIcon />}
                onClick={handleUnenroll}
                disabled={isUnenrolling}
                color="error"
                variant="outlined"
                size="small"
              >
                {isUnenrolling ? 'Frammelder...' : 'Frameld'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label="Ikke tilmeldt" 
                color="default" 
                variant="outlined"
              />
              <Button
                startIcon={<PersonAddIcon />}
                onClick={handleEnroll}
                disabled={isEnrolling}
                color="primary"
                variant="contained"
                size="small"
              >
                {isEnrolling ? 'Tilmelder...' : 'Tilmeld dig'}
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Course Progress */}
        {enrollmentStatus?.enrolled && enrollmentStatus.progress !== undefined && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Kursus fremgang
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(enrollmentStatus.progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={enrollmentStatus.progress} 
              sx={{ height: 8, borderRadius: 4 }} 
            />
          </Box>
        )}
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" sx={{ mb: 3 }}>
          Modules
        </Typography>
        
        <Grid container spacing={3}>
          {sortedModules.map((module, index) => {
            const isUnlocked = isModuleUnlocked(index);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={module.id}>
                <Card 
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: isUnlocked ? 1 : 0.7,
                    border: !enrollmentStatus?.enrolled ? '2px dashed #ccc' : 'none',
                  }}
                >
                  <CardActionArea 
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    onClick={() => isUnlocked && router.push(`/module/${module.id}`)}
                    disabled={!isUnlocked}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FolderIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6" component="div">
                            {module.title}
                          </Typography>
                        </Box>
                        
                        {isUnlocked ? (
                          <Chip 
                            icon={<LockOpenIcon />} 
                            label="Unlocked" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        ) : (
                          <Chip 
                            icon={<LockIcon />} 
                            label="Locked" 
                            size="small" 
                            color="default" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {module.description}
                      </Typography>
                      
                      {!enrollmentStatus?.enrolled ? (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 2 }}>
                          Tilmeld dig kurset for at få adgang
                        </Typography>
                      ) : !isUnlocked ? (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2 }}>
                          Gennemfør forrige modul for at låse op
                        </Typography>
                      ) : null}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.back()}
        >
          Back
        </Button>
        
        {sortedModules.length > 0 && enrollmentStatus?.enrolled && (
          <Button 
            endIcon={<NavigateNextIcon />} 
            variant="contained"
            onClick={() => router.push(`/module/${sortedModules[0].id}`)}
          >
            Start første modul
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default CoursePage;