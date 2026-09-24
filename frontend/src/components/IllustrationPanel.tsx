import { Box, SvgIconProps } from '@mui/material';
import { ReactElement } from 'react';
import { getIllustration, IllustrationKey } from '../assets/illustrations/manifest';

interface IllustrationPanelProps {
  illustrationKey: IllustrationKey;
  icon: ReactElement<SvgIconProps>;
  imageSrc?: string;
  gradient?: string;
  height?: number;
}

// Renders a generated illustration when available, otherwise a large icon on a
// gradient background — keeps every call site working before/after real assets exist.
export function IllustrationPanel({
  illustrationKey,
  icon,
  imageSrc,
  gradient = 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
  height = 120
}: IllustrationPanelProps) {
  const imageUrl = imageSrc ?? getIllustration(illustrationKey);

  return (
    <Box
      sx={{
        height,
        borderRadius: 3,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: imageUrl ? undefined : gradient,
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {!imageUrl && (
        <Box sx={{ color: 'rgba(255,255,255,0.9)', fontSize: height * 0.4 }}>
          {icon}
        </Box>
      )}
    </Box>
  );
}
