import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import { useAuth } from '../../../../src/context/useAuth';

interface SubjectArea {
  id: number;
  name: string;
  slug: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  subjectAreaId: number;
}

const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [subjectAreaId, setSubjectAreaId] = useState<number | ''>('');
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubjectAreas = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${baseUrl}/subject-areas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch subject areas: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSubjectAreas(data);
      } catch (err: any) {
        console.error('Error fetching subject areas:', err);
        setError(err.message || 'Failed to fetch subject areas');
      }
    };

    const fetchCourse = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${baseUrl}/courses/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch course: ${response.status} ${response.statusText}`);
        }

        const data: Course = await response.json();
        setTitle(data.title);
        setDescription(data.description);
        setSlug(data.slug);
        setSubjectAreaId(data.subjectAreaId);
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to fetch course');
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      setIsLoading(true);
      Promise.all([fetchSubjectAreas(), fetchCourse()]).catch(err => {
        console.error('Error in parallel fetching:', err);
        setIsLoading(false);
      });
    }
  }, [token, id]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Only auto-generate slug if it hasn't been manually edited
    if (slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !slug || !subjectAreaId) {
      setError('Alle felter skal udfyldes');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/courses/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          slug,
          subjectAreaId: Number(subjectAreaId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update course: ${response.status} ${response.statusText}`);
      }

      router.push('/admin/courses');
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError(err.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rediger Kursus</h1>
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
              onChange={handleTitleChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Kursus titel"
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
              placeholder="Kursus beskrivelse"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="kursus-slug"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              URL-venlig identifikator. Genereres automatisk fra titlen, men kan redigeres.
            </p>
          </div>

          <div>
            <label htmlFor="subjectAreaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fagområde
            </label>
            <select
              id="subjectAreaId"
              value={subjectAreaId}
              onChange={(e) => setSubjectAreaId(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="" disabled>Vælg fagområde</option>
              {subjectAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
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

export default EditCoursePage;