import React, { useEffect, useState } from 'react';
import { getRevenueReport, getOrderReport } from '../../api/admin';
import { Box, Typography, Paper, CircularProgress, Grid, TextField, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function Reports() {
  const [revenueData, setRevenueData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setLoading(true);
    Promise.all([
      getRevenueReport(dateRange),
      getOrderReport(dateRange)
    ]).then(([revenueRes, orderRes]) => {
      setRevenueData(revenueRes.data.data);
      setOrderData(orderRes.data.data);
    }).finally(() => setLoading(false));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Reports & Analytics</Typography>
      
      {/* Date Range Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField 
              label="Start Date" 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <TextField 
              label="End Date" 
              type="date" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={loadReports}>Generate Report</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Revenue Summary */}
      {revenueData && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">Total Revenue</Typography>
              <Typography variant="h4" fontWeight={700}>₹{revenueData.summary.totalRevenue?.toLocaleString() || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">Total Orders</Typography>
              <Typography variant="h4" fontWeight={700}>{revenueData.summary.totalOrders || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">Average Order Value</Typography>
              <Typography variant="h4" fontWeight={700}>₹{revenueData.summary.averageOrderValue?.toFixed(2) || 0}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Daily Revenue</Typography>
            {revenueData?.dailyRevenue && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 300, gap: 1 }}>
                {revenueData.dailyRevenue.map(day => (
                  <Box key={day._id} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        height: `${Math.max(day.revenue / 100, 10)}px`, 
                        borderRadius: 1, 
                        mb: 1 
                      }} 
                    />
                    <Typography variant="caption">{day._id.slice(5)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Category Revenue</Typography>
            {revenueData?.categoryRevenue && (
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={revenueData.categoryRevenue.map((cat, i) => ({ id: i, ...cat }))}
                  columns={[
                    { field: '_id', headerName: 'Category', flex: 1 },
                    { field: 'revenue', headerName: 'Revenue', flex: 1, valueGetter: p => `₹${p.row.revenue?.toLocaleString()}` },
                    { field: 'orders', headerName: 'Orders', flex: 1 }
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                  hideFooter
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Order Statistics */}
      {orderData && (
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Order Status Breakdown</Typography>
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={orderData.statusBreakdown.map((status, i) => ({ id: i, ...status }))}
                  columns={[
                    { field: '_id', headerName: 'Status', flex: 1 },
                    { field: 'count', headerName: 'Count', flex: 1 }
                  ]}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  disableSelectionOnClick
                  hideFooter
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Payment Method Breakdown</Typography>
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={orderData.paymentBreakdown.map((payment, i) => ({ id: i, ...payment }))}
                  columns={[
                    { field: '_id', headerName: 'Method', flex: 1 },
                    { field: 'count', headerName: 'Count', flex: 1 },
                    { field: 'revenue', headerName: 'Revenue', flex: 1, valueGetter: p => `₹${p.row.revenue?.toLocaleString()}` }
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                  hideFooter
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
} 