import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/api';
import { 
  Card, CardContent, Typography, Chip, Box, Select, MenuItem, 
  FormControl, InputLabel, CircularProgress, IconButton, Pagination
} from '@mui/material';
import { CheckCircleOutlined as CheckCircleOutlineIcon } from '@mui/icons-material';

const TYPE_COLORS = {
  'Placement': 'success',
  'Result': 'primary',
  'Event': 'secondary'
};

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = { limit, page };
        if (typeFilter) params.notification_type = typeFilter;
        const data = await fetchNotifications(params);
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, [typeFilter, page]);

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">All Notifications</Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={typeFilter}
            label="Filter by Type"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Box>
          {notifications.length === 0 ? (
            <Typography>No notifications found.</Typography>
          ) : (
            notifications.map(notif => {
              const isRead = readIds.includes(notif.ID);
              return (
                <Card 
                  key={notif.ID} 
                  sx={{ 
                    mb: 2, 
                    backgroundColor: isRead ? '#fafafa' : '#fff',
                    borderLeft: isRead ? '4px solid #ccc' : `4px solid #1976d2`
                  }}
                  onClick={() => markAsRead(notif.ID)}
                >
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={notif.Type} 
                          color={TYPE_COLORS[notif.Type] || 'default'} 
                          size="small" 
                          sx={{ mr: 1 }} 
                        />
                        {!isRead && <Chip label="New" color="error" size="small" />}
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: isRead ? 'normal' : 'bold' }}>
                        {notif.Message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notif.Timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {isRead ? (
                      <CheckCircleOutlineIcon color="disabled" />
                    ) : (
                      <IconButton onClick={(e) => { e.stopPropagation(); markAsRead(notif.ID); }}>
                        <CheckCircleOutlineIcon color="primary" />
                      </IconButton>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={3} // Hardcoded for demo since we only have 10 items in mockup
              page={page} 
              onChange={(e, val) => setPage(val)} 
              color="primary" 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AllNotifications;
