import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Stack,
} from '@mui/material';
import { fetchActivities, queryKeys } from '../../api/index.js';

const typeToLabel = {
  photo_upload: 'Photo Upload',
  comment_added: 'New Comment',
  user_register: 'User Registered',
  user_login: 'User Login',
  user_logout: 'User Logout',
};

export default function Activities() {
  const {
    data: activities = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.activities(5),
    queryFn: () => fetchActivities(5),
  });

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, color: '#1976d2' }}>
          Recent Activities
        </Typography>
        <Button
          variant='outlined'
          size='small'
          onClick={() => refetch()}
          disabled={isFetching}
          sx={{ textTransform: 'none' }}
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Stack>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : !activities.length ? (
        <Typography>No activities yet.</Typography>
      ) : (
        <List dense>
          {activities.map((a) => {
            const userName = a.user
              ? `${a.user.first_name} ${a.user.last_name}`
              : 'Unknown User';
            const primary = `${typeToLabel[a.type] || a.type} · ${userName}`;
            const secondary = new Date(a.date_time).toLocaleString();
            return (
              <ListItem key={a._id} alignItems='flex-start' sx={{ py: 1 }}>
                <ListItemAvatar>
                  {a.photo_file_name ? (
                    <Avatar
                      src={`/images/${a.photo_file_name}`}
                      alt='thumbnail'
                      variant='rounded'
                      sx={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        bgcolor: '#1976d2',
                        width: 48,
                        height: 48,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {userName
                        .split(' ')
                        .filter(Boolean)
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join('')}
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText primary={primary} secondary={secondary} />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}


