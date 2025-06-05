"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  BookOpen,
  Award,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Star,
  Calendar,
  Users,
  Zap,
  BarChart3,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface LearningRecommendation {
  userId: number;
  recommendedTopics: string[];
  suggestedDifficulty: "beginner" | "intermediate" | "advanced";
  personalizedContent: {
    title: string;
    description: string;
    estimatedTime: number;
    difficulty: string;
    priority: "high" | "medium" | "low";
  }[];
  learningPath: {
    step: number;
    topic: string;
    description: string;
    estimatedDuration: number;
    prerequisites: string[];
    outcomes: string[];
  }[];
  adaptiveInsights: {
    strengths: string[];
    weaknesses: string[];
    learningStyle: string;
    recommendedStudyTime: number;
    optimalDifficulty: string;
  };
  nextActions: string[];
  motivationalMessage: string;
}

interface UserPerformanceData {
  userId: number;
  totalQuestions: number;
  correctAnswers: number;
  totalStudyTime: number;
  strengths: string[];
  weaknesses: string[];
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  streakDays: number;
  lastActivity: Date;
  topicsStudied?: string[];
}

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  topics: string[];
  estimatedWeeks: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  learningObjectives: string[];
  resources: {
    type: "video" | "article" | "quiz" | "exercise";
    title: string;
    url?: string;
    duration?: number;
  }[];
  milestones: {
    week: number;
    description: string;
    assessmentCriteria: string[];
  }[];
}

interface PersonalizedLearningPath {
  pathId: string;
  title: string;
  description: string;
  totalDuration: number;
  difficultyProgression: string[];
  steps: LearningPathStep[];
  adaptiveFeatures: {
    dynamicDifficulty: boolean;
    personalizedPacing: boolean;
    contentRecommendations: boolean;
    progressTracking: boolean;
  };
  successMetrics: {
    completionRate: number;
    averageAccuracy: number;
    timeToCompletion: number;
    retentionRate: number;
  };
}

interface AdaptiveLearningPanelProps {
  userId: number;
  performanceHistory: UserPerformanceData[];
  onRecommendationSelected?: (recommendation: any) => void;
  onLearningPathStarted?: (path: PersonalizedLearningPath) => void;
  className?: string;
}

