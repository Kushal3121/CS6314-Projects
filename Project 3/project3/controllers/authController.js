import User from '../schema/user.js';

export async function login(req, res) {
  const { login_name, password } = req.body || {};
  if (!login_name || !password) {
    return res.status(400).json({ message: 'login_name and password required' });
  }
  try {
    const user = await User.findOne({ login_name }).lean();
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    req.session.user = {
      _id: user._id.toString(),
      login_name: user.login_name,
    };
    const { _id, first_name, last_name, login_name: ln } = user;
    return res.status(200).json({ _id, first_name, last_name, login_name: ln });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /admin/login:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export function logout(req, res) {
  if (!req.session.user) {
    return res.status(400).json({ message: 'Not logged in' });
  }
  return req.session.destroy((err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    return res.status(200).json({ message: 'Logged out' });
  });
}


