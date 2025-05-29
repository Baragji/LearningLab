import React from 'react';
import { Question, AnswerOption } from '@repo/core';
import { 
  Box, 
  Typography, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  Paper
} from '@mui/material';

interface QuizQuestionProps {
  question: Question;
  answerOptions: AnswerOption[];
  selectedAnswerId?: number;
  onAnswerSelect: (answerId: number) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  answerOptions,
  selectedAnswerId,
  onAnswerSelect
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onAnswerSelect(Number(event.target.value));
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {question.text}
      </Typography>
      
      <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
        <RadioGroup
          value={selectedAnswerId || ''}
          onChange={handleChange}
        >
          {answerOptions.map((option) => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              control={<Radio />}
              label={option.text}
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                ...(selectedAnswerId === option.id && {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                }),
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
      
      {question.explanation && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="info.dark" gutterBottom>
            Explanation:
          </Typography>
          <Typography variant="body2" color="info.dark">
            {question.explanation}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuizQuestion;