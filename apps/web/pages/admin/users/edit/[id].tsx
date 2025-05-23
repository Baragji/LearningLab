import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import { Role } from '@repo/core';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  profileImage: string | null;
  bio: string | null;
  socialLinks: Record<string, string> | null;
  settings: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  role?: Role;
  profileImage?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  password?: string;
}

const EditUserPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateUserData>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await axios.get<User>(`/api/users/${id}`);
        setUser(response.data);
        
        // Initialize form data with user data
        setFormData({
          email: response.data.email,
          name: response.data.name || '',
          role: response.data.role,
          profileImage: response.data.profileImage || '',
          bio: response.data.bio || '',
          socialLinks: response.data.socialLinks || {},
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Der opstod en fejl ved hentning af brugerdata. Prøv igen senere.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle social links changes
  const handleSocialLinkChange = (
    platform: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [platform]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSubmitting(true);
    
    try {
      await axios.put(`/api/users/${user.id}`, formData);
      toast.success('Bruger opdateret');
      router.push('/admin/users');
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Der opstod en fejl ved opdatering af brugeren');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user ? `Rediger bruger: ${user.name || user.email}` : 'Rediger bruger'}
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Tilbage
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : user ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Grundlæggende information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Navn
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rolle
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role || Role.STUDENT}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={Role.STUDENT}>Studerende</option>
                        <option value={Role.TEACHER}>Underviser</option>
                        <option value={Role.ADMIN}>Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profilbillede URL
                      </label>
                      <input
                        type="text"
                        id="profileImage"
                        name="profileImage"
                        value={formData.profileImage || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Profilinformation
                  </h2>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Biografi
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fortæl lidt om brugeren..."
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Sociale links
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        id="linkedin"
                        value={formData.socialLinks?.linkedin || ''}
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label htmlFor="github" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GitHub
                      </label>
                      <input
                        type="text"
                        id="github"
                        value={formData.socialLinks?.github || ''}
                        onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Twitter
                      </label>
                      <input
                        type="text"
                        id="twitter"
                        value={formData.socialLinks?.twitter || ''}
                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hjemmeside
                      </label>
                      <input
                        type="text"
                        id="website"
                        value={formData.socialLinks?.website || ''}
                        onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Reset */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Adgangskode
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowPasswordField(!showPasswordField)}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {showPasswordField ? 'Annuller' : 'Nulstil adgangskode'}
                    </button>
                  </div>
                  
                  {showPasswordField && (
                    <div className="mt-4">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ny adgangskode
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Indtast ny adgangskode"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Lad feltet være tomt for at beholde den nuværende adgangskode.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Annuller
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded-md ${
                      submitting
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    {submitting ? 'Gemmer...' : 'Gem ændringer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default EditUserPage;