import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ProgressProvider } from "../src/contexts/ProgressContext";
import { QuizProvider } from "../src/contexts/QuizContext";

export const metadata = {
  title: "LearningLab",
  description: "En avanceret læringsplatform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ProgressProvider>
              <QuizProvider>{children}</QuizProvider>
            </ProgressProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
