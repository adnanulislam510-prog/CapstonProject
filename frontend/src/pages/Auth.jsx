/**
 * =====================================================================
 * File: /frontend/src/pages/Auth.jsx
 * Description: Placeholder page for Login & Role-Based Registration
 * =====================================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('RESTAURANT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Try calling real backend or fallback to stub
        try {
          const res = await client.post('/auth/login', { email, password });
          const userObj = res.data.user || { id: 1, name: email.split('@')[0], role };
          const tokenStr = res.data.token || 'demo-jwt-token';
          login(userObj, tokenStr);
          navigate(userObj.role === 'RESTAURANT' ? '/restaurant' : '/shelter');
        } catch (apiErr) {
          // If backend returned stub or simulated auth
          const userObj = { id: 1, name: email.split('@')[0], role };
          login(userObj, 'demo-token');
          navigate(role === 'RESTAURANT' ? '/restaurant' : '/shelter');
        }
      } else {
        // Registration
        await client.post('/auth/register', { name, email, password, role, phone, address });
        setIsLogin(true);
        alert('Registration successful! Please sign in with your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Food Left at Closing Time
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Connecting surplus food with local charities & shelters at closing hour
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl sm:px-10 border border-slate-200">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                !isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Account Type (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                  >
                    <option value="RESTAURANT">Restaurant / Food Donor</option>
                    <option value="SHELTER">Shelter / Relief Organization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Organization / Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. City Bakery or Hope Shelter"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0123"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Address / Pickup Location</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
              />
            </div>

            {isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Login As Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                >
                  <option value="RESTAURANT">Restaurant (Tanvir's Dashboard)</option>
                  <option value="SHELTER">Shelter (Eligible Batches Feed)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

