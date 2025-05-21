// apps/web/pages/courses/index.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useGetCoursesQuery, useGetSubjectAreasQuery } from '../../src/store/services/api';

const Courses: React.FC = () => {
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch courses from API
  const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useGetCoursesQuery({ 
    subjectAreaId: selectedSubjectArea 
  });
  
  // Fetch subject areas from API
  const { data: subjectAreas = [], isLoading: isLoadingSubjectAreas } = useGetSubjectAreasQuery();

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            
            <select 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedSubjectArea(e.target.value ? parseInt(e.target.value) : undefined)}
              value={selectedSubjectArea || ''}
            >
              <option value="">Alle emneområder</option>
              {subjectAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoadingCourses && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error state */}
        {coursesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Der opstod en fejl ved indlæsning af kurser. Prøv igen senere.</p>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoadingCourses && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Ingen kurser fundet.</p>
          </div>
        )}
        
        {/* Courses grid */}
        {!isLoadingCourses && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link href={`/courses/${course.id}`} key={course.id}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{course.title}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
                    
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
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Courses;