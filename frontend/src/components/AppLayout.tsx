import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import ListAltIcon from '@mui/icons-material/ListAltOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import TimelineIcon from '@mui/icons-material/TimelineOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { Role, ROLE_LABELS } from '../types';
import { roleColors } from '../theme/theme';

const DRAWER_WIDTH = 248;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Use Cases', path: '/use-cases', icon: <ListAltIcon /> }
];

const ADMIN_NAV_ITEMS: { label: string; path: string; icon: JSX.Element; roles: Role[] }[] = [
  { label: 'Benutzer', path: '/admin/users', icon: <PeopleIcon />, roles: [Role.ADMINISTRATOR] },
  {
    label: 'Aktivitätsprotokoll',
    path: '/admin/activity',
    icon: <TimelineIcon />,
    roles: [Role.ADMINISTRATOR, Role.AI_CORE_TEAM]
  }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const runGlobalSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/use-cases?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <AutoAwesomeIcon />
          <Typography variant="h6" noWrap sx={{ mr: 2 }}>
            IGZ AI Use Case Portal
          </Typography>
          <TextField
            size="small"
            placeholder="Use Case suchen…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runGlobalSearch();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.8)' }} />
                </InputAdornment>
              )
            }}
            sx={{
              flexGrow: 1,
              maxWidth: 360,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 }
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={mode === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}>
            <IconButton onClick={toggleMode} size="small" sx={{ color: '#fff' }}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          {user && (
            <Chip
              label={`${user.name} · ${ROLE_LABELS[user.role]}`}
              size="small"
              sx={{
                bgcolor: roleColors[user.role],
                color: '#fff',
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' }
              }}
            />
          )}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: user ? roleColors[user.role] : 'secondary.main' }}>
              {user?.name?.charAt(0) ?? '?'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              {user?.name} · {user ? ROLE_LABELS[user.role] : ''}
            </MenuItem>
            <MenuItem
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Abmelden
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 'none' }
        }}
      >
        <Toolbar />
        <List sx={{ px: 1, pt: 2 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          {ADMIN_NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)).map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
