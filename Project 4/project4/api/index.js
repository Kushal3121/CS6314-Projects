import apiClient from './client.js';

// Query Keys
export const queryKeys = {
  users: ['users'],
  user: (userId) => ['user', userId],
  userCounts: ['userCounts'],
  photosOfUser: (userId) => ['photosOfUser', userId],
  commentsOfUser: (userId) => ['commentsOfUser', userId],
  userHighlights: (userId) => ['userHighlights', userId],
  mentionsOfUser: (userId) => ['mentionsOfUser', userId],
  activities: (limit = 5) => ['activities', limit],
  userLastActivities: ['userLastActivities'],
  favorites: ['favorites'],
};

// API Calls
export const fetchUsers = async () => {
  const { data } = await apiClient.get('/user/list', {
    params: { all: 1 },
  });
  return data;
};

export const fetchUserCounts = async () => {
  const { data } = await apiClient.get('/user/counts');
  return data;
};

export const fetchUserById = async (userId) => {
  const { data } = await apiClient.get(`/user/${userId}`);
  return data;
};

export const fetchPhotosOfUser = async (userId) => {
  const { data } = await apiClient.get(`/photosOfUser/${userId}`, {
    params: { meta: 1 },
  });
  return data;
};

export const fetchCommentsOfUser = async (userId) => {
  const { data } = await apiClient.get(`/commentsOfUser/${userId}`);
  return data;
};

export const fetchUserHighlights = async (userId) => {
  const { data } = await apiClient.get(`/user/${userId}/highlights`);
  return data;
};
export const postComment = async ({ photoId, comment }) => {
  const { data } = await apiClient.post(`/commentsOfPhoto/${photoId}`, {
    comment,
  });
  return data;
};

export const loginRequest = async ({ login_name, password }) => {
  const { data } = await apiClient.post('/admin/login', {
    login_name,
    password,
  });
  return data;
};

export const logoutRequest = async () => {
  const { data } = await apiClient.post('/admin/logout', {});
  return data;
};

export const uploadPhoto = async (file, options = {}) => {
  const form = new FormData();
  // Server (and tests) expect field name 'uploadedphoto'
  form.append('uploadedphoto', file);
  if (Array.isArray(options.sharedWith)) {
    form.append('shared_with', JSON.stringify(options.sharedWith));
  }
  const { data } = await apiClient.post('/photos/new', form);
  return data;
};

export const registerRequest = async (payload) => {
  const { data } = await apiClient.post('/user', payload);
  return data;
};

export const fetchMentionsOfUser = async (userId) => {
  const { data } = await apiClient.get(`/mentionsOfUser/${userId}`);
  return data;
};

export const fetchActivities = async (limit = 5) => {
  const { data } = await apiClient.get('/activities', {
    params: { limit },
  });
  return data;
};

export const fetchUserLastActivities = async () => {
  const { data } = await apiClient.get('/activities/last-by-user');
  return data;
};

// Deletions
export const deletePhoto = async (photoId) => {
  const { data } = await apiClient.delete(`/photos/${photoId}`);
  return data;
};

export const deleteComment = async ({ photoId, commentId }) => {
  const { data } = await apiClient.delete(
    `/commentsOfPhoto/${photoId}/${commentId}`
  );
  return data;
};

export const deleteUserAccount = async (userId) => {
  const { data } = await apiClient.delete(`/user/${userId}`);
  return data;
};

export const likePhoto = async (photoId) => {
  const { data } = await apiClient.post(`/photos/${photoId}/like`, {});
  return data;
};

export const unlikePhoto = async (photoId) => {
  const { data } = await apiClient.post(`/photos/${photoId}/unlike`, {});
  return data;
};

// Favorites
export const fetchFavorites = async () => {
  const { data } = await apiClient.get('/favorites');
  return data;
};

export const favoritePhoto = async (photoId) => {
  const { data } = await apiClient.post(`/favorites/${photoId}`, {});
  return data;
};

export const unfavoritePhoto = async (photoId) => {
  const { data } = await apiClient.delete(`/favorites/${photoId}`);
  return data;
};
