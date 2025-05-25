import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/components/layout/Layout';
import { useAuth } from '../../../src/contexts/useAuth';

interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  subjectAreaId: number;
  subjectArea?: {
    name: string;
  };
}

const AdminCoursesPage: React.FC = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${baseUrl}/courses?includeSubjectArea=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(err.message || 'Failed to fetch courses');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchCourses();
    }
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.status} ${response.statusText}`);
      }

      // Remove the deleted course from the state
      setCourses(courses.filter(course => course.id !== id));
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(err.message || 'Failed to delete course');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administrer Kurser</h1>
          <button
            onClick={() => router.push('/admin/courses/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Opret Nyt Kursus
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Fejl!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {courses.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Ingen kurser fundet. Opret et nyt kursus for at komme i gang.
                </li>
              ) : (
                courses.map((course) => (
                  <li key={course.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {course.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Fagområde: {course.subjectArea?.name || 'Ukendt'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/courses/edit/${course.id}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Rediger
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 rounded-md hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Slet
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default AdminCoursesPage;