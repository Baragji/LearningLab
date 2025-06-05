import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../../src/components/layout/Layout";
import axios from "axios";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface Course {
  id: number;
  title: string;
  description: string;
}

const AssignToCourse: React.FC = () => {
  const router = useRouter();
  const { userIds } = router.query;

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users and courses data
  useEffect(() => {
    const fetchData = async () => {
      if (!userIds) return;

      setLoading(true);
      try {
        // Parse user IDs from query parameter
        const ids = (userIds as string)
          .split(",")
          .map((id) => parseInt(id, 10));

        // Fetch user details
        const usersPromise = axios.post<User[]>("/api/users/bulk-get", {
          userIds: ids,
        });

        // Fetch available courses
        const coursesPromise = axios.get<Course[]>("/api/courses");

        const [usersResponse, coursesResponse] = await Promise.all([
          usersPromise,
          coursesPromise,
        ]);

        setSelectedUsers(usersResponse.data);
        setCourses(coursesResponse.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Der opstod en fejl ved hentning af data. Prøv igen senere.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userIds]);

  // Handle course selection
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCourseId(value === "" ? "" : parseInt(value, 10));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast.error("Vælg venligst et kursus");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Ingen brugere valgt");
      return;
    }

    setSubmitting(true);

    try {
      // Dette endpoint skal implementeres i backend
      await axios.post("/api/courses/assign-users", {
        courseId: selectedCourseId,
        userIds: selectedUsers.map((user) => user.id),
      });

      toast.success(`${selectedUsers.length} brugere tildelt til kurset`);
      router.push("/admin/users");
    } catch (err) {
      console.error("Error assigning users to course:", err);
      toast.error("Der opstod en fejl ved tildeling af brugere til kurset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tildel brugere til kursus
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
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Selected users */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Valgte brugere ({selectedUsers.length})
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md max-h-60 overflow-y-auto">
                    {selectedUsers.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        Ingen brugere valgt
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedUsers.map((user) => (
                          <li
                            key={user.id}
                            className="flex items-center space-x-2"
                          >
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300">
                                {(user.name || user.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name || "Unavngivet"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Course selection */}
                <div>
                  <label
                    htmlFor="course"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Vælg kursus *
                  </label>
                  <select
                    id="course"
                    value={selectedCourseId}
                    onChange={handleCourseChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Vælg et kursus</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Ingen kurser tilgængelige. Opret venligst et kursus først.
                    </p>
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
                    disabled={
                      submitting ||
                      !selectedCourseId ||
                      selectedUsers.length === 0 ||
                      courses.length === 0
                    }
                    className={`px-4 py-2 rounded-md ${
                      submitting ||
                      !selectedCourseId ||
                      selectedUsers.length === 0 ||
                      courses.length === 0
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }`}
                  >
                    {submitting ? "Tildeler..." : "Tildel til kursus"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssignToCourse;
