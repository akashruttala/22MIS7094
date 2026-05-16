import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, CssBaseline,
  ThemeProvider, createTheme, Box, Fade
} from '@mui/material';
import { Notifications, StarRate } from '@mui/icons-material';
import AllNotifications from './pages/AllNotifications';
import PriorityInbox from './pages/PriorityInbox';

// Dark theme with purple accent
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c4dff' },
    secondary: { main: '#ff9800' },
    background: { default: '#0d1117', paper: '#161b22' },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h5: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
  },
});

// Nav link that highlights the active page
function NavLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Button
      component={Link}
      to={to}
      startIcon={icon}
      size="small"
      sx={{
        color: isActive ? '#b388ff' : 'rgba(255,255,255,0.6)',
        borderBottom: isActive ? '2px solid #7c4dff' : '2px solid transparent',
        borderRadius: 0, px: 2, py: 1.2,
        '&:hover': { color: '#fff', backgroundColor: 'rgba(124,77,255,0.08)' },
      }}
    >
      {label}
    </Button>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Subtle background gradient */}
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 15% 0%, rgba(124,77,255,0.08) 0%, transparent 50%)',
        }} />

        <AppBar position="sticky" elevation={0} sx={{
          background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c4dff, #ff9800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Notifications sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.15rem' },
                background: 'linear-gradient(90deg, #b388ff, #ffb74d)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                CampusNotify
              </Typography>
            </Box>

            {/* Navigation */}
            <Box sx={{ display: 'flex' }}>
              <NavLink to="/" icon={<Notifications fontSize="small" />} label="All" />
              <NavLink to="/priority" icon={<StarRate fontSize="small" />} label="Priority" />
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4, mb: 6, position: 'relative', zIndex: 1 }}>
          <Fade in timeout={400}>
            <Box>
              <Routes>
                <Route path="/" element={<AllNotifications />} />
                <Route path="/priority" element={<PriorityInbox />} />
              </Routes>
            </Box>
          </Fade>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
