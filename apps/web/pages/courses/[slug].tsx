// apps/web/pages/courses/[slug].tsx
import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  useGetCourseByIdQuery, 
  useGetModulesByCourseIdQuery,
  useGetLessonsByModuleIdQuery
} from '../../src/store/services/api';

const CourseDetail: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Convert slug to courseId (assuming slug is the course ID)
  const courseId = slug ? parseInt(slug as string) : undefined;

  // Fetch course data
  const { 
    data: course, 
    isLoading: isLoadingCourse, 
    error: courseError 
  } = useGetCourseByIdQuery(courseId as number, { 
    skip: !courseId 
  });

  // Fetch modules for this course
  const { 
    data: modules = [], 
    isLoading: isLoadingModules 
  } = useGetModulesByCourseIdQuery(courseId as number, { 
    skip: !courseId 
  });

  // State to track which modules have their lessons loaded
  const [expandedModules, setExpandedModules] = React.useState<Record<number, boolean>>({});

  // Pre-fetch all module IDs that are expanded
  const expandedModuleIds = Object.entries(expandedModules)
    .filter(([_, isExpanded]) => isExpanded)
    .map(([id]) => parseInt(id));
  
  // Create an object to store lessons data for each module
  const lessonsData: Record<number, { data: any[], isLoading: boolean }> = {};
  
  // Use a single hook call with an array of module IDs
  // This is a workaround since we can't use hooks in loops
  const moduleId1 = expandedModuleIds[0] || 0;
  const moduleId2 = expandedModuleIds[1] || 0;
  const moduleId3 = expandedModuleIds[2] || 0;
  const moduleId4 = expandedModuleIds[3] || 0;
  
  const result1 = useGetLessonsByModuleIdQuery(moduleId1, { skip: !moduleId1 });
  const result2 = useGetLessonsByModuleIdQuery(moduleId2, { skip: !moduleId2 });
  const result3 = useGetLessonsByModuleIdQuery(moduleId3, { skip: !moduleId3 });
  const result4 = useGetLessonsByModuleIdQuery(moduleId4, { skip: !moduleId4 });
  
  // Populate the lessonsData object
  if (moduleId1) lessonsData[moduleId1] = { data: result1.data || [], isLoading: result1.isLoading };
  if (moduleId2) lessonsData[moduleId2] = { data: result2.data || [], isLoading: result2.isLoading };
  if (moduleId3) lessonsData[moduleId3] = { data: result3.data || [], isLoading: result3.isLoading };
  if (moduleId4) lessonsData[moduleId4] = { data: result4.data || [], isLoading: result4.isLoading };
  
  // Map modules with their lessons
  const moduleWithLessonsQueries = modules.map(module => {
    const moduleData = lessonsData[module.id] || { data: [], isLoading: false };
    
    return {
      ...module,
      lessons: moduleData.data,
      isLoadingLessons: moduleData.isLoading
    };
  });

  // Toggle module expansion to load lessons
  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Loading state
  if (router.isFallback || isLoadingCourse || !course) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (courseError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>Der opstod en fejl ved indlæsning af kurset. Prøv igen senere.</p>
        <button 
          onClick={() => router.push('/courses')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tilbage til kursusoversigten
        </button>
      </div>
    );
  }

  // Find first module and lesson for "Start Course" button
  const firstModule = moduleWithLessonsQueries[0];
  const firstLesson = firstModule?.lessons?.[0];

  return (
    <>
      <Head>
        <title>{course.title} | LearningLab</title>
      </Head>
      <div>
        {/* Breadcrumb */}
        <nav className="flex mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/courses" className="hover:text-gray-700 dark:hover:text-gray-200">
            Kurser
          </Link>
          {course.subjectArea && (
            <>
              <span className="mx-2">/</span>
              <Link 
                href={`/courses?subjectAreaId=${course.subjectArea.id}`} 
                className="hover:text-gray-700 dark:hover:text-gray-200"
              >
                {course.subjectArea.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-200">{course.title}</span>
        </nav>

        {/* Course header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              {firstLesson && (
                <Link 
                  href={`/lessons/${firstLesson.id}`} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow inline-block"
                >
                  Start Kursus
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center mr-4">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{course.level || 'Begynder'}</span>
              </div>

              <div className="flex items-center mr-4">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{course.estimatedHours ? `${course.estimatedHours} timer` : 'N/A'}</span>
              </div>

              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>{modules.length} moduler</span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300">{course.description}</p>
          </div>
        </div>

        {/* Loading modules */}
        {isLoadingModules && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Course modules */}
        {!isLoadingModules && moduleWithLessonsQueries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Kursusindhold</h2>

              <div className="space-y-4">
                {moduleWithLessonsQueries.map((module) => (
                  <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <div 
                      className="bg-gray-50 dark:bg-gray-750 px-4 py-3 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <h3 className="font-medium text-gray-800 dark:text-white">{module.title}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {module.lessons.length} lektioner
                        </span>
                        <svg 
                          className={`h-5 w-5 transition-transform ${expandedModules[module.id] ? 'transform rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {expandedModules[module.id] && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Loading lessons */}
                        {module.isLoadingLessons && (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        )}

                        {/* Lessons */}
                        {!module.isLoadingLessons && module.lessons.map((lesson) => (
                          <Link 
                            href={`/lessons/${lesson.id}`} 
                            key={lesson.id}
                            className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
                          >
                            <div className="flex items-center">
                              <svg className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-700 dark:text-gray-200">{lesson.title}</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : 'N/A'}
                            </span>
                          </Link>
                        ))}

                        {/* No lessons message */}
                        {!module.isLoadingLessons && module.lessons.length === 0 && (
                          <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                            Ingen lektioner fundet for dette modul.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No modules message */}
        {!isLoadingModules && moduleWithLessonsQueries.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Dette kursus har ingen moduler endnu.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CourseDetail;
