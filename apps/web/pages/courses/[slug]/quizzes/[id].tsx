import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { QuizProvider } from '../../../../src/context/QuizContext';
import QuizContainer from '../../../../src/components/quiz/QuizContainer';
import { Quiz, Question, AnswerOption, QuestionType } from '@repo/core/src/types/quiz.types';
import useQuizProgress from '../../../../src/hooks/useQuizProgress';

// Mock data for development - will be replaced with API call
const getMockQuizData = (id: string): { 
  quiz: Quiz; 
  questions: Question[]; 
  answerOptions: Record<number, AnswerOption[]> 
} => {
  // Mock quiz
  const quiz: Quiz = {
    id: parseInt(id),
    title: 'React Fundamentals Quiz',
    description: 'Test din viden om React grundbegreber',
    moduleId: 1,
    passingScore: 70,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Mock questions
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hvad er React?',
      type: QuestionType.MULTIPLE_CHOICE,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'React er et JavaScript-bibliotek til at bygge brugergrænseflader, udviklet af Facebook.'
    },
    {
      id: 2,
      text: 'Hvad er JSX?',
      type: QuestionType.MULTIPLE_CHOICE,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'JSX er en syntaksudvidelse til JavaScript, der ligner HTML og gør det lettere at skrive React-elementer.'
    },
    {
      id: 3,
      text: 'Hvad er en React-komponent?',
      type: QuestionType.MULTIPLE_CHOICE,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'En React-komponent er en genbrugelig kodeblok, der returnerer React-elementer som beskriver, hvad der skal vises på skærmen.'
    },
    {
      id: 4,
      text: 'Hvad er forskellen mellem state og props i React?',
      type: QuestionType.MULTIPLE_CHOICE,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'Props er data, der sendes til en komponent fra dens forælder, mens state er data, der administreres internt i komponenten.'
    },
    {
      id: 5,
      text: 'Hvad er en React Hook?',
      type: QuestionType.MULTIPLE_CHOICE,
      quizId: parseInt(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'Hooks er funktioner, der lader dig "hooke ind i" React-funktioner som state og livscyklus fra funktionelle komponenter.'
    }
  ];
  
  // Mock answer options
  const answerOptions: Record<number, AnswerOption[]> = {
    1: [
      { id: 101, text: 'Et JavaScript-bibliotek til at bygge brugergrænseflader', isCorrect: true, questionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 102, text: 'Et komplet framework som Angular', isCorrect: false, questionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 103, text: 'Et programmeringssprog', isCorrect: false, questionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 104, text: 'En database', isCorrect: false, questionId: 1, createdAt: new Date(), updatedAt: new Date() }
    ],
    2: [
      { id: 201, text: 'En ny programmeringssprog', isCorrect: false, questionId: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 202, text: 'En syntaksudvidelse til JavaScript, der ligner HTML', isCorrect: true, questionId: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 203, text: 'Et værktøj til at style komponenter', isCorrect: false, questionId: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 204, text: 'En JavaScript-compiler', isCorrect: false, questionId: 2, createdAt: new Date(), updatedAt: new Date() }
    ],
    3: [
      { id: 301, text: 'En HTML-fil', isCorrect: false, questionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 302, text: 'En CSS-klasse', isCorrect: false, questionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 303, text: 'En genbrugelig kodeblok, der returnerer React-elementer', isCorrect: true, questionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 304, text: 'En JavaScript-variabel', isCorrect: false, questionId: 3, createdAt: new Date(), updatedAt: new Date() }
    ],
    4: [
      { id: 401, text: 'Der er ingen forskel, de er det samme', isCorrect: false, questionId: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: 402, text: 'Props er for styling, state er for data', isCorrect: false, questionId: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: 403, text: 'Props sendes til komponenten, state administreres internt i komponenten', isCorrect: true, questionId: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: 404, text: 'State kan ikke ændres, props kan ændres', isCorrect: false, questionId: 4, createdAt: new Date(), updatedAt: new Date() }
    ],
    5: [
      { id: 501, text: 'En måde at tilføje HTML til React', isCorrect: false, questionId: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: 502, text: 'En funktion, der lader dig bruge React-funktioner i funktionelle komponenter', isCorrect: true, questionId: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: 503, text: 'Et værktøj til at forbinde React med en database', isCorrect: false, questionId: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: 504, text: 'En måde at style komponenter på', isCorrect: false, questionId: 5, createdAt: new Date(), updatedAt: new Date() }
    ]
  };
  
  return { quiz, questions, answerOptions };
};

const QuizPage: React.FC = () => {
  const router = useRouter();
  const { slug, id } = router.query;
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  
  // Initialize quiz progress hook
  const quizIdNumber = id ? parseInt(id as string) : 0;
  const { updateProgress, isUpdating } = useQuizProgress({ quizId: quizIdNumber });
  
  // Handle quiz completion
  const handleQuizComplete = async (score: number) => {
    console.log(`Quiz completed with score: ${score}%`);
    
    if (!id) return;
    
    try {
      setIsUpdatingProgress(true);
      setProgressError(null);
      
      // Get quiz data to access questions and answer options
      const { quiz, questions, answerOptions } = getMockQuizData(id as string);
      
      // In a real app, you would get the user's answers from the QuizContext
      // For now, we'll create mock answers based on the score
      const correctCount = Math.round((score / 100) * questions.length);
      const mockAnswers = questions.map((question, index) => {
        const options = answerOptions[question.id];
        const correctOption = options.find(opt => opt.isCorrect);
        const selectedOption = index < correctCount ? correctOption : options.find(opt => !opt.isCorrect);
        
        return {
          questionId: question.id,
          selectedOptionId: selectedOption?.id || 0,
          isCorrect: index < correctCount,
        };
      });
      
      // Update progress in the API
      await updateProgress(score, mockAnswers);
      
    } catch (error) {
      console.error('Failed to update quiz progress:', error);
      setProgressError('Failed to save your progress. Your results will still be shown.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };
  
  // Show loading state while router is not ready
  if (!router.isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Get quiz data
  const quizIdString = id as string;
  const { quiz, questions, answerOptions } = getMockQuizData(quizIdString);
  
  return (
    <>
      <Head>
        <title>{quiz.title} | LearningLab</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/courses" className="hover:text-gray-700 dark:hover:text-gray-200">
            Kurser
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/courses/${slug}`} className="hover:text-gray-700 dark:hover:text-gray-200">
            {slug}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-200">Quiz</span>
        </nav>
        
        {/* Progress error message */}
        {progressError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-700 dark:text-red-300">{progressError}</p>
          </div>
        )}
        
        {/* Loading indicator for API calls */}
        {isUpdatingProgress && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center">
            <div className="animate-spin mr-3 h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="text-blue-700 dark:text-blue-300">Gemmer dine resultater...</p>
          </div>
        )}
        
        <QuizProvider>
          <QuizContainer
            quiz={quiz}
            questions={questions}
            answerOptions={answerOptions}
            onComplete={handleQuizComplete}
          />
        </QuizProvider>
      </div>
    </>
  );
};

export default QuizPage;