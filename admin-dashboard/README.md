# Chai Park Admin Dashboard

A modern React-based admin dashboard for managing orders, menu, users, and analytics for Chai Park.

## Features
- Dashboard overview (orders, revenue, customers, popular items)
- Order management (view, update status, assign staff, cancel)
- Menu management (CRUD, availability, featured, ratings)
- User management (CRUD, roles, status)
- Analytics and reports
- Real-time updates via Socket.IO
- Secure authentication (JWT)
- Responsive Material UI design

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000).

### 3. Configure API endpoint
Set the backend API URL in `src/api/axios.js` if different from default.

## Project Structure
```
admin-dashboard/
  public/
  src/
    api/
    components/
    context/
    hooks/
    App.js
    index.js
    routes.js
    theme.js
  package.json
  README.md
```

## Environment
- Requires the backend server running (see `/api` endpoints in backend)
- Uses JWT authentication

## Customization
- Update theme in `src/theme.js`
- Add/modify pages in `src/components/`

---

© 2024 Chai Park 