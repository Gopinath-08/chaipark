import React, { useEffect, useState } from 'react';
import { getOrders, getOrder, updateOrderStatus, assignOrder } from '../../api/admin';
import { Box, Typography, Paper, CircularProgress, Button, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusValue, setStatusValue] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    getOrders(filterStatus ? { status: filterStatus } : undefined)
      .then(res => setOrders(res.data.data.orders))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const handleRowClick = (params) => {
    getOrder(params.row._id).then(res => setSelectedOrder(res.data.data));
  };

  const handleStatusChange = () => {
    setStatusLoading(true);
    updateOrderStatus(selectedOrder._id, { status: statusValue })
      .then(() => {
        setSelectedOrder({ ...selectedOrder, status: statusValue });
        setOrders(orders.map(o => o._id === selectedOrder._id ? { ...o, status: statusValue } : o));
        setStatusDialog(false);
      })
      .finally(() => setStatusLoading(false));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Orders</Typography>
      <Box mb={2}>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} displayEmpty size="small">
          <MenuItem value="">All Statuses</MenuItem>
          {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </Box>
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={orders.map((o, i) => ({ id: o._id || i, ...o }))}
          columns={[
            { field: 'orderNumber', headerName: 'Order #', flex: 1 },
            { field: 'status', headerName: 'Status', flex: 1 },
            { field: 'pricing', headerName: 'Total', flex: 1, valueGetter: p => `₹${p.row.pricing?.total?.toLocaleString()}` },
            { field: 'customer', headerName: 'Customer', flex: 1, valueGetter: p => p.row.customer?.name },
            { field: 'createdAt', headerName: 'Date', flex: 1, valueGetter: p => new Date(p.row.createdAt).toLocaleString() },
          ]}
          pageSize={10}
          rowsPerPageOptions={[10]}
          onRowClick={handleRowClick}
        />
      </Paper>
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="subtitle1">Order #: {selectedOrder.orderNumber}</Typography>
              <Typography>Status: {selectedOrder.status}</Typography>
              <Typography>Customer: {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})</Typography>
              <Typography>Address: {selectedOrder.deliveryInfo?.address}</Typography>
              <Typography>Payment: {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</Typography>
              <Typography>Total: ₹{selectedOrder.pricing?.total?.toLocaleString()}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Items:</Typography>
              <ul>
                {selectedOrder.items.map(item => (
                  <li key={item._id}>{item.name} x{item.quantity} - ₹{item.price} each</li>
                ))}
              </ul>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item>
                  <Button variant="outlined" onClick={() => { setStatusValue(selectedOrder.status); setStatusDialog(true); }}>Update Status</Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" onClick={() => setSelectedOrder(null)}>Close</Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Select value={statusValue} onChange={e => setStatusValue(e.target.value)} fullWidth>
            {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} disabled={statusLoading} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 