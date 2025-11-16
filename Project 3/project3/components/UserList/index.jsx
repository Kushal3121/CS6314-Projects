import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Stack,
  Chip,
  Avatar,
} from '@mui/material';
import './styles.css';
import useAppStore from '../../store/useAppStore.js';
import { fetchUserCounts, fetchUsers, queryKeys } from '../../api/index.js';

/**
 * UserList
 * Sidebar that displays all users.
 * When Advanced Mode is ON, shows photo/comment counts.
 */
export default function UserList() {
  const location = useLocation();
  const navigate = useNavigate();
  const advancedEnabled = useAppStore((s) => s.advancedEnabled);
  const currentUser = useAppStore((s) => s.currentUser);

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
    enabled: Boolean(currentUser),
  });

  const { data: counts = [] } = useQuery({
    queryKey: queryKeys.userCounts,
    queryFn: fetchUserCounts,
    enabled: Boolean(currentUser && advancedEnabled),
  });

  const getCount = (id, type) => {
    const entry = counts.find((c) => c._id === id);
    if (!entry) return 0;
    return type === 'photos' ? entry.photoCount : entry.commentCount;
  };

  return (
    <Paper elevation={0} className='userlist-card'>
      <Typography variant='subtitle2' className='userlist-title'>
        USERS
      </Typography>

      <Divider className='userlist-divider' />

      <List dense className='userlist-list'>
        {users.map((u) => {
          const isSelected =
            location.pathname.startsWith(`/users/${u._id}`) ||
            location.pathname.startsWith(`/photos/${u._id}`) ||
            location.pathname === `/comments/${u._id}`;

          const initials = `${u.first_name?.[0] || ''}${
            u.last_name?.[0] || ''
          }`;

          return (
            <ListItemButton
              key={u._id}
              component={Link}
              to={`/users/${u._id}`}
              selected={isSelected}
              className={`userlist-item ${
                isSelected ? 'userlist-selected' : ''
              }`}
            >
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  bgcolor: isSelected ? '#1976d2' : '#90caf9',
                  color: isSelected ? '#fff' : '#0d47a1',
                  mr: 1.5,
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>

              {/* Name */}
              <ListItemText
                primary={`${u.first_name} ${u.last_name}`}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#1976d2' : '#333',
                }}
              />

              {/* Count bubbles (if advanced mode enabled) */}
              {advancedEnabled && (
                <Stack direction='row' spacing={0.5}>
                  <Chip
                    size='small'
                    label={getCount(u._id, 'photos')}
                    className='chip-photo'
                  />
                  <Chip
                    size='small'
                    label={getCount(u._id, 'comments')}
                    className='chip-comment'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/comments/${u._id}`);
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
