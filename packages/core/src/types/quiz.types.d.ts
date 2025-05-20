export declare enum QuestionType {
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
    FILL_IN_BLANK = "FILL_IN_BLANK",
    MATCHING = "MATCHING"
}
export declare enum ProgressStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
}
export interface Quiz {
    id: number;
    title: string;
    description: string;
    lessonId?: number | null;
    moduleId?: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Question {
    id: number;
    text: string;
    type: QuestionType;
    quizId: number;
    quiz?: Quiz;
    createdAt: Date;
    updatedAt: Date;
}
export interface AnswerOption {
    id: number;
    text: string;
    isCorrect: boolean;
    questionId: number;
    question?: Question;
    createdAt: Date;
    updatedAt: Date;
}
export interface QuizAttempt {
    id: number;
    userId: number;
    quizId: number;
    score: number;
    startedAt: Date;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserAnswer {
    id: number;
    quizAttemptId: number;
    questionId: number;
    selectedAnswerOptionId?: number | null;
    inputText?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProgress {
    id: number;
    userId: number;
    lessonId?: number | null;
    quizId?: number | null;
    status: ProgressStatus;
    score?: number | null;
    quizAttemptId?: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateQuizInput {
    title: string;
    description: string;
    lessonId?: number;
    moduleId?: number;
}
export interface CreateQuestionInput {
    text: string;
    type: QuestionType;
    quizId: number;
    answerOptions?: CreateAnswerOptionInput[];
}
export interface CreateAnswerOptionInput {
    text: string;
    isCorrect: boolean;
    questionId?: number;
}
export interface StartQuizAttemptInput {
    quizId: number;
}
export interface SubmitAnswerInput {
    quizAttemptId: number;
    questionId: number;
    selectedAnswerOptionId?: number;
    inputText?: string;
}
export interface CompleteQuizAttemptInput {
    quizAttemptId: number;
}
//# sourceMappingURL=quiz.types.d.ts.map