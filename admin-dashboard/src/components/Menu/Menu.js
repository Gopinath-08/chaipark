import React, { useEffect, useState } from 'react';
import { getMenuItems, toggleAvailability, toggleFeatured, deleteMenuItem, createMenuItem, updateMenuItem, getCategories } from '../../api/menu';
import { 
  Box, Typography, Paper, CircularProgress, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, Switch, FormControlLabel, TextField, Select, MenuItem, FormControl, 
  InputLabel, Grid, IconButton, Alert, FormHelperText
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const MenuItemSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Too short').max(100, 'Too long').required('Required'),
  description: Yup.string().min(10, 'Too short').max(500, 'Too long').required('Required'),
  price: Yup.number().positive('Must be positive').required('Required'),
  category: Yup.string().required('Required')
});

const categoryOptions = ['coffee', 'tea', 'snacks', 'desserts', 'beverages', 'main-course', 'appetizers'];

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [addDialog, setAddDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, []);

  const loadMenuItems = () => {
    setLoading(true);
    getMenuItems()
      .then(res => setMenuItems(res.data.data.menuItems))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load menu items'))
      .finally(() => setLoading(false));
  };

  const loadCategories = () => {
    getCategories()
      .then(res => setCategories(res.data.data))
      .catch(err => console.error('Failed to load categories:', err));
  };

  const handleAvailabilityToggle = (id) => {
    toggleAvailability(id).then(() => {
      setMenuItems(items => items.map(item => 
        item._id === id ? { ...item, isAvailable: !item.isAvailable } : item
      ));
    });
  };

  const handleFeaturedToggle = (id) => {
    toggleFeatured(id).then(() => {
      setMenuItems(items => items.map(item => 
        item._id === id ? { ...item, featured: !item.featured } : item
      ));
    });
  };

  const handleDelete = () => {
    if (deleteDialog.item) {
      deleteMenuItem(deleteDialog.item._id).then(() => {
        setMenuItems(items => items.filter(item => item._id !== deleteDialog.item._id));
        setDeleteDialog({ open: false, item: null });
      });
    }
  };

  const handleAddItem = (values, { setSubmitting, resetForm }) => {
    setError(null);
    createMenuItem(values)
      .then(() => {
        loadMenuItems();
        setAddDialog(false);
        resetForm();
      })
      .catch(err => setError(err?.response?.data?.message || 'Failed to create menu item'))
      .finally(() => setSubmitting(false));
  };

  const handleEditItem = (values, { setSubmitting }) => {
    setError(null);
    updateMenuItem(editDialog.item._id, values)
      .then(() => {
        loadMenuItems();
        setEditDialog({ open: false, item: null });
      })
      .catch(err => setError(err?.response?.data?.message || 'Failed to update menu item'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Menu Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
          Add Item
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={menuItems.map((item, i) => ({ id: item._id || i, ...item }))}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'category', headerName: 'Category', flex: 1 },
            { field: 'description', headerName: 'Description', flex: 2 },
            { field: 'price', headerName: 'Price', flex: 1, valueGetter: p => `₹${p.row.price}` },
            { 
              field: 'isAvailable', 
              headerName: 'Available', 
              flex: 1,
              renderCell: (params) => (
                <Switch 
                  checked={params.row.isAvailable} 
                  onChange={() => handleAvailabilityToggle(params.row._id)}
                />
              )
            },
            { 
              field: 'featured', 
              headerName: 'Featured', 
              flex: 1,
              renderCell: (params) => (
                <Switch 
                  checked={params.row.featured} 
                  onChange={() => handleFeaturedToggle(params.row._id)}
                />
              )
            },
            {
              field: 'actions',
              headerName: 'Actions',
              flex: 1,
              renderCell: (params) => (
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => setEditDialog({ open: true, item: params.row })}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, item: params.row })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
          ]}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Add Menu Item Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Menu Item</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              name: '',
              description: '',
              price: '',
              category: ''
            }}
            validationSchema={MenuItemSchema}
            onSubmit={handleAddItem}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Field name="name" as={TextField} label="Item Name" fullWidth margin="normal" 
                           error={touched.name && !!errors.name} helperText={touched.name && errors.name} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal" error={touched.category && !!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Field name="category" as={Select} label="Category">
                        {categoryOptions.map(cat => (
                          <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                        ))}
                      </Field>
                      {touched.category && errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="description" as={TextField} label="Description" fullWidth margin="normal" 
                           multiline rows={3} error={touched.description && !!errors.description} 
                           helperText={touched.description && errors.description} />
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="price" as={TextField} label="Price (₹)" fullWidth margin="normal" type="number"
                           error={touched.price && !!errors.price} helperText={touched.price && errors.price} />
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button onClick={() => setAddDialog(false)}>Cancel</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={20} /> : 'Add Item'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Menu Item</DialogTitle>
        <DialogContent>
          {editDialog.item && (
            <Formik
              initialValues={{
                name: editDialog.item.name || '',
                description: editDialog.item.description || '',
                price: editDialog.item.price || '',
                category: editDialog.item.category || ''
              }}
              validationSchema={MenuItemSchema}
              onSubmit={handleEditItem}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Field name="name" as={TextField} label="Item Name" fullWidth margin="normal" 
                             error={touched.name && !!errors.name} helperText={touched.name && errors.name} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal" error={touched.category && !!errors.category}>
                        <InputLabel>Category</InputLabel>
                        <Field name="category" as={Select} label="Category">
                          {categoryOptions.map(cat => (
                            <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                          ))}
                        </Field>
                        {touched.category && errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Field name="description" as={TextField} label="Description" fullWidth margin="normal" 
                             multiline rows={3} error={touched.description && !!errors.description} 
                             helperText={touched.description && errors.description} />
                    </Grid>
                    <Grid item xs={12}>
                      <Field name="price" as={TextField} label="Price (₹)" fullWidth margin="normal" type="number"
                             error={touched.price && !!errors.price} helperText={touched.price && errors.price} />
                    </Grid>
                  </Grid>
                  <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, item: null })}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? <CircularProgress size={20} /> : 'Update Item'}
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Delete Menu Item</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{deleteDialog.item?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 