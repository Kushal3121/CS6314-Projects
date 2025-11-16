import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { loginRequest, registerRequest, queryKeys } from '../../api/index.js';
import useAppStore from '../../store/useAppStore.js';
import './styles.css'; // <— add this

export default function LoginRegister() {
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [registerState, setRegisterState] = useState({
    login_name: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    location: '',
    occupation: '',
    description: '',
  });
  const [registerMsg, setRegisterMsg] = useState('');
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ login_name, password }) =>
      loginRequest({ login_name, password }),
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCounts });
      navigate(`/users/${user._id}`);
    },
    onError: (e) => {
      const msg =
        e?.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => registerRequest(payload),
    onSuccess: () => {
      setRegisterMsg('Success: Account created. You can now log in.');
      setRegisterState({
        login_name: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        location: '',
        occupation: '',
        description: '',
      });
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || 'Registration failed.';
      setRegisterMsg(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!loginName.trim() || !loginPassword.trim()) {
      setError('Please enter login name and password.');
      return;
    }
    loginMutation.mutate({
      login_name: loginName.trim(),
      password: loginPassword.trim(),
    });
  };

  return (
    <Box
      className='loginPage' // handles no-scroll + perfect centering
      sx={{
        // smooth gradient backdrop (do NOT use `bgcolor` for gradients)
        background:
          'radial-gradient(1200px 600px at 10% 10%, #e3f2fd 0%, transparent 60%), radial-gradient(1200px 600px at 90% 10%, #f5f7fa 0%, transparent 60%), linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%)',
      }}
    >
      <Paper
        elevation={0}
        className='loginCard'
        sx={{
          p: { xs: 3.5, sm: 5 },
          width: '100%',
          maxWidth: 440,
          borderRadius: 4,
          backdropFilter: 'saturate(160%) blur(10px)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
          boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Stack spacing={2.5} alignItems='center'>
          <AccountCircleIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant='h5' fontWeight={700}>
            Welcome Back
          </Typography>
          <Typography
            variant='body2'
            sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}
          >
            Please sign in to continue to your Photo App
          </Typography>

          <Divider sx={{ width: '100%', my: 0.5 }} />

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={1.75}>
              <TextField
                label='Login Name'
                variant='outlined'
                fullWidth
                autoFocus
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder='e.g. ripley'
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                label='Password'
                type='password'
                variant='outlined'
                fullWidth
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              {error && (
                <Typography
                  role='alert'
                  variant='body2'
                  color='error'
                  sx={{ textAlign: 'center', mt: -0.5 }}
                >
                  {error}
                </Typography>
              )}

              <Button
                type='submit'
                variant='contained'
                startIcon={<LoginIcon />}
                disabled={loginMutation.isPending}
                sx={{
                  py: 1.2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  borderRadius: 2,
                  background:
                    'linear-gradient(45deg, #1976d2 0%, #42a5f5 100%)',
                  boxShadow:
                    '0 8px 16px rgba(25,118,210,0.25), 0 2px 6px rgba(25,118,210,0.25)',
                  '&:hover': {
                    background:
                      'linear-gradient(45deg, #1565c0 0%, #1e88e5 100%)',
                    boxShadow:
                      '0 10px 22px rgba(25,118,210,0.35), 0 4px 10px rgba(25,118,210,0.25)',
                  },
                }}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>

              <Typography
                variant='caption'
                sx={{ color: 'text.secondary', textAlign: 'center' }}
              >
                Try: malcolm, ripley, took, kenobi, ludgate, ousterhout
              </Typography>
            </Stack>
          </form>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Registration */}
          <Typography variant='h6' fontWeight={700}>
            Create Account
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRegisterMsg('');
              const {
                login_name,
                password,
                password2,
                first_name,
                last_name,
                location,
                occupation,
                description,
              } = registerState;
              if (
                !login_name.trim() ||
                !first_name.trim() ||
                !last_name.trim() ||
                !password.trim()
              ) {
                setRegisterMsg('Please fill required fields.');
                return;
              }
              if (password !== password2) {
                setRegisterMsg('Passwords do not match.');
                return;
              }
              registerMutation.mutate({
                login_name: login_name.trim(),
                password: password.trim(),
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                location,
                occupation,
                description,
              });
            }}
            style={{ width: '100%' }}
          >
            <Stack spacing={1.25}>
              <TextField
                label='Login Name'
                value={registerState.login_name}
                onChange={(e) =>
                  setRegisterState((s) => ({
                    ...s,
                    login_name: e.target.value,
                  }))
                }
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  label='First Name'
                  value={registerState.first_name}
                  onChange={(e) =>
                    setRegisterState((s) => ({
                      ...s,
                      first_name: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label='Last Name'
                  value={registerState.last_name}
                  onChange={(e) =>
                    setRegisterState((s) => ({
                      ...s,
                      last_name: e.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  label='Password'
                  type='password'
                  value={registerState.password}
                  onChange={(e) =>
                    setRegisterState((s) => ({
                      ...s,
                      password: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label='Confirm Password'
                  type='password'
                  value={registerState.password2}
                  onChange={(e) =>
                    setRegisterState((s) => ({
                      ...s,
                      password2: e.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>
              <TextField
                label='Location'
                value={registerState.location}
                onChange={(e) =>
                  setRegisterState((s) => ({ ...s, location: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label='Occupation'
                value={registerState.occupation}
                onChange={(e) =>
                  setRegisterState((s) => ({
                    ...s,
                    occupation: e.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label='Description'
                value={registerState.description}
                onChange={(e) =>
                  setRegisterState((s) => ({
                    ...s,
                    description: e.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={2}
              />
              {registerMsg && (
                <Typography
                  role='alert'
                  variant='body2'
                  color={
                    registerMsg.startsWith('Success') ? 'success.main' : 'error'
                  }
                >
                  {registerMsg}
                </Typography>
              )}
              <Button
                type='submit'
                variant='outlined'
                startIcon={<AccountCircleIcon />}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Registering...' : 'Register Me'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
