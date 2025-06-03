'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface FeedbackResponse {
  id: string;
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  suggestions: string[];
  confidence: number;
  learningTips: string[];
  relatedTopics: string[];
  nextSteps: string[];
  encouragement: string;
  timestamp: Date;
}

interface QuizAnswer {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  questionTopic?: string;
  confidence?: number;
  timeSpent?: number;
}

interface AIFeedbackPanelProps {
  userId: number;
  quizAnswer?: QuizAnswer;
  onFeedbackReceived?: (feedback: FeedbackResponse) => void;
  className?: string;
}

interface LearningAssistance {
  response: string;
  suggestions: string[];
  resources: string[];
  relatedConcepts: string[];
}

export function AIFeedbackPanel({
  userId,
  quizAnswer,
  onFeedbackReceived,
  className,
}: AIFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistanceQuery, setAssistanceQuery] = useState('');
  const [assistance, setAssistance] = useState<LearningAssistance | null>(null);
  const [showAssistance, setShowAssistance] = useState(false);

  // Generate feedback when quiz answer is provided
  useEffect(() => {
    if (quizAnswer) {
      generateFeedback(quizAnswer);
    }
  }, [quizAnswer]);

  const generateFeedback = async (answer: QuizAnswer) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/feedback/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          questionText: answer.questionText,
          questionTopic: answer.questionTopic,
          confidence: answer.confidence,
          timeSpent: answer.timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      onFeedbackReceived?.(feedbackData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getLearningAssistance = async () => {
    if (!assistanceQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/feedback/assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          topic: quizAnswer?.questionTopic || 'General',
          question: assistanceQuery,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get learning assistance');
      }

      const assistanceData = await response.json();
      setAssistance(assistanceData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackIcon = (isCorrect: boolean) => {
    return isCorrect ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse text-blue-500" />
            <span className="text-sm text-muted-foreground">
              AI is analyzing your response...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Feedback Card */}
      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getFeedbackIcon(feedback.isCorrect)}
              <span>
                {feedback.isCorrect ? 'Correct!' : 'Not Quite Right'}
              </span>
              <Badge
                variant={feedback.isCorrect ? 'default' : 'secondary'}
                className={cn(
                  'ml-auto',
                  getConfidenceColor(feedback.confidence)
                )}
              >
                {feedback.confidence}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feedback Text */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                {feedback.feedback}
              </p>
            </div>

            {/* Explanation */}
            {feedback.explanation && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Explanation</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  {feedback.explanation}
                </p>
              </div>
            )}

            {/* Learning Tips */}
            {feedback.learningTips.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Learning Tips</span>
                </h4>
                <ul className="space-y-1">
                  {feedback.learningTips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Suggestions</span>
                </h4>
                <ul className="space-y-1">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Topics */}
            {feedback.relatedTopics.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Related Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {feedback.relatedTopics.map((topic, index) => (
                    <Badge key={index} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {feedback.nextSteps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Next Steps</span>
                </h4>
                <ul className="space-y-1">
                  {feedback.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Encouragement */}
            {feedback.encouragement && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{feedback.encouragement}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Assistance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Need More Help?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ask me anything about this topic..."
              value={assistanceQuery}
              onChange={(e) => setAssistanceQuery(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={getLearningAssistance}
              disabled={!assistanceQuery.trim() || isLoading}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              Get AI Assistance
            </Button>
          </div>

          {/* Assistance Response */}
          {assistance && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-medium">AI Response</h4>
                <p className="text-sm text-muted-foreground">
                  {assistance.response}
                </p>
              </div>

              {assistance.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Suggestions</h4>
                  <ul className="space-y-1">
                    {assistance.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assistance.relatedConcepts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Related Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {assistance.relatedConcepts.map((concept, index) => (
                      <Badge key={index} variant="outline">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {assistance.resources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recommended Resources</h4>
                  <ul className="space-y-1">
                    {assistance.resources.map((resource, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <BookOpen className="h-3 w-3 mt-1 flex-shrink-0" />
                        <span>{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AIFeedbackPanel;
