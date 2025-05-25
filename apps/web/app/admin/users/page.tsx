// apps/web/app/admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppButton as Button } from '@/components/ui/AppButton';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus, Users, UserCheck, Trash2, Filter, Download, Upload } from 'lucide-react';
import { Role } from '@repo/core';

// Brugertype
interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  profileImage: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

// Brugergruppe type
interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  permissions: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;
  users?: User[];
}

// Bulk invitation type
interface BulkInvitation {
  email: string;
  name?: string;
  role: Role;
}

const AdminUsersPage = () => {
  const { user, isAuthenticated, isLoading, apiClient } = useAuth();
  const router = useRouter();
  
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // State for user groups
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  
  // State for bulk operations
  const [bulkInvitations, setBulkInvitations] = useState<BulkInvitation[]>([
    { email: '', role: Role.STUDENT }
  ]);
  const [bulkInvitationText, setBulkInvitationText] = useState('');
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  
  // State for dialogs
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [isAssignToGroupDialogOpen, setIsAssignToGroupDialogOpen] = useState(false);
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: Role.STUDENT,
    profileImage: '',
    bio: ''
  });
  
  // State for new group form
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    permissions: {
      canManageUsers: false,
      canManageCourses: false,
      canManageContent: false,
      canViewReports: false
    }
  });
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role !== Role.ADMIN))) {
      toast.error('Du har ikke adgang til denne side');
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);
  
  // Fetch users
  const fetchUsers = async (page = 1, filter = searchQuery, role = roleFilter) => {
    if (!apiClient) return;
    
    setIsLoadingUsers(true);
    try {
      let url = `/api/users?page=${page}&limit=10`;
      if (filter) url += `&filter=${filter}`;
      if (role) url += `&role=${role}`;
      
      const response = await apiClient.get(url);
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setTotalUsers(response.data.total);
      setTotalPages(Math.ceil(response.data.total / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error('Fejl ved hentning af brugere:', error);
      toast.error('Der opstod en fejl ved hentning af brugere');
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Fetch user groups
  const fetchUserGroups = async () => {
    if (!apiClient) return;
    
    setIsLoadingGroups(true);
    try {
      const response = await apiClient.get('/api/user-groups');
      setUserGroups(response.data.userGroups);
    } catch (error) {
      console.error('Fejl ved hentning af brugergrupper:', error);
      toast.error('Der opstod en fejl ved hentning af brugergrupper');
    } finally {
      setIsLoadingGroups(false);
    }
  };
  
  // Fetch users and groups on component mount
  useEffect(() => {
    if (isAuthenticated && user?.role === Role.ADMIN) {
      fetchUsers();
      fetchUserGroups();
    }
  }, [isAuthenticated, user]);
  
  // Handle search
  const handleSearch = () => {
    fetchUsers(1, searchQuery, roleFilter);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    fetchUsers(1, searchQuery, value);
  };
  
  // Handle user selection
  const handleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  // Handle select all users
  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };
  
  // Handle create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;
    
    try {
      const response = await apiClient.post('/api/users/signup', newUser);
      toast.success('Bruger oprettet');
      setIsCreateUserDialogOpen(false);
      setNewUser({
        email: '',
        name: '',
        password: '',
        role: Role.STUDENT,
        profileImage: '',
        bio: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Fejl ved oprettelse af bruger:', error);
      toast.error('Der opstod en fejl ved oprettelse af brugeren');
    }
  };
  
  // Handle create group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;
    
    try {
      const response = await apiClient.post('/api/user-groups', newGroup);
      toast.success('Brugergruppe oprettet');
      setIsCreateGroupDialogOpen(false);
      setNewGroup({
        name: '',
        description: '',
        permissions: {
          canManageUsers: false,
          canManageCourses: false,
          canManageContent: false,
          canViewReports: false
        }
      });
      fetchUserGroups();
    } catch (error) {
      console.error('Fejl ved oprettelse af brugergruppe:', error);
      toast.error('Der opstod en fejl ved oprettelse af brugergruppen');
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!apiClient || selectedUsers.length === 0) return;
    
    try {
      const response = await apiClient.post('/api/users/bulk-delete', {
        userIds: selectedUsers
      });
      toast.success(`${response.data.count} brugere slettet`);
      setSelectedUsers([]);
      setIsDeleteConfirmDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Fejl ved sletning af brugere:', error);
      toast.error('Der opstod en fejl ved sletning af brugerne');
    }
  };
  
  // Handle assign to group
  const handleAssignToGroup = async () => {
    if (!apiClient || selectedUsers.length === 0 || !selectedGroup) return;
    
    try {
      const response = await apiClient.post(`/api/user-groups/${selectedGroup.id}/users`, {
        userIds: selectedUsers
      });
      toast.success(`Brugere tilføjet til gruppen ${selectedGroup.name}`);
      setSelectedUsers([]);
      setSelectedGroup(null);
      setIsAssignToGroupDialogOpen(false);
    } catch (error) {
      console.error('Fejl ved tilføjelse af brugere til gruppe:', error);
      toast.error('Der opstod en fejl ved tilføjelse af brugere til gruppen');
    }
  };
  
  // Handle bulk invite
  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;
    
    // Validate emails
    const validInvitations = bulkInvitations.filter(inv => 
      inv.email && inv.email.includes('@')
    );
    
    if (validInvitations.length === 0) {
      toast.error('Ingen gyldige e-mailadresser at invitere');
      return;
    }
    
    setIsSendingInvitations(true);
    try {
      const response = await apiClient.post('/api/users/bulk-invite', {
        invitations: validInvitations
      });
      
      toast.success(`${response.data.count} invitationer sendt`);
      setBulkInvitations([{ email: '', role: Role.STUDENT }]);
      setBulkInvitationText('');
    } catch (error) {
      console.error('Fejl ved afsendelse af invitationer:', error);
      toast.error('Der opstod en fejl ved afsendelse af invitationerne');
    } finally {
      setIsSendingInvitations(false);
    }
  };
  
  // Handle bulk invitation text change
  const handleBulkInvitationTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBulkInvitationText(text);
    
    // Parse emails from text (one per line)
    const lines = text.split('\n').filter(line => line.trim());
    const newInvitations: BulkInvitation[] = lines.map(line => {
      const parts = line.split(',').map(part => part.trim());
      return {
        email: parts[0] || '',
        name: parts[1] || undefined,
        role: (parts[2] as Role) || Role.STUDENT
      };
    });
    
    if (newInvitations.length > 0) {
      setBulkInvitations(newInvitations);
    } else {
      setBulkInvitations([{ email: '', role: Role.STUDENT }]);
    }
  };
  
  // Add invitation field
  const addInvitationField = () => {
    setBulkInvitations([...bulkInvitations, { email: '', role: Role.STUDENT }]);
  };
  
  // Remove invitation field
  const removeInvitationField = (index: number) => {
    const newInvitations = [...bulkInvitations];
    newInvitations.splice(index, 1);
    setBulkInvitations(newInvitations.length ? newInvitations : [{ email: '', role: Role.STUDENT }]);
  };
  
  // Update invitation field
  const updateInvitationField = (index: number, field: keyof BulkInvitation, value: string) => {
    const newInvitations = [...bulkInvitations];
    newInvitations[index] = { 
      ...newInvitations[index], 
      [field]: field === 'role' ? value as Role : value 
    };
    setBulkInvitations(newInvitations);
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
      <h1 className="text-3xl font-bold mb-6">Brugeradministration</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users size={16} />
            <span>Brugere</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UserCheck size={16} />
            <span>Brugergrupper</span>
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus size={16} />
            <span>Inviter brugere</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Brugere tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Brugere</span>
                <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Opret bruger
                </Button>
              </CardTitle>
              <CardDescription>
                Administrer brugere i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Søg og filtrer */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg efter brugere..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch}>Søg</Button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alle roller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle roller</SelectItem>
                      <SelectItem value={Role.STUDENT}>Studerende</SelectItem>
                      <SelectItem value={Role.TEACHER}>Underviser</SelectItem>
                      <SelectItem value={Role.ADMIN}>Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Bulk actions */}
              {selectedUsers.length > 0 && (
                <div className="bg-muted p-2 rounded-md mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedUsers.length} bruger(e) valgt
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAssignToGroupDialogOpen(true)}
                    >
                      Tilføj til gruppe
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setIsDeleteConfirmDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slet valgte
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Brugertabel */}
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                              onCheckedChange={handleSelectAllUsers}
                            />
                          </TableHead>
                          <TableHead>Navn</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rolle</TableHead>
                          <TableHead>Oprettet</TableHead>
                          <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Ingen brugere fundet
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={() => handleUserSelection(user.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {user.profileImage ? (
                                    <img 
                                      src={user.profileImage} 
                                      alt={user.name || ''} 
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                      {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                    </div>
                                  )}
                                  {user.name || 'Unavngivet'}
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  user.role === Role.ADMIN 
                                    ? 'destructive' 
                                    : user.role === Role.TEACHER 
                                      ? 'default' 
                                      : 'secondary'
                                }>
                                  {user.role === Role.ADMIN 
                                    ? 'Administrator' 
                                    : user.role === Role.TEACHER 
                                      ? 'Underviser' 
                                      : 'Studerende'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.createdAt).toLocaleDateString('da-DK')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/admin/users/${user.id}`)}
                                >
                                  Rediger
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Viser {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalUsers)} af {totalUsers} brugere
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage === 1}
                          onClick={() => fetchUsers(currentPage - 1)}
                        >
                          Forrige
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage === totalPages}
                          onClick={() => fetchUsers(currentPage + 1)}
                        >
                          Næste
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Brugergrupper tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Brugergrupper</span>
                <Button onClick={() => setIsCreateGroupDialogOpen(true)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Opret gruppe
                </Button>
              </CardTitle>
              <CardDescription>
                Administrer brugergrupper og tilladelser
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Navn</TableHead>
                        <TableHead>Beskrivelse</TableHead>
                        <TableHead>Tilladelser</TableHead>
                        <TableHead>Antal brugere</TableHead>
                        <TableHead className="text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Ingen brugergrupper fundet
                          </TableCell>
                        </TableRow>
                      ) : (
                        userGroups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{group.description || '-'}</TableCell>
                            <TableCell>
                              {group.permissions ? (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(group.permissions).map(([key, value]) => (
                                    value && (
                                      <Badge key={key} variant="outline" className="text-xs">
                                        {key === 'canManageUsers' && 'Administrer brugere'}
                                        {key === 'canManageCourses' && 'Administrer kurser'}
                                        {key === 'canManageContent' && 'Administrer indhold'}
                                        {key === 'canViewReports' && 'Se rapporter'}
                                      </Badge>
                                    )
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {group.users?.length || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/admin/groups/${group.id}`)}
                              >
                                Administrer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inviter brugere tab */}
        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Inviter brugere</CardTitle>
              <CardDescription>
                Inviter flere brugere på én gang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="form">
                <TabsList className="mb-4">
                  <TabsTrigger value="form">Formular</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form">
                  <form onSubmit={handleBulkInvite}>
                    {bulkInvitations.map((invitation, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <Label htmlFor={`email-${index}`}>Email</Label>
                          <Input
                            id={`email-${index}`}
                            value={invitation.email}
                            onChange={(e) => updateInvitationField(index, 'email', e.target.value)}
                            placeholder="bruger@eksempel.dk"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`name-${index}`}>Navn (valgfrit)</Label>
                          <Input
                            id={`name-${index}`}
                            value={invitation.name || ''}
                            onChange={(e) => updateInvitationField(index, 'name', e.target.value)}
                            placeholder="Fornavn Efternavn"
                          />
                        </div>
                        <div className="w-40">
                          <Label htmlFor={`role-${index}`}>Rolle</Label>
                          <Select
                            value={invitation.role}
                            onValueChange={(value) => updateInvitationField(index, 'role', value)}
                          >
                            <SelectTrigger id={`role-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Role.STUDENT}>Studerende</SelectItem>
                              <SelectItem value={Role.TEACHER}>Underviser</SelectItem>
                              <SelectItem value={Role.ADMIN}>Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end mb-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvitationField(index)}
                            disabled={bulkInvitations.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addInvitationField}
                      >
                        Tilføj flere
                      </Button>
                      <Button type="submit" disabled={isSendingInvitations}>
                        {isSendingInvitations ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sender invitationer...
                          </>
                        ) : (
                          'Send invitationer'
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="bulk">
                  <form onSubmit={handleBulkInvite}>
                    <div className="mb-4">
                      <Label htmlFor="bulk-text">
                        Indsæt e-mails (én pr. linje, format: email,navn,rolle)
                      </Label>
                      <Textarea
                        id="bulk-text"
                        value={bulkInvitationText}
                        onChange={handleBulkInvitationTextChange}
                        placeholder="bruger1@eksempel.dk,John Doe,STUDENT&#10;bruger2@eksempel.dk,Jane Smith,TEACHER"
                        className="h-40 font-mono"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Format: email,navn,rolle (STUDENT/TEACHER/ADMIN). Navn og rolle er valgfri.
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm">
                        {bulkInvitations.filter(inv => inv.email).length} gyldige e-mails fundet
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Download template
                            const template = "email,navn,rolle\nbruger1@eksempel.dk,John Doe,STUDENT\nbruger2@eksempel.dk,Jane Smith,TEACHER";
                            const blob = new Blob([template], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'invitation_skabelon.csv';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Hent skabelon
                        </Button>
                        <Button type="submit" disabled={isSendingInvitations}>
                          {isSendingInvitations ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sender invitationer...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Send invitationer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Opret bruger dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Opret ny bruger</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Navn
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Adgangskode
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rolle
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as Role })}
                >
                  <SelectTrigger id="role" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.STUDENT}>Studerende</SelectItem>
                    <SelectItem value={Role.TEACHER}>Underviser</SelectItem>
                    <SelectItem value={Role.ADMIN}>Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profileImage" className="text-right">
                  Profilbillede URL
                </Label>
                <Input
                  id="profileImage"
                  value={newUser.profileImage}
                  onChange={(e) => setNewUser({ ...newUser, profileImage: e.target.value })}
                  className="col-span-3"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bio" className="text-right">
                  Biografi
                </Label>
                <Textarea
                  id="bio"
                  value={newUser.bio}
                  onChange={(e) => setNewUser({ ...newUser, bio: e.target.value })}
                  className="col-span-3"
                  placeholder="Kort beskrivelse..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                Annuller
              </Button>
              <Button type="submit">Opret bruger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Opret gruppe dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Opret ny brugergruppe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupName" className="text-right">
                  Navn
                </Label>
                <Input
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupDescription" className="text-right">
                  Beskrivelse
                </Label>
                <Textarea
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Tilladelser
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="canManageUsers" 
                      checked={newGroup.permissions.canManageUsers}
                      onCheckedChange={(checked) => 
                        setNewGroup({
                          ...newGroup,
                          permissions: {
                            ...newGroup.permissions,
                            canManageUsers: !!checked
                          }
                        })
                      }
                    />
                    <Label htmlFor="canManageUsers">Administrer brugere</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="canManageCourses" 
                      checked={newGroup.permissions.canManageCourses}
                      onCheckedChange={(checked) => 
                        setNewGroup({
                          ...newGroup,
                          permissions: {
                            ...newGroup.permissions,
                            canManageCourses: !!checked
                          }
                        })
                      }
                    />
                    <Label htmlFor="canManageCourses">Administrer kurser</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="canManageContent" 
                      checked={newGroup.permissions.canManageContent}
                      onCheckedChange={(checked) => 
                        setNewGroup({
                          ...newGroup,
                          permissions: {
                            ...newGroup.permissions,
                            canManageContent: !!checked
                          }
                        })
                      }
                    />
                    <Label htmlFor="canManageContent">Administrer indhold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="canViewReports" 
                      checked={newGroup.permissions.canViewReports}
                      onCheckedChange={(checked) => 
                        setNewGroup({
                          ...newGroup,
                          permissions: {
                            ...newGroup.permissions,
                            canViewReports: !!checked
                          }
                        })
                      }
                    />
                    <Label htmlFor="canViewReports">Se rapporter</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateGroupDialogOpen(false)}>
                Annuller
              </Button>
              <Button type="submit">Opret gruppe</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Bekræft sletning dialog */}
      <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bekræft sletning</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Er du sikker på, at du vil slette {selectedUsers.length} bruger(e)?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Denne handling kan ikke fortrydes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmDialogOpen(false)}>
              Annuller
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Slet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tilføj til gruppe dialog */}
      <Dialog open={isAssignToGroupDialogOpen} onOpenChange={setIsAssignToGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tilføj til brugergruppe</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Vælg en brugergruppe at tilføje {selectedUsers.length} bruger(e) til:</p>
            <Select
              value={selectedGroup?.id.toString() || ''}
              onValueChange={(value) => {
                const group = userGroups.find(g => g.id.toString() === value);
                setSelectedGroup(group || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg en gruppe" />
              </SelectTrigger>
              <SelectContent>
                {userGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignToGroupDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleAssignToGroup} disabled={!selectedGroup}>
              Tilføj til gruppe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;