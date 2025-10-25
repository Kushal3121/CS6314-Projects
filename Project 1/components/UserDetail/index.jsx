import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Paper, Typography, Stack } from '@mui/material';
import './styles.css';

export default function UserDetail() {
  const { userId } = useParams(); // extract from URL
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

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Paper elevation={0} style={{ padding: '16px' }}>
      <Typography variant='h6' gutterBottom>
        {user.first_name} {user.last_name}
      </Typography>

      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant='body2'>Location: {user.location}</Typography>
        <Typography variant='body2'>Occupation: {user.occupation}</Typography>
        <Typography variant='body2'>Description: {user.description}</Typography>
      </Stack>

      {/* Link to Photos */}
      <Link to={`/photos/${user._id}`} style={{ color: '#1976d2' }}>
        View Photos
      </Link>
    </Paper>
  );
}
