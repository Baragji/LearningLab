import React, { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../src/components/layout/Layout";
import { Role } from "@repo/core";
import axios from "axios";
import { toast } from "react-hot-toast";

interface InviteUserData {
  email: string;
  name?: string;
  role: Role;
}

const InviteUsersPage: React.FC = () => {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InviteUserData[]>([
    { email: "", role: Role.STUDENT },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<InviteUserData[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  // Add a new empty invitation row
  const addInvitation = () => {
    setInvitations([...invitations, { email: "", role: Role.STUDENT }]);
  };

  // Remove an invitation row
  const removeInvitation = (index: number) => {
    const newInvitations = [...invitations];
    newInvitations.splice(index, 1);
    setInvitations(newInvitations);
  };

  // Update an invitation field
  const updateInvitation = (
    index: number,
    field: keyof InviteUserData,
    value: string,
  ) => {
    const newInvitations = [...invitations];
    if (field === "role") {
      newInvitations[index][field] = value as Role;
    } else {
      newInvitations[index][field as "email" | "name"] = value;
    }
    setInvitations(newInvitations);
  };

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const rows = csvText.split("\n");
      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());

      const emailIndex = headers.indexOf("email");
      const nameIndex = headers.indexOf("name");
      const roleIndex = headers.indexOf("role");

      if (emailIndex === -1) {
        toast.error('CSV-filen skal indeholde en "email" kolonne');
        return;
      }

      const parsedData: InviteUserData[] = [];

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;

        const values = rows[i].split(",").map((v) => v.trim());
        const email = values[emailIndex];
        const name = nameIndex !== -1 ? values[nameIndex] : undefined;
        let role = Role.STUDENT;

        if (roleIndex !== -1) {
          const roleValue = values[roleIndex].toUpperCase();
          if (
            roleValue === "ADMIN" ||
            roleValue === "TEACHER" ||
            roleValue === "STUDENT"
          ) {
            role = roleValue as Role;
          }
        }

        if (email) {
          parsedData.push({ email, name, role });
        }
      }

      setCsvPreview(parsedData);
      setShowCsvPreview(true);
    };

    reader.readAsText(file);
  };

  // Import users from CSV preview
  const importFromCsv = () => {
    setInvitations(csvPreview);
    setShowCsvPreview(false);
    setCsvFile(null);
    toast.success(`${csvPreview.length} brugere importeret fra CSV`);
  };

  // Submit invitations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate emails
    const invalidEmails = invitations.filter(
      (inv) => !inv.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email),
    );

    if (invalidEmails.length > 0) {
      toast.error("Nogle email-adresser er ugyldige");
      return;
    }

    setIsSubmitting(true);

    try {
      // Dette endpoint skal implementeres i backend
      await axios.post("/api/users/bulk-invite", { invitations });
      toast.success(`${invitations.length} brugere inviteret`);
      router.push("/admin/users");
    } catch (err) {
      console.error("Error inviting users:", err);
      toast.error("Der opstod en fejl ved invitation af brugere");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inviter brugere
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Tilbage
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Importer fra CSV
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upload en CSV-fil med kolonner for email, navn (valgfrit) og rolle
              (valgfrit).
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {csvFile && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvFile(null);
                    setShowCsvPreview(false);
                  }}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Fjern
                </button>
              )}
            </div>
          </div>

          {showCsvPreview && csvPreview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                Forhåndsvisning ({csvPreview.length} brugere)
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Email
                      </th>
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
                        Rolle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {csvPreview.slice(0, 5).map((user, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.role}
                        </td>
                      </tr>
                    ))}
                    {csvPreview.length > 5 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-center"
                        >
                          ... og {csvPreview.length - 5} flere
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={importFromCsv}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Importer alle
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manuel invitation
            </h2>

            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor={`email-${index}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id={`email-${index}`}
                      value={invitation.email}
                      onChange={(e) =>
                        updateInvitation(index, "email", e.target.value)
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="bruger@eksempel.dk"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor={`name-${index}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Navn (valgfrit)
                    </label>
                    <input
                      type="text"
                      id={`name-${index}`}
                      value={invitation.name || ""}
                      onChange={(e) =>
                        updateInvitation(index, "name", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fornavn Efternavn"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label
                      htmlFor={`role-${index}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Rolle
                    </label>
                    <select
                      id={`role-${index}`}
                      value={invitation.role}
                      onChange={(e) =>
                        updateInvitation(index, "role", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={Role.STUDENT}>Studerende</option>
                      <option value={Role.TEACHER}>Underviser</option>
                      <option value={Role.ADMIN}>Administrator</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeInvitation(index)}
                      disabled={invitations.length === 1}
                      className={`px-3 py-2 rounded-md ${
                        invitations.length === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={addInvitation}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                + Tilføj flere
              </button>
              <div className="flex space-x-3">
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
                    isSubmitting || invitations.some((inv) => !inv.email)
                  }
                  className={`px-4 py-2 rounded-md ${
                    isSubmitting || invitations.some((inv) => !inv.email)
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                >
                  {isSubmitting
                    ? "Sender invitationer..."
                    : "Send invitationer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default InviteUsersPage;
