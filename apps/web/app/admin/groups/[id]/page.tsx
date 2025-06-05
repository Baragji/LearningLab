"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton as Button } from "@/components/ui/AppButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  UserPlus,
  Users,
  UserMinus,
} from "lucide-react";
import { Role } from "@repo/core";

// Brugertype
interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  profileImage: string | null;
  createdAt: string;
}

// Brugergruppe type
interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  permissions: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;
}

const GroupEditPage = ({ params }: { params: { id: string } }) => {
  const { user, isAuthenticated, isLoading, apiClient } = useAuth();
  const router = useRouter();
  const groupId = parseInt(params.id);

  // State for group data
  const [groupData, setGroupData] = useState<UserGroup | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for group members
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {
      canManageUsers: false,
      canManageCourses: false,
      canManageContent: false,
      canViewReports: false,
    },
  });

  // State for dialogs
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [isAddUsersDialogOpen, setIsAddUsersDialogOpen] = useState(false);
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // State for add users
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isLoadingAvailableUsers, setIsLoadingAvailableUsers] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || (user && user.role !== Role.ADMIN))
    ) {
      toast.error("Du har ikke adgang til denne side");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch group data
  const fetchGroupData = useCallback(async () => {
    if (!apiClient) return;

    setIsLoadingGroup(true);
    try {
      const response = await apiClient.get(`/api/user-groups/${groupId}`);
      setGroupData(response.data);

      // Initialize form data
      setFormData({
        name: response.data.name,
        description: response.data.description || "",
        permissions: {
          canManageUsers: response.data.permissions?.canManageUsers || false,
          canManageCourses:
            response.data.permissions?.canManageCourses || false,
          canManageContent:
            response.data.permissions?.canManageContent || false,
          canViewReports: response.data.permissions?.canViewReports || false,
        },
      });
    } catch (error) {
      console.error("Fejl ved hentning af brugergruppe:", error);
      toast.error("Der opstod en fejl ved hentning af brugergruppen");
      router.push("/admin/users?tab=groups");
    } finally {
      setIsLoadingGroup(false);
    }
  }, [apiClient, groupId, router]);

  // Fetch group members
  const fetchGroupMembers = useCallback(
    async (page = 1) => {
      if (!apiClient) return;

      setIsLoadingMembers(true);
      try {
        const response = await apiClient.get(
          `/api/user-groups/${groupId}/users?page=${page}&limit=10`,
        );
        setGroupMembers(response.data.users);
        setTotalMembers(response.data.total);
        setTotalPages(Math.ceil(response.data.total / 10));
        setCurrentPage(page);
      } catch (error) {
        console.error("Fejl ved hentning af gruppemedlemmer:", error);
        toast.error("Der opstod en fejl ved hentning af gruppemedlemmer");
      } finally {
        setIsLoadingMembers(false);
      }
    },
    [apiClient, groupId],
  );

  // Fetch available users (not in the group)
  const fetchAvailableUsers = async () => {
    if (!apiClient) return;

    setIsLoadingAvailableUsers(true);
    try {
      const response = await apiClient.get(
        `/api/user-groups/${groupId}/available-users`,
      );
      setAvailableUsers(response.data.users);
    } catch (error) {
      console.error("Fejl ved hentning af tilgængelige brugere:", error);
      toast.error("Der opstod en fejl ved hentning af tilgængelige brugere");
    } finally {
      setIsLoadingAvailableUsers(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.role === Role.ADMIN) {
      fetchGroupData();
      fetchGroupMembers();
    }
  }, [isAuthenticated, user, groupId, fetchGroupData, fetchGroupMembers]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle permission change
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        permissions: formData.permissions,
      };

      const response = await apiClient.put(
        `/api/user-groups/${groupId}`,
        updateData,
      );
      setGroupData(response.data);
      toast.success("Brugergruppe opdateret");
    } catch (error) {
      console.error("Fejl ved opdatering af brugergruppe:", error);
      toast.error("Der opstod en fejl ved opdatering af brugergruppen");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (!apiClient) return;

    try {
      await apiClient.delete(`/api/user-groups/${groupId}`);
      toast.success("Brugergruppe slettet");
      router.push("/admin/users?tab=groups");
    } catch (error) {
      console.error("Fejl ved sletning af brugergruppe:", error);
      toast.error("Der opstod en fejl ved sletning af brugergruppen");
    }
  };

  // Handle add users dialog open
  const handleAddUsersDialogOpen = () => {
    fetchAvailableUsers();
    setSelectedUserIds([]);
    setIsAddUsersDialogOpen(true);
  };

  // Handle user selection
  const handleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle add users to group
  const handleAddUsersToGroup = async () => {
    if (!apiClient || selectedUserIds.length === 0) return;

    try {
      await apiClient.post(`/api/user-groups/${groupId}/users`, {
        userIds: selectedUserIds,
      });

      toast.success(`${selectedUserIds.length} bruger(e) tilføjet til gruppen`);
      setIsAddUsersDialogOpen(false);
      setSelectedUserIds([]);
      fetchGroupMembers(1);
    } catch (error) {
      console.error("Fejl ved tilføjelse af brugere til gruppen:", error);
      toast.error("Der opstod en fejl ved tilføjelse af brugere til gruppen");
    }
  };

  // Handle remove user from group
  const handleRemoveUserFromGroup = async () => {
    if (!apiClient || !selectedUserId) return;

    try {
      await apiClient.delete(
        `/api/user-groups/${groupId}/users/${selectedUserId}`,
      );

      toast.success("Bruger fjernet fra gruppen");
      setIsRemoveUserDialogOpen(false);
      setSelectedUserId(null);
      fetchGroupMembers(currentPage);
    } catch (error) {
      console.error("Fejl ved fjernelse af bruger fra gruppen:", error);
      toast.error("Der opstod en fejl ved fjernelse af bruger fra gruppen");
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
          onClick={() => router.push("/admin/users?tab=groups")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbage
        </Button>
        <h1 className="text-3xl font-bold">
          {isLoadingGroup
            ? "Indlæser brugergruppe..."
            : `Rediger brugergruppe: ${groupData?.name}`}
        </h1>
      </div>

      {isLoadingGroup ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Gruppeoplysninger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{groupData?.name}</h3>
                    <p className="text-muted-foreground">
                      {groupData?.description || "Ingen beskrivelse"}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Tilladelser</h4>
                    <div className="space-y-2">
                      {groupData?.permissions ? (
                        Object.entries(groupData.permissions).map(
                          ([key, value]) => (
                            <div key={key} className="flex items-center">
                              <div
                                className={`w-4 h-4 rounded-full mr-2 ${value ? "bg-primary" : "bg-muted"}`}
                              />
                              <span>
                                {key === "canManageUsers" &&
                                  "Administrer brugere"}
                                {key === "canManageCourses" &&
                                  "Administrer kurser"}
                                {key === "canManageContent" &&
                                  "Administrer indhold"}
                                {key === "canViewReports" && "Se rapporter"}
                              </span>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-muted-foreground">
                          Ingen tilladelser defineret
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Oprettet
                    </p>
                    <p className="mb-3">
                      {new Date(groupData?.createdAt || "").toLocaleDateString(
                        "da-DK",
                      )}
                    </p>

                    <p className="text-sm text-muted-foreground mb-1">
                      Sidst opdateret
                    </p>
                    <p>
                      {new Date(groupData?.updatedAt || "").toLocaleDateString(
                        "da-DK",
                      )}
                    </p>
                  </div>

                  <Separator />

                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteConfirmDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slet gruppe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            <div className="space-y-6">
              {/* Edit group form */}
              <Card>
                <CardHeader>
                  <CardTitle>Rediger gruppe</CardTitle>
                  <CardDescription>
                    Opdater gruppens oplysninger og tilladelser
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Gruppenavn</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Beskrivelse af gruppen..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Tilladelser</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canManageUsers"
                            checked={formData.permissions.canManageUsers}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                "canManageUsers",
                                !!checked,
                              )
                            }
                          />
                          <Label htmlFor="canManageUsers">
                            Administrer brugere
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canManageCourses"
                            checked={formData.permissions.canManageCourses}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                "canManageCourses",
                                !!checked,
                              )
                            }
                          />
                          <Label htmlFor="canManageCourses">
                            Administrer kurser
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canManageContent"
                            checked={formData.permissions.canManageContent}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                "canManageContent",
                                !!checked,
                              )
                            }
                          />
                          <Label htmlFor="canManageContent">
                            Administrer indhold
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canViewReports"
                            checked={formData.permissions.canViewReports}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                "canViewReports",
                                !!checked,
                              )
                            }
                          />
                          <Label htmlFor="canViewReports">Se rapporter</Label>
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

              {/* Group members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Gruppemedlemmer</span>
                    <Button onClick={handleAddUsersDialogOpen}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tilføj brugere
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Administrer brugere i denne gruppe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Bruger</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Rolle</TableHead>
                              <TableHead className="text-right">
                                Handlinger
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupMembers.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center py-8 text-muted-foreground"
                                >
                                  Ingen brugere i denne gruppe
                                </TableCell>
                              </TableRow>
                            ) : (
                              groupMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {member.profileImage ? (
                                        <Image
                                          src={member.profileImage}
                                          alt={member.name || member.email}
                                          width={32}
                                          height={32}
                                          className="w-8 h-8 rounded-full mr-3"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 mr-3">
                                          {member.name
                                            ? member.name
                                                .charAt(0)
                                                .toUpperCase()
                                            : member.email
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                      )}
                                      {member.name || "Unavngivet"}
                                    </div>
                                  </TableCell>
                                  <TableCell>{member.email}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        member.role === Role.ADMIN
                                          ? "destructive"
                                          : member.role === Role.TEACHER
                                            ? "default"
                                            : "secondary"
                                      }
                                    >
                                      {member.role === Role.ADMIN
                                        ? "Administrator"
                                        : member.role === Role.TEACHER
                                          ? "Underviser"
                                          : "Studerende"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUserId(member.id);
                                        setIsRemoveUserDialogOpen(true);
                                      }}
                                    >
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Fjern
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
                            Viser {(currentPage - 1) * 10 + 1}-
                            {Math.min(currentPage * 10, totalMembers)} af{" "}
                            {totalMembers} brugere
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => fetchGroupMembers(currentPage - 1)}
                            >
                              Forrige
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={() => fetchGroupMembers(currentPage + 1)}
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
            </div>
          </div>
        </div>
      )}

      {/* Bekræft sletning dialog */}
      <Dialog
        open={isDeleteConfirmDialogOpen}
        onOpenChange={setIsDeleteConfirmDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bekræft sletning</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Er du sikker på, at du vil slette denne brugergruppe?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Denne handling kan ikke fortrydes. Brugere i gruppen vil miste de
              tilladelser, der er tildelt gennem denne gruppe.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Slet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tilføj brugere dialog */}
      <Dialog
        open={isAddUsersDialogOpen}
        onOpenChange={setIsAddUsersDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tilføj brugere til gruppen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingAvailableUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Alle brugere er allerede i denne gruppe</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p>Vælg brugere, der skal tilføjes til gruppen:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedUserIds.length} bruger(e) valgt
                  </p>
                </div>
                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedUserIds.length > 0 &&
                              selectedUserIds.length === availableUsers.length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUserIds(
                                  availableUsers.map((user) => user.id),
                                );
                              } else {
                                setSelectedUserIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Bruger</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rolle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableUsers.map((availableUser) => (
                        <TableRow key={availableUser.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUserIds.includes(
                                availableUser.id,
                              )}
                              onCheckedChange={() =>
                                handleUserSelection(availableUser.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {availableUser.profileImage ? (
                                <Image
                                  src={availableUser.profileImage}
                                  alt={
                                    availableUser.name || availableUser.email
                                  }
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 mr-3">
                                  {availableUser.name
                                    ? availableUser.name.charAt(0).toUpperCase()
                                    : availableUser.email
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                              )}
                              {availableUser.name || "Unavngivet"}
                            </div>
                          </TableCell>
                          <TableCell>{availableUser.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                availableUser.role === Role.ADMIN
                                  ? "destructive"
                                  : availableUser.role === Role.TEACHER
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {availableUser.role === Role.ADMIN
                                ? "Administrator"
                                : availableUser.role === Role.TEACHER
                                  ? "Underviser"
                                  : "Studerende"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddUsersDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button
              onClick={handleAddUsersToGroup}
              disabled={isLoadingAvailableUsers || selectedUserIds.length === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Tilføj {selectedUserIds.length} bruger(e)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fjern bruger dialog */}
      <Dialog
        open={isRemoveUserDialogOpen}
        onOpenChange={setIsRemoveUserDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Fjern bruger fra gruppen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Er du sikker på, at du vil fjerne denne bruger fra gruppen?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Brugeren vil miste de tilladelser, der er tildelt gennem denne
              gruppe.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveUserDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button variant="destructive" onClick={handleRemoveUserFromGroup}>
              Fjern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupEditPage;
