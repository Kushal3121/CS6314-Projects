import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Divider } from '@mui/material';
import './styles.css';

export default function UserPhotos() {
  const { userId } = useParams();
  const [photos, setPhotos] = useState([]);

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
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (!photos.length) return <Typography>Loading...</Typography>;

  return (
    <div style={{ padding: '12px' }}>
      {photos.map((p) => (
        <Paper
          key={p._id}
          elevation={1}
          style={{ padding: '12px', marginBottom: '16px' }}
        >
          <img
            src={`/images/${p.file_name}`}
            alt='user upload'
            style={{ width: '100%', maxWidth: '500px', borderRadius: '6px' }}
          />

          <Typography variant='caption' display='block' sx={{ mt: 1, mb: 1 }}>
            Uploaded: {new Date(p.date_time).toLocaleString()}
          </Typography>

          {p.comments?.map((c) => (
            <div key={c._id} style={{ marginTop: '8px', paddingLeft: '8px' }}>
              <Typography variant='body2' sx={{ mb: 0.5 }}>
                <Link to={`/users/${c.user._id}`}>
                  {c.user.first_name} {c.user.last_name}
                </Link>
                {' — '}
                {new Date(c.date_time).toLocaleString()}
              </Typography>
              <Typography variant='body2' sx={{ ml: 2 }}>
                {c.comment}
              </Typography>
              <Divider sx={{ mt: 1 }} />
            </div>
          ))}
        </Paper>
      ))}
    </div>
  );
}
