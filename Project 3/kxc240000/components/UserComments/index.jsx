import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Divider,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import './styles.css';

/**
 * UserComments
 * Fetches all comments authored by a specific user and renders them alongside
 * a thumbnail of the photo the comment belongs to. Clicking a comment or its
 * thumbnail navigates to that exact photo within the user's photo gallery.
 */
export default function UserComments() {
  // Router param for the user whose comments we are displaying
  const { userId } = useParams();
  // Local view state
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  // Imperative navigation helper
  const navigate = useNavigate();

  /**
   * Returns an onClick handler that navigates to the owner's photo page
   * focused on the selected photo.
   */
  const createNavigateToPhoto = (ownerId, photoId) => () => {
    navigate(`/photos/${ownerId}/${photoId}`);
  };

  useEffect(() => {
    // Fetch user comments and the user's basic profile in parallel.
    // Re-runs when the router param `userId` changes.
    async function loadData() {
      try {
        const [{ data: commentsData }, { data: userData }] = await Promise.all([
          axios.get(`/commentsOfUser/${userId}`),
          axios.get(`/user/${userId}`),
        ]);
        setComments(commentsData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user comments:', err);
      }
    }
    loadData();
  }, [userId]);

  // Keep the UI responsive while data is loading.
  if (!user) return <Typography sx={{ p: 2 }}>Loading...</Typography>;

  return (
    <Box className='usercomments-container'>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Comments by {user.first_name} {user.last_name}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {comments.length === 0 ? (
        <Typography variant='body1'>No comments yet.</Typography>
      ) : (
        comments.map((c) => (
          <Card
            // Composite key avoids collisions for multiple comments on same photo.
            key={c.photo_id + c.date_time}
            className='usercomment-card'
            elevation={1}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={createNavigateToPhoto(c.owner_id, c.photo_id)}
            >
              <CardMedia
                component='img'
                image={`/images/${c.file_name}`}
                alt='photo thumbnail'
                sx={{
                  width: 120,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: '6px',
                  mr: 2,
                }}
              />
              <CardContent sx={{ flex: 1, p: 1 }}>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 500 }}
                  onClick={createNavigateToPhoto(c.owner_id, c.photo_id)}
                >
                  {c.comment}
                </Typography>
                <Typography variant='caption' sx={{ opacity: 0.7 }}>
                  {/* Human-friendly timestamp */}
                  {new Date(c.date_time).toLocaleString()}
                </Typography>
              </CardContent>
            </Box>
          </Card>
        ))
      )}
    </Box>
  );
}
