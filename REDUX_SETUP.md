# Redux Setup Documentation

## 📁 Store Structure

```
src/store/
├── index.ts           # Store configuration with persistence
├── hooks.ts           # Typed hooks and custom auth hooks
└── slices/
    └── authSlice.ts   # Authentication state management
```

## 🔧 Implemented Features

### ✅ Redux Toolkit with Persistence
- **Store Configuration**: Configured with Redux Persist using localStorage
- **TypeScript Integration**: Fully typed store, actions, and selectors
- **DevTools**: Redux DevTools enabled in development
- **Persistence**: Auth state persists across browser sessions

### ✅ Authentication Slice (`authSlice.ts`)
- **User Interface**: Complete user model with roles and permissions
- **Auth State**: Login, loading, error, session management
- **Actions**: Login, logout, profile updates, session handling
- **Selectors**: Helper functions for accessing auth state

### ✅ Custom Hooks (`hooks.ts`)
- **`useAuth()`**: Complete auth state and dispatch access
- **`usePermissions()`**: Permission checking and role validation
- **`useAppDispatch()` / `useAppSelector()`**: Typed Redux hooks

## 🚀 Usage Examples

### Login Process
```typescript
const { dispatch } = useAuth();

const handleLogin = async (username: string, password: string) => {
  const mockUser: User = {
    id: "1",
    username: "user",
    role: "cashier",
    permissions: ["pos:access", "inventory:view"],
    // ... other fields
  };

  dispatch(loginSuccess({
    user: mockUser,
    token: "jwt-token",
    refreshToken: "refresh-token",
    expiresIn: 3600 // 1 hour
  }));
};
```

### Permission Checking
```typescript
const { hasPermission, isAdmin, role } = usePermissions();

if (hasPermission("admin:users")) {
  // Show admin features
}

if (isAdmin) {
  // Show admin-only content
}
```

### Session Management
```typescript
// Automatic session checking every minute
// Automatic activity updates
// Session expiry handling
```

## 🎯 State Persistence

### Persisted Data
- ✅ User authentication state
- ✅ Session tokens
- ✅ User profile information
- ✅ Login timestamp

### Not Persisted (by design)
- Loading states
- Error messages
- Temporary UI state

## 🔐 Security Features

### Session Management
- **Expiry Tracking**: Automatic session expiry checking
- **Activity Updates**: Last activity timestamp tracking
- **Token Refresh**: Structure for token refresh flow
- **Automatic Logout**: Session expired handling

### Permission System
- **Role-based Access**: Admin, Manager, Pharmacist, Cashier roles
- **Granular Permissions**: Fine-grained permission strings
- **Helper Functions**: Easy permission checking utilities

## 📱 UI Integration

### Login Page
- **Environment Detection**: Shows Tauri/Browser badge
- **Error Handling**: Redux error state integration
- **Loading States**: Async login support

### POS Page
- **User Display**: Header with user info and avatar
- **Logout Menu**: Dropdown menu with logout option
- **Session Info**: Environment and user role display

## 🔄 Next Steps

### Recommended Additions
1. **Cart Slice**: Move cart state to Redux
2. **Inventory Slice**: Product management state
3. **Transaction Slice**: Sales and receipt management
4. **Settings Slice**: App configuration and preferences
5. **Offline Support**: Queue actions when offline

### API Integration
```typescript
// Future API service integration
const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (token) => api.post('/auth/refresh', { token }),
  logout: () => api.post('/auth/logout'),
};
```

### Enhanced Features
- **Token Refresh Middleware**: Automatic token refresh
- **Offline Queue**: Store actions when offline
- **Audit Logging**: Track all user actions
- **Multi-language**: Localization support

## 🧪 Testing

### State Testing
```typescript
// Test reducer functions
import authSlice, { loginSuccess } from './authSlice';

const state = authSlice(undefined, loginSuccess(mockLoginData));
expect(state.isAuthenticated).toBe(true);
```

### Component Testing
```typescript
// Test with Redux Provider
import { Provider } from 'react-redux';
import { store } from '../store';

const Wrapper = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);
```

## 🎉 Benefits Achieved

### For POS Systems
- ✅ **Audit Trail**: Every action tracked in Redux DevTools
- ✅ **Session Security**: Automatic session management
- ✅ **State Persistence**: Survive page refreshes and crashes
- ✅ **Role-based Access**: Different permissions per user type
- ✅ **Environment Awareness**: Tauri vs Browser detection

### For Development
- ✅ **Type Safety**: Full TypeScript integration
- ✅ **DevTools**: Powerful debugging capabilities
- ✅ **Predictable State**: Centralized state management
- ✅ **Reusable Logic**: Custom hooks for common operations
- ✅ **Testing Ready**: Easy to test business logic
