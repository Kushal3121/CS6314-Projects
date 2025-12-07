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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { MentionsInput, Mention } from 'react-mentions';

import './styles.css';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';
import useAppStore from '../../store/useAppStore.js';
import socket from '../../lib/socketClient.js';
import {
  fetchPhotosOfUser,
  fetchUsers,
  postComment,
  queryKeys,
  deletePhoto as deletePhotoApi,
  deleteComment as deleteCommentApi,
  likePhoto as likePhotoApi,
  unlikePhoto as unlikePhotoApi,
  favoritePhoto as favoritePhotoApi,
} from '../../api/index.js';

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

  const addCommentMutation = useMutation({
    mutationFn: ({ photoId: targetPhotoId, comment }) =>
      postComment({ photoId: targetPhotoId, comment }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.photosOfUser(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities(5) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userHighlights(userId) });
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
  const [confirmComment, setConfirmComment] = useState(null);

  const likeMutation = useMutation({
    mutationFn: (targetPhotoId) => likePhotoApi(targetPhotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(userId) });
    },
  });
  const unlikeMutation = useMutation({
    mutationFn: (targetPhotoId) => unlikePhotoApi(targetPhotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(userId) });
    },
  });
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

  useEffect(() => {
    const handler = ({ photoId: updatedPhotoId, likesCount, userId: likerId, liked }) => {
      queryClient.setQueryData(queryKeys.photosOfUser(userId), (prev) => {
        if (!prev) return prev;
        return prev.map((p) => {
          const id = p._id?.toString?.() || p._id;
          if (id !== updatedPhotoId) return p;
          const viewerId = currentUser?._id;
          const nextLikedByViewer = viewerId && viewerId === likerId ? liked : p.likedByViewer;
          return {
            ...p,
            likesCount,
            likedByViewer: nextLikedByViewer,
          };
        });
      });
    };

    socket.on('photo:likeUpdated', handler);
    return () => {
      socket.off('photo:likeUpdated', handler);
    };
  }, [userId, queryClient, currentUser]);

  const favoriteMutation = useMutation({
    mutationFn: (targetPhotoId) => favoritePhotoApi(targetPhotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });

  const currentPhoto = photos[currentIndex];
  const currentId = currentPhoto?._id?.toString?.() || currentPhoto?._id;

  const sortedComments = useMemo(() => {
    if (!currentPhoto) return [];
    const arr = [...(currentPhoto.comments || [])];
    arr.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    return arr;
  }, [currentPhoto]);

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

  if (isLoading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }
  if (!photos.length) {
    return <Typography sx={{ p: 2 }}>No photos yet.</Typography>;
  }

  // helpers for mentions
  const mentionStyle = {
    control: {
      backgroundColor: '#fff',
      minHeight: 44,
      width: '100%',
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '8px 10px',
    },
    highlighter: { overflow: 'hidden' },
    input: { margin: 0 },
  };

  const mentionUsers = users.map((u) => ({
    id: u._id,
    display: `${u.first_name} ${u.last_name}`,
  }));

  // Format date
  const formatDateTime = (dt) => new Date(dt).toLocaleString();

  // Add comment text setter
  const setText = (photoKey, value) => setTextFor(photoKey, value);

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
              Uploaded: {formatDateTime(p.date_time)}
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
                      · {formatDateTime(c.date_time)}
                    </Typography>
                    <Typography variant='body2' className='comment-text'>
                      {c.comment}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
            <Box sx={{ mt: 1.5 }}>
              <Stack direction='row' spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <MentionsInput
                    value={newComments[p._id] || ''}
                    onChange={(e) => setText(p._id, e.target.value)}
                    style={mentionStyle}
                    placeholder='Add a comment (@name to mention)...'
                  >
                    <Mention
                      trigger='@'
                      data={mentionUsers}
                      style={{ backgroundColor: '#cee4ff' }}
                      markup='@[__display__](__id__)'
                    />
                  </MentionsInput>
                </Box>
                <Button
                  variant='contained'
                  disabled={
                    addCommentMutation.isPending || !(newComments[p._id] || '').trim()
                  }
                  onClick={() => {
                    addCommentMutation.mutate(
                      {
                        photoId: p._id,
                        comment: (newComments[p._id] || '').trim(),
                      },
                      {
                        onSuccess: () => setText(p._id, ''),
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
            <Divider sx={{ my: 1 }} />
            <Stack direction='row' spacing={1} alignItems='center'>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Button
                  size='small'
                  variant={p.likedByViewer ? 'contained' : 'outlined'}
                  color={p.likedByViewer ? 'secondary' : 'primary'}
                  sx={{ textTransform: 'none' }}
                  disabled={likeMutation.isPending || unlikeMutation.isPending}
                  onClick={() => {
                    if (p.likedByViewer) {
                      unlikeMutation.mutate(p._id);
                    } else {
                      likeMutation.mutate(p._id);
                    }
                  }}
                  startIcon={p.likedByViewer ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                >
                  {p.likedByViewer ? 'Unlike' : 'Like'}
                </Button>
                <Typography variant='body2' sx={{ color: '#555', minWidth: 24, textAlign: 'center' }}>
                  {p.likesCount || 0}
                </Typography>
                <Button
                  size='small'
                  variant={p.favoritedByViewer ? 'contained' : 'outlined'}
                  color={p.favoritedByViewer ? 'success' : 'inherit'}
                  sx={{ textTransform: 'none' }}
                  disabled={favoriteMutation.isPending || p.favoritedByViewer}
                  onClick={() => favoriteMutation.mutate(p._id)}
                >
                  {p.favoritedByViewer ? 'Favorited' : 'Favorite'}
                </Button>
                {currentUser && (p.user_id?.toString?.() || p.user_id) === currentUser._id ? (
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
            </Stack>
          </Paper>
        ))}
        <ConfirmDialog
          open={Boolean(confirmPhotoId)}
          title='Delete Photo'
          description='Are you sure you want to delete this photo?'
          confirmText='Delete'
          confirmColor='error'
          loading={deletePhotoMutation?.isPending}
          onCancel={() => setConfirmPhotoId(null)}
          onConfirm={() => deletePhotoMutation.mutate(confirmPhotoId)}
        />
        <ConfirmDialog
          open={Boolean(confirmComment)}
          title='Delete Comment'
          description='Are you sure you want to delete this comment?'
          confirmText='Delete'
          confirmColor='error'
          loading={deleteCommentMutation?.isPending}
          onCancel={() => setConfirmComment(null)}
          onConfirm={() =>
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
          {currentUser &&
          (photo.user_id?.toString?.() || photo.user_id) === currentUser._id ? (
            <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
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
              >
                Prev
              </Button>
              <Typography variant='body2'>
                {currentIndex + 1} / {photos.length}
              </Typography>
              <Button
                variant='outlined'
                onClick={handleNext}
                disabled={currentIndex === photos.length - 1}
              >
                Next
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* RIGHT — Comments */}
        <Box className='viewer-comments-box'>
          <Typography variant='h6' gutterBottom>
            Photo Details
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            Uploaded: {formatDateTime(photo.date_time)}
          </Typography>

          <Divider sx={{ marginY: 2 }} />
          <Typography variant='h6' gutterBottom>
            Comments ({photo.comments?.length || 0})
          </Typography>

          <Box className='comments-scroll-area'>
            {sortedComments.map((c) => (
              <Box key={c._id} className='comment-bubble'>
                <Stack direction='row' spacing={1} alignItems='flex-start'>
                  <Avatar
                    sx={{
                      bgcolor: '#1976d2',
                      width: 28,
                      height: 28,
                      fontSize: '0.8rem',
                    }}
                  >
                    {c.user?.first_name?.[0]}
                    {c.user?.last_name?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='body2' className='comment-header'>
                      <Link
                        to={`/users/${c.user?._id}`}
                        className='comment-user'
                      >
                        {c.user?.first_name} {c.user?.last_name}
                      </Link>{' '}
                      · {formatDateTime(c.date_time)}
                    </Typography>
                    <Typography variant='body2' className='comment-text'>
                      {c.comment}
                    </Typography>
                  </Box>
                  {(currentUser && c.user && c.user._id === currentUser._id) ? (
                    <IconButton
                      size='small'
                      color='error'
                      sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      onClick={() =>
                        setConfirmComment({
                          photoId: photo._id,
                          commentId: c._id,
                        })
                      }
                    >
                      <DeleteOutlineIcon fontSize='small' />
                    </IconButton>
                  ) : null}
                </Stack>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ flex: 1 }}>
              <MentionsInput
                value={newComments[currentId] || ''}
                onChange={(e) => setText(currentId, e.target.value)}
                style={mentionStyle}
                placeholder='Add a comment (@name to mention)...'
              >
                <Mention
                  trigger='@'
                  data={mentionUsers}
                  style={{ backgroundColor: 'transparent', color: 'inherit' }}
                  markup='@[__display__](__id__)'
                />
              </MentionsInput>
            </Box>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 1 }}>
              <Button
                variant='contained'
                disabled={
                  addCommentMutation.isPending || !(newComments[currentId] || '').trim()
                }
                onClick={() => {
                  addCommentMutation.mutate(
                    {
                      photoId: photo._id,
                      comment: (newComments[currentId] || '').trim(),
                    },
                    {
                      onSuccess: () => setText(currentId, ''),
                    }
                  );
                }}
              >
                Post
              </Button>
              {addCommentMutation.isError ? (
                <Typography variant='caption' color='error'>
                  Failed to add comment
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Divider sx={{ marginY: 2 }} />
          <Stack direction='row' spacing={1} alignItems='center' sx={{ whiteSpace: 'nowrap' }}>
            <Button
              size='small'
              variant={photo.likedByViewer ? 'contained' : 'outlined'}
              color={photo.likedByViewer ? 'secondary' : 'primary'}
              sx={{ textTransform: 'none' }}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              onClick={() => {
                if (photo.likedByViewer) {
                  unlikeMutation.mutate(photo._id);
                } else {
                  likeMutation.mutate(photo._id);
                }
              }}
              startIcon={photo.likedByViewer ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            >
              {photo.likedByViewer ? 'Unlike' : 'Like'}
            </Button>
            <Typography variant='body2' sx={{ color: '#555' }}>
              {photo.likesCount || 0}
            </Typography>
            <Button
              size='small'
              variant={photo.favoritedByViewer ? 'contained' : 'outlined'}
              color={photo.favoritedByViewer ? 'success' : 'inherit'}
              sx={{ textTransform: 'none' }}
              disabled={favoriteMutation.isPending || photo.favoritedByViewer}
              onClick={() => favoriteMutation.mutate(photo._id)}
            >
              {photo.favoritedByViewer ? 'Favorited' : 'Favorite'}
            </Button>
          </Stack>
        </Box>
      </Paper>
      {/* Confirmations - advanced mode */}
      <ConfirmDialog
        open={Boolean(confirmPhotoId)}
        title='Delete Photo'
        description='Are you sure you want to delete this photo?'
        confirmText='Delete'
        confirmColor='error'
        loading={deletePhotoMutation?.isPending}
        onCancel={() => setConfirmPhotoId(null)}
        onConfirm={() => deletePhotoMutation.mutate(confirmPhotoId)}
      />
      <ConfirmDialog
        open={Boolean(confirmComment)}
        title='Delete Comment'
        description='Are you sure you want to delete this comment?'
        confirmText='Delete'
        confirmColor='error'
        loading={deleteCommentMutation?.isPending}
        onCancel={() => setConfirmComment(null)}
        onConfirm={() =>
          deleteCommentMutation.mutate({
            photoId: confirmComment.photoId,
            commentId: confirmComment.commentId,
          })
        }
      />
    </Box>
  );
}
