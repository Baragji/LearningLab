import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

/**
 * Adaptive Learning API Route
 * Handles requests for personalized learning paths and content recommendations
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handleGenerateLearningPath(req, res);
      case 'GET':
        return await handleGetRecommendations(req, res);
      case 'PUT':
        return await handleUpdateProgress(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Adaptive Learning API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Generate personalized learning path
 */
async function handleGenerateLearningPath(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, courseId, currentLevel, learningGoals } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({ 
      error: 'Missing required fields: userId, courseId' 
    });
  }

  try {
    // Call backend adaptive learning service
    const response = await fetch(`${process.env.API_BASE_URL}/ai/adaptive-learning/generate-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        userId,
        courseId,
        currentLevel,
        learningGoals,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const learningPathData = await response.json();
    return res.status(200).json(learningPathData);
  } catch (error) {
    console.error('Generate learning path error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get content recommendations
 */
async function handleGetRecommendations(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, courseId, contentType, limit = 5 } = req.query;

  if (!userId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: userId' 
    });
  }

  try {
    // Call backend adaptive learning service
    const queryParams = new URLSearchParams({
      userId: userId as string,
      ...(courseId && { courseId: courseId as string }),
      ...(contentType && { contentType: contentType as string }),
      limit: limit as string,
    });

    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/adaptive-learning/recommendations?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const recommendationsData = await response.json();
    return res.status(200).json(recommendationsData);
  } catch (error) {
    console.error('Get recommendations error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve recommendations',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update learning progress
 */
async function handleUpdateProgress(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, courseId, moduleId, progressData } = req.body;

  if (!userId || !progressData) {
    return res.status(400).json({ 
      error: 'Missing required fields: userId, progressData' 
    });
  }

  try {
    // Call backend adaptive learning service
    const response = await fetch(`${process.env.API_BASE_URL}/ai/adaptive-learning/update-progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        userId,
        courseId,
        moduleId,
        progressData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const updateResult = await response.json();
    return res.status(200).json(updateResult);
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ 
      error: 'Failed to update learning progress',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}