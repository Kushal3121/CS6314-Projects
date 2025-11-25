import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  FormHelperText,
  Autocomplete,
  TextField,
  Stack,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './styles.css';
import {
  fetchUserById,
  fetchUsers,
  logoutRequest,
  uploadPhoto,
  queryKeys,
  deleteUserAccount,
} from '../../api/index.js';
import useAppStore from '../../store/useAppStore.js';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';

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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [visibility, setVisibility] = useState('public'); // public | private | shared
  const [sharedWith, setSharedWith] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: allUsers = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
    enabled: Boolean(currentUser),
  });

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
    enabled: Boolean(
      userId &&
        (pathPrefix === '/users' ||
          pathPrefix === '/photos' ||
          pathPrefix === '/comments')
    ),
  });

  const rightText = useMemo(() => {
    if (!currentUser) {
      if (location.pathname === '/login-register') {
        return 'Login / Register';
      }
      return '';
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
    if (location.pathname === '/activities') {
      return 'Recent Activities';
    }
    if (location.pathname === '/favorites') {
      return 'My Favorites';
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
    mutationFn: ({ file, sharedWithIds }) =>
      uploadPhoto(file, { sharedWith: sharedWithIds }),
    onSuccess: () => {
      if (currentUser?._id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.photosOfUser(currentUser._id),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
        queryClient.invalidateQueries({ queryKey: queryKeys.activities(5) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userHighlights(currentUser._id),
        });
        navigate(`/photos/${currentUser._id}`);
      }
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteUserAccount(currentUser._id),
    onSuccess: () => {
      setDeleteOpen(false);
      clearCurrentUser();
      queryClient.clear();
      navigate('/users');
    },
  });

  const startUploadFlow = () => {
    setSelectedFile(null);
    setVisibility('public');
    setSharedWith([]);
    setUploadOpen(true);
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) return;
    let sharedWithIds;
    if (visibility === 'private') {
      sharedWithIds = []; // owner only
    } else if (visibility === 'shared') {
      sharedWithIds = sharedWith.map((u) => u._id);
    }
    uploadMutation.mutate({ file: selectedFile, sharedWithIds });
    setUploadOpen(false);
  };

  return (
    <AppBar position='static' className='topbar-appBar' elevation={2}>
      <Toolbar className='topbar-toolbar'>
        {/* Left - Greeting / login prompt */}
        <Typography variant='h6' className='topbar-left'>
          {currentUser ? `Hi ${currentUser.first_name}` : 'Please Login'}
        </Typography>

        {/* Center - Page context */}
        <Typography variant='h6' className='topbar-center' noWrap>
          {rightText}
        </Typography>

        {/* Right - Actions */}
        <Box className='topbar-toggle'>
          {currentUser ? (
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              sx={{ flexWrap: 'nowrap' }}
            >
              <Button
                variant='outlined'
                size='small'
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.6)',
                  textTransform: 'none',
                }}
                onClick={() => navigate('/activities')}
              >
                Activities
              </Button>
              <Button
                variant='outlined'
                size='small'
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.6)',
                  textTransform: 'none',
                }}
                onClick={() => navigate('/favorites')}
              >
                Favorites
              </Button>
              <Button
                variant='outlined'
                size='small'
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.6)',
                  textTransform: 'none',
                }}
                disabled={uploadMutation.isPending}
                onClick={startUploadFlow}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Add Photo'}
              </Button>
              <Button
                variant='outlined'
                size='small'
                color='error'
                sx={{
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: 'white',
                }}
                onClick={() => setDeleteOpen(true)}
              >
                Delete Account
              </Button>
              <Dialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                maxWidth='sm'
                fullWidth
              >
                <DialogTitle>Upload Photo</DialogTitle>
                <DialogContent dividers>
                  <Box sx={{ my: 1 }}>
                    <Button variant='outlined' component='label'>
                      {selectedFile ? 'Change File' : 'Choose File'}
                      <input
                        type='file'
                        accept='image/*'
                        hidden
                        onChange={handleSelectFile}
                      />
                    </Button>
                    <Typography variant='caption' sx={{ ml: 1 }}>
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </Typography>
                  </Box>
                  <FormControl component='fieldset' sx={{ mt: 1 }}>
                    <FormLabel component='legend'>Visibility</FormLabel>
                    <RadioGroup
                      row
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <FormControlLabel
                        value='public'
                        control={<Radio />}
                        label='Public'
                      />
                      <FormControlLabel
                        value='private'
                        control={<Radio />}
                        label='Only me'
                      />
                      <FormControlLabel
                        value='shared'
                        control={<Radio />}
                        label='Share with...'
                      />
                    </RadioGroup>
                    {visibility === 'shared' ? (
                      <Autocomplete
                        multiple
                        options={allUsers.filter(
                          (u) => u._id !== currentUser._id
                        )}
                        getOptionLabel={(o) => `${o.first_name} ${o.last_name}`}
                        value={sharedWith}
                        onChange={(e, val) => setSharedWith(val)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Select users'
                            placeholder='Type to search users'
                          />
                        )}
                        sx={{ mt: 1 }}
                      />
                    ) : null}
                    <FormHelperText>
                      Public: everyone. Only me: just you. Share with: only
                      selected users.
                    </FormHelperText>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
                  <Button
                    variant='contained'
                    onClick={handleConfirmUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                  >
                    Upload
                  </Button>
                </DialogActions>
              </Dialog>
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
              <Button
                variant='outlined'
                size='small'
                onClick={() => logoutMutation.mutate()}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.6)',
                  textTransform: 'none',
                }}
              >
                Logout
              </Button>
            </Stack>
          ) : null}
          <ConfirmDialog
            open={deleteOpen}
            title='Delete Account'
            description='This will permanently delete your user, photos, and comments. This action cannot be undone.'
            confirmText='Delete'
            confirmColor='error'
            loading={deleteAccountMutation?.isPending}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => deleteAccountMutation.mutate()}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
