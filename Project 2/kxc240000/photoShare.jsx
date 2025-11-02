import React, { useState, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import { Grid, Paper } from '@mui/material';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import './styles/main.css';
import axios from 'axios';
import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';

// Set base URL for backend
axios.defaults.baseURL = 'http://localhost:3001';

// Context to store Advanced Features toggle state
export const AdvancedFeaturesContext = createContext();

function UserDetailRoute() {
  const { userId } = useParams();
  console.log('UserDetailRoute: userId is:', userId);
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const { userId } = useParams();
  return <UserPhotos userId={userId} />;
}

function PhotoShare() {
  // Global flag for enabling/disabling advanced features
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  return (
    <AdvancedFeaturesContext.Provider
      value={{ advancedEnabled, setAdvancedEnabled }}
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
                  <Route path='/users/:userId' element={<UserDetailRoute />} />
                  <Route
                    path='/photos/:userId/*'
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
  );
}

const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(<PhotoShare />);
