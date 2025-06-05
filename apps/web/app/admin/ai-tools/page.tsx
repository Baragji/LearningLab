"use client";

import React from "react";
import { QuestionGenerator } from "../../../src/components/ai/QuestionGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../src/components/ui/tabs";
import { Brain, Sparkles, Target, Zap } from "lucide-react";

export default function AIToolsPage() {
  const handleQuestionsGenerated = (questions: any[]) => {
    console.log("Generated questions:", questions);
    // Here you could save questions to database, show success message, etc.
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          AI Værktøjer
        </h1>
        <p className="text-muted-foreground text-lg">
          Avancerede AI-drevne værktøjer til automatisk indholdsoprettelse og
          spørgsmålsgenerering
        </p>
      </div>

      <Tabs defaultValue="question-generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="question-generator"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Spørgsmålsgenerator
          </TabsTrigger>
          <TabsTrigger
            value="content-analyzer"
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Indholdsanalyse
          </TabsTrigger>
          <TabsTrigger
            value="quiz-optimizer"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Quiz Optimering
          </TabsTrigger>
          <TabsTrigger
            value="learning-paths"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Læringsstier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="question-generator" className="space-y-6">
          <QuestionGenerator onQuestionsGenerated={handleQuestionsGenerated} />
        </TabsContent>

        <TabsContent value="content-analyzer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Indholdsanalyse
              </CardTitle>
              <CardDescription>
                Analyser eksisterende indhold for at identificere læringshul og
                forbedringspotentiale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Indholdsanalyse værktøj kommer snart...</p>
                <p className="text-sm mt-2">
                  Dette værktøj vil analysere eksisterende lektioner og foreslå
                  forbedringer
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz-optimizer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quiz Optimering
              </CardTitle>
              <CardDescription>
                Optimer eksisterende quizzer baseret på brugerperformance og
                AI-analyse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Quiz optimering værktøj kommer snart...</p>
                <p className="text-sm mt-2">
                  Dette værktøj vil analysere quiz-performance og foreslå
                  forbedringer
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning-paths" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personaliserede Læringsstier
              </CardTitle>
              <CardDescription>
                Generer tilpassede læringsstier baseret på brugerens niveau og
                mål
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Læringsstier værktøj kommer snart...</p>
                <p className="text-sm mt-2">
                  Dette værktøj vil skabe personaliserede læringsstier for hver
                  bruger
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Overview Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Spørgsmål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generer automatisk spørgsmål fra enhver tekst med avanceret
              AI-analyse og kvalitetsvurdering.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Smart Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyser indhold for læringshul, sværhedsgrad og foreslå
              forbedringer baseret på AI-indsigter.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Optimering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Optimer quizzer og lektioner baseret på brugerdata og
              performance-metrics.
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-600" />
              Personalisering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Skab tilpassede læringsstier og anbefalinger baseret på
              individuelle behov.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
