// apps/web/src/screens/common/UserProfilePage.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  CircularProgress, 
  Snackbar,
  Alert,
  Divider,
  Avatar,
  Tab,
  Tabs
} from '@mui/material';
import { 
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation
} from '../../store/services/api';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';

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
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { 
    data: currentUser, 
    isLoading: isUserLoading, 
    refetch: refetchUser
  } = useGetCurrentUserQuery();
  
  const [
    updateProfile, 
    { isLoading: isUpdating }
  ] = useUpdateUserProfileMutation();
  
  const [
    changePassword, 
    { isLoading: isChangingPassword }
  ] = useChangePasswordMutation();
  
  // Initialize form with user data when it loads
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email);
    }
  }, [currentUser]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({ name, email }).unwrap();
      setSuccessMessage('Profile updated successfully');
      refetchUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSuccessMessage('');
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setSuccessMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordError('Current password is incorrect');
      setSuccessMessage('');
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };
  
  if (isUserLoading) {
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
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              mr: 3
            }}
          >
            {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              User Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account settings
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
              label="Profile Information" 
              id="profile-tab-0" 
              aria-controls="profile-tabpanel-0" 
            />
            <Tab 
              icon={<LockIcon />} 
              label="Change Password" 
              id="profile-tab-1" 
              aria-controls="profile-tabpanel-1" 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
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
              
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handlePasswordChange}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Current Password"
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  variant="outlined"
                  type="password"
                  required
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="New Password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  variant="outlined"
                  type="password"
                  required
                  helperText="Password must be at least 8 characters long"
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Confirm New Password"
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
              
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isChangingPassword}
                  startIcon={isChangingPassword ? <CircularProgress size={20} /> : <LockIcon />}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
          </form>
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