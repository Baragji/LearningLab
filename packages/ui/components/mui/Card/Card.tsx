// packages/ui/components/mui/Card/Card.tsx
import React from 'react';
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
  CardMedia,
} from '@mui/material';

export interface CardProps extends Omit<MuiCardProps, 'title'> {
  /**
   * Titel på kortet
   */
  title?: React.ReactNode;
  
  /**
   * Undertitel på kortet
   */
  subtitle?: React.ReactNode;
  
  /**
   * Handling i header (f.eks. en knap eller ikon)
   */
  headerAction?: React.ReactNode;
  
  /**
   * Medie-indhold (billede)
   */
  media?: {
    image: string;
    height?: number | string;
    alt?: string;
  };
  
  /**
   * Indhold til footer-sektionen
   */
  footer?: React.ReactNode;
  
  /**
   * Om der skal være padding i indholdet
   * @default false
   */
  noPadding?: boolean;
}

/**
 * Card-komponent til at vise indhold i et kort-layout
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    title,
    subtitle,
    headerAction,
    media,
    footer,
    children,
    noPadding = false,
    ...props
  }, ref) => {
    return (
      <MuiCard ref={ref} {...props}>
        {(title || subtitle || headerAction) && (
          <CardHeader
            title={typeof title === 'string' ? title : undefined}
            titleTypographyProps={typeof title !== 'string' && title ? { component: 'div' } : undefined}
            subheader={typeof subtitle === 'string' ? subtitle : undefined}
            subheaderTypographyProps={typeof subtitle !== 'string' && subtitle ? { component: 'div' } : undefined}
            action={headerAction}
          >
            {typeof title !== 'string' && title ? <div>{title}</div> : null}
            {typeof subtitle !== 'string' && subtitle ? <div>{subtitle}</div> : null}
          </CardHeader>
        )}
        {media && (
          <CardMedia
            component="img"
            height={media.height || 140}
            image={media.image}
            alt={media.alt || 'Card media'}
          />
        )}
        {children && (
          <CardContent sx={noPadding ? { padding: 0, '&:last-child': { paddingBottom: 0 } } : {}}>
            {children}
          </CardContent>
        )}
        {footer && <CardActions>{footer}</CardActions>}
      </MuiCard>
    );
  }
);

Card.displayName = 'Card';