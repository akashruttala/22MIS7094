import React from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, Tooltip } from '@mui/material';
import { CheckCircleOutlined, MarkEmailRead, FiberNew, WorkOutlined, School, EmojiEvents } from '@mui/icons-material';

// Color + icon config for each notification type
const TYPE_STYLES = {
  Placement: { color: '#4caf50', bg: 'rgba(76,175,80,0.08)', icon: <WorkOutlined fontSize="small" /> },
  Result:    { color: '#2196f3', bg: 'rgba(33,150,243,0.08)', icon: <School fontSize="small" /> },
  Event:     { color: '#ff9800', bg: 'rgba(255,152,0,0.08)',  icon: <EmojiEvents fontSize="small" /> },
};

const NotificationCard = ({ notification, isRead, onMarkRead, showRank, rank }) => {
  const style = TYPE_STYLES[notification.Type] || TYPE_STYLES.Event;

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Card
      onClick={() => !isRead && onMarkRead && onMarkRead(notification.ID)}
      sx={{
        cursor: onMarkRead && !isRead ? 'pointer' : 'default',
        mb: 1.5,
        borderLeft: `4px solid ${isRead ? '#444' : style.color}`,
        backgroundColor: isRead ? 'rgba(255,255,255,0.02)' : style.bg,
        opacity: isRead ? 0.6 : 1,
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: onMarkRead ? 'translateX(4px)' : 'none',
          opacity: 1,
          boxShadow: `0 2px 12px ${style.color}15`,
        },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important', px: { xs: 1.5, sm: 2.5 } }}>
        {/* Rank badge (for priority inbox) */}
        {showRank && (
          <Box sx={{
            minWidth: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${rank <= 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][rank - 1] : '#555'}`,
            flexShrink: 0,
          }}>
            <Typography sx={{
              fontWeight: 700, fontSize: '0.8rem',
              color: rank <= 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][rank - 1] : '#888',
            }}>
              {rank}
            </Typography>
          </Box>
        )}

        {/* Type icon */}
        <Box sx={{
          width: 36, height: 36, borderRadius: '8px',
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${style.color}18`, color: style.color, flexShrink: 0,
        }}>
          {style.icon}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3, flexWrap: 'wrap' }}>
            <Chip label={notification.Type} size="small" sx={{
              backgroundColor: `${style.color}20`, color: style.color,
              fontWeight: 600, fontSize: '0.7rem', height: 20,
            }} />
            {!isRead && (
              <Chip icon={<FiberNew sx={{ fontSize: '13px !important' }} />} label="New" size="small" sx={{
                backgroundColor: 'rgba(244,67,54,0.12)', color: '#f44336',
                fontWeight: 600, fontSize: '0.65rem', height: 20,
                '& .MuiChip-icon': { color: '#f44336' },
              }} />
            )}
          </Box>
          <Typography variant="body2" sx={{
            fontWeight: isRead ? 400 : 600, color: isRead ? '#999' : '#e0e0e0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {notification.Message}
          </Typography>
        </Box>

        {/* Right side: time + mark read */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: '#666', display: { xs: 'none', sm: 'block' } }}>
            {formatTime(notification.Timestamp)}
          </Typography>
          {onMarkRead && (
            isRead ? (
              <MarkEmailRead sx={{ color: '#555', fontSize: 18 }} />
            ) : (
              <Tooltip title="Mark as read">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMarkRead(notification.ID); }}
                  sx={{ color: style.color, '&:hover': { backgroundColor: `${style.color}15` } }}>
                  <CheckCircleOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
