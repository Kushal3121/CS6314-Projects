import React, { useEffect, useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';
import { AdvancedFeaturesContext } from '../../photoShare.jsx';

/**
 * TopBar:
 * - Shows developer name (left)
 * - Shows context for current view (center/right)
 * - Adds a toggle for enabling Advanced Features
 */
export default function TopBar() {
  const location = useLocation();
  const [rightText, setRightText] = useState('');

  // Access global advanced feature state
  const { advancedEnabled, setAdvancedEnabled } = useContext(
    AdvancedFeaturesContext
  );

  useEffect(() => {
    async function updateRightText() {
      const path = location.pathname;

      if (path.startsWith('/users/')) {
        const userId = path.split('/')[2];
        try {
          const { data } = await axios.get(`/user/${userId}`);
          setRightText(`${data.first_name} ${data.last_name}`);
        } catch {
          setRightText('');
        }
      } else if (path.startsWith('/photos/')) {
        const userId = path.split('/')[2];
        try {
          const { data } = await axios.get(`/user/${userId}`);
          setRightText(`Photos of ${data.first_name} ${data.last_name}`);
        } catch {
          setRightText('');
        }
      } else if (path === '/users') {
        setRightText('User List');
      } else {
        setRightText('');
      }
    }

    updateRightText();
  }, [location]);

  // Toggle handler
  const handleToggle = (event) => {
    setAdvancedEnabled(event.target.checked);
  };

  return (
    <AppBar
      position='static'
      elevation={3}
      color='primary'
      className='topbar-appBar'
    >
      <Toolbar
        className='topbar-toolbar'
        sx={{ justifyContent: 'space-between', gap: 2 }}
      >
        {/* Left side — your name */}
        <Typography variant='h6' className='topbar-left'>
          Kushal Choudhary
        </Typography>

        {/* Center/right — dynamic route text */}
        <Typography variant='h6' className='topbar-right'>
          {rightText}
        </Typography>

        {/* Rightmost — Advanced Features toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={advancedEnabled}
              onChange={handleToggle}
              color='secondary'
              inputProps={{ 'aria-label': 'Enable advanced features' }}
            />
          }
          label='Advanced'
          labelPlacement='start'
          sx={{ color: 'white' }}
        />
      </Toolbar>
    </AppBar>
  );
}
