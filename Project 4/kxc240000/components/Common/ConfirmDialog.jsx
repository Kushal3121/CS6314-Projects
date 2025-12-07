import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description = '',
  confirmText = 'Confirm',
  confirmColor = 'error',
  onCancel,
  onConfirm,
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth='xs' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body2'>{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button
          variant='contained'
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


