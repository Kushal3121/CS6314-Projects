import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import './styles.css';

export default function UserList() {
  // Local state that stores list of all users
  const [users, setUsers] = useState([]);

  // useLocation helps identify current URL for highlighting active user
  const location = useLocation();

  /**
   * Load users on initial render.
   * Using axios to fetch from server OR mock depending on environment.
   */
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

    // cleanup function to avoid state update after unmount
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Paper elevation={0} className='userlist-card'>
      {/* Section title */}
      <Typography variant='subtitle2' className='userlist-title'>
        Users
      </Typography>

      <Divider className='userlist-divider' />

      {/* Render each user as a navigable list item */}
      <List dense className='userlist-list'>
        {users.map((u) => {
          // Highlight if current route matches this user
          const isSelected =
            location.pathname === `/users/${u._id}` ||
            location.pathname === `/photos/${u._id}`;

          return (
            <ListItemButton
              key={u._id}
              component={Link}
              to={`/users/${u._id}`}
              selected={isSelected} // MUI-controlled styling
              className='userlist-item'
            >
              <ListItemText primary={`${u.first_name} ${u.last_name}`} />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
