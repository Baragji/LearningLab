import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions
}) => {
  // Calculate progress percentage
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const answeredPercentage = (answeredQuestions / totalQuestions) * 100;

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestion} of {totalQuestions}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {answeredQuestions} answered
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progressPercentage} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          mb: 1,
          backgroundColor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          }
        }} 
      />
      
      <LinearProgress 
        variant="determinate" 
        value={answeredPercentage} 
        color="success"
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          }
        }} 
      />
    </Box>
  );
};

export default QuizProgress;