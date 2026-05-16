import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/api';
import NotificationCard from '../components/NotificationCard';
import {
  Typography, Box, CircularProgress, Alert, Stack,
  Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import { StarRate, TrendingUp } from '@mui/icons-material';

// Priority weights — Placement is most important
const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

const PriorityInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState(10);

  useEffect(() => {
    const loadAndSort = async () => {
      setLoading(true);
      try {
        // Fetch all notifications (no pagination limit)
        const result = await fetchNotifications({});
        const all = result.notifications || [];

        // Sort by weight (desc) then by timestamp (desc for recency)
        const sorted = [...all].sort((a, b) => {
          const wDiff = (WEIGHTS[b.Type] || 0) - (WEIGHTS[a.Type] || 0);
          if (wDiff !== 0) return wDiff;
          return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
        });

        setNotifications(sorted.slice(0, topN));
      } catch (err) {
        console.error('Failed to load priority notifications:', err);
      }
      setLoading(false);
    };
    loadAndSort();
  }, [topN]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2, mb: 3,
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'linear-gradient(135deg, #ffd700, #ff9800)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StarRate sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              Priority Inbox
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#888', ml: 6 }}>
            Top notifications ranked by importance and recency
          </Typography>
        </Box>

        {/* Top N selector */}
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Show Top</InputLabel>
          <Select
            value={topN}
            label="Show Top"
            onChange={(e) => setTopN(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,215,0,0.2)' },
            }}
          >
            <MenuItem value={5}>Top 5</MenuItem>
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Priority weight legend */}
      <Alert
        icon={<TrendingUp sx={{ color: '#b388ff' }} />}
        sx={{
          mb: 3, backgroundColor: 'rgba(124,77,255,0.05)',
          border: '1px solid rgba(124,77,255,0.12)',
          '& .MuiAlert-message': { display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' },
        }}
      >
        <Typography variant="caption" sx={{ color: '#aaa', mr: 0.5 }}>Weight:</Typography>
        <Chip label="Placement (3)" size="small" sx={{ backgroundColor: 'rgba(76,175,80,0.12)', color: '#4caf50', fontSize: '0.7rem', height: 20 }} />
        <Chip label="Result (2)" size="small" sx={{ backgroundColor: 'rgba(33,150,243,0.12)', color: '#2196f3', fontSize: '0.7rem', height: 20 }} />
        <Chip label="Event (1)" size="small" sx={{ backgroundColor: 'rgba(255,152,0,0.12)', color: '#ff9800', fontSize: '0.7rem', height: 20 }} />
      </Alert>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#ffd700' }} />
        </Box>
      ) : (
        <Stack spacing={0}>
          {notifications.map((notif, i) => (
            <Box key={notif.ID} className="fade-in-up" sx={{ animationDelay: `${i * 0.05}s` }}>
              <NotificationCard
                notification={notif}
                isRead={false}
                showRank
                rank={i + 1}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default PriorityInbox;
