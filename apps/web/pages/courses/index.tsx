// apps/web/pages/courses/index.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const Courses: React.FC = () => {
  // Mock courses data
  const courses = [
    {
      id: 1,
      slug: 'react-fundamentals',
      title: 'React Fundamentals',
      description: 'Lær grundlæggende React-koncepter og byg din første app',
      level: 'Begynder',
      duration: '4 uger',
      modules: 8,
    },
    {
      id: 2,
      slug: 'typescript-basics',
      title: 'TypeScript Basics',
      description: 'Bliv fortrolig med TypeScript og statisk typning',
      level: 'Begynder',
      duration: '3 uger',
      modules: 6,
    },
    {
      id: 3,
      slug: 'nextjs-advanced',
      title: 'Next.js Advanced',
      description: 'Avancerede teknikker og best practices i Next.js',
      level: 'Avanceret',
      duration: '5 uger',
      modules: 10,
    },
    {
      id: 4,
      slug: 'redux-toolkit',
      title: 'Redux Toolkit Masterclass',
      description: 'Lær at håndtere global state med Redux Toolkit',
      level: 'Mellem',
      duration: '4 uger',
      modules: 7,
    },
    {
      id: 5,
      slug: 'tailwind-css',
      title: 'Tailwind CSS for Developers',
      description: 'Byg moderne UI\'er hurtigt med Tailwind CSS',
      level: 'Begynder',
      duration: '2 uger',
      modules: 5,
    },
    {
      id: 6,
      slug: 'testing-react-apps',
      title: 'Testing React Applications',
      description: 'Lær at skrive tests for React-applikationer',
      level: 'Mellem',
      duration: '3 uger',
      modules: 6,
    },
  ];

  return (
    <>
      <Head>
        <title>Kurser | LearningLab</title>
      </Head>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alle Kurser</h1>
          
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Søg efter kurser..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Alle niveauer</option>
              <option value="beginner">Begynder</option>
              <option value="intermediate">Mellem</option>
              <option value="advanced">Avanceret</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link href={`/courses/${course.slug}`} key={course.id}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-40 bg-gray-300 dark:bg-gray-700"></div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{course.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
                  
                  <div className="flex items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
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
                      <span>{course.modules} moduler</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Courses;