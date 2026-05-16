import React, { useState, useEffect, useCallback } from 'react';
import { fetchNotifications } from '../api/api';
import NotificationCard from '../components/NotificationCard';
import {
  Typography, Box, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Pagination, Chip, Stack, Alert
} from '@mui/material';
import { Notifications, FilterList } from '@mui/icons-material';

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
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

  // Stats from current data
  const unreadCount = notifications.filter(n => !viewedIds.includes(n.ID)).length;

  return (
    <Box>
      {/* Page header */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2, mb: 3,
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Notifications sx={{ color: '#7c4dff', fontSize: 28 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              All Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" sx={{
                backgroundColor: 'rgba(244,67,54,0.15)', color: '#f44336',
                fontWeight: 600, fontSize: '0.7rem', height: 22,
              }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#888', ml: 5.5 }}>
            Click a notification to mark it as viewed
          </Typography>
        </Box>

        {/* Filter dropdown */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="type-filter-label">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FilterList sx={{ fontSize: 16 }} /> Type
            </Box>
          </InputLabel>
          <Select
            labelId="type-filter-label"
            value={typeFilter}
            label="Type"
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,77,255,0.2)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,77,255,0.4)' },
            }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Active filter chip */}
      {typeFilter && (
        <Alert severity="info" onClose={() => setTypeFilter('')} sx={{
          mb: 2, backgroundColor: 'rgba(33,150,243,0.06)',
          border: '1px solid rgba(33,150,243,0.15)',
          '& .MuiAlert-icon': { color: '#2196f3' },
        }}>
          Showing <strong>{typeFilter}</strong> notifications only
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7c4dff' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: '#555', mb: 1 }}>No notifications found</Typography>
          <Typography variant="body2" sx={{ color: '#444' }}>Try removing the filter</Typography>
        </Box>
      ) : (
        <Stack spacing={0}>
          {notifications.map((notif, i) => (
            <Box key={notif.ID} className="fade-in-up" sx={{ animationDelay: `${i * 0.06}s` }}>
              <NotificationCard
                notification={notif}
                isRead={viewedIds.includes(notif.ID)}
                onMarkRead={markAsViewed}
              />
            </Box>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#999',
                '&.Mui-selected': { backgroundColor: '#7c4dff', color: '#fff' },
                '&:hover': { backgroundColor: 'rgba(124,77,255,0.12)' },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AllNotifications;
