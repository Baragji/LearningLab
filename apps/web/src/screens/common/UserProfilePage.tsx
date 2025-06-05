// apps/web/src/screens/common/UserProfilePage.tsx
import React, { useState, useRef } from "react";
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
  Badge,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import {
  useGetUserCoursesQuery,
  useGetUserStatisticsQuery,
  useUpdateUserProfileMutation,
} from "../../store/services/api";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SettingsIcon from "@mui/icons-material/Settings";
import SchoolIcon from "@mui/icons-material/School";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BookIcon from "@mui/icons-material/Book";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfilePage: React.FC = () => {
  const { user, isLoading: authIsLoading } = useAuth();
  const { data: userCoursesData, isLoading: coursesLoading } =
    useGetUserCoursesQuery();
  const { data: userStats, isLoading: statsLoading } =
    useGetUserStatisticsQuery();
  const [updateUserProfile] = useUpdateUserProfileMutation();
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with user data when it loads
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
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
      await updateUserProfile({ name, email }).unwrap();
      setSuccessMessage("Profil opdateret succesfuldt");
    } catch (error) {
      console.error("Fejl ved opdatering af profil:", error);
      setSuccessMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("De nye adgangskoder matcher ikke");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Adgangskoden skal være mindst 8 tegn lang");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Her ville vi normalt kalde en API til at ændre adgangskoden
      // await changePassword({ currentPassword, newPassword }).unwrap();

      // Simulerer en API-kald med en timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage("Adgangskode ændret succesfuldt");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Fejl ved ændring af adgangskode:", error);
      setPasswordError("Nuværende adgangskode er forkert");
      setSuccessMessage("");
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMessage("Profilbillede uploadet");
    } catch (error) {
      console.error("Fejl ved upload af profilbillede:", error);
      setSuccessMessage("");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage("");
  };

  if (authIsLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <IconButton
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                  width: 32,
                  height: 32,
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
                bgcolor: "primary.main",
                fontSize: "2.5rem",
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </Avatar>
          </Badge>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />
          <Box sx={{ ml: 3 }}>
            <Typography variant="h4" component="h1">
              {user?.name || "Bruger"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Rolle: {user?.role || "Bruger"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<PersonIcon />}
              label="Profilinformation"
              id="profile-tab-0"
              aria-controls="profile-tabpanel-0"
            />
            <Tab
              icon={<SchoolIcon />}
              label="Mine Kurser"
              id="profile-tab-1"
              aria-controls="profile-tabpanel-1"
            />
            <Tab
              icon={<EmojiEventsIcon />}
              label="Certifikater"
              id="profile-tab-2"
              aria-controls="profile-tabpanel-2"
            />
            <Tab
              icon={<LockIcon />}
              label="Skift adgangskode"
              id="profile-tab-3"
              aria-controls="profile-tabpanel-3"
            />
            <Tab
              icon={<SettingsIcon />}
              label="Indstillinger"
              id="profile-tab-4"
              aria-controls="profile-tabpanel-4"
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
                  startIcon={
                    isUpdating ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                >
                  {isUpdating ? "Gemmer..." : "Gem ændringer"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Mine Kurser
          </Typography>

          {coursesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {userCoursesData?.courses?.map((course) => {
                const progress = userCoursesData.progress[course.id] || 0;
                return (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <BookIcon sx={{ mr: 1, color: "primary.main" }} />
                          <Typography variant="h6" component="h3">
                            {course.title}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {course.description}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2">Fremskridt</Typography>
                            <Typography variant="body2">
                              {Math.round(progress)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={progress === 100 ? "Gennemført" : "I gang"}
                            color={progress === 100 ? "success" : "primary"}
                            size="small"
                            icon={
                              progress === 100 ? <CheckCircleIcon /> : undefined
                            }
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            href={`/courses/${course.id}`}
                          >
                            {progress === 100 ? "Gennemse" : "Fortsæt"}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

              {(!userCoursesData?.courses ||
                userCoursesData.courses.length === 0) && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: "center" }}>
                    <SchoolIcon
                      sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      Ingen kurser endnu
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      Du har ikke tilmeldt dig nogen kurser endnu. Udforsk vores
                      kurser for at komme i gang!
                    </Typography>
                    <Button variant="contained" href="/courses">
                      Udforsk Kurser
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Mine Certifikater
          </Typography>

          {statsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Statistik oversigt */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <EmojiEventsIcon
                        sx={{ fontSize: 48, color: "warning.main", mb: 1 }}
                      />
                      <Typography variant="h4" component="div">
                        {userStats?.totalXp || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total XP
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <CheckCircleIcon
                        sx={{ fontSize: 48, color: "success.main", mb: 1 }}
                      />
                      <Typography variant="h4" component="div">
                        {userCoursesData?.courses?.filter(
                          (course) =>
                            (userCoursesData.progress[course.id] || 0) === 100,
                        ).length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gennemførte Kurser
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <SchoolIcon
                        sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                      />
                      <Typography variant="h4" component="div">
                        {userStats?.quizResults?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gennemførte Quizzer
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Seneste quiz resultater */}
              <Typography variant="h6" gutterBottom>
                Seneste Quiz Resultater
              </Typography>

              {userStats?.quizResults && userStats.quizResults.length > 0 ? (
                <List>
                  {userStats.quizResults.slice(0, 5).map((result, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <CheckCircleIcon
                          color={result.passed ? "success" : "error"}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Quiz ${result.quizId}`}
                        secondary={`Score: ${result.score}% - ${result.passed ? "Bestået" : "Ikke bestået"}`}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(result.completedAt).toLocaleDateString(
                          "da-DK",
                        )}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <EmojiEventsIcon
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Ingen certifikater endnu
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gennemfør kurser og quizzer for at optjene certifikater!
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Skift Adgangskode
          </Typography>
          <form onSubmit={handlePasswordUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nuværende Adgangskode"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ny Adgangskode"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bekræft Ny Adgangskode"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              {passwordError && (
                <Grid item xs={12}>
                  <Alert severity="error">{passwordError}</Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isChangingPassword}
                  startIcon={
                    isChangingPassword ? (
                      <CircularProgress size={20} />
                    ) : (
                      <LockIcon />
                    )
                  }
                >
                  {isChangingPassword ? "Opdaterer..." : "Opdater Adgangskode"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Indstillinger
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Indstillinger funktionalitet er under udvikling. Her kan brugeren
            ændre notifikations- og privatindstillinger.
          </Typography>
        </TabPanel>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfilePage;
