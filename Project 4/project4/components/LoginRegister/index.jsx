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
  IconButton,
  InputAdornment,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login.js';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1.js';
import Visibility from '@mui/icons-material/Visibility.js';
import VisibilityOff from '@mui/icons-material/VisibilityOff.js';
import { loginRequest, registerRequest, queryKeys } from '../../api/index.js';
import useAppStore from '../../store/useAppStore.js';
import './styles.css';

export default function LoginRegister() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginData, setLoginData] = useState({ login_name: '', password: '' });
  const [registerData, setRegisterData] = useState({
    login_name: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    location: '',
    occupation: '',
    description: '',
  });

  const navigate = useNavigate();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      navigate(`/users/${user._id}`);
    },
    onError: (e) =>
      setError(e?.response?.data?.message || 'Invalid credentials.'),
  });

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: () => {
      setSuccess('Account created successfully! Please log in.');
      setIsRegister(false);
      setRegisterData({
        login_name: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        location: '',
        occupation: '',
        description: '',
      });
    },
    onError: (e) =>
      setError(e?.response?.data?.message || 'Registration failed.'),
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!loginData.login_name || !loginData.password) {
      setError('Please enter login name and password.');
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const {
      login_name,
      first_name,
      last_name,
      password,
      confirmPassword,
      location,
      occupation,
      description,
    } = registerData;

    if (!login_name || !first_name || !last_name || !password) {
      setError('Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    registerMutation.mutate({
      login_name,
      first_name,
      last_name,
      password,
      location,
      occupation,
      description,
    });
  };

  return (
    <Box className='authWrapper'>
      <Paper elevation={6} className='authCardSingle hoverCard'>
        <Stack spacing={3} alignItems='center'>
          <Typography variant='h5' fontWeight={700}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Typography>
          <Typography
            variant='body2'
            sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 340 }}
          >
            {isRegister
              ? 'Fill in the details below to register and join the Photo App.'
              : 'Please sign in to continue to your Photo App.'}
          </Typography>

          {!isRegister && (
            <form
              onSubmit={handleLogin}
              style={{ width: '100%', maxWidth: 360 }}
            >
              <Stack spacing={2}>
                <TextField
                  label='Login Name'
                  fullWidth
                  value={loginData.login_name}
                  onChange={(e) =>
                    setLoginData((s) => ({ ...s, login_name: e.target.value }))
                  }
                />
                <TextField
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData((s) => ({ ...s, password: e.target.value }))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowPassword((p) => !p)}>
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {error && (
                  <Typography variant='body2' color='error' textAlign='center'>
                    {error}
                  </Typography>
                )}
                {success && (
                  <Typography
                    variant='body2'
                    color='success.main'
                    textAlign='center'
                  >
                    {success}
                  </Typography>
                )}
                <Button
                  type='submit'
                  variant='contained'
                  startIcon={<LoginIcon />}
                  className='primaryBtn'
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
              </Stack>
            </form>
          )}

          {isRegister && (
            <form
              onSubmit={handleRegister}
              style={{ width: '100%', maxWidth: 360 }}
            >
              <Stack spacing={1.5}>
                <TextField
                  label='Login Name'
                  fullWidth
                  value={registerData.login_name}
                  onChange={(e) =>
                    setRegisterData((s) => ({
                      ...s,
                      login_name: e.target.value,
                    }))
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label='First Name'
                    fullWidth
                    value={registerData.first_name}
                    onChange={(e) =>
                      setRegisterData((s) => ({
                        ...s,
                        first_name: e.target.value,
                      }))
                    }
                  />
                  <TextField
                    label='Last Name'
                    fullWidth
                    value={registerData.last_name}
                    onChange={(e) =>
                      setRegisterData((s) => ({
                        ...s,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </Stack>
                <TextField
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData((s) => ({ ...s, password: e.target.value }))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowPassword((p) => !p)}>
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label='Confirm Password'
                  type={showConfirm ? 'text' : 'password'}
                  fullWidth
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData((s) => ({
                      ...s,
                      confirmPassword: e.target.value,
                    }))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowConfirm((p) => !p)}>
                          {showConfirm ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label='Location'
                  fullWidth
                  value={registerData.location}
                  onChange={(e) =>
                    setRegisterData((s) => ({ ...s, location: e.target.value }))
                  }
                />
                <TextField
                  label='Occupation'
                  fullWidth
                  value={registerData.occupation}
                  onChange={(e) =>
                    setRegisterData((s) => ({
                      ...s,
                      occupation: e.target.value,
                    }))
                  }
                />
                <TextField
                  label='Description'
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={6}
                  value={registerData.description}
                  onChange={(e) =>
                    setRegisterData((s) => ({
                      ...s,
                      description: e.target.value,
                    }))
                  }
                  sx={{
                    '& textarea': {
                      overflowY: 'auto',
                      maxHeight: '120px',
                    },
                  }}
                />
                {error && (
                  <Typography variant='body2' color='error' textAlign='center'>
                    {error}
                  </Typography>
                )}
                <Button
                  type='submit'
                  variant='contained'
                  startIcon={<PersonAddAlt1Icon />}
                  className='primaryBtn'
                >
                  {registerMutation.isPending ? 'Registering...' : 'Register'}
                </Button>
              </Stack>
            </form>
          )}

          <Typography variant='body2' sx={{ mt: 2 }}>
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Button
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                    setSuccess('');
                  }}
                  className='linkBtn'
                >
                  Login here
                </Button>
              </>
            ) : (
              <>
                Don’t have an account?{' '}
                <Button
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                    setSuccess('');
                  }}
                  className='linkBtn'
                >
                  Register
                </Button>
              </>
            )}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
