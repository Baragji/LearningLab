'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppButton as Button } from '@/components/ui/AppButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Trash2, UserCog, Key, ShieldAlert } from 'lucide-react';
import { Role } from '@repo/core';

// Brugertype
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

// Brugergruppe type
interface UserGroup {
  id: number;
  name: string;
  description: string | null;
}

const UserEditPage = ({ params }: { params: { id: string } }) => {
  const { user, isAuthenticated, isLoading, apiClient } = useAuth();
  const router = useRouter();
  const userId = parseInt(params.id);
  
  // State for user data
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for user groups
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [userGroupMemberships, setUserGroupMemberships] = useState<number[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  
  // State for form data
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: Role.STUDENT,
    profileImage: '',
    bio: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      website: ''
    }
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for dialogs
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role !== Role.ADMIN))) {
      toast.error('Du har ikke adgang til denne side');
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);
  
  // Fetch user data
  const fetchUserData = async () => {
    if (!apiClient) return;
    
    setIsLoadingUser(true);
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      setUserData(response.data);
      
      // Initialize form data
      setFormData({
        email: response.data.email,
        name: response.data.name || '',
        role: response.data.role,
        profileImage: response.data.profileImage || '',
        bio: response.data.bio || '',
        socialLinks: {
          twitter: response.data.socialLinks?.twitter || '',
          linkedin: response.data.socialLinks?.linkedin || '',
          github: response.data.socialLinks?.github || '',
          website: response.data.socialLinks?.website || ''
        }
      });
    } catch (error) {
      console.error('Fejl ved hentning af bruger:', error);
      toast.error('Der opstod en fejl ved hentning af brugeren');
      router.push('/admin/users');
    } finally {
      setIsLoadingUser(false);
    }
  };
  
  // Fetch user groups
  const fetchUserGroups = async () => {
    if (!apiClient) return;
    
    setIsLoadingGroups(true);
    try {
      // Fetch all groups
      const groupsResponse = await apiClient.get('/api/user-groups');
      setUserGroups(groupsResponse.data.userGroups);
      
      // Fetch user's group memberships
      const membershipsResponse = await apiClient.get(`/api/users/${userId}/groups`);
      setUserGroupMemberships(membershipsResponse.data.map((group: UserGroup) => group.id));
    } catch (error) {
      console.error('Fejl ved hentning af brugergrupper:', error);
      toast.error('Der opstod en fejl ved hentning af brugergrupper');
    } finally {
      setIsLoadingGroups(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.role === Role.ADMIN) {
      fetchUserData();
      fetchUserGroups();
    }
  }, [isAuthenticated, user, userId]);
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle social links change
  const handleSocialLinkChange = (network: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value
      }
    }));
  };
  
  // Handle role change
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as Role
    }));
  };
  
  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;
    
    setIsSaving(true);
    try {
      const updateData = {
        email: formData.email,
        name: formData.name || null,
        role: formData.role,
        profileImage: formData.profileImage || null,
        bio: formData.bio || null,
        socialLinks: Object.entries(formData.socialLinks).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      };
      
      const response = await apiClient.put(`/api/users/${userId}`, updateData);
      setUserData(response.data);
      toast.success('Bruger opdateret');
    } catch (error) {
      console.error('Fejl ved opdatering af bruger:', error);
      toast.error('Der opstod en fejl ved opdatering af brugeren');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Adgangskoderne matcher ikke');
      return;
    }
    
    try {
      await apiClient.post(`/api/users/${userId}/reset-password`, {
        newPassword: passwordData.newPassword
      });
      
      toast.success('Adgangskode ændret');
      setIsResetPasswordDialogOpen(false);
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Fejl ved nulstilling af adgangskode:', error);
      toast.error('Der opstod en fejl ved nulstilling af adgangskoden');
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!apiClient) return;
    
    try {
      await apiClient.delete(`/api/users/${userId}`);
      toast.success('Bruger slettet');
      router.push('/admin/users');
    } catch (error) {
      console.error('Fejl ved sletning af bruger:', error);
      toast.error('Der opstod en fejl ved sletning af brugeren');
    }
  };
  
  // Handle group membership toggle
  const handleGroupMembershipToggle = async (groupId: number, isMember: boolean) => {
    if (!apiClient) return;
    
    try {
      if (isMember) {
        // Remove from group
        await apiClient.delete(`/api/user-groups/${groupId}/users/${userId}`);
        setUserGroupMemberships(prev => prev.filter(id => id !== groupId));
        toast.success('Bruger fjernet fra gruppen');
      } else {
        // Add to group
        await apiClient.post(`/api/user-groups/${groupId}/users`, {
          userIds: [userId]
        });
        setUserGroupMemberships(prev => [...prev, groupId]);
        toast.success('Bruger tilføjet til gruppen');
      }
    } catch (error) {
      console.error('Fejl ved ændring af gruppemedlemskab:', error);
      toast.error('Der opstod en fejl ved ændring af gruppemedlemskab');
    }
  };
  
  // If loading or not authenticated, show loading
  if (isLoading || !isAuthenticated || (user && user.role !== Role.ADMIN)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/users')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbage
        </Button>
        <h1 className="text-3xl font-bold">
          {isLoadingUser ? 'Indlæser bruger...' : `Rediger bruger: ${userData?.name || userData?.email}`}
        </h1>
      </div>
      
      {isLoadingUser ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Brugeroplysninger</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                {userData?.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name || ''} 
                    className="h-32 w-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mb-4 text-4xl font-semibold">
                    {userData?.name ? userData.name[0].toUpperCase() : userData?.email[0].toUpperCase()}
                  </div>
                )}
                <h3 className="text-xl font-semibold">{userData?.name || 'Unavngivet'}</h3>
                <p className="text-muted-foreground mb-2">{userData?.email}</p>
                <Badge variant={
                  userData?.role === Role.ADMIN 
                    ? 'destructive' 
                    : userData?.role === Role.TEACHER 
                      ? 'default' 
                      : 'secondary'
                }>
                  {userData?.role === Role.ADMIN 
                    ? 'Administrator' 
                    : userData?.role === Role.TEACHER 
                      ? 'Underviser' 
                      : 'Studerende'}
                </Badge>
                
                <Separator className="my-4" />
                
                <div className="w-full text-left">
                  <p className="text-sm text-muted-foreground mb-1">Oprettet</p>
                  <p className="mb-3">{new Date(userData?.createdAt || '').toLocaleDateString('da-DK')}</p>
                  
                  <p className="text-sm text-muted-foreground mb-1">Sidst opdateret</p>
                  <p className="mb-3">{new Date(userData?.updatedAt || '').toLocaleDateString('da-DK')}</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsResetPasswordDialogOpen(true)}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Nulstil adgangskode
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsDeleteConfirmDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slet bruger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserCog size={16} />
                  <span>Profil</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>Grupper & Tilladelser</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Profil tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Rediger profil</CardTitle>
                    <CardDescription>
                      Opdater brugerens profiloplysninger
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Navn</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Rolle</Label>
                        <Select
                          value={formData.role}
                          onValueChange={handleRoleChange}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Role.STUDENT}>Studerende</SelectItem>
                            <SelectItem value={Role.TEACHER}>Underviser</SelectItem>
                            <SelectItem value={Role.ADMIN}>Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileImage">Profilbillede URL</Label>
                        <Input
                          id="profileImage"
                          name="profileImage"
                          value={formData.profileImage}
                          onChange={handleInputChange}
                          placeholder="https://..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografi</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Kort beskrivelse..."
                          rows={4}
                        />
                      </div>
                      
                      <div>
                        <Label>Sociale links</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                            <Input
                              id="twitter"
                              value={formData.socialLinks.twitter}
                              onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                              placeholder="https://twitter.com/username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                            <Input
                              id="linkedin"
                              value={formData.socialLinks.linkedin}
                              onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="github" className="text-sm">GitHub</Label>
                            <Input
                              id="github"
                              value={formData.socialLinks.github}
                              onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                              placeholder="https://github.com/username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-sm">Hjemmeside</Label>
                            <Input
                              id="website"
                              value={formData.socialLinks.website}
                              onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gemmer...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Gem ændringer
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              {/* Grupper tab */}
              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Brugergrupper og tilladelser</CardTitle>
                    <CardDescription>
                      Administrer brugerens gruppemedlemskaber
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGroups ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : userGroups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Ingen brugergrupper fundet</p>
                        <Button 
                          variant="link" 
                          onClick={() => router.push('/admin/users?tab=groups')}
                          className="mt-2"
                        >
                          Opret en brugergruppe
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userGroups.map((group) => {
                          const isMember = userGroupMemberships.includes(group.id);
                          return (
                            <div 
                              key={group.id} 
                              className={`p-4 rounded-lg border ${isMember ? 'bg-muted/50' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{group.name}</h3>
                                  {group.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {group.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant={isMember ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleGroupMembershipToggle(group.id, isMember)}
                                >
                                  {isMember ? 'Fjern' : 'Tilføj'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Bekræft sletning dialog */}
      <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bekræft sletning</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Er du sikker på, at du vil slette denne bruger?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Denne handling kan ikke fortrydes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmDialogOpen(false)}>
              Annuller
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Slet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nulstil adgangskode dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nulstil adgangskode</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordReset}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Ny adgangskode</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Bekræft adgangskode</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                Annuller
              </Button>
              <Button type="submit">
                Nulstil adgangskode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserEditPage;