import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  Tooltip,
  Zoom,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchFavorites, unfavoritePhoto, queryKeys } from '../../api/index.js';

export default function Favorites() {
  const queryClient = useQueryClient();
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: fetchFavorites,
  });
  const [preview, setPreview] = useState(null); // { _id, file_name, date_time }

  const removeMutation = useMutation({
    mutationFn: (photoId) => unfavoritePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });

  if (isLoading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>
        My Favorites
      </Typography>
      {favorites.length === 0 && <Typography>No favorites yet.</Typography>}
      <Grid container spacing={2} direction='column'>
        {favorites.map((p) => (
          <Grid item key={p._id}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
              }}
              onClick={() => setPreview(p)}
            >
              <img
                src={`/images/${p.file_name}`}
                alt='favorite'
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant='subtitle1'>
                  {p.user?.first_name} {p.user?.last_name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {new Date(p.date_time).toLocaleString()}
                </Typography>
                {p.caption ? (
                  <Typography variant='body2' sx={{ mt: 1 }}>
                    {p.caption}
                  </Typography>
                ) : null}
              </Box>
              <Tooltip title='Remove from favorites'>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMutation.mutate(p._id);
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        TransitionComponent={Zoom}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Preview</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {preview && (
            <>
              <img
                src={`/images/${preview.file_name}`}
                alt='preview'
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
              />
              <Typography variant='subtitle1' sx={{ mt: 2 }}>
                {preview.user?.first_name} {preview.user?.last_name}
              </Typography>
              <Typography variant='caption' sx={{ display: 'block', mt: 1 }}>
                {new Date(preview.date_time).toLocaleString()}
              </Typography>
              {preview.caption && (
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {preview.caption}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
