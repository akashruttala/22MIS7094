import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/api';
import { 
  Card, CardContent, Typography, Chip, Box, CircularProgress, Alert
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

const WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

const PriorityInbox = () => {
  const [priorityNotifications, setPriorityNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPriority = async () => {
      setLoading(true);
      try {
        // Fetch all notifications (or a large batch) to sort them locally
        const data = await fetchNotifications(); 
        
        // Apply Stage 6 logic to find Top 10
        const sorted = data.sort((a, b) => {
          const wA = WEIGHTS[a.Type] || 0;
          const wB = WEIGHTS[b.Type] || 0;
          if (wA !== wB) return wB - wA; // Highest weight first
          return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime(); // Newest first
        });
        
        setPriorityNotifications(sorted.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadPriority();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StarIcon color="warning" sx={{ fontSize: 40, mr: 1 }} />
        <Typography variant="h4">Priority Inbox</Typography>
      </Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Displaying the Top 10 most important notifications (Placement &gt; Result &gt; Event).
      </Alert>

      {loading ? (
        <CircularProgress />
      ) : (
        <Box>
          {priorityNotifications.map((notif, index) => (
            <Card 
              key={notif.ID} 
              sx={{ 
                mb: 2, 
                borderLeft: '4px solid #ff9800',
                backgroundColor: '#fffcf5'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ minWidth: 40, fontWeight: 'bold', color: '#ff9800' }}>
                  #{index + 1}
                </Typography>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={notif.Type} size="small" sx={{ mr: 1, fontWeight: 'bold' }} />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {notif.Message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notif.Timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PriorityInbox;
