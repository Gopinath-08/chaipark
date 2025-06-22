import React, { useEffect, useState } from 'react';
import { getUsers, updateUserStatus, updateUserRole, createUser } from '../../api/admin';
import { Box, Typography, Paper, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Select, MenuItem, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    getUsers()
      .then(res => setUsers(res.data.data.users))
      .finally(() => setLoading(false));
  };

  const handleStatusToggle = (id) => {
    updateUserStatus(id).then(() => {
      setUsers(users => users.map(user => 
        user._id === id ? { ...user, isActive: !user.isActive } : user
      ));
    });
  };

  const handleRoleChange = (id, role) => {
    updateUserRole(id, { role }).then(() => {
      setUsers(users => users.map(user => 
        user._id === id ? { ...user, role } : user
      ));
    });
  };

  const handleAddUser = () => {
    createUser(newUser).then(() => {
      loadUsers();
      setAddDialog(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'staff' });
    });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>Add User</Button>
      </Box>
      
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users.map((user, i) => ({ id: user._id || i, ...user }))}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'email', headerName: 'Email', flex: 1 },
            { field: 'phone', headerName: 'Phone', flex: 1 },
            { field: 'role', headerName: 'Role', flex: 1 },
            { 
              field: 'isActive', 
              headerName: 'Active', 
              flex: 1,
              renderCell: (params) => (
                <Switch 
                  checked={params.row.isActive} 
                  onChange={() => handleStatusToggle(params.row._id)}
                />
              )
            },
            {
              field: 'roleChange',
              headerName: 'Change Role',
              flex: 1,
              renderCell: (params) => (
                <Select 
                  value={params.row.role} 
                  onChange={(e) => handleRoleChange(params.row._id, e.target.value)}
                  size="small"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              )
            }
          ]}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField 
            fullWidth 
            label="Name" 
            margin="normal" 
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
          />
          <TextField 
            fullWidth 
            label="Email" 
            margin="normal" 
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
          />
          <TextField 
            fullWidth 
            label="Phone" 
            margin="normal" 
            value={newUser.phone}
            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
          />
          <TextField 
            fullWidth 
            label="Password" 
            margin="normal" 
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
          />
          <Select 
            fullWidth 
            margin="normal" 
            value={newUser.role}
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
          >
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 