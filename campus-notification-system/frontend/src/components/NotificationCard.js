import React from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, Tooltip } from '@mui/material';
import { CheckCircleOutlined, MarkEmailRead, FiberNew, WorkOutlined, School, EmojiEvents } from '@mui/icons-material';

const TYPE_STYLES = {
  Placement: { color: '#34A853', bg: 'rgba(52,168,83,0.1)', icon: <WorkOutlined fontSize="small" /> },
  Result:    { color: '#1A73E8', bg: 'rgba(26,115,232,0.1)', icon: <School fontSize="small" /> },
  Event:     { color: '#F9AB00', bg: 'rgba(249,171,0,0.15)',  icon: <EmojiEvents fontSize="small" /> },
};

const NotificationCard = ({ notification, isRead, onMarkRead, showRank, rank }) => {
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.Event;

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
      onClick={() => !isRead && onMarkRead && onMarkRead(notification.id)}
      sx={{
        cursor: onMarkRead && !isRead ? 'pointer' : 'default',
        mb: 2,
        borderLeft: `5px solid ${isRead ? '#E8EAED' : style.color}`,
        background: isRead ? '#F8F9FA' : '#FFFFFF',
        opacity: isRead ? 0.75 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isRead ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
        '&:hover': {
          transform: onMarkRead ? 'translateY(-2px)' : 'none',
          opacity: 1,
          boxShadow: onMarkRead ? `0 8px 24px rgba(0,0,0,0.06)` : (isRead ? 'none' : '0 2px 10px rgba(0,0,0,0.04)'),
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '18px !important', px: { xs: 2, sm: 3 } }}>
        {showRank && (
          <Box sx={{
            minWidth: 42, height: 42, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: rank <= 3
              ? `linear-gradient(135deg, ${['#F9AB00', '#9AA0A6', '#D97706'][rank - 1]}, ${['#F29900', '#80868B', '#B45309'][rank - 1]})`
              : '#F1F3F4',
            color: rank <= 3 ? '#FFF' : '#5F6368',
            flexShrink: 0,
            boxShadow: rank <= 3 ? `0 4px 10px rgba(0,0,0,0.15)` : 'none',
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              {rank}
            </Typography>
          </Box>
        )}

        <Box sx={{
          width: 46, height: 46, borderRadius: '12px',
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center',
          background: style.bg,
          color: style.color, flexShrink: 0,
        }}>
          {style.icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
            <Chip label={notification.type} size="small" sx={{
              background: style.bg,
              color: style.color,
              fontWeight: 800, fontSize: '0.75rem', height: 24,
              border: `1px solid ${style.color}30`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }} />
            {!isRead && (
              <Chip icon={<FiberNew sx={{ fontSize: '14px !important' }} />} label="NEW" size="small" sx={{
                background: '#FCE8E6',
                color: '#EA4335',
                fontWeight: 800, fontSize: '0.65rem', height: 22,
                border: '1px solid #FAD2CF',
                '& .MuiChip-icon': { color: '#EA4335' },
              }} />
            )}
          </Box>
          <Typography variant="body1" sx={{
            fontWeight: isRead ? 500 : 700, color: isRead ? '#5F6368' : '#202124',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4, letterSpacing: '0.01em',
            fontSize: '1.05rem'
          }}>
            {notification.message}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Typography variant="body2" sx={{
            color: '#80868B', display: { xs: 'none', sm: 'block' },
            fontWeight: 600, fontSize: '0.85rem'
          }}>
            {formatTime(notification.timestamp)}
          </Typography>
          {onMarkRead && (
            isRead ? (
              <MarkEmailRead sx={{ color: '#DADCE0', fontSize: 26 }} />
            ) : (
              <Tooltip title="Mark as read" arrow placement="top">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                  sx={{
                    color: style.color,
                    background: style.bg,
                    '&:hover': {
                      background: style.color,
                      color: '#FFF',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}>
                  <CheckCircleOutlined sx={{ fontSize: 22 }} />
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
