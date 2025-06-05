import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * AI Feedback API Route
 * Handles requests for AI-generated feedback on quiz answers and learning progress
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;

  try {
    switch (method) {
      case "POST":
        return await handleGenerateFeedback(req, res);
      case "GET":
        return await handleGetFeedbackHistory(req, res);
      default:
        res.setHeader("Allow", ["POST", "GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("AI Feedback API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Generate AI feedback for quiz answers
 */
async function handleGenerateFeedback(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { quizId, answers, userId } = req.body;

  if (!quizId || !answers || !userId) {
    return res.status(400).json({
      error: "Missing required fields: quizId, answers, userId",
    });
  }

  try {
    // Call backend AI service
    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/feedback/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          quizId,
          answers,
          userId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const feedbackData = await response.json();
    return res.status(200).json(feedbackData);
  } catch (error) {
    console.error("Generate feedback error:", error);
    return res.status(500).json({
      error: "Failed to generate AI feedback",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get feedback history for a user
 */
async function handleGetFeedbackHistory(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, limit = 10, offset = 0 } = req.query;

  if (!userId) {
    return res.status(400).json({
      error: "Missing required parameter: userId",
    });
  }

  try {
    // Call backend AI service
    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/feedback/history?userId=${userId}&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const historyData = await response.json();
    return res.status(200).json(historyData);
  } catch (error) {
    console.error("Get feedback history error:", error);
    return res.status(500).json({
      error: "Failed to retrieve feedback history",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