export function AdaptiveLearningPanel({
  userId,
  performanceHistory,
  onRecommendationSelected,
  onLearningPathStarted,
  className,
}: AdaptiveLearningPanelProps) {
  const [recommendations, setRecommendations] =
    useState<LearningRecommendation | null>(null);
  const [learningPath, setLearningPath] =
    useState<PersonalizedLearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    if (performanceHistory.length > 0) {
      generateRecommendations();
    }
  }, [userId, performanceHistory]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/adaptive/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          performanceHistory,
          learningGoals: ["improve accuracy", "learn new topics"],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const generateLearningPath = async (topics: string[], goals: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/adaptive/learning-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          currentTopics: topics,
          learningGoals: goals,
          timeframeWeeks: 12,
          studyDaysPerWeek: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate learning path");
      }

      const data = await response.json();
      setLearningPath(data.data);
      setActiveTab("learning-path");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse text-blue-500" />
            <span className="text-sm text-muted-foreground">
              AI is analyzing your learning patterns...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
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
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Adaptive Learning Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
            </TabsList>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4 mt-4">
              {recommendations && (
                <>
                  {/* Motivational Message */}
                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription>
                      {recommendations.motivationalMessage}
                    </AlertDescription>
                  </Alert>

                  {/* Recommended Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Recommended Topics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recommendations.recommendedTopics.map(
                          (topic, index) => (
                            <Badge key={index} variant="outline">
                              {topic}
                            </Badge>
                          ),
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Suggested difficulty:
                        <Badge
                          className={cn(
                            "ml-2",
                            getDifficultyColor(
                              recommendations.suggestedDifficulty,
                            ),
                          )}
                        >
                          {recommendations.suggestedDifficulty}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personalized Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Personalized Content</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recommendations.personalizedContent.map(
                        (content, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{content.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={getPriorityColor(content.priority)}
                                >
                                  {content.priority}
                                </Badge>
                                <Badge
                                  className={getDifficultyColor(
                                    content.difficulty,
                                  )}
                                >
                                  {content.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {content.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDuration(content.estimatedTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </CardContent>
                  </Card>

                  {/* Next Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <ArrowRight className="h-5 w-5" />
                        <span>Next Actions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.nextActions.map((action, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() =>
                          generateLearningPath(
                            recommendations.recommendedTopics,
                            ["improve skills", "learn new concepts"],
                          )
                        }
                        className="w-full mt-4"
                      >
                        <Route className="h-4 w-4 mr-2" />
                        Generate Learning Path
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4 mt-4">
              {recommendations?.adaptiveInsights && (
                <>
                  {/* Learning Style & Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5" />
                        <span>Learning Profile</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Learning Style
                          </h4>
                          <Badge variant="outline" className="text-sm">
                            {recommendations.adaptiveInsights.learningStyle}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Optimal Difficulty
                          </h4>
                          <Badge
                            className={getDifficultyColor(
                              recommendations.adaptiveInsights
                                .optimalDifficulty,
                            )}
                          >
                            {recommendations.adaptiveInsights.optimalDifficulty}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Recommended Study Time
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDuration(
                              recommendations.adaptiveInsights
                                .recommendedStudyTime,
                            )}{" "}
                            per day
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <span>Strengths</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.adaptiveInsights.strengths.map(
                            (strength, index) => (
                              <li
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{strength}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          <span>Areas for Improvement</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.adaptiveInsights.weaknesses.map(
                            (weakness, index) => (
                              <li
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-sm">{weakness}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Learning Path Tab */}
            <TabsContent value="learning-path" className="space-y-4 mt-4">
              {learningPath ? (
                <>
                  {/* Path Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Route className="h-5 w-5" />
                        <span>{learningPath.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {learningPath.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {learningPath.totalDuration}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            weeks
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {learningPath.steps.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            steps
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {learningPath.successMetrics.completionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            success rate
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Adaptive Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(learningPath.adaptiveFeatures)
                            .filter(([_, enabled]) => enabled)
                            .map(([feature, _]) => (
                              <Badge key={feature} variant="outline">
                                {feature
                                  .replace(/([A-Z])/g, " $1")
                                  .toLowerCase()}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Steps */}
                  <div className="space-y-4">
                    {learningPath.steps.map((step, index) => (
                      <Card key={step.id}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span>{step.title}</span>
                            <Badge
                              className={getDifficultyColor(step.difficulty)}
                            >
                              {step.difficulty}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">
                                Topics Covered
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {step.topics.map((topic, topicIndex) => (
                                  <Badge
                                    key={topicIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Duration</h4>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                  {step.estimatedWeeks} weeks
                                </span>
                              </div>
                            </div>
                          </div>

                          {step.learningObjectives.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">
                                Learning Objectives
                              </h4>
                              <ul className="space-y-1">
                                {step.learningObjectives.map(
                                  (objective, objIndex) => (
                                    <li
                                      key={objIndex}
                                      className="text-sm text-muted-foreground flex items-start space-x-2"
                                    >
                                      <Target className="h-3 w-3 mt-1 flex-shrink-0" />
                                      <span>{objective}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          {step.milestones.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">
                                Milestones
                              </h4>
                              <div className="space-y-2">
                                {step.milestones.map(
                                  (milestone, milestoneIndex) => (
                                    <div
                                      key={milestoneIndex}
                                      className="border-l-2 border-blue-200 pl-4"
                                    >
                                      <div className="font-medium text-sm">
                                        Week {milestone.week}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {milestone.description}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={() => onLearningPathStarted?.(learningPath)}
                    className="w-full"
                    size="lg"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Start Learning Path
                  </Button>
                </>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">
                      No Learning Path Generated
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate recommendations first to create a personalized
                      learning path.
                    </p>
                    <Button
                      onClick={() => setActiveTab("recommendations")}
                      variant="outline"
                    >
                      View Recommendations
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdaptiveLearningPanel;
