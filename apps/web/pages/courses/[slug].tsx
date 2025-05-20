// apps/web/pages/courses/[slug].tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

const CourseDetail: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Mock course data - in a real app, you would fetch this based on the slug
  const course = {
    id: 1,
    slug: 'react-fundamentals',
    title: 'React Fundamentals',
    description: 'Lær grundlæggende React-koncepter og byg din første app',
    longDescription: 'Dette kursus giver dig en solid introduktion til React, et af de mest populære JavaScript-biblioteker til at bygge brugergrænseflader. Du vil lære om komponenter, props, state, hooks og meget mere. Ved slutningen af kurset vil du være i stand til at bygge dine egne React-applikationer fra bunden.',
    level: 'Begynder',
    duration: '4 uger',
    modules: [
      {
        id: 1,
        title: 'Introduktion til React',
        lessons: [
          { id: 101, title: 'Hvad er React?', duration: '10 min' },
          { id: 102, title: 'Opsætning af udviklingsmiljø', duration: '15 min' },
          { id: 103, title: 'Din første React-komponent', duration: '20 min' },
        ],
        quizzes: [
          { id: 1, title: 'React Grundbegreber Quiz', duration: '15 min' }
        ]
      },
      {
        id: 2,
        title: 'React Komponenter og Props',
        lessons: [
          { id: 201, title: 'Komponentstruktur', duration: '15 min' },
          { id: 202, title: 'Funktionelle komponenter vs. klassekomponenter', duration: '20 min' },
          { id: 203, title: 'Props og PropTypes', duration: '25 min' },
        ],
        quizzes: [
          { id: 2, title: 'Komponenter og Props Quiz', duration: '15 min' }
        ]
      },
      {
        id: 3,
        title: 'State og Lifecycle',
        lessons: [
          { id: 301, title: 'Introduktion til state', duration: '15 min' },
          { id: 302, title: 'useState hook', duration: '20 min' },
          { id: 303, title: 'useEffect hook', duration: '25 min' },
        ],
        quizzes: [
          { id: 3, title: 'State og Lifecycle Quiz', duration: '15 min' }
        ]
      },
      {
        id: 4,
        title: 'Håndtering af Events',
        lessons: [
          { id: 401, title: 'Event handling i React', duration: '15 min' },
          { id: 402, title: 'Forms og controlled components', duration: '20 min' },
          { id: 403, title: 'Lifting state up', duration: '25 min' },
        ],
        quizzes: [
          { id: 4, title: 'Events og Forms Quiz', duration: '15 min' }
        ]
      },
    ],
  };

  if (router.isFallback) {
    return <div className="text-center py-10">Indlæser kursus...</div>;
  }

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
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-200">{course.title}</span>
        </nav>
        
        {/* Course header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow">
                Start Kursus
              </button>
            </div>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center mr-4">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{course.level}</span>
              </div>
              
              <div className="flex items-center mr-4">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{course.duration}</span>
              </div>
              
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>{course.modules.length} moduler</span>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300">{course.longDescription}</p>
          </div>
        </div>
        
        {/* Course modules */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Kursusindhold</h2>
            
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 dark:text-white">{module.title}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{module.lessons.length} lektioner</span>
                      {module.quizzes && module.quizzes.length > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{module.quizzes.length} quiz(zer)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Lessons */}
                    {module.lessons.map((lesson) => (
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
                        <span className="text-sm text-gray-500 dark:text-gray-400">{lesson.duration}</span>
                      </Link>
                    ))}
                    
                    {/* Quizzes */}
                    {module.quizzes && module.quizzes.map((quiz) => (
                      <Link 
                        href={`/courses/${slug}/quizzes/${quiz.id}`} 
                        key={`quiz-${quiz.id}`}
                        className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 bg-blue-50 dark:bg-blue-900/10"
                      >
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">{quiz.title}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{quiz.duration}</span>
                          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetail;