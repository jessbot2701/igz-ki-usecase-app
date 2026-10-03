import { Box } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

/** Decorative motif shared by the idea form and its thank-you moment. */
export function IdeaSpark({ celebrate = false }: { celebrate?: boolean }) {
  return (
    <Box aria-hidden="true" sx={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 9,
          borderRadius: '50%',
          border: '1px solid rgba(137,221,255,.25)',
          transform: 'rotate(-24deg) scaleY(.8)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px dashed rgba(137,221,255,.25)',
          transform: 'rotate(32deg) scaleY(.8)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 32,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '28px',
          color: '#fff',
          background: 'linear-gradient(145deg, #408bbe, #32658c 50%, #498f83)',
          border: '1px solid rgba(180,237,255,.55)',
          boxShadow: '0 0 44px rgba(93,213,225,.23)',
          transform: 'rotate(-8deg)',
          ...(celebrate ? { animation: 'idea-bloom 850ms ease-out both' } : {}),
          '@keyframes idea-bloom': {
            from: { opacity: 0, transform: 'scale(.7) rotate(-18deg)' },
            to: { opacity: 1, transform: 'scale(1) rotate(-8deg)' }
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
        }}
      >
        <AutoAwesomeOutlinedIcon sx={{ fontSize: 42, transform: 'rotate(8deg)' }} />
      </Box>
      {[
        { top: 16, left: 34, color: '#9cecc2' },
        { top: 105, left: 122, color: '#99d7ff' },
        { top: 123, left: 28, color: '#b5b8ff' }
      ].map((dot, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            top: dot.top,
            left: dot.left,
            bgcolor: dot.color,
            boxShadow: `0 0 16px ${dot.color}`,
            ...(celebrate ? { animation: `idea-dot 1.2s ${index * 100}ms ease-out both` } : {}),
            '@keyframes idea-dot': {
              from: { opacity: 0, transform: 'scale(0)' },
              to: { opacity: 1, transform: 'scale(1)' }
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
      ))}
    </Box>
  );
}
