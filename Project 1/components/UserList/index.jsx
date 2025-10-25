import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
} from '@mui/material';
import './styles.css';

export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      try {
        const { data } = await axios.get('/user/list'); // mock mode returns mock users
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

  return (
    <Paper elevation={0} style={{ padding: '8px' }}>
      <Typography variant='subtitle2' style={{ marginBottom: '8px' }}>
        Users
      </Typography>
      <List dense>
        {users.map((u) => (
          <ListItemButton key={u._id} component={Link} to={`/users/${u._id}`}>
            <ListItemText primary={`${u.first_name} ${u.last_name}`} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
