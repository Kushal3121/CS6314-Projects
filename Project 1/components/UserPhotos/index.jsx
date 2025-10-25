import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

import './styles.css';

function UserPhotos({ userId }) {
  return (
    <Typography variant="body1">
      This should be the UserPhotos view of the PhotoShare app. Since it is
      invoked from React Router the params from the route will be in property
      userId. So this should show photos of user:
      {' '}
      {userId}
      . You can fetch the
      model for the user&apos;s photos from API: /photosOfUser/:id
    </Typography>
  );
}

UserPhotos.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserPhotos;
