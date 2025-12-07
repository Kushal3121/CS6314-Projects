import React from 'react';
import ReactDOM from 'react-dom/client';
import { Grid, Paper } from '@mui/material';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import './styles/main.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopBar from './components/TopBar/index.jsx';
import UserDetail from './components/UserDetail/index.jsx';
import UserList from './components/UserList/index.jsx';
import UserPhotos from './components/UserPhotos/index.jsx';
import UserComments from './components/UserComments/index.jsx';
import LoginRegister from './components/LoginRegister/index.jsx';
import Activities from './components/Activities/index.jsx';
import Favorites from './components/Favorites/index.jsx';
import useAppStore from './store/useAppStore.js';

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
  const currentUser = useAppStore((s) => s.currentUser);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar />
            </Grid>
            <div className='main-topbar-buffer' />
            {currentUser ? (
              <Grid item sm={3}>
                <Paper className='main-grid-item'>
                  <UserList />
                </Paper>
              </Grid>
            ) : null}
            <Grid item sm={currentUser ? 9 : 12}>
              <Paper className='main-grid-item'>
                <MainContentRoutes />
              </Paper>
            </Grid>
          </Grid>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function MainContentRoutes() {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) {
    return <LoginRegister />;
  }
  return (
    <Routes>
      <Route path='/users/:userId' element={<UserDetailRoute />} />
      <Route path='/comments/:userId' element={<UserCommentsRoute />} />
      {/* photos list + optional specific photo */}
      <Route path='/photos/:userId' element={<UserPhotosRoute />} />
      <Route path='/photos/:userId/:photoId' element={<UserPhotosRoute />} />
      <Route path='/favorites' element={<Favorites />} />
      <Route path='/activities' element={<Activities />} />
      <Route path='/users' element={<UserList />} />
      <Route path='*' element={<UserList />} />
    </Routes>
  );
}
const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(<PhotoShare />);
