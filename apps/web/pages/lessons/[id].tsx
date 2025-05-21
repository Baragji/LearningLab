// apps/web/pages/lessons/[id].tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  useGetLessonByIdQuery, 
  useGetContentBlocksByLessonIdQuery,
  useGetModuleByIdQuery,
  useGetCourseByIdQuery,
  useGetLessonsByModuleIdQuery
} from '../../src/store/services/api';

// Define types for our content renderer
interface ContentBlockProps {
  type: string;
  content: string;
}

// Content block renderer component
const ContentBlockRenderer: React.FC<ContentBlockProps> = ({ type, content }) => {
  switch (type) {
    case 'TEXT':
      return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;

    case 'IMAGE_URL':
      return (
        <div className="my-4">
          <img 
            src={content} 
            alt="Lesson content" 
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      );

    case 'VIDEO_URL':
      // Extract video ID from YouTube or Vimeo URL
      const getVideoEmbedUrl = (url: string) => {
        // YouTube URL patterns
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);

        if (youtubeMatch && youtubeMatch[1]) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }

        // Vimeo URL patterns
        const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
        const vimeoMatch = url.match(vimeoRegex);

        if (vimeoMatch && vimeoMatch[1]) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // If no match, return the original URL
        return url;
      };

      const embedUrl = getVideoEmbedUrl(content);

      return (
        <div className="my-4 aspect-w-16 aspect-h-9">
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-96 rounded-lg"
          ></iframe>
        </div>
      );

    default:
      return <div className="text-gray-500 dark:text-gray-400">Unsupported content type: {type}</div>;
  }
};

const LessonDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Convert id to number
  const lessonId = id ? parseInt(id as string) : undefined;

  // Fetch lesson data
  const { 
    data: lesson, 
    isLoading: isLoadingLesson, 
    error: lessonError 
  } = useGetLessonByIdQuery(lessonId as number, { 
    skip: !lessonId 
  });

  // Fetch content blocks for this lesson
  const { 
    data: contentBlocks = [], 
    isLoading: isLoadingContentBlocks 
  } = useGetContentBlocksByLessonIdQuery(lessonId as number, { 
    skip: !lessonId 
  });

  // Fetch module data to get navigation context
  const { 
    data: module,
    isLoading: isLoadingModule
  } = useGetModuleByIdQuery(lesson?.moduleId as number, {
    skip: !lesson?.moduleId
  });

  // Fetch course data for breadcrumbs
  const {
    data: course,
    isLoading: isLoadingCourse
  } = useGetCourseByIdQuery(lesson?.courseId as number, {
    skip: !lesson?.courseId
  });

  // State for previous and next lessons
  const [prevLesson, setPrevLesson] = useState<{ id: number; title: string } | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: number; title: string } | null>(null);

  // Fetch lessons for the module to determine prev/next
  const {
    data: moduleLessons = []
  } = useGetLessonsByModuleIdQuery(module?.id as number, {
    skip: !module?.id
  });

  // Determine previous and next lessons when module data is loaded
  useEffect(() => {
    if (module && lesson && moduleLessons.length > 0) {
      // Sort lessons by order or id
      const sortedLessons = [...moduleLessons].sort((a, b) => 
        (a.order || a.id) - (b.order || b.id)
      );

      // Find current lesson index
      const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id);

      if (currentIndex > 0) {
        const prev = sortedLessons[currentIndex - 1];
        setPrevLesson({ id: prev.id, title: prev.title });
      } else {
        setPrevLesson(null);
      }

      if (currentIndex < sortedLessons.length - 1) {
        const next = sortedLessons[currentIndex + 1];
        setNextLesson({ id: next.id, title: next.title });
      } else {
        setNextLesson(null);
      }
    }
  }, [module, lesson, moduleLessons]);

  // Loading state
  if (router.isFallback || isLoadingLesson || isLoadingContentBlocks || !lesson) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (lessonError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>Der opstod en fejl ved indlæsning af lektionen. Prøv igen senere.</p>
        <button 
          onClick={() => router.push('/courses')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tilbage til kursusoversigten
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{lesson.title} | {course?.title || 'Kursus'} | LearningLab</title>
      </Head>
      <div>
        {/* Breadcrumb */}
        <nav className="flex mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/courses" className="hover:text-gray-700 dark:hover:text-gray-200">
            Kurser
          </Link>
          <span className="mx-2">/</span>
          {course?.subjectArea && (
            <>
              <Link 
                href={`/courses?subjectAreaId=${course.subjectArea.id}`} 
                className="hover:text-gray-700 dark:hover:text-gray-200"
              >
                {course.subjectArea.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          {course && (
            <>
              <Link href={`/courses/${course.id}`} className="hover:text-gray-700 dark:hover:text-gray-200">
                {course.title}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          {module && (
            <>
              <span className="text-gray-600 dark:text-gray-300">{module.title}</span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-700 dark:text-gray-200">{lesson.title}</span>
        </nav>

        {/* Lesson header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {module?.title || 'Modul'} • Lektion {lessonId}
          </p>
        </div>

        {/* Lesson content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {contentBlocks.length > 0 ? (
            <div className="space-y-6">
              {contentBlocks.map((block, index) => (
                <ContentBlockRenderer 
                  key={block.id || index} 
                  type={block.type} 
                  content={block.content} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Denne lektion har intet indhold endnu.</p>
            </div>
          )}
        </div>

        {/* Lesson navigation */}
        <div className="flex justify-between">
          {prevLesson ? (
            <Link 
              href={`/lessons/${prevLesson.id}`}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {prevLesson.title}
            </Link>
          ) : (
            <div></div>
          )}

          {nextLesson ? (
            <Link 
              href={`/lessons/${nextLesson.id}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
            >
              {nextLesson.title}
              <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            course && (
              <Link 
                href={`/courses/${course.id}`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
              >
                Tilbage til kurset
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default LessonDetail;
