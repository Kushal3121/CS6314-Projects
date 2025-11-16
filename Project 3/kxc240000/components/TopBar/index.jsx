import React, { useEffect, useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  FormControlLabel,
  Box,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';
import AdvancedFeaturesContext from '../../context/AdvancedFeaturesContext.js';

/**
 * TopBar
 * - Displays developer name on the left
 * - Shows contextual info (user, photos, comments) in the center
 * - Offers Advanced Mode toggle on the right
 */
export default function TopBar() {
  const location = useLocation();
  const [rightText, setRightText] = useState('');
  const { advancedEnabled, setAdvancedEnabled } = useContext(
    AdvancedFeaturesContext
  );

  useEffect(() => {
    async function updateRightText() {
      const path = location.pathname;

      try {
        if (path.startsWith('/users/')) {
          const userId = path.split('/')[2];
          const { data } = await axios.get(`/user/${userId}`);
          setRightText(`${data.first_name} ${data.last_name}`);
        } else if (path.startsWith('/photos/')) {
          const userId = path.split('/')[2];
          const { data } = await axios.get(`/user/${userId}`);
          setRightText(`Photos of ${data.first_name} ${data.last_name}`);
        } else if (path.startsWith('/comments/')) {
          const userId = path.split('/')[2];
          const { data } = await axios.get(`/user/${userId}`);
          setRightText(`Comments by ${data.first_name} ${data.last_name}`);
        } else if (path === '/users') {
          setRightText('All Users');
        } else {
          setRightText('');
        }
      } catch {
        setRightText('');
      }
    }

    updateRightText();
  }, [location]);

  const handleToggle = (event) => {
    setAdvancedEnabled(event.target.checked);
  };

  return (
    <AppBar position='static' className='topbar-appBar' elevation={2}>
      <Toolbar className='topbar-toolbar'>
        {/* Left - Developer name */}
        <Typography variant='h6' className='topbar-left'>
          Kushal Choudhary
        </Typography>

        {/* Center - Page context */}
        <Typography variant='h6' className='topbar-center' noWrap>
          {rightText}
        </Typography>

        {/* Right - Advanced toggle */}
        <Box className='topbar-toggle'>
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
            sx={{ color: 'white', fontSize: '0.9rem' }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
