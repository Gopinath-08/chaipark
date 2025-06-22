import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';

const RegisterSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Too short').max(50, 'Too long').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number')
    .required('Required'),
  password: Yup.string().min(6, 'Too short').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 340, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">Admin Registration</Typography>
        <Formik
          initialValues={{ name: '', email: '', phone: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          onSubmit={async (values) => {
            setError(null);
            setLoading(true);
            try {
              await register(values.name, values.email, values.phone, values.password);
              navigate('/');
            } catch (err) {
              setError(err?.response?.data?.message || 'Registration failed');
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ errors, touched }) => (
            <Form>
              <Field name="name" as={TextField} label="Full Name" fullWidth margin="normal" error={touched.name && !!errors.name} helperText={touched.name && errors.name} autoFocus />
              <Field name="email" as={TextField} label="Email" fullWidth margin="normal" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
              <Field name="phone" as={TextField} label="Phone Number" fullWidth margin="normal" error={touched.phone && !!errors.phone} helperText={touched.phone && errors.phone} />
              <Field name="password" as={TextField} label="Password" type="password" fullWidth margin="normal" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
              <Field name="confirmPassword" as={TextField} label="Confirm Password" type="password" fullWidth margin="normal" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading} startIcon={loading && <CircularProgress size={18} />}>
                Register
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none', color: 'primary.main' }}>
                    Login here
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