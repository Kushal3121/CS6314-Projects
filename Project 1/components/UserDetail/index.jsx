import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Stack, Button } from '@mui/material';
import './styles.css';

export default function UserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

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

  if (!user)
    return <Typography className='detail-loading'>Loading...</Typography>;

  return (
    <Paper elevation={1} className='user-detail-card'>
      <Typography variant='h6' className='user-detail-name'>
        {user.first_name} {user.last_name}
      </Typography>

      <Stack spacing={0.5} className='user-detail-meta'>
        <Typography variant='body2'>📍 {user.location}</Typography>
        <Typography variant='body2'>💼 {user.occupation}</Typography>
        <Typography variant='body2'>📝 {user.description}</Typography>
      </Stack>

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
