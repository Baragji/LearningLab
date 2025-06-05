import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:5002/api";

test.describe("AI API Endpoints Testing", () => {
  test("should test AI question generation endpoint", async ({ request }) => {
    const response = await request.post(
      `${API_BASE_URL}/ai/questions/generate-advanced`,
      {
        data: {
          content:
            "JavaScript er et programmeringssprog. Variabler kan deklareres med let, const eller var.",
          contentType: "lesson",
          contentId: "test-lesson-1",
          targetDifficulty: "INTERMEDIATE",
          questionTypes: ["MULTIPLE_CHOICE", "FILL_IN_BLANK"],
          numberOfQuestions: 3,
          focusAreas: ["variabler", "syntax"],
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.questions).toBeDefined();
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBe(3);

    // Verify question structure
    data.questions.forEach((question: any) => {
      expect(question.text).toBeDefined();
      expect(question.type).toBeDefined();
      expect(["MULTIPLE_CHOICE", "FILL_IN_BLANK"].includes(question.type)).toBe(
        true,
      );
      expect(question.difficulty).toBe("INTERMEDIATE");
      expect(question.points).toBeDefined();
      expect(question.qualityScore).toBeDefined();
      expect(question.reasoning).toBeDefined();
    });
  });

  test("should test lesson-based question generation", async ({ request }) => {
    // First create a lesson (assuming we have this endpoint)
    const lessonResponse = await request.post(`${API_BASE_URL}/lessons`, {
      data: {
        title: "Test Lesson for AI",
        description: "This is a test lesson for AI question generation",
        topicId: 1,
        order: 1,
      },
    });

    if (lessonResponse.status() === 201) {
      const lessonData = await lessonResponse.json();
      const lessonId = lessonData.id;

      // Test question generation from lesson
      const response = await request.post(
        `${API_BASE_URL}/ai/questions/generate/lesson/${lessonId}`,
        {
          data: {
            numberOfQuestions: 2,
            questionTypes: ["MULTIPLE_CHOICE"],
            targetDifficulty: "BEGINNER",
          },
        },
      );

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.questions).toBeDefined();
    }
  });

  test("should test topic-based question generation", async ({ request }) => {
    // Test question generation from topic
    const response = await request.post(
      `${API_BASE_URL}/ai/questions/generate/topic/1`,
      {
        data: {
          numberOfQuestions: 2,
          questionTypes: ["MULTIPLE_CHOICE", "ESSAY"],
          targetDifficulty: "ADVANCED",
        },
      },
    );

    // This might fail if topic doesn't exist, but we test the endpoint structure
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.questions).toBeDefined();
    } else {
      // Expected if topic doesn't exist
      expect([404, 400].includes(response.status())).toBe(true);
    }
  });

  test("should test content embedding creation", async ({ request }) => {
    const response = await request.post(
      `${API_BASE_URL}/ai/embeddings/create`,
      {
        data: {
          content:
            "Dette er test indhold for embedding generering. Det handler om JavaScript programmering.",
          contentType: "lesson",
          contentId: "embedding-test-1",
          metadata: {
            title: "Test Lesson",
            difficulty: "INTERMEDIATE",
          },
        },
      },
    );

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.embeddingId).toBeDefined();
    expect(data.chunkCount).toBeDefined();
  });

  test("should test content embedding search", async ({ request }) => {
    // First create an embedding
    await request.post(`${API_BASE_URL}/ai/embeddings/create`, {
      data: {
        content:
          "JavaScript arrays er en datastruktur til at gemme flere værdier.",
        contentType: "lesson",
        contentId: "search-test-1",
      },
    });

    // Wait a bit for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test search
    const response = await request.post(
      `${API_BASE_URL}/ai/embeddings/search`,
      {
        data: {
          query: "JavaScript arrays",
          limit: 5,
          threshold: 0.7,
        },
      },
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("should test content processing pipeline", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/ai/content/process`, {
      data: {
        content:
          "Langt indhold der skal processeres og analyseres af AI systemet for at skabe embeddings og metadata.",
        contentType: "lesson",
        contentId: "process-test-1",
        options: {
          generateSummary: true,
          extractKeywords: true,
          createEmbeddings: true,
        },
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.processingId).toBeDefined();

    // Check processing status
    const statusResponse = await request.get(
      `${API_BASE_URL}/ai/content/process/${data.processingId}/status`,
    );
    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.status).toBeDefined();
  });

  test("should test AI usage logging", async ({ request }) => {
    // Make an AI request that should be logged
    await request.post(`${API_BASE_URL}/ai/questions/generate-advanced`, {
      data: {
        content: "Test content for usage logging",
        contentType: "lesson",
        contentId: "usage-log-test",
        targetDifficulty: "INTERMEDIATE",
        questionTypes: ["MULTIPLE_CHOICE"],
        numberOfQuestions: 1,
      },
    });

    // Get usage logs
    const response = await request.get(`${API_BASE_URL}/ai/usage-logs`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.logs).toBeDefined();
    expect(Array.isArray(data.logs)).toBe(true);

    // Check log structure
    if (data.logs.length > 0) {
      const log = data.logs[0];
      expect(log.operation).toBeDefined();
      expect(log.model).toBeDefined();
      expect(log.tokensUsed).toBeDefined();
      expect(log.duration).toBeDefined();
      expect(log.success).toBeDefined();
      expect(log.createdAt).toBeDefined();
    }
  });

  test("should test AI configuration management", async ({ request }) => {
    // Get current configuration
    const getResponse = await request.get(`${API_BASE_URL}/ai/config`);
    expect(getResponse.status()).toBe(200);

    const configData = await getResponse.json();
    expect(configData.success).toBe(true);
    expect(configData.config).toBeDefined();

    // Update configuration
    const updateResponse = await request.put(`${API_BASE_URL}/ai/config`, {
      data: {
        maxTokens: 2000,
        temperature: 0.8,
        model: "gpt-4",
        useLocalModel: false,
      },
    });

    expect(updateResponse.status()).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);

    // Verify update
    const verifyResponse = await request.get(`${API_BASE_URL}/ai/config`);
    const verifyData = await verifyResponse.json();
    expect(verifyData.config.maxTokens).toBe(2000);
    expect(verifyData.config.temperature).toBe(0.8);
  });

  test("should test error handling for invalid requests", async ({
    request,
  }) => {
    // Test with missing required fields
    const response1 = await request.post(
      `${API_BASE_URL}/ai/questions/generate-advanced`,
      {
        data: {
          // Missing content
          contentType: "lesson",
          targetDifficulty: "INTERMEDIATE",
        },
      },
    );

    expect(response1.status()).toBe(400);

    // Test with invalid difficulty
    const response2 = await request.post(
      `${API_BASE_URL}/ai/questions/generate-advanced`,
      {
        data: {
          content: "Test content",
          contentType: "lesson",
          targetDifficulty: "INVALID_DIFFICULTY",
          questionTypes: ["MULTIPLE_CHOICE"],
          numberOfQuestions: 1,
        },
      },
    );

    expect(response2.status()).toBe(400);

    // Test with invalid question type
    const response3 = await request.post(
      `${API_BASE_URL}/ai/questions/generate-advanced`,
      {
        data: {
          content: "Test content",
          contentType: "lesson",
          targetDifficulty: "INTERMEDIATE",
          questionTypes: ["INVALID_TYPE"],
          numberOfQuestions: 1,
        },
      },
    );

    expect(response3.status()).toBe(400);
  });

  test("should test rate limiting and performance", async ({ request }) => {
    const requests = [];
    const startTime = Date.now();

    // Make multiple concurrent requests
    for (let i = 0; i < 3; i++) {
      requests.push(
        request.post(`${API_BASE_URL}/ai/questions/generate-advanced`, {
          data: {
            content: `Performance test content ${i}`,
            contentType: "lesson",
            contentId: `perf-test-${i}`,
            targetDifficulty: "INTERMEDIATE",
            questionTypes: ["MULTIPLE_CHOICE"],
            numberOfQuestions: 1,
          },
        }),
      );
    }

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    // All requests should succeed or be rate limited
    responses.forEach((response) => {
      expect([201, 429].includes(response.status())).toBe(true);
    });

    console.log(`Concurrent requests completed in: ${endTime - startTime}ms`);
  });

  test("should test different content types", async ({ request }) => {
    const contentTypes = ["lesson", "topic", "quiz", "general"];

    for (const contentType of contentTypes) {
      const response = await request.post(
        `${API_BASE_URL}/ai/questions/generate-advanced`,
        {
          data: {
            content: `Test content for ${contentType} type`,
            contentType: contentType,
            contentId: `test-${contentType}`,
            targetDifficulty: "INTERMEDIATE",
            questionTypes: ["MULTIPLE_CHOICE"],
            numberOfQuestions: 1,
          },
        },
      );

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test("should test question bank integration", async ({ request }) => {
    // Test creating questions and adding to question bank
    const response = await request.post(
      `${API_BASE_URL}/ai/questions/generate-to-bank`,
      {
        data: {
          content: "Content for question bank generation",
          questionBankId: 1,
          targetDifficulty: "INTERMEDIATE",
          questionTypes: ["MULTIPLE_CHOICE", "FILL_IN_BLANK"],
          numberOfQuestions: 2,
        },
      },
    );

    // This might fail if question bank doesn't exist
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.questionsAdded).toBeDefined();
    } else {
      expect([404, 400].includes(response.status())).toBe(true);
    }
  });
});
