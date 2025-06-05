import { test, expect, APIResponse } from "@playwright/test";

test.describe("AI Features E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:3000");

    // Login as admin to access AI features
    await page.click("text=Login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/dashboard");
  });

  test("should access AI Tools admin page", async ({ page }) => {
    // Navigate to AI Tools
    await page.goto("http://localhost:3000/admin/ai-tools");

    // Check if the page loads correctly
    await expect(page.locator("h1")).toContainText("AI Tools");

    // Check if QuestionGenerator component is present
    await expect(page.locator("text=AI Spørgsmålsgenerator")).toBeVisible();
  });

  test("should generate questions from content", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/ai-tools");

    // Fill in content for question generation
    const testContent = `
      JavaScript er et programmeringssprog der bruges til at skabe interaktive websider.
      Variabler i JavaScript kan deklareres med var, let eller const.
      Funktioner kan defineres med function keyword eller som arrow functions.
    `;

    await page.fill('textarea[label="Indhold"]', testContent);

    // Set number of questions
    await page.fill('input[label="Antal spørgsmål"]', "3");

    // Select difficulty
    await page.click("text=Sværhedsgrad");
    await page.click("text=Mellem");

    // Select question types
    await page.check('input[type="checkbox"]:has-text("Multiple Choice")');
    await page.check('input[type="checkbox"]:has-text("Udfyld blanke felter")');

    // Generate questions
    await page.click('button:has-text("Generer")');

    // Wait for generation to complete
    await page.waitForSelector("text=Genererede Spørgsmål", { timeout: 30000 });

    // Verify questions were generated
    await expect(page.locator("text=Genererede Spørgsmål")).toBeVisible();

    // Check if at least one question is displayed
    await expect(
      page.locator('[data-testid="generated-question"]').first(),
    ).toBeVisible();
  });

  test("should test AI question generation API endpoints", async ({ page }) => {
    // Test the API endpoints directly
    const response = await page.request.post(
      "http://localhost:5002/api/ai/questions/generate-advanced",
      {
        data: {
          content: "Test content for question generation",
          contentType: "lesson",
          contentId: "test",
          targetDifficulty: "INTERMEDIATE",
          questionTypes: ["MULTIPLE_CHOICE"],
          numberOfQuestions: 2,
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.questions).toBeDefined();
    expect(Array.isArray(data.questions)).toBe(true);
  });

  test("should test content embedding API", async ({ page }) => {
    const response = await page.request.post(
      "http://localhost:5002/api/ai/embeddings/create",
      {
        data: {
          content: "This is test content for embedding",
          contentType: "lesson",
          contentId: "test-lesson-1",
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.embeddingId).toBeDefined();
  });

  test("should test content search functionality", async ({ page }) => {
    // First create some content to search
    await page.request.post("http://localhost:5002/api/ai/embeddings/create", {
      data: {
        content: "JavaScript programming fundamentals",
        contentType: "lesson",
        contentId: "js-lesson-1",
      },
    });

    // Wait a bit for processing
    await page.waitForTimeout(2000);

    // Test search
    const searchResponse = await page.request.post(
      "http://localhost:5002/api/search",
      {
        data: {
          query: "JavaScript",
          contentTypes: ["lessons"],
          limit: 10,
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(searchResponse.status()).toBe(200);
    const searchData = await searchResponse.json();
    expect(searchData.success).toBe(true);
    expect(searchData.results).toBeDefined();
  });

  test("should test AI usage logging", async ({ page }) => {
    // Make an AI request that should be logged
    await page.request.post(
      "http://localhost:5002/api/ai/questions/generate-advanced",
      {
        data: {
          content: "Test content for logging",
          contentType: "lesson",
          contentId: "test-logging",
          targetDifficulty: "BEGINNER",
          questionTypes: ["MULTIPLE_CHOICE"],
          numberOfQuestions: 1,
        },
      },
    );

    // Check if usage was logged
    const logsResponse = await page.request.get(
      "http://localhost:5002/api/ai/usage-logs",
    );
    expect(logsResponse.status()).toBe(200);

    const logsData = await logsResponse.json();
    expect(logsData.success).toBe(true);
    expect(Array.isArray(logsData.logs)).toBe(true);
  });

  test("should handle AI service errors gracefully", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/ai-tools");

    // Try to generate questions with invalid content
    await page.fill('textarea[label="Indhold"]', "");
    await page.click('button:has-text("Generer")');

    // Should show error message
    await expect(
      page.locator("text=Indtast venligst noget indhold"),
    ).toBeVisible();
  });

  test("should test question quality scoring", async ({ page }) => {
    const response = await page.request.post(
      "http://localhost:5002/api/ai/questions/generate-advanced",
      {
        data: {
          content:
            "Detailed content about machine learning algorithms and their applications in data science",
          contentType: "lesson",
          contentId: "ml-lesson",
          targetDifficulty: "ADVANCED",
          questionTypes: ["MULTIPLE_CHOICE", "ESSAY"],
          numberOfQuestions: 2,
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check that questions have quality scores
    data.questions.forEach((question: any) => {
      expect(question.qualityScore).toBeDefined();
      expect(typeof question.qualityScore).toBe("number");
      expect(question.qualityScore).toBeGreaterThanOrEqual(0);
      expect(question.qualityScore).toBeLessThanOrEqual(100);
      expect(question.reasoning).toBeDefined();
    });
  });

  test("should test different question types generation", async ({ page }) => {
    const questionTypes = ["MULTIPLE_CHOICE", "FILL_IN_BLANK", "ESSAY", "CODE"];

    for (const questionType of questionTypes) {
      const response = await page.request.post(
        "http://localhost:5002/api/ai/questions/generate-advanced",
        {
          data: {
            content: `Content for ${questionType} question generation`,
            contentType: "lesson",
            contentId: `test-${questionType.toLowerCase()}`,
            targetDifficulty: "INTERMEDIATE",
            questionTypes: [questionType],
            numberOfQuestions: 1,
          },
        },
      );

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.questions[0].type).toBe(questionType);
    }
  });

  test("should test content processing pipeline", async ({ page }) => {
    // Test content processing
    const response = await page.request.post(
      "http://localhost:5002/api/ai/content/process",
      {
        data: {
          content:
            "Complex educational content that needs to be processed and analyzed",
          contentType: "lesson",
          contentId: "processing-test",
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.processingId).toBeDefined();

    // Check processing status
    const statusResponse = await page.request.get(
      `http://localhost:5002/api/ai/content/process/${data.processingId}/status`,
    );
    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.status).toBeDefined();
  });

  test("should test AI configuration management", async ({ page }) => {
    // Get current AI configuration
    const configResponse = await page.request.get(
      "http://localhost:5002/api/ai/config",
    );
    expect(configResponse.status()).toBe(200);

    const configData = await configResponse.json();
    expect(configData.success).toBe(true);
    expect(configData.config).toBeDefined();

    // Test updating configuration
    const updateResponse = await page.request.put(
      "http://localhost:5002/api/ai/config",
      {
        data: {
          maxTokens: 1000,
          temperature: 0.7,
          model: "gpt-3.5-turbo",
        },
      },
    );

    expect(updateResponse.status()).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
  });
});

test.describe("Ollama Local AI Integration", () => {
  test("should connect to local Ollama service", async ({ page }) => {
    // Test connection to local Ollama
    try {
      const response = await page.request.get(
        "http://localhost:11434/api/tags",
      );

      // If Ollama is running, this should return available models
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.models).toBeDefined();
        expect(Array.isArray(data.models)).toBe(true);
      } else {
        console.log("Ollama service not available - skipping local AI tests");
      }
    } catch (error) {
      console.log("Ollama service not available - skipping local AI tests");
    }
  });

  test("should use Ollama for question generation if available", async ({
    page,
  }) => {
    // Check if Ollama is available
    try {
      const ollamaCheck = await page.request.get(
        "http://localhost:11434/api/tags",
      );

      if (ollamaCheck.status() === 200) {
        // Test question generation with Ollama
        const response = await page.request.post(
          "http://localhost:5002/api/ai/questions/generate-advanced",
          {
            data: {
              content: "Test content for Ollama generation",
              contentType: "lesson",
              contentId: "ollama-test",
              targetDifficulty: "INTERMEDIATE",
              questionTypes: ["MULTIPLE_CHOICE"],
              numberOfQuestions: 1,
              useLocalModel: true,
            },
          },
        );

        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.questions).toBeDefined();
      } else {
        console.log("Ollama not available - skipping local model tests");
      }
    } catch (error) {
      console.log("Ollama not available - skipping local model tests");
    }
  });
});

test.describe("AI Performance and Load Testing", () => {
  test("should handle multiple concurrent AI requests", async ({ page }) => {
    const requests: Promise<APIResponse>[] = [];

    // Create 5 concurrent requests
    for (let i = 0; i < 5; i++) {
      requests.push(
        page.request.post(
          "http://localhost:5002/api/ai/questions/generate-advanced",
          {
            data: {
              content: `Test content ${i} for concurrent processing`,
              contentType: "lesson",
              contentId: `concurrent-test-${i}`,
              targetDifficulty: "INTERMEDIATE",
              questionTypes: ["MULTIPLE_CHOICE"],
              numberOfQuestions: 1,
            },
          },
        ),
      );
    }

    // Wait for all requests to complete
    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response: APIResponse, index: number) => {
      expect(response.status()).toBe(201);
    });
  });

  test("should measure AI response times", async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.post(
      "http://localhost:5002/api/ai/questions/generate-advanced",
      {
        data: {
          content: "Performance test content for measuring response times",
          contentType: "lesson",
          contentId: "performance-test",
          targetDifficulty: "INTERMEDIATE",
          questionTypes: ["MULTIPLE_CHOICE"],
          numberOfQuestions: 3,
        },
      },
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(201);

    // Response should be within reasonable time (30 seconds)
    expect(responseTime).toBeLessThan(30000);

    console.log(`AI response time: ${responseTime}ms`);
  });
});
