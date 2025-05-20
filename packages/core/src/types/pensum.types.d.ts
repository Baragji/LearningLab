export interface SubjectArea {
    id: number;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Course {
    id: number;
    title: string;
    description: string;
    slug: string;
    subjectAreaId: number;
    subjectArea?: SubjectArea;
    createdAt: Date;
    updatedAt: Date;
}
export interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
    courseId: number;
    course?: Course;
    createdAt: Date;
    updatedAt: Date;
}
export interface Lesson {
    id: number;
    title: string;
    description: string;
    order: number;
    moduleId: number;
    module?: Module;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ContentBlockType {
    TEXT = "TEXT",
    IMAGE_URL = "IMAGE_URL",
    VIDEO_URL = "VIDEO_URL",
    QUIZ_REF = "QUIZ_REF"
}
export interface ContentBlock {
    id: number;
    type: ContentBlockType;
    content: string;
    order: number;
    lessonId: number;
    lesson?: Lesson;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSubjectAreaInput {
    name: string;
    slug: string;
}
export interface CreateCourseInput {
    title: string;
    description: string;
    slug: string;
    subjectAreaId: number;
}
export interface CreateModuleInput {
    title: string;
    description: string;
    order: number;
    courseId: number;
}
export interface CreateLessonInput {
    title: string;
    description: string;
    order: number;
    moduleId: number;
}
export interface CreateContentBlockInput {
    type: ContentBlockType;
    content: string;
    order: number;
    lessonId: number;
}
//# sourceMappingURL=pensum.types.d.ts.map