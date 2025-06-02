'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface GeneratedQuestion {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | 'ESSAY' | 'CODE' | 'DRAG_DROP';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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
  MULTIPLE_CHOICE: 'Multiple Choice',
  FILL_IN_BLANK: 'Udfyld blanke felter',
  ESSAY: 'Essay',
  CODE: 'Kode',
  DRAG_DROP: 'Træk og slip',
};

const difficultyLabels = {
  BEGINNER: 'Begynder',
  INTERMEDIATE: 'Mellem',
  ADVANCED: 'Avanceret',
};

const difficultyColors = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-red-100 text-red-800',
};

export function QuestionGenerator({ lessonId, topicId, onQuestionsGenerated }: QuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Form state
  const [content, setContent] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [targetDifficulty, setTargetDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['MULTIPLE_CHOICE', 'FILL_IN_BLANK']);
  const [focusAreas, setFocusAreas] = useState('');

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionTypes([...selectedQuestionTypes, type]);
    } else {
      setSelectedQuestionTypes(selectedQuestionTypes.filter(t => t !== type));
    }
  };

  const generateQuestionsFromContent = async () => {
    if (!content.trim()) {
      setError('Indtast venligst noget indhold at generere spørgsmål fra');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/ai/questions/generate-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          contentType: 'lesson',
          contentId: 'manual',
          targetDifficulty,
          questionTypes: selectedQuestionTypes,
          numberOfQuestions,
          focusAreas: focusAreas ? focusAreas.split(',').map(area => area.trim()) : undefined,
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
        throw new Error(data.message || 'Fejl ved generering af spørgsmål');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukendt fejl opstod');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generateQuestionsFromLesson = async () => {
    if (!lessonId) {
      setError('Ingen lesson ID angivet');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/ai/questions/generate/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numberOfQuestions,
          questionTypes: selectedQuestionTypes,
          targetDifficulty,
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
        throw new Error(data.message || 'Fejl ved generering af spørgsmål');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukendt fejl opstod');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generateQuestionsFromTopic = async () => {
    if (!topicId) {
      setError('Ingen topic ID angivet');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/ai/questions/generate/topic/${topicId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numberOfQuestions,
          questionTypes: selectedQuestionTypes,
          targetDifficulty,
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
        throw new Error(data.message || 'Fejl ved generering af spørgsmål');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukendt fejl opstod');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Spørgsmålsgenerator
          </CardTitle>
          <CardDescription>
            Generer automatisk spørgsmål baseret på indhold ved hjælp af avanceret AI-analyse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!lessonId && !topicId && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">Fra Indhold</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Indsæt dit eget indhold
                </p>
                <Button 
                  onClick={generateQuestionsFromContent} 
                  disabled={isGenerating || !content.trim()}
                  className="w-full"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generer
                </Button>
              </Card>
            )}
            
            {lessonId && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">Fra Lesson</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Generer fra lesson #{lessonId}
                </p>
                <Button 
                  onClick={generateQuestionsFromLesson} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generer
                </Button>
              </Card>
            )}
            
            {topicId && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">Fra Topic</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Generer fra topic #{topicId}
                </p>
                <Button 
                  onClick={generateQuestionsFromTopic} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generer
                </Button>
              </Card>
            )}
          </div>

          {/* Content Input (only show if no lessonId or topicId) */}
          {!lessonId && !topicId && (
            <div className="space-y-2">
              <Label htmlFor="content">Indhold</Label>
              <Textarea
                id="content"
                placeholder="Indsæt det indhold du vil generere spørgsmål fra..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="min-h-[150px]"
              />
            </div>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfQuestions">Antal spørgsmål</Label>
                <Input
                  id="numberOfQuestions"
                  type="number"
                  min="1"
                  max="20"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDifficulty">Sværhedsgrad</Label>
                <Select value={targetDifficulty} onValueChange={(value: any) => setTargetDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Begynder</SelectItem>
                    <SelectItem value="INTERMEDIATE">Mellem</SelectItem>
                    <SelectItem value="ADVANCED">Avanceret</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focusAreas">Fokusområder (valgfrit)</Label>
                <Input
                  id="focusAreas"
                  placeholder="f.eks. funktioner, variabler, loops"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Adskil med komma for at specificere fokusområder
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Spørgsmålstyper</Label>
                {Object.entries(questionTypeLabels).map(([type, label]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={selectedQuestionTypes.includes(type)}
                      onCheckedChange={(checked) => handleQuestionTypeChange(type, checked as boolean)}
                    />
                    <Label htmlFor={type} className="text-sm font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Genererer spørgsmål...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Genererede Spørgsmål ({generatedQuestions.length})</CardTitle>
            <CardDescription>
              Spørgsmålene er sorteret efter kvalitetsscore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedQuestions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {questionTypeLabels[question.type]}
                        </Badge>
                        <Badge className={difficultyColors[question.difficulty]}>
                          {difficultyLabels[question.difficulty]}
                        </Badge>
                        <Badge variant="secondary">
                          {question.points} point{question.points !== 1 ? 'er' : ''}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-lg mb-2">{question.text}</h4>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getQualityIcon(question.qualityScore)}
                      <span className={`text-sm font-medium ${getQualityColor(question.qualityScore)}`}>
                        {question.qualityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Answer Options for Multiple Choice */}
                  {question.type === 'MULTIPLE_CHOICE' && question.answerOptions && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Svarmuligheder:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {question.answerOptions.map((option, optionIndex) => (
                          <div 
                            key={optionIndex} 
                            className={`p-2 rounded border text-sm ${
                              option.isCorrect 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle className="h-3 w-3 inline mr-2" />}
                            {option.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Essay Requirements */}
                  {question.type === 'ESSAY' && (
                    <div className="text-sm text-muted-foreground">
                      <p>Ordkrav: {question.essayMinWords}-{question.essayMaxWords} ord</p>
                    </div>
                  )}

                  {/* Code Template */}
                  {question.type === 'CODE' && question.codeTemplate && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Kode template ({question.codeLanguage}):</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        <code>{question.codeTemplate}</code>
                      </pre>
                      {question.expectedOutput && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Forventet output:</p>
                          <pre className="bg-gray-100 p-2 rounded text-sm">
                            <code>{question.expectedOutput}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reasoning */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>AI Begrundelse:</strong> {question.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}