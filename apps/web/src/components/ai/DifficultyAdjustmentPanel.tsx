'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Gauge,
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Users,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface DifficultyAnalysis {
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  confidenceScore: number;
  performanceMetrics: {
    accuracy: number;
    speed: number;
    consistency: number;
    improvement: number;
  };
  adjustmentReasons: string[];
  suggestedActions: {
    action: 'increase' | 'decrease' | 'maintain';
    reason: string;
    impact: string;
  }[];
  adaptiveSettings: {
    enableRealTimeAdjustment: boolean;
    adjustmentSensitivity: number;
    minimumQuestionsBeforeAdjustment: number;
    maxDifficultyJumps: number;
  };
}

interface QuestionConfiguration {
  difficultyLevel: number; // 1-10 scale
  questionTypes: string[];
  timeLimit: number;
  hintsEnabled: boolean;
  multipleAttempts: boolean;
  adaptiveScoring: boolean;
  conceptWeights: Record<string, number>;
}

interface RealTimeAdjustment {
  sessionId: string;
  currentQuestion: number;
  totalQuestions: number;
  adjustmentsMade: {
    questionNumber: number;
    oldDifficulty: number;
    newDifficulty: number;
    reason: string;
    timestamp: Date;
  }[];
  performanceWindow: {
    correct: number;
    total: number;
    averageTime: number;
    streak: number;
  };
  nextAdjustment: {
    predicted: boolean;
    direction: 'up' | 'down' | 'maintain';
    confidence: number;
  };
}

interface DifficultyAdjustmentPanelProps {
  userId: number;
  currentSession?: {
    sessionId: string;
    questionsAnswered: number;
    currentDifficulty: number;
    performance: {
      correct: number;
      total: number;
      averageTime: number;
    };
  };
  onDifficultyChanged?: (newDifficulty: number) => void;
  onSettingsUpdated?: (settings: any) => void;
  className?: string;
}

