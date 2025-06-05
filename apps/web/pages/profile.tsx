// apps/web/pages/profile.tsx
import React from "react";
import ProtectedRoute from "../src/components/auth/ProtectedRoute";
import UserProfilePage from "../src/screens/common/UserProfilePage";

// Default export er en wrapper-komponent, der anvender ProtectedRoute
export default function WrappedProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfilePage />
    </ProtectedRoute>
  );
}
