import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Too short').required('Required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 340, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">Admin Login</Typography>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={async (values) => {
            setError(null);
            setLoading(true);
            try {
              await login(values.email, values.password, true);
              navigate('/');
            } catch (err) {
              setError(err?.response?.data?.message || 'Login failed');
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ errors, touched }) => (
            <Form>
              <Field name="email" as={TextField} label="Email" fullWidth margin="normal" error={touched.email && !!errors.email} helperText={touched.email && errors.email} autoFocus />
              <Field name="password" as={TextField} label="Password" type="password" fullWidth margin="normal" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading} startIcon={loading && <CircularProgress size={18} />}>
                Login
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
                    Register here
                  </Link>
                </Typography>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
} 