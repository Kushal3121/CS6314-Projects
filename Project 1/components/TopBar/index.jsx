import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

import './styles.css';

function TopBar() {
  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar>
        <Typography variant="h5" color="inherit">
          This is the TopBar component
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
