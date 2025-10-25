import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Divider, Box } from '@mui/material';
import './styles.css';

export default function UserPhotos() {
  const { userId } = useParams();
  const [photos, setPhotos] = useState([]);

  // Load photos once per userId change
  useEffect(() => {
    let mounted = true;

    async function loadPhotos() {
      try {
        const { data } = await axios.get(`/photosOfUser/${userId}`);
        if (mounted) setPhotos(data);
      } catch (err) {
        console.error('Failed to load photos:', err);
      }
    }

    loadPhotos();
    return () => (mounted = false);
  }, [userId]);

  if (!photos.length) return <Typography sx={{ p: 2 }}>Loading...</Typography>;

  return (
    <Box className='photos-container'>
      {photos.map((p) => (
        <Paper key={p._id} elevation={1} className='photo-card'>
          {/* IMAGE */}
          <img
            src={`/images/${p.file_name}`}
            alt='user upload'
            className='photo-img'
          />

          {/* UPLOAD TIME */}
          <Typography variant='caption' className='upload-time'>
            Uploaded: {new Date(p.date_time).toLocaleString()}
          </Typography>

          {/* COMMENTS */}
          {p.comments?.map((c) => (
            <Box key={c._id} className='comment-bubble'>
              <Typography variant='body2' className='comment-header'>
                <Link to={`/users/${c.user._id}`} className='comment-user'>
                  {c.user.first_name} {c.user.last_name}
                </Link>
                {' · '}
                {new Date(c.date_time).toLocaleString()}
              </Typography>

              <Typography variant='body2' className='comment-text'>
                {c.comment}
              </Typography>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
}
