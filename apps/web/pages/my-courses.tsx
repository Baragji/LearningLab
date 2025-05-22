// apps/web/pages/my-courses.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useGetUserCoursesQuery } from '../src/store/services/api';

const MyCourses: React.FC = () => {
  // Fetch user courses and progress
  const { 
    data: userCoursesData, 
    isLoading: isLoadingCourses, 
    error: coursesError 
  } = useGetUserCoursesQuery();
  
  // Loading state
  if (isLoadingCourses) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Mine Kurser | LearningLab</title>
      </Head>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mine Kurser</h1>
        </div>
        
        {/* Error state */}
        {coursesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Der opstod en fejl ved indlæsning af dine kurser. Prøv igen senere.</p>
          </div>
        )}
        
        {/* Empty state */}
        {!coursesError && (!userCoursesData?.courses || userCoursesData.courses.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Du har ikke påbegyndt nogen kurser endnu.</p>
            <Link 
              href="/courses" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
            >
              Udforsk kurser
            </Link>
          </div>
        )}
        
        {/* Course grid */}
        {userCoursesData?.courses && userCoursesData.courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCoursesData.courses.map(course => {
              const progress = userCoursesData.progress[course.id] || 0;
              
              // Generate a gradient color based on course ID
              const gradientColors = [
                ['from-blue-500 to-purple-600', 'blue-600'],
                ['from-green-500 to-teal-600', 'green-600'],
                ['from-indigo-500 to-purple-600', 'indigo-600'],
                ['from-red-500 to-pink-600', 'red-600'],
                ['from-yellow-500 to-orange-600', 'yellow-600'],
              ];
              
              const colorIndex = course.id % gradientColors.length;
              const [gradient, progressColor] = gradientColors[colorIndex];
              
              return (
                <Link href={`/courses/${course.id}`} key={course.id} className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className={`h-40 bg-gradient-to-r ${gradient} flex items-center justify-center`}>
                      <span className="text-white text-xl font-bold">{course.title}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                          <div 
                            className={`bg-${progressColor} h-2.5 rounded-full`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{progress}% gennemført</p>
                      </div>
                      
                      <div className="flex items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
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
                          <span>{course.moduleCount || 0} moduler</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyCourses;