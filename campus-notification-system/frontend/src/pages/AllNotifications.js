import React, { useState, useEffect, useCallback } from 'react';
import { fetchNotifications } from '../api/api';
import NotificationCard from '../components/NotificationCard';
import {
  Typography, Box, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Pagination, Stack, Chip, Button
} from '@mui/material';
import { Notifications, FilterList, DoneAll, Inbox } from '@mui/icons-material';

const TYPE_COLORS = { Placement: '#34A853', Result: '#1A73E8', Event: '#F9AB00' };

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('viewedNotifications') || '[]');
    } catch { return []; }
  });

  const LIMIT = 5;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: LIMIT, page };
      if (typeFilter) params.notification_type = typeFilter;
      const result = await fetchNotifications(params);
      setNotifications(result.notifications);
      setTotalPages(result.totalPages || 1);
      setTotalRecords(result.total || 0);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
    }
    setLoading(false);
  }, [typeFilter, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsViewed = (id) => {
    if (!viewedIds.includes(id)) {
      const updated = [...viewedIds, id];
      setViewedIds(updated);
      localStorage.setItem('viewedNotifications', JSON.stringify(updated));
    }
  };

  const markAllViewed = () => {
    const allIds = notifications.map(n => n.id);
    const merged = [...new Set([...viewedIds, ...allIds])];
    setViewedIds(merged);
    localStorage.setItem('viewedNotifications', JSON.stringify(merged));
  };

  const unreadCount = notifications.filter(n => !viewedIds.includes(n.id)).length;

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
              background: '#E8F0FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Notifications sx={{ color: '#1A73E8', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#202124', fontWeight: 800 }}>
              All Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} NEW`} size="small" sx={{
                background: '#EA4335', color: '#FFF',
                fontWeight: 800, fontSize: '0.7rem', height: 24,
                boxShadow: '0 2px 8px rgba(234,67,53,0.3)',
                letterSpacing: '0.05em'
              }} />
            )}
          </Box>
          <Typography variant="body1" sx={{ color: '#5F6368', ml: 7.5, fontWeight: 500 }}>
            {totalRecords > 0 ? `${totalRecords} updates total` : 'Stay updated'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Button
              size="medium"
              startIcon={<DoneAll />}
              onClick={markAllViewed}
              sx={{
                color: '#1A73E8', background: '#E8F0FE',
                borderRadius: '8px', px: 2, py: 1,
                fontSize: '0.9rem', fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { background: '#D2E3FC', boxShadow: 'none' },
              }}
            >
              Mark all read
            </Button>
          )}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: '#5F6368', fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FilterList sx={{ fontSize: 18 }} /> Type Filter
              </Box>
            </InputLabel>
            <Select
              value={typeFilter}
              label="Type Filter"
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              sx={{
                background: '#FFF',
                fontWeight: 700,
                color: typeFilter ? TYPE_COLORS[typeFilter] : '#202124',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DADCE0', borderWidth: '2px' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1A73E8' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1A73E8' },
              }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Types</MenuItem>
              <MenuItem value="Placement" sx={{ color: '#34A853', fontWeight: 700 }}>Placement</MenuItem>
              <MenuItem value="Result" sx={{ color: '#1A73E8', fontWeight: 700 }}>Result</MenuItem>
              <MenuItem value="Event" sx={{ color: '#F9AB00', fontWeight: 700 }}>Event</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
          <CircularProgress sx={{ color: '#1A73E8' }} size={48} thickness={4} />
          <Typography variant="body1" sx={{ color: '#5F6368', fontWeight: 600 }}>Loading notifications...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{
          textAlign: 'center', py: 8, borderRadius: '16px',
          background: '#FCE8E6', border: '1px solid #FAD2CF',
        }}>
          <Typography variant="h6" sx={{ color: '#EA4335', fontWeight: 700, mb: 1 }}>Failed to load</Typography>
          <Typography variant="body1" sx={{ color: '#C5221F' }}>{error}</Typography>
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12, background: '#FFF', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Inbox sx={{ fontSize: 64, color: '#DADCE0', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#202124', fontWeight: 700 }}>No notifications found</Typography>
          <Typography variant="body1" sx={{ color: '#5F6368', mt: 1, fontWeight: 500 }}>
            {typeFilter ? 'Try removing the filter to see more.' : "You're all caught up!"}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0}>
          {notifications.map((notif, i) => (
            <Box key={notif.id} className="fade-in-up" sx={{ animationDelay: `${i * 0.05}s` }}>
              <NotificationCard
                notification={notif}
                isRead={viewedIds.includes(notif.id)}
                onMarkRead={markAsViewed}
              />
            </Box>
          ))}
        </Stack>
      )}

      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            shape="rounded"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#5F6368', fontWeight: 700, fontSize: '1.05rem',
                '&.Mui-selected': {
                  background: '#1A73E8',
                  color: '#FFF',
                  '&:hover': { background: '#1557B0' }
                },
                '&:hover': { background: '#E8F0FE', color: '#1A73E8' },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AllNotifications;
