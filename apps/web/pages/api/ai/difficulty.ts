import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * Difficulty Adjustment API Route
 * Handles requests for dynamic difficulty adjustment based on user performance
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
        return await handleAdjustDifficulty(req, res);
      case "GET":
        return await handleGetDifficultySettings(req, res);
      case "PUT":
        return await handleUpdateDifficultySettings(req, res);
      default:
        res.setHeader("Allow", ["POST", "GET", "PUT"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Difficulty Adjustment API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Adjust difficulty based on performance
 */
async function handleAdjustDifficulty(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    userId,
    courseId,
    moduleId,
    performanceData,
    currentDifficulty,
    adjustmentType = "automatic",
  } = req.body;

  if (!userId || !performanceData) {
    return res.status(400).json({
      error: "Missing required fields: userId, performanceData",
    });
  }

  try {
    // Call backend difficulty adjustment service
    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/difficulty/adjust`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          userId,
          courseId,
          moduleId,
          performanceData,
          currentDifficulty,
          adjustmentType,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const adjustmentData = await response.json();
    return res.status(200).json(adjustmentData);
  } catch (error) {
    console.error("Adjust difficulty error:", error);
    return res.status(500).json({
      error: "Failed to adjust difficulty",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get current difficulty settings
 */
async function handleGetDifficultySettings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, courseId, moduleId } = req.query;

  if (!userId) {
    return res.status(400).json({
      error: "Missing required parameter: userId",
    });
  }

  try {
    // Call backend difficulty adjustment service
    const queryParams = new URLSearchParams({
      userId: userId as string,
      ...(courseId && { courseId: courseId as string }),
      ...(moduleId && { moduleId: moduleId as string }),
    });

    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/difficulty/settings?${queryParams}`,
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

    const settingsData = await response.json();
    return res.status(200).json(settingsData);
  } catch (error) {
    console.error("Get difficulty settings error:", error);
    return res.status(500).json({
      error: "Failed to retrieve difficulty settings",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Update difficulty settings
 */
async function handleUpdateDifficultySettings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    userId,
    courseId,
    moduleId,
    difficultySettings,
    autoAdjustment = true,
  } = req.body;

  if (!userId || !difficultySettings) {
    return res.status(400).json({
      error: "Missing required fields: userId, difficultySettings",
    });
  }

  try {
    // Call backend difficulty adjustment service
    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/difficulty/settings`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          userId,
          courseId,
          moduleId,
          difficultySettings,
          autoAdjustment,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const updateResult = await response.json();
    return res.status(200).json(updateResult);
  } catch (error) {
    console.error("Update difficulty settings error:", error);
    return res.status(500).json({
      error: "Failed to update difficulty settings",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
