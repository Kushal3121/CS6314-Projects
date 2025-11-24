import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import './styles.css';
import useAppStore from '../../store/useAppStore.js';
import {
  fetchPhotosOfUser,
  fetchUsers,
  postComment,
  queryKeys,
  deletePhoto as deletePhotoApi,
  deleteComment as deleteCommentApi,
} from '../../api/index.js';
import { MentionsInput, Mention } from 'react-mentions';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';

export default function UserPhotos() {
  const { userId, photoId } = useParams();
  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKeys.photosOfUser(userId),
    queryFn: () => fetchPhotosOfUser(userId),
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newComments, setNewComments] = useState({});
  const navigate = useNavigate();
  const advancedEnabled = useAppStore((s) => s.advancedEnabled);
  const currentUser = useAppStore((s) => s.currentUser);
  const queryClient = useQueryClient();
  const setTextFor = (photoKey, text) =>
    setNewComments((prev) => ({ ...prev, [photoKey]: text }));
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
  });
  const mentionData = useMemo(
    () =>
      users.map((u) => ({
        id: u._id,
        display: `${u.first_name} ${u.last_name}`,
      })),
    [users]
  );

  const addCommentMutation = useMutation({
    mutationFn: ({ photoId: targetPhotoId, comment }) =>
      postComment({ photoId: targetPhotoId, comment }),
    onSuccess: (data) => {
      // refresh photos cache so new comment appears
      queryClient.invalidateQueries({
        queryKey: queryKeys.photosOfUser(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities(5) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userHighlights(userId) });
      // Invalidate mentions for any users referenced
      if (data?.mentions?.length) {
        for (const mentionedId of data.mentions) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.mentionsOfUser(mentionedId),
          });
        }
      }
    },
  });

  const [confirmPhotoId, setConfirmPhotoId] = useState(null);
  const [confirmComment, setConfirmComment] = useState(null); // { photoId, commentId }

  const deletePhotoMutation = useMutation({
    mutationFn: (targetPhotoId) => deletePhotoApi(targetPhotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities(5) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userHighlights(userId) });
      setConfirmPhotoId(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ photoId: targetPhotoId, commentId }) =>
      deleteCommentApi({ photoId: targetPhotoId, commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities(5) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userHighlights(userId) });
      setConfirmComment(null);
    },
  });

  // Handle photo navigation
  useEffect(() => {
    if (!photos.length) {
      return;
    }
    if (!photoId) {
      setCurrentIndex(0);
    } else {
      const maybeIndex = Number(photoId);
      if (Number.isFinite(maybeIndex)) {
        const bounded = Math.max(0, Math.min(photos.length - 1, maybeIndex));
        setCurrentIndex(bounded);
      } else {
        const byIdIndex = photos.findIndex((p) => p._id === photoId);
        setCurrentIndex(byIdIndex >= 0 ? byIdIndex : 0);
      }
    }
  }, [photoId, photos]);

  // If in gallery mode, scroll the selected photo into view
  useEffect(() => {
    if (!photos.length || !photoId) return;
    if (advancedEnabled) return;
    const el = document.getElementById(`photo-card-${photoId}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [photos, photoId, advancedEnabled]);

  if (isLoading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }
  if (!photos.length) {
    return <Typography sx={{ p: 2 }}>No photos yet.</Typography>;
  }

  /* ---------- NORMAL GALLERY MODE ---------- */
  if (!advancedEnabled) {
    return (
      <Box className='gallery-container'>
        {photos.map((p) => (
          <Paper
            key={p._id}
            id={`photo-card-${p._id}`}
            elevation={2}
            className='photo-card-modern'
          >
            <img
              src={`/images/${p.file_name}`}
              alt='user upload'
              className='photo-img-modern'
            />
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Typography variant='caption' className='upload-time' sx={{ m: 0 }}>
                Uploaded: {new Date(p.date_time).toLocaleString()}
              </Typography>
              {(currentUser &&
                ((p.user_id?.toString?.() || p.user_id) === currentUser._id)) ? (
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  sx={{ textTransform: 'none' }}
                  disabled={deletePhotoMutation.isPending}
                  onClick={() => setConfirmPhotoId(p._id)}
                >
                  Delete Photo
                </Button>
              ) : null}
            </Stack>

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
                  <Box sx={{ flex: 1 }}>
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
                  {(currentUser && c.user._id === currentUser._id) ? (
                    <IconButton
                      aria-label='Delete comment'
                      size='small'
                      onClick={() => setConfirmComment({ photoId: p._id, commentId: c._id })}
                    >
                      <DeleteOutlineIcon fontSize='small' />
                    </IconButton>
                  ) : null}
                </Stack>
              </Box>
            ))}
            <Box sx={{ mt: 1.5 }}>
              <Stack direction='row' spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <MentionsInput
                    value={newComments[p._id] || ''}
                    onChange={(e) => setTextFor(p._id, e.target.value)}
                    placeholder='Add a comment... Use @ to mention'
                    style={{
                      control: {
                        fontSize: 14,
                        minHeight: 38,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      },
                      input: { padding: 8 },
                      highlighter: { padding: 8 },
                      suggestions: {
                        list: {
                          backgroundColor: 'white',
                          border: '1px solid rgba(0,0,0,0.15)',
                          borderRadius: 6,
                        },
                        item: {
                          padding: '5px 10px',
                          borderBottom: '1px solid #eee',
                        },
                      },
                    }}
                  >
                    <Mention
                      trigger='@'
                      data={mentionData}
                      markup='@[__display__](__id__)'
                      displayTransform={(id, display) => `@${display}`}
                    />
                  </MentionsInput>
                </Box>
                <Button
                  variant='contained'
                  disabled={
                    addCommentMutation.isPending ||
                    !(newComments[p._id] || '').trim()
                  }
                  onClick={() => {
                    addCommentMutation.mutate(
                      {
                        photoId: p._id,
                        comment: (newComments[p._id] || '').trim(),
                      },
                      {
                        onSuccess: () => setTextFor(p._id, ''),
                      }
                    );
                  }}
                >
                  Post
                </Button>
              </Stack>
              {addCommentMutation.isError ? (
                <Typography variant='caption' color='error'>
                  Failed to add comment
                </Typography>
              ) : null}
            </Box>
          </Paper>
        ))}
        {/* Confirmations - gallery mode */}
        <ConfirmDialog
          open={Boolean(confirmPhotoId)}
          title='Delete Photo'
          description='This will permanently delete the photo and its comments.'
          confirmText='Delete'
          confirmColor='error'
          loading={deletePhotoMutation.isPending}
          onCancel={() => setConfirmPhotoId(null)}
          onConfirm={() => confirmPhotoId && deletePhotoMutation.mutate(confirmPhotoId)}
        />
        <ConfirmDialog
          open={Boolean(confirmComment)}
          title='Delete Comment'
          description='This will permanently delete your comment.'
          confirmText='Delete'
          confirmColor='error'
          loading={deleteCommentMutation.isPending}
          onCancel={() => setConfirmComment(null)}
          onConfirm={() =>
            confirmComment &&
            deleteCommentMutation.mutate({
              photoId: confirmComment.photoId,
              commentId: confirmComment.commentId,
            })
          }
        />
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
          {(currentUser &&
            ((photo.user_id?.toString?.() || photo.user_id) === currentUser._id)) ? (
            <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
              <Button
                size='small'
                variant='outlined'
                color='error'
                sx={{ textTransform: 'none' }}
                disabled={deletePhotoMutation.isPending}
                onClick={() => setConfirmPhotoId(photo._id)}
              >
                Delete Photo
              </Button>
            </Box>
          ) : null}
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
                    <Box sx={{ flex: 1 }}>
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
                    {(currentUser && c.user._id === currentUser._id) ? (
                      <IconButton
                        aria-label='Delete comment'
                        size='small'
                        onClick={() => {
                          // eslint-disable-next-line no-alert
                          if (window.confirm('Delete this comment?')) {
                            deleteCommentMutation.mutate({
                              photoId: photo._id,
                              commentId: c._id,
                            });
                          }
                        }}
                      >
                        <DeleteOutlineIcon fontSize='small' />
                      </IconButton>
                    ) : null}
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant='body2' sx={{ color: '#666', mt: 2 }}>
                No comments yet.
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Stack direction='row' spacing={1}>
              <Box sx={{ flex: 1 }}>
                <MentionsInput
                  value={newComments[photo._id] || ''}
                  onChange={(e) => setTextFor(photo._id, e.target.value)}
                  placeholder='Add a comment... Use @ to mention'
                  style={{
                    control: {
                      fontSize: 14,
                      minHeight: 38,
                      border: '1px solid #ccc',
                      borderRadius: 4,
                    },
                    input: { padding: 8 },
                    highlighter: { padding: 8 },
                    suggestions: {
                      list: {
                        backgroundColor: 'white',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: 6,
                      },
                      item: {
                        padding: '5px 10px',
                        borderBottom: '1px solid #eee',
                      },
                    },
                  }}
                >
                  <Mention
                    trigger='@'
                    data={mentionData}
                    markup='@[__display__](__id__)'
                    displayTransform={(id, display) => `@${display}`}
                  />
                </MentionsInput>
              </Box>
              <Button
                variant='contained'
                disabled={
                  addCommentMutation.isPending ||
                  !(newComments[photo._id] || '').trim()
                }
                onClick={() => {
                  addCommentMutation.mutate(
                    {
                      photoId: photo._id,
                      comment: (newComments[photo._id] || '').trim(),
                    },
                    {
                      onSuccess: () => setTextFor(photo._id, ''),
                    }
                  );
                }}
              >
                Post
              </Button>
            </Stack>
            {addCommentMutation.isError ? (
              <Typography variant='caption' color='error'>
                Failed to add comment
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Paper>
      {/* Confirmations - advanced mode */}
      <ConfirmDialog
        open={Boolean(confirmPhotoId)}
        title='Delete Photo'
        description='This will permanently delete the photo and its comments.'
        confirmText='Delete'
        confirmColor='error'
        loading={deletePhotoMutation.isPending}
        onCancel={() => setConfirmPhotoId(null)}
        onConfirm={() => confirmPhotoId && deletePhotoMutation.mutate(confirmPhotoId)}
      />
      <ConfirmDialog
        open={Boolean(confirmComment)}
        title='Delete Comment'
        description='This will permanently delete your comment.'
        confirmText='Delete'
        confirmColor='error'
        loading={deleteCommentMutation.isPending}
        onCancel={() => setConfirmComment(null)}
        onConfirm={() =>
          confirmComment &&
          deleteCommentMutation.mutate({
            photoId: confirmComment.photoId,
            commentId: confirmComment.commentId,
          })
        }
      />
    </Box>
  );
}
