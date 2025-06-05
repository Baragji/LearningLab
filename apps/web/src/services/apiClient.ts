import axios from "axios";

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// Check if we're online and sync any offline data
export const setupOnlineListener = (): void => {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("Back online, syncing data...");
      // Import and call syncOfflineData function
      import("./userProgressApi").then(({ syncOfflineQuizUpdates }) => {
        syncOfflineQuizUpdates();
      });
    });
  }
};

// Initialize online listener
if (typeof window !== "undefined") {
  setupOnlineListener();
}
