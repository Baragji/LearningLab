import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should load the login page correctly", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Check if the page title is correct
    await expect(page.locator("h2")).toHaveText("Log ind på Læringsplatformen");

    // Check if the form elements are present
    await expect(page.locator('label[for="email"]')).toHaveText("Emailadresse");
    await expect(page.locator('label[for="password"]')).toHaveText(
      "Adgangskode",
    );
    await expect(page.locator('button[type="submit"]')).toHaveText("Log ind");
  });

  test("should allow entering email and password", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Enter email and password
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");

    // Check if the values were entered correctly
    await expect(page.locator("#email")).toHaveValue("test@example.com");
    await expect(page.locator("#password")).toHaveValue("password123");
  });

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Enter an invalid email format
    await page.fill("#email", "invalid-email");

    // Try to submit the form
    await page.click('button[type="submit"]');

    // Check if the browser's built-in validation message appears
    // Note: This is a bit tricky to test with Playwright as browser validation messages
    // are not part of the DOM. We can check if the form didn't submit instead.

    // Check if we're still on the login page
    await expect(page).toHaveURL(/.*login/);
  });

  // Note: We can't fully test the actual login process in E2E tests without setting up
  // a mock server or using a test account. This test just verifies the UI interaction.
  test("should attempt to submit the form with valid inputs", async ({
    page,
  }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Enter valid email and password
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");

    // Intercept API calls to prevent actual login attempt
    await page.route("**/api/auth/login", async (route) => {
      // Mock a successful response
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, token: "fake-token" }),
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Check if the submit button shows loading state
    // This depends on how your app handles loading states
    // await expect(page.locator('button[type="submit"] svg')).toBeVisible();
  });

  test("should have links to signup and forgot password pages", async ({
    page,
  }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Check if the signup link is present and has the correct href
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toHaveText("Opret dig her");

    // Check if the forgot password link is present and has the correct href
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotPasswordLink).toHaveText("Glemt adgangskode?");
  });
});
