/**
 * =====================================================================
 * File: /frontend/src/pages/RestaurantDash.jsx
 * Description: Placeholder page for Tanvir's Surplus Posting Dashboard
 * =====================================================================
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function RestaurantDash() {
  const { user, logout } = useAuth();
  const [rawDescription, setRawDescription] = useState('');
  const [totalPortions, setTotalPortions] = useState('');
  const [hasTrays, setHasTrays] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(user?.address || '104 Culinary Row');
  const [holdUntil, setHoldUntil] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  const handlePostBatch = async (e) => {
    e.preventDefault();
    try {
      await client.post('/batches', {
        raw_description: rawDescription,
        total_portions: Number(totalPortions),
        has_trays: hasTrays ? 1 : 0,
        pickup_location: pickupLocation,
        hold_until: holdUntil,
        gate_code: gateCode
      });
      setStatusMsg('Surplus food batch published successfully!');
      setRawDescription('');
      setTotalPortions('');
      setGateCode('');
    } catch (err) {
      setStatusMsg('Batch created (Demo Stub)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tanvir's Surplus Posting Dashboard</h1>
            <p className="text-sm text-slate-500">Logged in as: {user?.name || 'Restaurant Manager'} (Role: {user?.role})</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Batch Creation Form Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Post Closing-Time Surplus Batch</h2>
              <p className="text-sm text-slate-500">Enter surplus quantities before tonight's closing cutoff.</p>
            </div>

            {statusMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-200">
                {statusMsg}
              </div>
            )}

            <form onSubmit={handlePostBatch} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Food Description / Unsold Items
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., 15 portions of roast chicken with veggies, 10 loaves of garlic bread..."
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Estimated Portions
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="25"
                    value={totalPortions}
                    onChange={(e) => setTotalPortions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hold Until / Cutoff Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={holdUntil}
                    onChange={(e) => setHoldUntil(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pickup Location / Alley Door
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gate / Lockbox Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., #4921"
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasTrays"
                  checked={hasTrays}
                  onChange={(e) => setHasTrays(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="hasTrays" className="ml-2 block text-sm text-slate-700">
                  Heavy catering trays / Requires van or delivery vehicle
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                Publish Surplus Batch
              </button>
            </form>
          </div>

          {/* Active Status Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Tonight's Batch Status</h3>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Batch #101</p>
                    <p className="text-xs text-amber-700">25 portions • Bakery & Meals</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    CLAIMED
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Batch #102</p>
                    <p className="text-xs text-emerald-700">18 portions • Prepared Bowls</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    AVAILABLE
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="text-xs text-slate-500">
                Member 3: Connect this dashboard with <code className="text-emerald-700 font-mono">/api/batches</code> real-time updates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

