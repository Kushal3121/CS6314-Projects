import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Typography, Paper } from '@mui/material';
import {
  BrowserRouter, Route, Routes, useParams,
} from 'react-router-dom';

import './styles/main.css';
// Import mock setup - Remove this once you have implemented the actual API calls
import './lib/mockSetup.js';
import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';

function UserDetailRoute() {
  const { userId } = useParams();
  // eslint-disable-next-line no-console
  console.log('UserDetailRoute: userId is:', userId);
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const { userId } = useParams();
  return <UserPhotos userId={userId} />;
}

function PhotoShare() {
  return (
    <BrowserRouter basename="/photo-share.html">
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TopBar />
          </Grid>
          <div className="main-topbar-buffer" />
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList />
            </Paper>
          </Grid>
          <Grid item sm={9}>
            <Paper className="main-grid-item">
              <Routes>
                <Route
                  path="/"
                  element={(
                    <Typography variant="body1">
                      Welcome to your photosharing app! This
                      {' '}
                      <a href="https://mui.com/components/paper/" rel="noreferrer" target="_blank">Paper</a>
                      {' '}
                      component displays the main content of the application. The
                      {'sm={9}'}
                      {' '}
                      prop in the
                      {' '}
                      <a href="https://mui.com/components/grid/" rel="noreferrer" target="_blank">Grid</a>
                      {' '}
                      item
                      component makes it responsively display 9/12 of the
                      window. The Routes component enables us to conditionally
                      render different components to this part of the screen.
                      You don&apos;t need to display anything here on the
                      homepage, so you should delete this Route component once
                      you get started.
                    </Typography>
                  )}
                />
                <Route path="/users/:userId" element={<UserDetailRoute />} />
                <Route path="/photos/:userId" element={<UserPhotosRoute />} />
                <Route path="/users" element={<UserList />} />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(<PhotoShare />);
