import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function TopBar() {
  const location = useLocation();
  const [rightText, setRightText] = useState('');

  useEffect(() => {
    async function update() {
      const path = location.pathname;

      if (path.startsWith('/users/')) {
        const userId = path.split('/')[2];
        const { data } = await axios.get(`/user/${userId}`);
        setRightText(`${data.first_name} ${data.last_name}`);
      } else if (path.startsWith('/photos/')) {
        const userId = path.split('/')[2];
        const { data } = await axios.get(`/user/${userId}`);
        setRightText(`Photos of ${data.first_name} ${data.last_name}`);
      } else if (path === '/users') {
        setRightText('User List');
      } else {
        setRightText('');
      }
    }

    update();
  }, [location]);

  return (
    <AppBar position='static'>
      <Toolbar>
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Kushal Choudhary
        </Typography>
        <Typography variant='h6'>{rightText}</Typography>
      </Toolbar>
    </AppBar>
  );
}
