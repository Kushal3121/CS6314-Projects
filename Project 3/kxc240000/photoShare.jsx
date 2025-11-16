import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Grid, Paper } from '@mui/material';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import './styles/main.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';
import UserComments from './components/UserComments';
import AdvancedFeaturesContext from './context/AdvancedFeaturesContext.js';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

// Context provided from separate module to avoid import cycles

function UserDetailRoute() {
  const { userId } = useParams();
  console.log('UserDetailRoute: userId is:', userId);
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const { userId } = useParams();
  return <UserPhotos userId={userId} />;
}

function UserCommentsRoute() {
  const { userId } = useParams();
  return <UserComments userId={userId} />;
}

function PhotoShare() {
  // Global flag for enabling/disabling advanced features
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AdvancedFeaturesContext.Provider
        value={useMemo(
          () => ({ advancedEnabled, setAdvancedEnabled }),
          [advancedEnabled]
        )}
      >
        <BrowserRouter>
          <div>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TopBar />
              </Grid>
              <div className='main-topbar-buffer' />
              <Grid item sm={3}>
                <Paper className='main-grid-item'>
                  <UserList />
                </Paper>
              </Grid>
              <Grid item sm={9}>
                <Paper className='main-grid-item'>
                  <Routes>
                    <Route
                      path='/users/:userId'
                      element={<UserDetailRoute />}
                    />
                    <Route
                      path='/comments/:userId'
                      element={<UserCommentsRoute />}
                    />

                    {/* photos list + optional specific photo */}
                    <Route
                      path='/photos/:userId'
                      element={<UserPhotosRoute />}
                    />
                    <Route
                      path='/photos/:userId/:photoId'
                      element={<UserPhotosRoute />}
                    />

                    <Route path='/users' element={<UserList />} />
                  </Routes>
                </Paper>
              </Grid>
            </Grid>
          </div>
        </BrowserRouter>
      </AdvancedFeaturesContext.Provider>
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(<PhotoShare />);
