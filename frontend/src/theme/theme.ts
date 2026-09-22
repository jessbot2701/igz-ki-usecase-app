import { createTheme, SxProps, Theme } from '@mui/material/styles';
import { Role, UseCaseStatus } from '../types';

export type ThemeMode = 'light' | 'dark';

// Central design tokens — swapping the visual identity (colors, illustrations, etc.)
// later only requires editing this file, never the feature components.
export const statusColors: Record<UseCaseStatus, string> = {
  DRAFT: '#617486',
  SUBMITTED: '#29668D',
  IN_REVIEW: '#74569A',
  NEED_MORE_INFO: '#9E6420',
  ON_HOLD: '#7A6555',
  APPROVED: '#24834D',
  PILOT: '#207F7F',
  IMPLEMENTED: '#24834D',
  ARCHIVED: '#617486',
  REJECTED: '#BB3F48'
};

export const roleColors: Record<Role, string> = {
  EMPLOYEE: '#546E7A',
  AI_CHAMPION: '#7C4DFF',
  AI_CORE_TEAM: '#00897B',
  ADMINISTRATOR: '#EF6C00'
};

const PRIMARY = { main: '#1F4E79', light: '#29668D', dark: '#09243A' };
const ACCENT = '#43A85E';

export const APP_BAR_GRADIENT = `linear-gradient(135deg, ${PRIMARY.dark} 0%, #123D63 68%, #1F4E79 100%)`;

export const dataGridSx: SxProps<Theme> = {
  border: 0,
  cursor: 'pointer',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'background.default',
    borderBottom: 1,
    borderColor: 'divider'
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    color: 'text.secondary',
    fontSize: '0.7rem',
    fontWeight: 800,
    letterSpacing: '0.065em',
    textTransform: 'uppercase'
  },
  '& .MuiDataGrid-row': {
    borderBottom: 1,
    borderColor: 'divider'
  },
  '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(31, 78, 121, 0.035)' },
  '& .MuiDataGrid-cell': { borderBottom: 0 },
  '& .MuiDataGrid-footerContainer': { borderTop: 1, borderColor: 'divider' }
};

export function getTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: PRIMARY,
      secondary: { main: ACCENT },
      warning: { main: '#DC7A31' },
      success: { main: '#24834D' },
      error: { main: '#BB3F48' },
      text: isDark
        ? { primary: '#F4F7F9', secondary: '#AFC0CC' }
        : { primary: '#173148', secondary: '#617486' },
      divider: isDark ? '#2D4960' : '#E2E8EC',
      background: isDark
        ? { default: '#071B2A', paper: '#102D41' }
        : { default: '#F5F7F8', paper: '#FFFFFF' }
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 800, letterSpacing: -0.8 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 }
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
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.26)'
              : '0 5px 18px rgba(17, 51, 76, 0.05)',
            border: `1px solid ${isDark ? '#2D4960' : 'rgba(23, 49, 72, 0.08)'}`,
            borderRadius: 15
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 700, borderRadius: 8 }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700, borderRadius: 20 }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            color: isDark ? '#FFFFFF' : '#173148',
            background: isDark ? '#102D41' : 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? '#2D4960' : '#E2E8EC'}`,
            boxShadow: 'none'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': { borderRadius: 8 }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 15 }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${isDark ? '#2D4960' : '#E2E8EC'}`, fontWeight: 700 }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { borderTop: `1px solid ${isDark ? '#2D4960' : '#E2E8EC'}` }
        }
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#102D41' : '#FFFFFF',
            border: `1px solid ${isDark ? '#2D4960' : '#E2E8EC'}`,
            borderRadius: 10,
            minHeight: 52
          },
          indicator: { height: 3, backgroundColor: ACCENT }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', minHeight: 52, fontWeight: 700 }
        }
      }
    }
  });
}