export function DifficultyAdjustmentPanel({
  userId,
  currentSession,
  onDifficultyChanged,
  onSettingsUpdated,
  className,
}: DifficultyAdjustmentPanelProps) {
  const [analysis, setAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [questionConfig, setQuestionConfig] = useState<QuestionConfiguration>({
    difficultyLevel: 5,
    questionTypes: ['multiple-choice', 'true-false'],
    timeLimit: 60,
    hintsEnabled: true,
    multipleAttempts: false,
    adaptiveScoring: true,
    conceptWeights: {},
  });
  const [realTimeData, setRealTimeData] = useState<RealTimeAdjustment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true);
  const [adjustmentSensitivity, setAdjustmentSensitivity] = useState([5]);

  useEffect(() => {
    if (userId) {
      analyzeDifficulty();
    }
  }, [userId]);

  useEffect(() => {
    if (currentSession && autoAdjustEnabled) {
      monitorRealTimePerformance();
    }
  }, [currentSession, autoAdjustEnabled]);

  const analyzeDifficulty = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/difficulty/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          includeRecommendations: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze difficulty');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const adjustDifficulty = async (newLevel: number, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/difficulty/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newDifficultyLevel: newLevel,
          reason,
          sessionId: currentSession?.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to adjust difficulty');
      }

      const data = await response.json();
      setQuestionConfig(prev => ({ ...prev, difficultyLevel: newLevel }));
      onDifficultyChanged?.(newLevel);
      
      // Refresh analysis
      await analyzeDifficulty();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const monitorRealTimePerformance = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch('/api/ai/difficulty/real-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRealTimeData(data.realTimeData);
      }
    } catch (err) {
      console.error('Failed to monitor real-time performance:', err);
    }
  };

  const generateQuestionConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/difficulty/question-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          targetDifficulty: questionConfig.difficultyLevel,
          preferences: {
            questionTypes: questionConfig.questionTypes,
            timeLimit: questionConfig.timeLimit,
            hintsEnabled: questionConfig.hintsEnabled,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate question configuration');
      }

      const data = await response.json();
      setQuestionConfig(data.configuration);
      onSettingsUpdated?.(data.configuration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (level: string | number) => {
    const numLevel = typeof level === 'string' ? 
      (level === 'beginner' ? 3 : level === 'intermediate' ? 6 : 9) : level;
    
    if (numLevel <= 3) return 'bg-green-100 text-green-800';
    if (numLevel <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    return 'Advanced';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'increase':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'decrease':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'maintain':
        return <Minus className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading && !analysis) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Settings className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">
              Analyzing difficulty settings...
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
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Difficulty Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>Difficulty Adjustment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Current Level</div>
                  <Badge className={getDifficultyColor(analysis.currentLevel)}>
                    {analysis.currentLevel}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Recommended</div>
                  <Badge className={getDifficultyColor(analysis.recommendedLevel)}>
                    {analysis.recommendedLevel}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                  <div className="text-lg font-bold">
                    {Math.round(analysis.confidenceScore * 100)}%
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Performance Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                    <Progress value={analysis.performanceMetrics.accuracy} className="h-2" />
                    <div className="text-xs font-medium">
                      {Math.round(analysis.performanceMetrics.accuracy)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Speed</div>
                    <Progress value={analysis.performanceMetrics.speed} className="h-2" />
                    <div className="text-xs font-medium">
                      {Math.round(analysis.performanceMetrics.speed)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Consistency</div>
                    <Progress value={analysis.performanceMetrics.consistency} className="h-2" />
                    <div className="text-xs font-medium">
                      {Math.round(analysis.performanceMetrics.consistency)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Improvement</div>
                    <Progress value={analysis.performanceMetrics.improvement} className="h-2" />
                    <div className="text-xs font-medium">
                      {Math.round(analysis.performanceMetrics.improvement)}%
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Difficulty Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Manual Adjustment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Badge className={getDifficultyColor(questionConfig.difficultyLevel)}>
                {getDifficultyLabel(questionConfig.difficultyLevel)}
              </Badge>
            </div>
            <Slider
              value={[questionConfig.difficultyLevel]}
              onValueChange={(value) => {
                setQuestionConfig(prev => ({ ...prev, difficultyLevel: value[0] }));
              }}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Easy</span>
              <span>Medium</span>
              <span>Hard</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Auto-Adjustment</label>
              <p className="text-xs text-muted-foreground">
                Automatically adjust difficulty based on performance
              </p>
            </div>
            <Switch
              checked={autoAdjustEnabled}
              onCheckedChange={setAutoAdjustEnabled}
            />
          </div>

          {autoAdjustEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Sensitivity</label>
              <Slider
                value={adjustmentSensitivity}
                onValueChange={setAdjustmentSensitivity}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => adjustDifficulty(
                questionConfig.difficultyLevel,
                'Manual adjustment'
              )}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Apply Changes
            </Button>
            <Button
              onClick={generateQuestionConfig}
              disabled={isLoading}
              variant="outline"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Optimize
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Actions */}
      {analysis?.suggestedActions && analysis.suggestedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>AI Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.suggestedActions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  {getActionIcon(suggestion.action)}
                  <span className="font-medium capitalize">{suggestion.action} Difficulty</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {suggestion.reason}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Expected Impact:</strong> {suggestion.impact}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newLevel = suggestion.action === 'increase' 
                      ? Math.min(10, questionConfig.difficultyLevel + 1)
                      : suggestion.action === 'decrease'
                      ? Math.max(1, questionConfig.difficultyLevel - 1)
                      : questionConfig.difficultyLevel;
                    adjustDifficulty(newLevel, suggestion.reason);
                  }}
                  disabled={isLoading}
                >
                  Apply Suggestion
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real-Time Monitoring */}
      {currentSession && realTimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Real-Time Session Monitoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {realTimeData.currentQuestion}/{realTimeData.totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((realTimeData.performanceWindow.correct / realTimeData.performanceWindow.total) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(realTimeData.performanceWindow.averageTime)}s
                </div>
                <div className="text-xs text-muted-foreground">Avg Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {realTimeData.performanceWindow.streak}
                </div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
            </div>

            {realTimeData.adjustmentsMade.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Adjustments</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {realTimeData.adjustmentsMade.slice(-3).map((adjustment, index) => (
                    <div key={index} className="text-xs border rounded p-2">
                      <div className="flex items-center justify-between">
                        <span>Question {adjustment.questionNumber}</span>
                        <span className="text-muted-foreground">
                          {adjustment.oldDifficulty} → {adjustment.newDifficulty}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {adjustment.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {realTimeData.nextAdjustment.predicted && (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  AI predicts next adjustment: <strong>{realTimeData.nextAdjustment.direction}</strong> 
                  (confidence: {Math.round(realTimeData.nextAdjustment.confidence * 100)}%)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adjustment Reasons */}
      {analysis?.adjustmentReasons && analysis.adjustmentReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analysis Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.adjustmentReasons.map((reason, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                  <span className="text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DifficultyAdjustmentPanel;
