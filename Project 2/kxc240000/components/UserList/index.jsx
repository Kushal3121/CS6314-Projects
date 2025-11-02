import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import './styles.css';
import { AdvancedFeaturesContext } from '../../photoShare.jsx';

export default function UserList() {
  // Local state for user list and counts
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Access the global advanced mode from context
  const { advancedEnabled } = useContext(AdvancedFeaturesContext);

  // Load all users initially
  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      try {
        const { data } = await axios.get('/user/list');
        if (mounted) setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }
    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // Load user photo/comment counts when Advanced Mode is ON
  useEffect(() => {
    if (!advancedEnabled) return;
    let mounted = true;
    async function loadCounts() {
      try {
        const { data } = await axios.get('/user/counts');
        if (mounted) setCounts(data);
      } catch (err) {
        console.error('Failed to load counts:', err);
      }
    }
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [advancedEnabled]);

  // Helper to find count for given user
  const getCount = (id, type) => {
    const entry = counts.find((c) => c._id === id);
    if (!entry) return 0;
    return type === 'photos' ? entry.photoCount : entry.commentCount;
  };

  return (
    <Paper elevation={0} className='userlist-card'>
      {/* Sidebar Header */}
      <Typography variant='subtitle2' className='userlist-title'>
        Users
      </Typography>

      <Divider className='userlist-divider' />

      {/* Sidebar List */}
      <List dense className='userlist-list'>
        {users.map((u) => {
          // Only highlight if the user route or photo route is active
          const isSelected =
            location.pathname.startsWith(`/users/${u._id}`) ||
            location.pathname.startsWith(`/photos/${u._id}`);

          // Optional: faint highlight for comments page
          const isOnComments = location.pathname === `/comments/${u._id}`;

          return (
            <ListItemButton
              key={u._id}
              component={Link}
              to={`/users/${u._id}`}
              selected={isSelected || isOnComments}
              className='userlist-item'
            >
              <ListItemText primary={`${u.first_name} ${u.last_name}`} />

              {/* Only show bubbles if Advanced Mode is enabled */}
              {advancedEnabled && (
                <Stack direction='row' spacing={1}>
                  {/* Green bubble — photo count */}
                  <Chip
                    size='small'
                    label={getCount(u._id, 'photos')}
                    sx={{
                      backgroundColor: '#4caf50',
                      color: 'white',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />

                  {/* Red bubble — comment count */}
                  <Chip
                    size='small'
                    label={getCount(u._id, 'comments')}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // prevent parent link click
                      navigate(`/comments/${u._id}`); // go to comments page
                    }}
                    sx={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      fontWeight: 600,
                      height: 22,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#d32f2f',
                      },
                    }}
                  />
                </Stack>
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
