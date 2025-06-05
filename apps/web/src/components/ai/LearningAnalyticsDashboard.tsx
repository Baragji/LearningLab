"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Brain,
  BookOpen,
  Award,
  Calendar,
  Users,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface LearningMetrics {
  totalStudyTime: number;
  questionsAnswered: number;
  correctAnswers: number;
  averageAccuracy: number;
  streakDays: number;
  topicsStudied: number;
  skillLevel: string;
  learningVelocity: number;
  retentionRate: number;
  engagementScore: number;
}

interface ConceptMastery {
  concept: string;
  masteryLevel: number;
  questionsAnswered: number;
  accuracy: number;
  timeSpent: number;
  lastStudied: Date;
  difficulty: "beginner" | "intermediate" | "advanced";
  trend: "improving" | "stable" | "declining";
}

interface LearningPattern {
  pattern: string;
  description: string;
  frequency: number;
  impact: "positive" | "neutral" | "negative";
  recommendations: string[];
}

interface ProgressPrediction {
  timeframe: string;
  predictedAccuracy: number;
  confidence: number;
  milestones: {
    date: Date;
    description: string;
    probability: number;
  }[];
}

interface VisualizationData {
  progressOverTime: {
    date: string;
    accuracy: number;
    studyTime: number;
    questionsAnswered: number;
  }[];
  topicDistribution: {
    topic: string;
    value: number;
    color: string;
  }[];
  skillRadar: {
    skill: string;
    current: number;
    target: number;
  }[];
  difficultyProgression: {
    difficulty: string;
    completed: number;
    total: number;
  }[];
}

interface ComprehensiveDashboardData {
  metrics: LearningMetrics;
  conceptMastery: ConceptMastery[];
  learningPatterns: LearningPattern[];
  progressPredictions: ProgressPrediction;
  visualizations: VisualizationData;
  insights: string[];
  recommendations: string[];
}

interface LearningAnalyticsDashboardProps {
  userId: number;
  timeframe?: {
    start: Date;
    end: Date;
    period: "day" | "week" | "month" | "quarter" | "year";
  };
  className?: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function LearningAnalyticsDashboard({
  userId,
  timeframe,
  className,
}: LearningAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] =
    useState<ComprehensiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(
    timeframe || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      period: "month" as const,
    },
  );

  useEffect(() => {
    loadDashboardData();
  }, [userId, selectedTimeframe]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock performance history - in real app, this would come from your database
      const mockPerformanceHistory = [
        {
          userId,
          totalQuestions: 150,
          correctAnswers: 120,
          totalStudyTime: 3600,
          strengths: ["Mathematics", "Logic"],
          weaknesses: ["History", "Literature"],
          difficultyLevel: "intermediate" as const,
          streakDays: 7,
          lastActivity: new Date().toISOString(),
          topicsStudied: ["Math", "Science", "History"],
        },
      ];

      const response = await fetch("/api/ai/analytics/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          timeframe: {
            start: selectedTimeframe.start.toISOString(),
            end: selectedTimeframe.end.toISOString(),
            period: selectedTimeframe.period,
          },
          performanceHistory: mockPerformanceHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "accuracy":
        return <Target className="h-4 w-4" />;
      case "time":
        return <Clock className="h-4 w-4" />;
      case "streak":
        return <Zap className="h-4 w-4" />;
      case "engagement":
        return <Activity className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "text-green-600 bg-green-50";
      case "negative":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse text-blue-500" />
            <span className="text-sm text-muted-foreground">
              Loading analytics dashboard...
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

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getMetricIcon("accuracy")}
              <div>
                <p className="text-sm font-medium">Accuracy</p>
                <p className="text-2xl font-bold">
                  {dashboardData.metrics.averageAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getMetricIcon("time")}
              <div>
                <p className="text-sm font-medium">Study Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(dashboardData.metrics.totalStudyTime / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getMetricIcon("streak")}
              <div>
                <p className="text-sm font-medium">Streak</p>
                <p className="text-2xl font-bold">
                  {dashboardData.metrics.streakDays} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getMetricIcon("engagement")}
              <div>
                <p className="text-sm font-medium">Engagement</p>
                <p className="text-2xl font-bold">
                  {dashboardData.metrics.engagementScore.toFixed(1)}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Progress Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={dashboardData.visualizations.progressOverTime}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#8884d8"
                      name="Accuracy %"
                    />
                    <Line
                      type="monotone"
                      dataKey="questionsAnswered"
                      stroke="#82ca9d"
                      name="Questions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Topic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.visualizations.topicDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.visualizations.topicDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dashboardData.insights.map((insight, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start space-x-2"
                    >
                      <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0 text-green-500" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dashboardData.recommendations.map(
                    (recommendation, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start space-x-2"
                      >
                        <Award className="h-3 w-3 mt-1 flex-shrink-0 text-blue-500" />
                        <span>{recommendation}</span>
                      </li>
                    ),
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Development Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={dashboardData.visualizations.skillRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Current Level"
                    dataKey="current"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Target Level"
                    dataKey="target"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Difficulty Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboardData.visualizations.difficultyProgression}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="difficulty" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                  <Bar dataKey="total" fill="#82ca9d" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Concepts Tab */}
        <TabsContent value="concepts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.conceptMastery.map((concept, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{concept.concept}</span>
                    {getTrendIcon(concept.trend)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Mastery Level</span>
                      <span>{concept.masteryLevel}%</span>
                    </div>
                    <Progress value={concept.masteryLevel} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Accuracy</span>
                      <span>{concept.accuracy}%</span>
                    </div>
                    <Progress value={concept.accuracy} className="h-2" />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Questions: {concept.questionsAnswered}</span>
                    <Badge variant="outline" className="text-xs">
                      {concept.difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="space-y-4">
            {dashboardData.learningPatterns.map((pattern, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pattern.pattern}</span>
                    <Badge className={getImpactColor(pattern.impact)}>
                      {pattern.impact}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {pattern.description}
                  </p>

                  <div className="text-xs text-muted-foreground">
                    Frequency: {pattern.frequency}%
                  </div>

                  {pattern.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recommendations:</h4>
                      <ul className="space-y-1">
                        {pattern.recommendations.map((rec, recIndex) => (
                          <li
                            key={recIndex}
                            className="text-xs text-muted-foreground flex items-start space-x-2"
                          >
                            <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Progress Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Predicted Accuracy (
                    {dashboardData.progressPredictions.timeframe})
                  </span>
                  <span className="text-lg font-bold">
                    {dashboardData.progressPredictions.predictedAccuracy.toFixed(
                      1,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={dashboardData.progressPredictions.predictedAccuracy}
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  Confidence: {dashboardData.progressPredictions.confidence}%
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Upcoming Milestones</h4>
                {dashboardData.progressPredictions.milestones.map(
                  (milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {milestone.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.date.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {milestone.probability}% likely
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LearningAnalyticsDashboard;
