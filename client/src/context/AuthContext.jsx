import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, try to restore session from cookie
  const fetchCurrentUser = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await authService.me();
      dispatch({ type: 'SET_USER', payload: data.data });
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authService.login(credentials);
      dispatch({ type: 'SET_USER', payload: data.data });
      return data.data;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const register = async (userData) => {
    const { data } = await authService.register(userData);
    return data;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register, refetch: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;
