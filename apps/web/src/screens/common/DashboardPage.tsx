// apps/web/src/screens/common/DashboardPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea, 
  CircularProgress, 
  Button,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { 
  useGetUserCoursesQuery,
  useGetUserStatisticsQuery,
  useGetCurrentUserQuery
} from '../../store/services/api';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QuizIcon from '@mui/icons-material/Quiz';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { 
    data: userCoursesData, 
    isLoading: isCoursesLoading, 
    error: coursesError 
  } = useGetUserCoursesQuery();
  
  const { 
    data: userStats, 
    isLoading: isStatsLoading, 
    error: statsError 
  } = useGetUserStatisticsQuery();
  
  const {
    data: currentUser,
    isLoading: isUserLoading
  } = useGetCurrentUserQuery();
  
  const isLoading = isCoursesLoading || isStatsLoading || isUserLoading;
  const hasError = !!coursesError || !!statsError;
  
  // Get courses in progress first, then completed courses
  const sortedCourses = React.useMemo(() => {
    if (!userCoursesData) return [];
    
    return [...userCoursesData.courses].sort((a, b) => {
      const progressA = userCoursesData.progress[a.id] || 0;
      const progressB = userCoursesData.progress[b.id] || 0;
      
      // Sort by in-progress (not 0% and not 100%) first
      if (progressA > 0 && progressA < 100 && (progressB === 0 || progressB === 100)) return -1;
      if (progressB > 0 && progressB < 100 && (progressA === 0 || progressA === 100)) return 1;
      
      // Then by progress percentage (descending)
      return progressB - progressA;
    });
  }, [userCoursesData]);
  
  // Recent quiz results
  const recentQuizResults = React.useMemo(() => {
    if (!userStats) return [];
    
    return [...userStats.quizResults]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5); // Get only the 5 most recent
  }, [userStats]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (hasError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Error loading dashboard data. Please try again later.
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={4}>
        {/* Welcome Section */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  mr: 2
                }}
              >
                {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1">
                  Welcome back, {currentUser?.name || 'User'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Continue your learning journey
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">
                  My Courses
                </Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {userCoursesData?.courses.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total enrolled courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEventsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">
                  XP Points
                </Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {userStats?.totalXp || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total experience points earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <QuizIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">
                  Quizzes Completed
                </Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {userStats?.quizResults.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total quizzes completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* My Courses Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              My Courses
            </Typography>
            
            {sortedCourses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven&apos;t enrolled in any courses yet.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {sortedCourses.map(course => {
                  const progress = userCoursesData?.progress[course.id] || 0;
                  
                  return (
                    <Grid key={course.id} size={{ xs: 12, sm: 6 }}>
                      <Card 
                        elevation={1}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          ...(progress === 100 && {
                            borderLeft: '4px solid',
                            borderColor: 'success.main',
                          }),
                        }}
                      >
                        <CardActionArea 
                          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                          onClick={() => navigate(`/course/${course.id}`)}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" gutterBottom>
                              {course.title}
                            </Typography>
                            
                            <Box sx={{ mt: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {progress}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ height: 6, borderRadius: 3 }} 
                              />
                            </Box>
                            
                            {progress === 100 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'success.main' }}>
                                <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="success.main">
                                  Completed
                                </Typography>
                              </Box>
                            )}
                            
                            {progress > 0 && progress < 100 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'info.main' }}>
                                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="info.main">
                                  In Progress
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            {sortedCourses.length > 0 && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/courses')}
                >
                  View All Courses
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Quiz Results */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Recent Quiz Results
            </Typography>
            
            {recentQuizResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  You haven&apos;t completed any quizzes yet.
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%' }}>
                {recentQuizResults.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {result.passed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <QuizIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.quiz?.title || 'Quiz'}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color={result.passed ? "success.main" : "warning.main"}
                            >
                              Score: {result.score}% - {result.passed ? 'Passed' : 'Failed'}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(result.completedAt).toLocaleDateString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < recentQuizResults.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;