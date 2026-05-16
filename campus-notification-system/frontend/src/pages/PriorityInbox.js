import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/api';
import NotificationCard from '../components/NotificationCard';
import {
  Typography, Box, CircularProgress, Stack,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { StarRate, TrendingUp, WorkOutlined, School, EmojiEvents } from '@mui/icons-material';

const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

const PriorityInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState(10);

  useEffect(() => {
    const loadAndSort = async () => {
      setLoading(true);
      try {
        const result = await fetchNotifications({});
        const all = result.notifications || [];

        const sorted = [...all].sort((a, b) => {
          const wDiff = (WEIGHTS[b.type] || 0) - (WEIGHTS[a.type] || 0);
          if (wDiff !== 0) return wDiff;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setNotifications(sorted.slice(0, topN));
      } catch (err) {
        console.error('Failed to load priority notifications:', err);
      }
      setLoading(false);
    };
    loadAndSort();
  }, [topN]);

  const weightItems = [
    { label: 'Placement', weight: 3, color: '#34A853', icon: <WorkOutlined sx={{ fontSize: 20 }} /> },
    { label: 'Result', weight: 2, color: '#1A73E8', icon: <School sx={{ fontSize: 20 }} /> },
    { label: 'Event', weight: 1, color: '#F9AB00', icon: <EmojiEvents sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box>
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 3, mb: 4,
        background: '#FFFFFF',
        p: 3,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.04)'
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              width: 46, height: 46, borderRadius: '12px',
              background: '#FFF8E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StarRate sx={{ color: '#F9AB00', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#202124', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Priority Inbox
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#5F6368', ml: 7.5, fontWeight: 500 }}>
            Smart ranked by importance × recency
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: '#5F6368', fontWeight: 600 }}>Show Top</InputLabel>
          <Select
            value={topN}
            label="Show Top"
            onChange={(e) => setTopN(e.target.value)}
            sx={{
              background: '#FFF',
              fontWeight: 700,
              color: '#202124',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DADCE0', borderWidth: '2px' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#F9AB00' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#F9AB00' },
            }}
          >
            <MenuItem value={5} sx={{ fontWeight: 600 }}>Top 5</MenuItem>
            <MenuItem value={10} sx={{ fontWeight: 600 }}>Top 10</MenuItem>
            <MenuItem value={15} sx={{ fontWeight: 600 }}>Top 15</MenuItem>
            <MenuItem value={20} sx={{ fontWeight: 600 }}>Top 20</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 3, mb: 4,
        p: '16px 24px', borderRadius: '12px',
        background: '#FFF',
        border: '1px solid #E8EAED',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ color: '#1A73E8', fontSize: 24 }} />
          <Typography variant="subtitle1" sx={{ color: '#5F6368', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Weights
          </Typography>
        </Box>
        <Box sx={{ width: 2, height: 28, background: '#E8EAED', mx: 1 }} />
        {weightItems.map(({ label, weight, color, icon }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: `${color}10`, px: 2, py: 0.8, borderRadius: 2 }}>
            <Box sx={{ color }}>{icon}</Box>
            <Typography variant="body1" sx={{ color, fontWeight: 800 }}>
              {label}
            </Typography>
            <Box sx={{
              width: 26, height: 26, borderRadius: '50%',
              background: color, color: '#FFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800 }}>{weight}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
          <CircularProgress sx={{ color: '#F9AB00' }} size={48} thickness={4} />
          <Typography variant="body1" sx={{ color: '#5F6368', fontWeight: 600 }}>Analyzing priority...</Typography>
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12, background: '#FFF', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <StarRate sx={{ fontSize: 64, color: '#DADCE0', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#202124', fontWeight: 700 }}>Inbox Zero</Typography>
          <Typography variant="body1" sx={{ color: '#5F6368', mt: 1, fontWeight: 500 }}>No priority notifications right now.</Typography>
        </Box>
      ) : (
        <Stack spacing={0}>
          {notifications.map((notif, i) => (
            <Box key={notif.id} className="fade-in-up" sx={{ animationDelay: `${i * 0.05}s` }}>
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
