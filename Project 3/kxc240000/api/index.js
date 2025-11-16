import apiClient from './client.js';

// Query Keys
export const queryKeys = {
  users: ['users'],
  user: (userId) => ['user', userId],
  userCounts: ['userCounts'],
  photosOfUser: (userId) => ['photosOfUser', userId],
  commentsOfUser: (userId) => ['commentsOfUser', userId],
};

// API Calls
export const fetchUsers = async () => {
  const { data } = await apiClient.get('/user/list');
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
  const { data } = await apiClient.get(`/photosOfUser/${userId}`);
  return data;
};

export const fetchCommentsOfUser = async (userId) => {
  const { data } = await apiClient.get(`/commentsOfUser/${userId}`);
  return data;
};

export const postComment = async ({ photoId, comment }) => {
  const { data } = await apiClient.post(`/commentsOfPhoto/${photoId}`, {
    comment,
  });
  return data;
};

export const loginRequest = async ({ login_name }) => {
  const { data } = await apiClient.post('/admin/login', { login_name });
  return data;
};

export const logoutRequest = async () => {
  const { data } = await apiClient.post('/admin/logout', {});
  return data;
};
