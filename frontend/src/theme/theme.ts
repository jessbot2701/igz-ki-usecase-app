import { createTheme, Theme } from '@mui/material/styles';
import { Role, UseCaseStatus } from '../types';

export type ThemeMode = 'light' | 'dark';

// Central design tokens — swapping the visual identity (colors, illustrations, etc.)
// later only requires editing this file, never the feature components.
export const statusColors: Record<UseCaseStatus, string> = {
  DRAFT: '#9E9E9E',
  SUBMITTED: '#42A5F5',
  IN_REVIEW: '#AB47BC',
  NEED_MORE_INFO: '#FFA726',
  ON_HOLD: '#8D6E63',
  APPROVED: '#26A69A',
  PILOT: '#7E57C2',
  IMPLEMENTED: '#66BB6A',
  ARCHIVED: '#78909C',
  REJECTED: '#EF5350'
};

export const roleColors: Record<Role, string> = {
  EMPLOYEE: '#546E7A',
  AI_CHAMPION: '#7C4DFF',
  AI_CORE_TEAM: '#00897B',
  ADMINISTRATOR: '#EF6C00'
};

const PRIMARY = { main: '#4338CA', light: '#6366F1', dark: '#312E81' };
const ACCENT = '#F59E0B';

export const APP_BAR_GRADIENT = `linear-gradient(120deg, ${PRIMARY.dark} 0%, ${PRIMARY.main} 55%, #6D28D9 100%)`;

export function getTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: PRIMARY,
      secondary: { main: '#0EA5A4' },
      warning: { main: ACCENT },
      success: { main: '#2E7D32' },
      error: { main: '#D32F2F' },
      background: isDark ? { default: '#0F1220', paper: '#171B2E' } : { default: '#F3F4FB', paper: '#FFFFFF' }
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.3 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? '0 2px 14px rgba(0, 0, 0, 0.45)' : '0 2px 12px rgba(20, 30, 70, 0.08)',
            borderRadius: 16
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: APP_BAR_GRADIENT, boxShadow: '0 2px 10px rgba(20, 12, 60, 0.25)' }
        }
      }
    }
  });
}
