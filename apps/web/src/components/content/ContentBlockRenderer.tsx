// apps/web/src/components/content/ContentBlockRenderer.tsx
import React from 'react';
import { ContentBlock, ContentBlockType } from '@repo/core/src/types/pensum.types';
import { Box, Typography, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface ContentBlockRendererProps {
  contentBlock: ContentBlock;
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ contentBlock }) => {
  const theme = useTheme();

  const renderContent = () => {
    switch (contentBlock.type) {
      case ContentBlockType.TEXT:
        return (
          <Box sx={{ mb: 3 }}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {contentBlock.content}
            </ReactMarkdown>
          </Box>
        );
      
      case ContentBlockType.IMAGE_URL:
        return (
          <Box 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Box
              component="img"
              src={contentBlock.content}
              alt="Lesson image"
              sx={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                boxShadow: theme.shadows[2],
              }}
            />
          </Box>
        );
      
      case ContentBlockType.VIDEO_URL:
        // Extract video ID from YouTube or Vimeo URL
        const getVideoEmbedUrl = (url: string) => {
          // YouTube URL patterns
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const youtubeMatch = url.match(youtubeRegex);
          
          if (youtubeMatch && youtubeMatch[1]) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
          }
          
          // Vimeo URL patterns
          const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
          const vimeoMatch = url.match(vimeoRegex);
          
          if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }
          
          // If no match found, return the original URL
          return url;
        };
        
        const embedUrl = getVideoEmbedUrl(contentBlock.content);
        
        return (
          <Box 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%', // 16:9 aspect ratio
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: theme.shadows[2],
              }}
            >
              <Box
                component="iframe"
                src={embedUrl}
                title="Embedded video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </Box>
          </Box>
        );
      
      case ContentBlockType.QUIZ_REF:
        // This will be handled separately in the lesson page
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Quiz reference: {contentBlock.content}
            </Typography>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="error">
              Unknown content type: {contentBlock.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {renderContent()}
    </Box>
  );
};

export default ContentBlockRenderer;