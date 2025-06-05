import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../../src/components/layout/Layout";
import { useAuth } from "../../../src/contexts/useAuth";
import { GetServerSidePropsContext } from "next";
import { parseCookies } from "nookies";

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  courseId: number;
  course?: {
    title: string;
  };
}

const AdminModulesPage: React.FC = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const response = await fetch(`${baseUrl}/modules?includeCourse=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch modules: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        setModules(data);
      } catch (err: any) {
        console.error("Error fetching modules:", err);
        setError(err.message || "Failed to fetch modules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Er du sikker på, at du vil slette dette modul?")) {
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/modules/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to delete module: ${response.status} ${response.statusText}`,
        );
      }

      // Remove the deleted module from the state
      setModules(modules.filter((module) => module.id !== id));
    } catch (err: any) {
      console.error("Error deleting module:", err);
      setError(err.message || "Failed to delete module");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Administrer Moduler
          </h1>
          <button
            onClick={() => router.push("/admin/modules/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Opret Nyt Modul
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Fejl!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {modules.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Ingen moduler fundet. Opret et nyt modul for at komme i gang.
                </li>
              ) : (
                modules.map((module) => (
                  <li key={module.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {module.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {module.description}
                        </p>
                        <div className="flex mt-1 space-x-4">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Kursus: {module.course?.title || "Ukendt"}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Rækkefølge: {module.order}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/modules/edit/${module.id}`)
                          }
                          className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Rediger
                        </button>
                        <button
                          onClick={() => handleDelete(module.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 rounded-md hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Slet
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Funktion til at validere om brugeren er autentificeret baseret på token
const isUserAuthenticated = (token: string | undefined): boolean => {
  // Dette er en simpel implementering, der blot tjekker om token eksisterer
  return !!token;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  // Hent cookies fra request
  const cookies = parseCookies(context);

  // Hent token fra access_token cookie
  const token = cookies.access_token;

  // Valider token
  if (!isUserAuthenticated(token)) {
    // Hvis token ikke er gyldig eller mangler, redirect til login
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Hvis token er gyldig, returner props
  return {
    props: {},
  };
};

export default AdminModulesPage;
