import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, CssBaseline, ThemeProvider, createTheme, Box, Fade } from '@mui/material';
import { Notifications, StarRate } from '@mui/icons-material';
import AllNotifications from './pages/AllNotifications';
import PriorityInbox from './pages/PriorityInbox';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1A73E8' },
    secondary: { main: '#EA4335' },
    background: { default: '#F8F9FA', paper: '#FFFFFF' },
    text: { primary: '#202124', secondary: '#5F6368' }
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h5: { fontWeight: 800, color: '#202124' },
    h6: { fontWeight: 700, color: '#202124' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
});

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
        color: isActive ? '#1A73E8' : '#5F6368',
        borderBottom: isActive ? '3px solid #1A73E8' : '3px solid transparent',
        borderRadius: 0, px: 2.5, py: 1.5,
        fontSize: '0.95rem',
        fontWeight: isActive ? 800 : 600,
        transition: 'all 0.2s ease',
        '&:hover': {
          color: '#1A73E8',
          backgroundColor: 'rgba(26,115,232,0.05)',
        },
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
        <AppBar position="sticky" elevation={0} sx={{
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          color: '#202124'
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '68px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '10px',
                background: '#1A73E8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(26,115,232,0.3)',
              }}>
                <Notifications sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.35rem' },
                color: '#1A73E8',
                letterSpacing: '-0.02em',
              }}>
                CampusNotify
              </Typography>
            </Box>

            <Box sx={{ display: 'flex' }}>
              <NavLink to="/" icon={<Notifications fontSize="small" />} label="All" />
              <NavLink to="/priority" icon={<StarRate fontSize="small" />} label="Priority" />
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
          <Fade in timeout={500}>
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
