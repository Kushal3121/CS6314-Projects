import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import './styles.css';
import { AdvancedFeaturesContext } from '../../photoShare.jsx';

export default function UserPhotos() {
  const { userId, photoId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { advancedEnabled } = useContext(AdvancedFeaturesContext);

  // Load photos for user
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

  // Handle photo navigation
  useEffect(() => {
    if (!photos.length) return;
    if (!photoId) return setCurrentIndex(0);

    const maybeIndex = Number(photoId);
    if (Number.isFinite(maybeIndex)) {
      const bounded = Math.max(0, Math.min(photos.length - 1, maybeIndex));
      setCurrentIndex(bounded);
    } else {
      const byIdIndex = photos.findIndex((p) => p._id === photoId);
      setCurrentIndex(byIdIndex >= 0 ? byIdIndex : 0);
    }
  }, [photoId, photos]);

  if (!photos.length) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }

  /* ---------- NORMAL GALLERY MODE ---------- */
  if (!advancedEnabled) {
    return (
      <Box className='gallery-container'>
        {photos.map((p) => (
          <Paper key={p._id} elevation={2} className='photo-card-modern'>
            <img
              src={`/images/${p.file_name}`}
              alt='user upload'
              className='photo-img-modern'
            />
            <Typography variant='caption' className='upload-time'>
              Uploaded: {new Date(p.date_time).toLocaleString()}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {p.comments?.map((c) => (
              <Box key={c._id} className='comment-modern'>
                <Stack direction='row' spacing={1} alignItems='flex-start'>
                  <Avatar
                    sx={{
                      bgcolor: '#1976d2',
                      width: 28,
                      height: 28,
                      fontSize: '0.8rem',
                    }}
                  >
                    {c.user.first_name[0]}
                    {c.user.last_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant='body2' className='comment-header'>
                      <Link
                        to={`/users/${c.user._id}`}
                        className='comment-user'
                      >
                        {c.user.first_name} {c.user.last_name}
                      </Link>{' '}
                      · {new Date(c.date_time).toLocaleString()}
                    </Typography>
                    <Typography variant='body2' className='comment-text'>
                      {c.comment}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
    );
  }

  /* ---------- ADVANCED VIEWER MODE (Split Layout) ---------- */
  const photo = photos[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      navigate(`/photos/${userId}/${newIndex}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      navigate(`/photos/${userId}/${newIndex}`);
    }
  };

  return (
    <Box className='viewer-wrapper'>
      <Paper elevation={0} className='viewer-split-card'>
        {/* LEFT — Photo */}
        <Box className='viewer-photo-box'>
          <img
            src={`/images/${photo.file_name}`}
            alt='user upload'
            className='viewer-photo-fixed'
          />

          {/* Navigation footer */}
          <Box className='viewer-nav-footer'>
            <Stack
              direction='row'
              spacing={2}
              justifyContent='center'
              alignItems='center'
            >
              <Button
                variant='outlined'
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  textTransform: 'none',
                  borderColor: '#bbb',
                  color: '#333',
                  fontWeight: 500,
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#f2f2f2',
                  },
                  '&:disabled': {
                    color: '#999',
                    borderColor: '#ddd',
                  },
                }}
              >
                ← Prev
              </Button>

              <Typography
                variant='body2'
                sx={{
                  color: '#555',
                  fontWeight: 500,
                  minWidth: 50,
                  textAlign: 'center',
                }}
              >
                {currentIndex + 1} / {photos.length}
              </Typography>

              <Button
                variant='outlined'
                onClick={handleNext}
                disabled={currentIndex === photos.length - 1}
                sx={{
                  textTransform: 'none',
                  borderColor: '#bbb',
                  color: '#333',
                  fontWeight: 500,
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#f2f2f2',
                  },
                  '&:disabled': {
                    color: '#999',
                    borderColor: '#ddd',
                  },
                }}
              >
                Next →
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* RIGHT — Comments */}
        <Box className='viewer-comments-box'>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#1976d2',
              mb: 1,
            }}
          >
            💬 Comments
          </Typography>

          <Typography variant='caption' sx={{ color: '#666' }}>
            Uploaded: {new Date(photo.date_time).toLocaleString()}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Box className='comments-scroll-area'>
            {photo.comments?.length ? (
              photo.comments.map((c) => (
                <Box key={c._id} className='comment-bubble'>
                  <Stack direction='row' spacing={1.5}>
                    <Avatar
                      sx={{
                        bgcolor: '#1976d2',
                        width: 30,
                        height: 30,
                        fontSize: '0.8rem',
                      }}
                    >
                      {c.user.first_name[0]}
                      {c.user.last_name[0]}
                    </Avatar>
                    <Box>
                      <Typography
                        variant='body2'
                        sx={{
                          fontWeight: 600,
                          color: '#1976d2',
                          lineHeight: 1.2,
                        }}
                      >
                        <Link
                          to={`/users/${c.user._id}`}
                          className='comment-user'
                        >
                          {c.user.first_name} {c.user.last_name}
                        </Link>
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: '#888', display: 'block' }}
                      >
                        {new Date(c.date_time).toLocaleString()}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ mt: 0.5, color: '#333' }}
                      >
                        {c.comment}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant='body2' sx={{ color: '#666', mt: 2 }}>
                No comments yet.
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
