import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import { useAuth } from '../../../../src/contexts/useAuth';

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  courseId: number;
}

const EditModulePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${baseUrl}/courses`, {
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
      }
    };

    const fetchModule = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${baseUrl}/modules/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch module: ${response.status} ${response.statusText}`);
        }

        const data: Module = await response.json();
        setTitle(data.title);
        setDescription(data.description);
        setOrder(data.order);
        setCourseId(data.courseId);
      } catch (err: any) {
        console.error('Error fetching module:', err);
        setError(err.message || 'Failed to fetch module');
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      setIsLoading(true);
      Promise.all([fetchCourses(), fetchModule()]).catch(err => {
        console.error('Error in parallel fetching:', err);
        setIsLoading(false);
      });
    }
  }, [token, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !courseId) {
      setError('Alle felter skal udfyldes');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/modules/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          order,
          courseId: Number(courseId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update module: ${response.status} ${response.statusText}`);
      }

      router.push('/admin/modules');
    } catch (err: any) {
      console.error('Error updating module:', err);
      setError(err.message || 'Failed to update module');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kun render indholdet når token er tilgængelig (client-side)
  if (typeof window !== 'undefined' && !token) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rediger Modul</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Tilbage
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Fejl!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Titel
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Modul titel"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beskrivelse
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Modul beskrivelse"
              required
            />
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rækkefølge
            </label>
            <input
              type="number"
              id="order"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value))}
              min={1}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bestemmer modulets placering i kurset. Lavere tal vises først.
            </p>
          </div>

          <div>
            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kursus
            </label>
            <select
              id="courseId"
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="" disabled>Vælg kursus</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Gemmer...' : 'Gem Ændringer'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default EditModulePage;