import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

/**
 * TopBar:
 * - Shows developer name (left)
 * - Shows context for current view (right)
 *   -> User Name OR "Photos of ..." OR "User List"
 */
export default function TopBar() {
  const location = useLocation();
  const [rightText, setRightText] = useState('');

  useEffect(() => {
    /**
     * Derive the correct right-hand text based on current route.
     * Uses axios to fetch the user name when needed.
     */
    async function updateRightText() {
      const path = location.pathname;

      // When viewing a specific User Detail
      if (path.startsWith('/users/')) {
        const userId = path.split('/')[2];
        const { data } = await axios.get(`/user/${userId}`);
        setRightText(`${data.first_name} ${data.last_name}`);
      }

      // When viewing a specific User's Photos
      else if (path.startsWith('/photos/')) {
        const userId = path.split('/')[2];
        const { data } = await axios.get(`/user/${userId}`);
        setRightText(`Photos of ${data.first_name} ${data.last_name}`);
      }

      // When viewing user list
      else if (path === '/users') {
        setRightText('User List');
      }

      // Default fallback for home or unknown route
      else {
        setRightText('');
      }
    }

    updateRightText();
  }, [location]);

  return (
    <AppBar
      position='static'
      elevation={3}
      color='primary'
      className='topbar-appBar'
    >
      <Toolbar className='topbar-toolbar'>
        <Typography variant='h6' className='topbar-left'>
          Kushal Choudhary
        </Typography>
        <Typography variant='h6' className='topbar-right'>
          {rightText}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
