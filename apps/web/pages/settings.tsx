// apps/web/pages/settings.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  useGetCurrentUserQuery, 
  useUpdateUserProfileMutation,
  useChangePasswordMutation
} from '../src/store/services/api';

const Settings: React.FC = () => {
  // Fetch current user
  const { 
    data: currentUser, 
    isLoading: isLoadingUser 
  } = useGetCurrentUserQuery();
  
  // Mutations for updating profile and changing password
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Status messages
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  // Update form when user data is loaded
  React.useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      }).unwrap();
      
      setProfileUpdateStatus({
        success: true,
        message: 'Profil opdateret med succes!'
      });
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setProfileUpdateStatus({});
      }, 3000);
    } catch (error) {
      setProfileUpdateStatus({
        success: false,
        message: 'Der opstod en fejl ved opdatering af profilen. Prøv igen senere.'
      });
    }
  };
  
  // Handle password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordChangeStatus({
        success: false,
        message: 'De nye adgangskoder matcher ikke.'
      });
      return;
    }
    
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      
      setPasswordChangeStatus({
        success: true,
        message: 'Adgangskode ændret med succes!'
      });
      
      // Clear form and status after 3 seconds
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setTimeout(() => {
        setPasswordChangeStatus({});
      }, 3000);
    } catch (error) {
      setPasswordChangeStatus({
        success: false,
        message: 'Der opstod en fejl ved ændring af adgangskoden. Kontroller din nuværende adgangskode og prøv igen.'
      });
    }
  };
  
  // Loading state
  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Indstillinger | LearningLab</title>
      </Head>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indstillinger</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Profiloplysninger</h2>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Navn
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {profileUpdateStatus.message && (
                <div className={`mb-4 p-3 rounded ${profileUpdateStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profileUpdateStatus.message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Opdaterer...' : 'Opdater Profil'}
              </button>
            </form>
          </div>
          
          {/* Password Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Skift Adgangskode</h2>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuværende Adgangskode
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ny Adgangskode
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bekræft Ny Adgangskode
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>
              
              {passwordChangeStatus.message && (
                <div className={`mb-4 p-3 rounded ${passwordChangeStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {passwordChangeStatus.message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isChangingPassword ? 'Ændrer...' : 'Skift Adgangskode'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Glemt din adgangskode?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;