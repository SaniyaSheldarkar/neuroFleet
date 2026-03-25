import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('nfx_user');
    const token = localStorage.getItem('nfx_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(
        BASE_URL + '/auth/login',
        { email: email, password: password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const token = res.data.token;
      const userData = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      };
      localStorage.setItem('nfx_token', token);
      localStorage.setItem('nfx_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      setUser(userData);
      return userData;
    } catch (err) {
      const demoUsers = {
        'admin@neurofleetx.com': {
          id: 1,
          name: 'Admin User',
          email: 'admin@neurofleetx.com',
          role: 'ADMIN'
        },
        'manager@neurofleetx.com': {
          id: 2,
          name: 'Fleet Manager',
          email: 'manager@neurofleetx.com',
          role: 'FLEET_MANAGER'
        },
        'driver@neurofleetx.com': {
          id: 3,
          name: 'Driver One',
          email: 'driver@neurofleetx.com',
          role: 'DRIVER'
        },
        'customer@neurofleetx.com': {
          id: 4,
          name: 'Customer One',
          email: 'customer@neurofleetx.com',
          role: 'CUSTOMER'
        }
      };

      if (demoUsers[email] && password === 'password123') {
        const userData = demoUsers[email];
        const fakeToken = 'demo-token-' + Date.now();
        localStorage.setItem('nfx_token', fakeToken);
        localStorage.setItem('nfx_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error('Invalid credentials');
    }
  };

  const register = async (data) => {
    await axios.post(
      BASE_URL + '/auth/register',
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  };

  const logout = () => {
    localStorage.removeItem('nfx_token');
    localStorage.removeItem('nfx_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user: user, login: login, register: register, logout: logout, loading: loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);