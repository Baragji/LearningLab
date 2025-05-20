// apps/web/src/screens/auth/login/login.test.tsx
import { render } from "@testing-library/react";
import { Provider } from 'react-redux';
import store from '../../../store';
import { LoginScreen } from "./login";
import { AuthProvider } from '../../../context/AuthContext'; // Sørg for korrekt importsti

// Det er ikke længere nødvendigt at mocke next/router her,
// hvis du gør det globalt i jest.setup.js (anbefalet)
// Hvis du *ikke* har en jest.setup.js eller foretrækker at gøre det her:
// jest.mock('next/router', () => require('next-router-mock'));

test('vis login-form', () => {
  render(
    <Provider store={store}>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </Provider>
  );
});