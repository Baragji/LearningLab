import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

/**
 * Learning Analytics API Route
 * Handles requests for learning analytics data and insights
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
      case 'GET':
        return await handleGetAnalytics(req, res);
      case 'POST':
        return await handleGenerateReport(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Learning Analytics API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get learning analytics data
 */
async function handleGetAnalytics(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { 
    userId, 
    courseId, 
    timeframe = '30d', 
    metrics = 'all',
    includeComparisons = 'false'
  } = req.query;

  if (!userId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: userId' 
    });
  }

  try {
    // Call backend learning analytics service
    const queryParams = new URLSearchParams({
      userId: userId as string,
      timeframe: timeframe as string,
      metrics: metrics as string,
      includeComparisons: includeComparisons as string,
      ...(courseId && { courseId: courseId as string }),
    });

    const response = await fetch(
      `${process.env.API_BASE_URL}/ai/analytics/dashboard?${queryParams}`,
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

    const analyticsData = await response.json();
    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve analytics data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Generate detailed analytics report
 */
async function handleGenerateReport(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { 
    userId, 
    courseId, 
    reportType, 
    dateRange, 
    includeRecommendations = true 
  } = req.body;

  if (!userId || !reportType) {
    return res.status(400).json({ 
      error: 'Missing required fields: userId, reportType' 
    });
  }

  try {
    // Call backend learning analytics service
    const response = await fetch(`${process.env.API_BASE_URL}/ai/analytics/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        userId,
        courseId,
        reportType,
        dateRange,
        includeRecommendations,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const reportData = await response.json();
    return res.status(200).json(reportData);
  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate analytics report',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}