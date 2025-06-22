import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../api/admin';
import { Box, Typography, Paper, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/Restaurant';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = () => {
    setLoading(true);
    getDashboardStats()
      .then(res => setStats(res.data.data))
      .finally(() => setLoading(false));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.revenue?.toLocaleString() || 0}`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main'
    },
    {
      title: 'Total Orders',
      value: stats?.orders || 0,
      icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main'
    },
    {
      title: 'Total Users',
      value: stats?.users || 0,
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.main'
    },
    {
      title: 'Menu Items',
      value: stats?.menuItems || 0,
      icon: <RestaurantIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Dashboard</Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={card.color}>
                      {card.value}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Recent Orders</Typography>
            {stats?.recentOrders?.length > 0 ? (
              <Box>
                {stats.recentOrders.map((order, index) => (
                  <Box key={order._id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="subtitle2">Order #{order.orderNumber}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {order.customer?.name} - ₹{order.pricing?.total?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No recent orders</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Top Menu Items</Typography>
            {stats?.topMenuItems?.length > 0 ? (
              <Box>
                {stats.topMenuItems.map((item, index) => (
                  <Box key={item._id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {item.orders} orders - ₹{item.revenue?.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No menu items data</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 