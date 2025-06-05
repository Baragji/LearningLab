import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../../../src/components/layout/Layout";
import axios from "axios";
import { toast } from "react-hot-toast";

interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  permissions: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

interface UserGroupListResponse {
  userGroups: UserGroup[];
  total: number;
}

const UserGroupsPage: React.FC = () => {
  const router = useRouter();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  // Fetch user groups
  const fetchUserGroups = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/user-groups?page=${page}&limit=${limit}`;
      if (filter) url += `&filter=${encodeURIComponent(filter)}`;

      const response = await axios.get<UserGroupListResponse>(url);
      setUserGroups(response.data.userGroups);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching user groups:", err);
      setError(
        "Der opstod en fejl ved hentning af brugergrupper. Prøv igen senere.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  // Handle create new group
  const handleCreateGroup = () => {
    router.push("/admin/user-groups/create");
  };

  // Handle edit group
  const handleEditGroup = (groupId: number) => {
    router.push(`/admin/user-groups/edit/${groupId}`);
  };

  // Handle view group members
  const handleViewMembers = (groupId: number) => {
    router.push(`/admin/user-groups/${groupId}/members`);
  };

  // Handle delete click
  const handleDeleteClick = (groupId: number) => {
    setGroupToDelete(groupId);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      await axios.delete(`/api/user-groups/${groupToDelete}`);
      toast.success("Brugergruppe slettet");
      fetchUserGroups();
    } catch (err) {
      console.error("Error deleting user group:", err);
      toast.error("Der opstod en fejl ved sletning af brugergruppen");
    } finally {
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Brugergrupper
          </h1>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Opret ny gruppe
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Søg efter brugergrupper..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {/* User groups table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Navn
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Beskrivelse
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Antal brugere
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Oprettet
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {userGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      Ingen brugergrupper fundet
                    </td>
                  </tr>
                ) : (
                  userGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {group.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {group.description || "Ingen beskrivelse"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {group._count?.users || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(group.createdAt).toLocaleDateString("da-DK")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewMembers(group.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Medlemmer
                        </button>
                        <button
                          onClick={() => handleEditGroup(group.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Rediger
                        </button>
                        <button
                          onClick={() => handleDeleteClick(group.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Slet
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {userGroups.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Viser {(page - 1) * limit + 1} til {Math.min(page * limit, total)}{" "}
              af {total} brugergrupper
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Forrige
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                className={`px-3 py-1 rounded-md ${
                  page * limit >= total
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Næste
              </button>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Bekræft sletning
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Er du sikker på, at du vil slette denne brugergruppe? Denne
                handling kan ikke fortrydes.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Annuller
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Slet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserGroupsPage;
