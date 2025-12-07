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
import {
  fetchUserCounts,
  fetchUsers,
  fetchUserLastActivities,
  queryKeys,
} from '../../api/index.js';

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
  const activityRefreshMs = useAppStore((s) => s.activityRefreshMs);

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

  // Last activity per user (auto-refresh)
  const { data: lastActivities = [] } = useQuery({
    queryKey: queryKeys.userLastActivities,
    queryFn: fetchUserLastActivities,
    enabled: Boolean(currentUser),
    refetchInterval: activityRefreshMs,
  });

  const activityMap =
    Array.isArray(lastActivities) &&
    new Map(lastActivities.map((a) => [a.user_id, a]));
  const typeToText = {
    photo_upload: 'posted a photo',
    comment_added: 'added a comment',
    user_register: 'registered',
    user_login: 'logged in',
    user_logout: 'logged out',
  };
  const formatRelativeTime = (input) => {
    const d = new Date(input);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.max(1, Math.floor(diffMs / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 4) return `${wk}w ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
  };

  const getCount = (id, type) => {
    const entry = counts.find((c) => c._id === id);
    if (!entry) return 0;
    return type === 'photos' ? entry.photoCount : entry.commentCount;
  };

  return (
    <Paper elevation={0} className='userlist-card'>
      <Typography variant='subtitle2' className='userlist-title'>
        CURRENT USER
      </Typography>

      <Divider className='userlist-divider' />
      {currentUser &&
        (() => {
          const u = currentUser;
          const isSelected =
            location.pathname.startsWith(`/users/${u._id}`) ||
            location.pathname.startsWith(`/photos/${u._id}`) ||
            location.pathname === `/comments/${u._id}`;
          const initials = `${u.first_name?.[0] || ''}${
            u.last_name?.[0] || ''
          }`;
          const activity = activityMap && activityMap.get(u._id);
          return (
            <List dense className='userlist-list'>
              <ListItemButton
                key={`current-${u._id}`}
                component={Link}
                to={`/users/${u._id}`}
                selected={isSelected}
                className={`userlist-item ${
                  isSelected ? 'userlist-selected' : ''
                }`}
              >
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
                <ListItemText
                  primary={`${u.first_name} ${u.last_name}`}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#1976d2' : '#333',
                  }}
                  secondary={
                    activity ? (
                      <span className='user-activity'>
                        {activity.type === 'photo_upload' &&
                        activity.photo_file_name ? (
                          <Avatar
                            src={`/images/${activity.photo_file_name}`}
                            variant='rounded'
                            className='user-activity-thumb'
                          />
                        ) : null}
                        <span className='user-activity-text'>
                          {typeToText[activity.type] || activity.type}
                          {' · '}
                          <span className='user-activity-time'>
                            {formatRelativeTime(activity.date_time)}
                          </span>
                        </span>
                      </span>
                    ) : null
                  }
                  secondaryTypographyProps={{ component: 'div' }}
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
            </List>
          );
        })()}

      <Typography
        variant='subtitle2'
        className='userlist-title userlist-title-secondary'
      >
        ALL USERS
      </Typography>
      <Divider className='userlist-divider' />

      <List dense className='userlist-list'>
        {users
          .filter((u) => u._id !== currentUser?._id)
          .map((u) => {
            const isSelected =
              location.pathname.startsWith(`/users/${u._id}`) ||
              location.pathname.startsWith(`/photos/${u._id}`) ||
              location.pathname === `/comments/${u._id}`;

            const initials = `${u.first_name?.[0] || ''}${
              u.last_name?.[0] || ''
            }`;

            const activity = activityMap && activityMap.get(u._id);

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
                  secondary={
                    activity ? (
                      <span className='user-activity'>
                        {activity.type === 'photo_upload' &&
                        activity.photo_file_name ? (
                          <Avatar
                            src={`/images/${activity.photo_file_name}`}
                            variant='rounded'
                            className='user-activity-thumb'
                          />
                        ) : null}
                        <span className='user-activity-text'>
                          {typeToText[activity.type] || activity.type}
                          {' · '}
                          <span className='user-activity-time'>
                            {formatRelativeTime(activity.date_time)}
                          </span>
                        </span>
                      </span>
                    ) : null
                  }
                  secondaryTypographyProps={{
                    component: 'div',
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
