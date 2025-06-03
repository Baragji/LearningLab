[{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2305",
	"severity": 8,
	"message": "Module '\"./services/ai-feedback.service\"' has no exported member 'FeedbackResponse'.",
	"source": "ts",
	"startLineNumber": 22,
	"startColumn": 46,
	"endLineNumber": 22,
	"endColumn": 62,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2305",
	"severity": 8,
	"message": "Module '\"./services/adaptive-learning.service\"' has no exported member 'LearningRecommendation'.",
	"source": "ts",
	"startLineNumber": 23,
	"startColumn": 56,
	"endLineNumber": 23,
	"endColumn": 78,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type '\"beginner\" | \"intermediate\" | \"advanced\"' is not assignable to parameter of type '\"easy\" | \"medium\" | \"hard\"'.\n  Type '\"beginner\"' is not assignable to type '\"easy\" | \"medium\" | \"hard\"'.",
	"source": "ts",
	"startLineNumber": 255,
	"startColumn": 9,
	"endLineNumber": 255,
	"endColumn": 40,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2353",
	"severity": 8,
	"message": "Object literal may only specify known properties, and 'questionId' does not exist in type 'FeedbackRequest'.",
	"source": "ts",
	"startLineNumber": 288,
	"startColumn": 9,
	"endLineNumber": 288,
	"endColumn": 19,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2551",
	"severity": 8,
	"message": "Property 'generateFeedback' does not exist on type 'AIFeedbackService'. Did you mean 'generateQuizFeedback'?",
	"source": "ts",
	"startLineNumber": 297,
	"startColumn": 43,
	"endLineNumber": 297,
	"endColumn": 59,
	"relatedInformation": [
		{
			"startLineNumber": 72,
			"startColumn": 9,
			"endLineNumber": 72,
			"endColumn": 29,
			"message": "'generateQuizFeedback' is declared here.",
			"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/services/ai-feedback.service.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2554",
	"severity": 8,
	"message": "Expected 1 arguments, but got 3.",
	"source": "ts",
	"startLineNumber": 346,
	"startColumn": 9,
	"endLineNumber": 347,
	"endColumn": 22,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }[]' is not assignable to type 'UserPerformanceData[]'.\n  Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }' is missing the following properties from type 'UserPerformanceData': averageResponseTime, learningStyle",
	"source": "ts",
	"startLineNumber": 374,
	"startColumn": 13,
	"endLineNumber": 374,
	"endColumn": 28,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'analyzeUserPerformance' does not exist on type 'AdaptiveLearningService'.",
	"source": "ts",
	"startLineNumber": 379,
	"startColumn": 59,
	"endLineNumber": 379,
	"endColumn": 81,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }[]' is not assignable to type 'UserPerformanceData[]'.\n  Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }' is missing the following properties from type 'UserPerformanceData': averageResponseTime, learningStyle",
	"source": "ts",
	"startLineNumber": 408,
	"startColumn": 13,
	"endLineNumber": 408,
	"endColumn": 28,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'generatePersonalizedRecommendations' does not exist on type 'AdaptiveLearningService'.",
	"source": "ts",
	"startLineNumber": 413,
	"startColumn": 49,
	"endLineNumber": 413,
	"endColumn": 84,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2554",
	"severity": 8,
	"message": "Expected 3-4 arguments, but got 5.",
	"source": "ts",
	"startLineNumber": 439,
	"startColumn": 9,
	"endLineNumber": 439,
	"endColumn": 41,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }[]' is not assignable to type 'UserPerformanceData[]'.\n  Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }' is missing the following properties from type 'UserPerformanceData': averageResponseTime, learningStyle",
	"source": "ts",
	"startLineNumber": 473,
	"startColumn": 13,
	"endLineNumber": 473,
	"endColumn": 28,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }[]' is not assignable to type 'UserPerformanceData[]'.\n  Type '{ lastActivity: Date; userId: number; totalQuestions: number; correctAnswers: number; totalStudyTime: number; strengths: string[]; weaknesses: string[]; difficultyLevel: \"beginner\" | \"intermediate\" | \"advanced\"; streakDays: number; topicsStudied?: string[]; }' is missing the following properties from type 'UserPerformanceData': averageResponseTime, learningStyle",
	"source": "ts",
	"startLineNumber": 542,
	"startColumn": 13,
	"endLineNumber": 542,
	"endColumn": 28,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2551",
	"severity": 8,
	"message": "Property 'processContent' does not exist on type 'ContentProcessingService'. Did you mean 'processTextContent'?",
	"source": "ts",
	"startLineNumber": 628,
	"startColumn": 58,
	"endLineNumber": 628,
	"endColumn": 72,
	"relatedInformation": [
		{
			"startLineNumber": 52,
			"startColumn": 9,
			"endLineNumber": 52,
			"endColumn": 27,
			"message": "'processTextContent' is declared here.",
			"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/services/content-processing.service.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'searchSimilarContent' does not exist on type 'EmbeddingService'.",
	"source": "ts",
	"startLineNumber": 655,
	"startColumn": 51,
	"endLineNumber": 655,
	"endColumn": 71,
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2551",
	"severity": 8,
	"message": "Property 'createEmbedding' does not exist on type 'EmbeddingService'. Did you mean 'getEmbedding'?",
	"source": "ts",
	"startLineNumber": 687,
	"startColumn": 57,
	"endLineNumber": 687,
	"endColumn": 72,
	"relatedInformation": [
		{
			"startLineNumber": 225,
			"startColumn": 9,
			"endLineNumber": 225,
			"endColumn": 21,
			"message": "'getEmbedding' is declared here.",
			"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/services/embedding.service.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
},{
	"resource": "/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/apps/api/src/ai/ai.controller.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'message' does not exist on type 'unknown'.",
	"source": "ts",
	"startLineNumber": 712,
	"startColumn": 24,
	"endLineNumber": 712,
	"endColumn": 31,
	"extensionID": "vscode.typescript-language-features"
}]