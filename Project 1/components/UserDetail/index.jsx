import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Stack, Button } from '@mui/material';
import './styles.css';

export default function UserDetail() {
  // Extract userId directly from the current URL
  const { userId } = useParams();

  // Local state where fetched user data will be stored
  const [user, setUser] = useState(null);

  /**
   * Fetch user details on mount OR when userId in URL changes.
   * Using cleanup to prevent state update after unmount.
   */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data } = await axios.get(`/user/${userId}`);
        if (mounted) setUser(data);
      } catch (err) {
        console.error('Failed to load user detail:', err);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // Loading UI while fetching user data
  if (!user)
    return <Typography className='detail-loading'>Loading...</Typography>;

  return (
    <Paper elevation={1} className='user-detail-card'>
      {/* User full name */}
      <Typography variant='h6' className='user-detail-name'>
        {user.first_name} {user.last_name}
      </Typography>

      {/* Meta details of user */}
      <Stack spacing={0.5} className='user-detail-meta'>
        <Typography variant='body2'>📍 {user.location}</Typography>
        <Typography variant='body2'>💼 {user.occupation}</Typography>
        <Typography variant='body2'>📝 {user.description}</Typography>
      </Stack>

      {/* Button to navigate to user's photos */}
      <Button
        variant='contained'
        size='small'
        component={Link}
        to={`/photos/${user._id}`}
        className='view-photos-btn'
      >
        View Photos
      </Button>
    </Paper>
  );
}
