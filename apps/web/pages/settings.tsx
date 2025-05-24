// apps/web/pages/settings.tsx
import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../src/contexts/AuthContext';
import ProtectedRoute from '../src/components/auth/ProtectedRoute';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    darkMode: false,
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

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update form when user data is loaded
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        bio: '',
      });
    }
  }, [user]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  // Handle notification settings changes
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle appearance settings changes
  const handleAppearanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAppearanceSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle profile image click
  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file change for profile image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);

    try {
      // Here we would normally upload the image to a server
      // const formData = new FormData();
      // formData.append('profileImage', file);
      // await uploadProfileImage(formData);

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProfileUpdateStatus({
        success: true,
        message: 'Profilbillede uploadet med succes!'
      });

      // Clear status after 3 seconds
      setTimeout(() => {
        setProfileUpdateStatus({});
      }, 3000);
    } catch (error) {
      setProfileUpdateStatus({
        success: false,
        message: 'Der opstod en fejl ved upload af profilbillede. Prøv igen senere.'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      // Here we would normally call an API to update the profile
      // await updateProfile({
      //   name: profileForm.name,
      //   email: profileForm.email,
      //   bio: profileForm.bio,
      // });

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    } finally {
      setIsUpdatingProfile(false);
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

    setIsChangingPassword(true);

    try {
      // Here we would normally call an API to change the password
      // await changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword,
      // });

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle notification settings submission
  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Here we would normally call an API to update notification settings
      // await updateNotificationSettings(notificationSettings);

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Notifikationsindstillinger gemt!');
    } catch (error) {
      alert('Der opstod en fejl ved opdatering af notifikationsindstillinger. Prøv igen senere.');
    }
  };

  // Handle privacy settings submission
  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Here we would normally call an API to update privacy settings
      // await updatePrivacySettings(privacySettings);

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Privatindstillinger gemt!');
    } catch (error) {
      alert('Der opstod en fejl ved opdatering af privatindstillinger. Prøv igen senere.');
    }
  };

  // Handle appearance settings submission
  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Here we would normally call an API to update appearance settings
      // await updateAppearanceSettings(appearanceSettings);

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Udseendeindstillinger gemt!');
    } catch (error) {
      alert('Der opstod en fejl ved opdatering af udseendeindstillinger. Prøv igen senere.');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Indstillinger | LearningLab</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indstillinger</h1>
        </div>

        {/* Profile Image Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Profilbillede</h2>

          <div className="flex items-center">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer"
                onClick={handleProfileImageClick}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profilbillede" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-500 dark:text-gray-400">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 cursor-pointer"
                onClick={handleProfileImageClick}
              >
                {isUploadingImage ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Upload profilbillede</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Klik på billedet for at uploade et nyt profilbillede. Maksimal filstørrelse: 5MB.
              </p>
              {profileUpdateStatus.message && (
                <div className={`mt-2 p-2 text-sm rounded ${profileUpdateStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profileUpdateStatus.message}
                </div>
              )}
            </div>
          </div>
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
                />
              </div>

              <div className="mb-4">
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

              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Biografi
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Fortæl lidt om dig selv..."
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
                {isUpdatingProfile ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opdaterer...
                  </span>
                ) : 'Opdater Profil'}
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
                {isChangingPassword ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ændrer...
                  </span>
                ) : 'Skift Adgangskode'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Glemt din adgangskode?
              </Link>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Notifikationsindstillinger</h2>

            <form onSubmit={handleNotificationSubmit}>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Email-notifikationer
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Modtag notifikationer om nye kurser, beskeder og aktiviteter via email.
                </p>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Browser-notifikationer
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Modtag notifikationer direkte i din browser, når du er på platformen.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Gem Notifikationsindstillinger
              </button>
            </form>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Privatindstillinger</h2>

            <form onSubmit={handlePrivacySubmit}>
              <div className="mb-6">
                <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profilsynlighed
                </label>
                <select
                  id="profileVisibility"
                  name="profileVisibility"
                  value={privacySettings.profileVisibility}
                  onChange={handlePrivacyChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Offentlig (alle kan se din profil)</option>
                  <option value="registered">Kun registrerede brugere</option>
                  <option value="private">Privat (kun dig og administratorer)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Vælg hvem der kan se din profil og dine aktiviteter på platformen.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Gem Privatindstillinger
              </button>
            </form>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Udseendeindstillinger</h2>

            <form onSubmit={handleAppearanceSubmit}>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={appearanceSettings.darkMode}
                    onChange={handleAppearanceChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Mørkt tema
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Aktivér mørkt tema for en mere behagelig oplevelse i mørke omgivelser.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Gem Udseendeindstillinger
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
