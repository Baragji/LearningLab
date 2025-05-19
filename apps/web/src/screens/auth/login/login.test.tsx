// apps/web/src/screens/auth/login/login.test.tsx
import { render } from "@testing-library/react";
import { LoginScreen } from "./login";
import { AuthProvider } from '../../../context/AuthContext'; // Sørg for korrekt importsti

test("render login component", () => {
  render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
});