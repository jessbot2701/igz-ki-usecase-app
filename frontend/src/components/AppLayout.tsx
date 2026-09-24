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
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { Role, ROLE_LABELS } from '../types';
import { BRAND_BLUE, BRAND_GREEN, BRAND_NAVY, roleColors } from '../theme/theme';
import igzLogo from '../assets/igz-logo.jpg';

const DRAWER_WIDTH = 248;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Use Cases', path: '/use-cases', icon: <ListAltIcon /> }
];

const ADMIN_NAV_ITEMS: { label: string; path: string; icon: JSX.Element; roles: Role[] }[] = [
  { label: 'Benutzer', path: '/admin/users', icon: <PeopleIcon />, roles: [Role.ADMINISTRATOR] },
  { label: 'Stammdaten', path: '/admin/master-data', icon: <SettingsIcon />, roles: [Role.ADMINISTRATOR] },
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
  const availableAdminItems = ADMIN_NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );
  const mobileNavItems = [...NAV_ITEMS, ...availableAdminItems];

  const runGlobalSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/use-cases?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, md: 72 } }}>
          <Box
            component="img"
            src={igzLogo}
            alt="IGZ – Die SAP Ingenieure"
            sx={{ display: { xs: 'block', md: 'none' }, width: 132, height: 'auto' }}
          />
          <Typography variant="h6" noWrap sx={{ mr: 2, display: { xs: 'none', lg: 'block' } }}>
            AI Use Case Portal
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
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
            sx={{
              flexGrow: 1,
              maxWidth: 380,
              display: { xs: 'none', sm: 'flex' },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default'
              }
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={mode === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}>
            <IconButton onClick={toggleMode} size="small" color="inherit">
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
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: user ? roleColors[user.role] : 'secondary.main'
              }}
            >
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
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 'none',
            bgcolor: BRAND_NAVY,
            color: '#FFFFFF'
          }
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: 2.5 }}>
          <Box
            component="img"
            src={igzLogo}
            alt="IGZ – Die SAP Ingenieure"
            sx={{ width: '100%', height: 'auto', borderRadius: 0.5 }}
          />
        </Toolbar>
        <Typography
          variant="overline"
          sx={{
            color: '#7FA0B7',
            px: 3,
            pt: 3,
            pb: 1,
            fontSize: '0.66rem',
            letterSpacing: '0.12em'
          }}
        >
          Use Case Management
        </Typography>
        <List sx={{ px: 1.5 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: '#B7C9D6',
                borderRadius: 1.5,
                mb: 0.5,
                minHeight: 48,
                '& .MuiListItemIcon-root': { color: '#93ADBE', minWidth: 42 },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' },
                '&.Mui-selected': {
                  bgcolor: BRAND_BLUE,
                  color: '#fff',
                  boxShadow: `inset 3px 0 ${BRAND_GREEN}`,
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { bgcolor: BRAND_BLUE }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          {availableAdminItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: '#B7C9D6',
                borderRadius: 1.5,
                mb: 0.5,
                minHeight: 48,
                '& .MuiListItemIcon-root': { color: '#93ADBE', minWidth: 42 },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' },
                '&.Mui-selected': {
                  bgcolor: BRAND_BLUE,
                  color: '#fff',
                  boxShadow: `inset 3px 0 ${BRAND_GREEN}`,
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { bgcolor: BRAND_BLUE }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          pb: { xs: 9, md: 0 }
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
        <Box sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1500, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
      <Box
        component="nav"
        aria-label="Mobile Navigation"
        sx={{
          display: { xs: 'grid', md: 'none' },
          gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))`,
          position: 'fixed',
          zIndex: (t) => t.zIndex.appBar,
          inset: 'auto 0 0',
          minHeight: 66,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          boxShadow: '0 -9px 25px rgba(16,45,65,0.08)'
        }}
      >
        {mobileNavItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => navigate(item.path)}
              sx={{
                minWidth: 0,
                py: 0.75,
                px: 0.5,
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.25,
                color: selected ? 'primary.main' : 'text.secondary',
                '&.Mui-selected': { bgcolor: 'rgba(31,78,121,0.06)' }
              }}
            >
              <Box sx={{ display: 'flex', '& svg': { fontSize: 21 } }}>{item.icon}</Box>
              <Typography
                variant="caption"
                noWrap
                sx={{ maxWidth: '100%', fontSize: '0.62rem', fontWeight: 700 }}
              >
                {item.label}
              </Typography>
            </ListItemButton>
          );
        })}
      </Box>
    </Box>
  );
}
