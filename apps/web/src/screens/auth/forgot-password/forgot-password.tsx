// apps/web/src/screens/auth/forgot-password/forgot-password.tsx
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/router"; // Selvom vi ikke omdirigerer direkte her, kan den være nyttig

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        // Kalder dit backend endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Backend returnerer altid 200 OK for forgot-password for ikke at afsløre om en email eksisterer.
      // Vi stoler på beskeden fra backend.
      const data = await response.json();

      if (!response.ok) {
        // Dette burde ikke ske ofte med forgot-password, medmindre der er en serverfejl
        // eller en uventet valideringsfejl, der ikke returnerer 200.
        let errorMessage = "Anmodning om nulstilling af adgangskode fejlede.";
        if (data && data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(", ");
          } else {
            errorMessage = data.message;
          }
        }
        throw new Error(errorMessage);
      }

      console.log("Anmodning om glemt adgangskode succesfuld:", data);
      // Backend sender en generisk succesbesked, som vi viser.
      setSuccessMessage(
        data.message ||
          "Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.",
      );
      setEmail(""); // Ryd email feltet efter succes
    } catch (err: any) {
      console.error("Fejl ved glemt adgangskode:", err);
      setError(err.message || "Der opstod en uventet fejl.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Glemt Adgangskode?
        </h2>
        <p className="text-center text-sm text-gray-600">
          Indtast din emailadresse, så sender vi dig et link til at nulstille
          din adgangskode.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email felt */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Emailadresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!successMessage}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="din@email.com"
            />
          </div>

          {/* Fejlmeddelelse */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Succesmeddelelse */}
          {successMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Submit knap */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Send Nulstillingslink"
              )}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Tilbage til{" "}
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
