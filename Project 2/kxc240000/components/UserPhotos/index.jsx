import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Box, Button, Stack } from '@mui/material';
import './styles.css';
import { AdvancedFeaturesContext } from '../../photoShare.jsx';

export default function UserPhotos() {
  const { userId, photoId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { advancedEnabled } = useContext(AdvancedFeaturesContext);

  // Load photos when userId changes
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

  // Sync currentIndex from optional URL segment: supports numeric index OR photoId
  useEffect(() => {
    if (!photos.length) return;

    if (photoId === undefined) {
      setCurrentIndex(0);
      return;
    }

    const maybeIndex = Number(photoId);
    if (Number.isFinite(maybeIndex) && !Number.isNaN(maybeIndex)) {
      const bounded = Math.max(0, Math.min(photos.length - 1, maybeIndex));
      setCurrentIndex(bounded);
      return;
    }

    const byIdIndex = photos.findIndex((p) => p._id === photoId);
    setCurrentIndex(byIdIndex >= 0 ? byIdIndex : 0);
  }, [photoId, photos]);

  if (!photos.length) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }

  // NORMAL MODE (original)
  if (!advancedEnabled) {
    return (
      <Box className='photos-container'>
        {photos.map((p) => (
          <Paper key={p._id} elevation={1} className='photo-card'>
            <img
              src={`/images/${p.file_name}`}
              alt='user upload'
              className='photo-img'
            />
            <Typography variant='caption' className='upload-time'>
              Uploaded: {new Date(p.date_time).toLocaleString()}
            </Typography>

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

  // ADVANCED MODE — single photo viewer with stepper
  const photo = photos[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      navigate(`/photos/${userId}/${newIndex}`); // update URL
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      navigate(`/photos/${userId}/${newIndex}`); // update URL
    }
  };

  return (
    <Box className='photo-viewer' sx={{ textAlign: 'center', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, display: 'inline-block' }}>
        {/* IMAGE */}
        <img
          src={`/images/${photo.file_name}`}
          alt='user upload'
          className='photo-img'
        />

        <Typography variant='caption' display='block' sx={{ mt: 1 }}>
          Uploaded: {new Date(photo.date_time).toLocaleString()}
        </Typography>

        {/* COMMENTS */}
        {photo.comments?.map((c) => (
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

        {/* STEPPER BUTTONS */}
        <Stack
          direction='row'
          spacing={2}
          justifyContent='center'
          alignItems='center'
          sx={{ mt: 2 }}
        >
          <Button
            variant='contained'
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Prev
          </Button>
          <Typography variant='body2'>
            {currentIndex + 1} / {photos.length}
          </Typography>
          <Button
            variant='contained'
            onClick={handleNext}
            disabled={currentIndex === photos.length - 1}
          >
            Next →
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
