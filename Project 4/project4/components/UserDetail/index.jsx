import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Paper,
  Typography,
  Stack,
  Button,
  Avatar,
  Divider,
  Box,
} from '@mui/material';
import './styles.css';
import {
  fetchUserById,
  fetchUserHighlights,
  queryKeys,
} from '../../api/index.js';

/**
 * UserDetail
 * Shows profile info in a horizontal card (avatar left, details right).
 */
export default function UserDetail() {
  const { userId } = useParams();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => fetchUserById(userId),
  });
  const { data: highlights } = useQuery({
    queryKey: queryKeys.userHighlights(userId),
    queryFn: () => fetchUserHighlights(userId),
  });

  if (isLoading || !user) {
    return <Typography className='detail-loading'>Loading...</Typography>;
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <Paper elevation={0} className='user-detail-wide'>
      {/* Left — Avatar */}
      <Box className='user-detail-avatar-section'>
        <Avatar className='user-detail-avatar-large'>{initials}</Avatar>
      </Box>

      {/* Right — Info */}
      <Box className='user-detail-info'>
        <Typography variant='h5' className='user-detail-name'>
          {user.first_name} {user.last_name}
        </Typography>

        <Divider className='user-detail-divider' />

        <Stack spacing={0.8} className='user-detail-meta'>
          <Typography variant='body1' className='meta-line'>
            📍 <span>{user.location || 'Unknown location'}</span>
          </Typography>
          <Typography variant='body1' className='meta-line'>
            💼 <span>{user.occupation || 'No occupation listed'}</span>
          </Typography>
          <Typography variant='body1' className='meta-line'>
            📝 <span>{user.description || 'No description available'}</span>
          </Typography>
        </Stack>

        {/* Usage section */}
        <Box className='usage-section'>
          <Typography variant='subtitle1' className='usage-title'>
            Usage
          </Typography>
          <Stack direction='row' spacing={2} className='usage-cards'>
            {/* Most recent photo */}
            <Button
              variant='text'
              className='usage-card'
              component={Link}
              to={
                highlights?.mostRecent
                  ? `/photos/${user._id}/${highlights.mostRecent._id}`
                  : `/photos/${user._id}`
              }
              disabled={!highlights?.mostRecent}
            >
              <Box className='usage-card-inner'>
                {highlights?.mostRecent ? (
                  <img
                    className='usage-thumb'
                    alt='most recent'
                    src={`/images/${highlights.mostRecent.file_name}`}
                  />
                ) : (
                  <Box className='usage-thumb-empty' />
                )}
                <Box className='usage-meta'>
                  <Typography variant='body2' className='usage-label'>
                    Most Recent
                  </Typography>
                  <Typography variant='caption' className='usage-sub'>
                    {highlights?.mostRecent
                      ? new Date(
                          highlights.mostRecent.date_time
                        ).toLocaleString()
                      : 'No photos'}
                  </Typography>
                </Box>
              </Box>
            </Button>

            {/* Most commented photo */}
            <Button
              variant='text'
              className='usage-card'
              component={Link}
              to={
                highlights?.mostCommented
                  ? `/photos/${user._id}/${highlights.mostCommented._id}`
                  : `/photos/${user._id}`
              }
              disabled={!highlights?.mostCommented}
            >
              <Box className='usage-card-inner'>
                {highlights?.mostCommented ? (
                  <img
                    className='usage-thumb'
                    alt='most commented'
                    src={`/images/${highlights.mostCommented.file_name}`}
                  />
                ) : (
                  <Box className='usage-thumb-empty' />
                )}
                <Box className='usage-meta'>
                  <Typography variant='body2' className='usage-label'>
                    Most Commented
                  </Typography>
                  <Typography variant='caption' className='usage-sub'>
                    {highlights?.mostCommented
                      ? `${highlights.mostCommented.commentsCount} comments`
                      : 'No photos'}
                  </Typography>
                </Box>
              </Box>
            </Button>
          </Stack>
        </Box>

        <Button
          variant='contained'
          size='medium'
          component={Link}
          to={`/photos/${user._id}`}
          className='view-photos-btn-wide'
        >
          View Photos
        </Button>
      </Box>
    </Paper>
  );
}
