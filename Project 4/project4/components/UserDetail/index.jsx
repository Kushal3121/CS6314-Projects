import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Paper,
  Typography,
  Stack,
  Button,
  Avatar,
  Divider,
  Box,
} from '@mui/material';
import './styles.css';
import { fetchUserById, queryKeys } from '../../api/index.js';

/**
 * UserDetail
 * Shows profile info in a horizontal card (avatar left, details right).
 */
export default function UserDetail() {
  const { userId } = useParams();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => fetchUserById(userId),
  });

  if (isLoading || !user) {
    return <Typography className='detail-loading'>Loading...</Typography>;
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <Paper elevation={0} className='user-detail-wide'>
      {/* Left — Avatar */}
      <Box className='user-detail-avatar-section'>
        <Avatar className='user-detail-avatar-large'>{initials}</Avatar>
      </Box>

      {/* Right — Info */}
      <Box className='user-detail-info'>
        <Typography variant='h5' className='user-detail-name'>
          {user.first_name} {user.last_name}
        </Typography>

        <Divider className='user-detail-divider' />

        <Stack spacing={0.8} className='user-detail-meta'>
          <Typography variant='body1' className='meta-line'>
            📍 <span>{user.location || 'Unknown location'}</span>
          </Typography>
          <Typography variant='body1' className='meta-line'>
            💼 <span>{user.occupation || 'No occupation listed'}</span>
          </Typography>
          <Typography variant='body1' className='meta-line'>
            📝 <span>{user.description || 'No description available'}</span>
          </Typography>
        </Stack>

        <Button
          variant='contained'
          size='medium'
          component={Link}
          to={`/photos/${user._id}`}
          className='view-photos-btn-wide'
        >
          View Photos
        </Button>
      </Box>
    </Paper>
  );
}
