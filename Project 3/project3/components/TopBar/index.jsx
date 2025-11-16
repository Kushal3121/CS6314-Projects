import React, { useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './styles.css';
import { fetchUserById, logoutRequest, uploadPhoto, queryKeys } from '../../api/index.js';
import useAppStore from '../../store/useAppStore.js';

/**
 * TopBar
 * - Displays developer name on the left
 * - Shows contextual info (user, photos, comments) in the center
 * - Offers Advanced Mode toggle on the right
 */
export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const advancedEnabled = useAppStore((s) => s.advancedEnabled);
  const setAdvancedEnabled = useAppStore((s) => s.setAdvancedEnabled);
  const currentUser = useAppStore((s) => s.currentUser);
  const clearCurrentUser = useAppStore((s) => s.clearCurrentUser);
  const queryClient = useQueryClient();

  const { pathPrefix, userId } = useMemo(() => {
    const path = location.pathname;
    const segments = path.split('/');
    return {
      pathPrefix: `/${segments[1] || ''}`,
      userId: segments[2] || null,
    };
  }, [location]);

  const { data: user } = useQuery({
    queryKey: userId ? queryKeys.user(userId) : ['noop'],
    queryFn: () => fetchUserById(userId),
    enabled: Boolean(userId && (pathPrefix === '/users' || pathPrefix === '/photos' || pathPrefix === '/comments')),
  });

  const rightText = useMemo(() => {
    if (!currentUser) {
      return 'Please Login';
    }
    if (pathPrefix === '/users' && userId && user) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (pathPrefix === '/photos' && userId && user) {
      return `Photos of ${user.first_name} ${user.last_name}`;
    }
    if (pathPrefix === '/comments' && userId && user) {
      return `Comments by ${user.first_name} ${user.last_name}`;
    }
    if (location.pathname === '/users') {
      return 'All Users';
    }
    return '';
  }, [pathPrefix, userId, user, location.pathname]);

  const handleToggle = (event) => {
    setAdvancedEnabled(event.target.checked);
  };

  const logoutMutation = useMutation({
    mutationFn: () => logoutRequest(),
    onSuccess: () => {
      clearCurrentUser();
      // Clear cached data
      queryClient.clear();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadPhoto(file),
    onSuccess: () => {
      if (currentUser?._id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.photosOfUser(currentUser._id) });
        navigate(`/photos/${currentUser._id}`);
      }
    },
  });

  const handleChooseFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      // reset so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <AppBar position='static' className='topbar-appBar' elevation={2}>
      <Toolbar className='topbar-toolbar'>
        {/* Left - Developer name */}
        <Typography variant='h6' className='topbar-left'>
          Kushal Choudhary
        </Typography>

        {/* Center - Page context or greeting */}
        <Typography variant='h6' className='topbar-center' noWrap>
          {currentUser ? `Hi ${currentUser.first_name}` : rightText}
        </Typography>

        {/* Right - Add Photo, Advanced toggle and Logout */}
        <Box className='topbar-toggle'>
          {currentUser ? (
            <>
              <input
                id='file-input'
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleChooseFile}
              />
              <Button
                component='label'
                htmlFor='file-input'
                variant='outlined'
                size='small'
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', mr: 1 }}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Add Photo'}
              </Button>
              <FormControlLabel
                control={(
                  <Switch
                    checked={advancedEnabled}
                    onChange={handleToggle}
                    color='default'
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#ffffffff',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#ffffffff',
                      },
                    }}
                    inputProps={{ 'aria-label': 'Enable advanced features' }}
                  />
                )}
                label='Advanced'
                labelPlacement='start'
                sx={{ color: 'white', fontSize: '0.9rem', mr: 1 }}
              />
              <button
                type='button'
                onClick={() => logoutMutation.mutate()}
                className='logout-btn'
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: 4,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
