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

export default function UserComments() {
  const { userId } = useParams();
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
            key={c.photo_id + c.date_time}
            className='usercomment-card'
            elevation={1}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/photos/${c.owner_id}/${c.photo_id}`)}
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
                  onClick={() =>
                    navigate(`/photos/${c.owner_id}/${c.photo_id}`)
                  }
                >
                  {c.comment}
                </Typography>
                <Typography variant='caption' sx={{ opacity: 0.7 }}>
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
