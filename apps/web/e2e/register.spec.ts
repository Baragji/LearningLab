import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/da';

// Hjælpefunktion til at generere unikke testdata
const generateTestUser = () => {
  return {
    name: faker.person.fullName(),
    email: `test.${faker.string.uuid()}@example.com`,
    password: faker.internet.password({ length: 12, memorable: true }),
  };
};

test.describe('Brugerregistrering', () => {
  test('skal indlæse registreringssiden korrekt', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    // Tjek om sidens titel er korrekt
    await expect(page.locator('h2')).toHaveText('Opret en ny konto');

    // Tjek om formularelementerne er til stede
    await expect(page.locator('label[for="name"]')).toHaveText('Navn (valgfrit)');
    await expect(page.locator('label[for="email"]')).toHaveText('Emailadresse');
    await expect(page.locator('label[for="password"]')).toHaveText('Adgangskode');
    await expect(page.locator('label[for="confirmPassword"]')).toHaveText('Bekræft adgangskode');
    await expect(page.locator('button[type="submit"]')).toHaveText('Opret konto');
  });

  test('skal tillade indtastning af registreringsoplysninger', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    const testUser = generateTestUser();

    // Udfyld registreringsformularen
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);

    // Tjek om værdierne blev indtastet korrekt
    await expect(page.locator('#name')).toHaveValue(testUser.name);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await expect(page.locator('#password')).toHaveValue(testUser.password);
    await expect(page.locator('#confirmPassword')).toHaveValue(testUser.password);
  });

  test('skal vise valideringsfejl ved ikke-matchende adgangskoder', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    const testUser = generateTestUser();

    // Udfyld registreringsformularen med forskellige adgangskoder
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password + '123'); // Ikke-matchende adgangskode

    // Klik på registreringsknappen
    await page.click('button[type="submit"]');

    // Tjek om fejlmeddelelsen vises
    await expect(page.locator('.text-red-700')).toBeVisible();
    await expect(page.locator('.text-red-700')).toHaveText('Adgangskoderne matcher ikke.');
  });

  test('skal vise valideringsfejl ved tom email', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    const testUser = generateTestUser();

    // Udfyld registreringsformularen uden email
    await page.fill('#name', testUser.name);
    // Lad email-feltet være tomt
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);

    // Klik på registreringsknappen
    await page.click('button[type="submit"]');

    // Tjek om vi stadig er på registreringssiden (formularen blev ikke sendt)
    await expect(page).toHaveURL(/.*signup/);
  });

  test('skal gennemføre registreringsprocessen med succes', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    const testUser = generateTestUser();

    // Intercepter API-kald for at forhindre faktisk registrering
    await page.route('**/api/users/signup', async (route) => {
      // Mock et succesfuldt svar
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ success: true, message: 'Bruger oprettet' })
      });
    });

    // Udfyld registreringsformularen
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);

    // Klik på registreringsknappen
    await page.click('button[type="submit"]');

    // Tjek om succesmeddelelsen vises
    await expect(page.locator('.text-green-700')).toBeVisible();
    await expect(page.locator('.text-green-700')).toHaveText('Din konto er blevet oprettet! Du bliver nu sendt til login-siden.');

    // Tjek om vi bliver omdirigeret til login-siden efter et stykke tid
    // Bemærk: Dette kræver en timeout, da omdirigering sker efter 3 sekunder
    await page.waitForURL(/.*login/, { timeout: 5000 });
  });

  test('skal håndtere serverfejl ved registrering', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    const testUser = generateTestUser();

    // Intercepter API-kald for at simulere en serverfejl
    await page.route('**/api/users/signup', async (route) => {
      // Mock et fejlsvar
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ 
          success: false, 
          message: 'En bruger med denne email findes allerede' 
        })
      });
    });

    // Udfyld registreringsformularen
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);

    // Klik på registreringsknappen
    await page.click('button[type="submit"]');

    // Tjek om fejlmeddelelsen vises
    await expect(page.locator('.text-red-700')).toBeVisible();
    await expect(page.locator('.text-red-700')).toHaveText('En bruger med denne email findes allerede');
  });

  test('skal have link til login-siden', async ({ page }) => {
    // Naviger til registreringssiden
    await page.goto('/signup');

    // Tjek om login-linket er til stede og har den korrekte href
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toHaveText('Log ind her');
  });
});