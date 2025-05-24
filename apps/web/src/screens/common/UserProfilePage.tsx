// apps/web/src/screens/common/UserProfilePage.tsx
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid as MuiGrid, 
  TextField, 
  Button, 
  CircularProgress, 
  Snackbar,
  Alert,
  Divider,
  Avatar,
  Tab,
  Tabs,
  IconButton,
  Badge
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SettingsIcon from '@mui/icons-material/Settings';

// Brug MuiGrid direkte, da vi har omdøbt den ved import
const Grid = MuiGrid;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserProfilePage: React.FC = () => {
  const { user, isLoading: authIsLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with user data when it loads
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email);
      // Hvis vi havde profileImage og bio i user-objektet, ville vi sætte dem her
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Her ville vi normalt kalde en API til at opdatere profilen
      // await updateProfile({ name, email, bio }).unwrap();

      // Simulerer en API-kald med en timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Profil opdateret');
      // refetchUser();
    } catch (error) {
      console.error('Fejl ved opdatering af profil:', error);
      setSuccessMessage('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('De nye adgangskoder matcher ikke');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Adgangskoden skal være mindst 8 tegn lang');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Her ville vi normalt kalde en API til at ændre adgangskoden
      // await changePassword({ currentPassword, newPassword }).unwrap();

      // Simulerer en API-kald med en timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Adgangskode ændret');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Fejl ved ændring af adgangskode:', error);
      setPasswordError('Nuværende adgangskode er forkert');
      setSuccessMessage('');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vis en forhåndsvisning af billedet
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);

    try {
      // Her ville vi normalt uploade billedet til en server
      // const formData = new FormData();
      // formData.append('profileImage', file);
      // await uploadProfileImage(formData).unwrap();

      // Simulerer en API-kald med en timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccessMessage('Profilbillede uploadet');
    } catch (error) {
      console.error('Fejl ved upload af profilbillede:', error);
      setSuccessMessage('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  if (authIsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 32,
                  height: 32
                }}
                onClick={handleProfileImageClick}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PhotoCameraIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            }
          >
            <Avatar 
              src={profileImage || undefined}
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </Badge>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
          <Box sx={{ ml: 3 }}>
            <Typography variant="h4" component="h1">
              {user?.name || 'Bruger'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Rolle: {user?.role || 'Bruger'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Profilinformation" 
              id="profile-tab-0" 
              aria-controls="profile-tabpanel-0" 
            />
            <Tab 
              icon={<LockIcon />} 
              label="Skift adgangskode" 
              id="profile-tab-1" 
              aria-controls="profile-tabpanel-1" 
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Indstillinger" 
              id="profile-tab-2" 
              aria-controls="profile-tabpanel-2" 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Navn"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  type="email"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Biografi"
                  fullWidth
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={4}
                  placeholder="Fortæl lidt om dig selv..."
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {isUpdating ? 'Gemmer...' : 'Gem ændringer'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handlePasswordChange}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Nuværende adgangskode"
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  variant="outlined"
                  type="password"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Ny adgangskode"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  variant="outlined"
                  type="password"
                  required
                  helperText="Adgangskoden skal være mindst 8 tegn lang"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Bekræft ny adgangskode"
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  variant="outlined"
                  type="password"
                  required
                  error={!!passwordError}
                  helperText={passwordError || ''}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isChangingPassword}
                  startIcon={isChangingPassword ? <CircularProgress size={20} /> : <LockIcon />}
                >
                  {isChangingPassword ? 'Ændrer...' : 'Skift adgangskode'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notifikationsindstillinger
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" gutterBottom>
              Denne funktion er under udvikling. Her vil du kunne styre dine notifikationsindstillinger.
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Privatindstillinger
          </Typography>

          <Box>
            <Typography variant="body1">
              Denne funktion er under udvikling. Her vil du kunne styre dine privatindstillinger.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfilePage;
