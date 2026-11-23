/**
 * =====================================================================
 * File: /frontend/src/pages/ShelterFeed.jsx
 * Description: Placeholder page for Shelter Eligible Batches & Handover PIN entry
 * =====================================================================
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function ShelterFeed() {
  const { user, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('101');
  const [handoverMsg, setHandoverMsg] = useState(null);

  // Mock sample batches matching shelter capacity
  const [batches] = useState([
    {
      id: '101',
      restaurantName: 'Bistro Central',
      raw_description: '20 freshly packaged warm dinner boxes (beef stroganoff, mashed potatoes)',
      total_portions: 20,
      has_trays: 0,
      pickup_location: '124 Market St, Rear Gate',
      hold_until: '21:30',
      status: 'AVAILABLE'
    },
    {
      id: '102',
      restaurantName: 'Artisan Bagels & Cafe',
      raw_description: '40 assorted bagels and 5 boxes of packaged sandwiches',
      total_portions: 45,
      has_trays: 1,
      pickup_location: '88 Broadway Alley',
      hold_until: '22:00',
      status: 'CLAIMED'
    }
  ]);

  const handleClaim = async (batchId) => {
    try {
      await client.post(`/batches/${batchId}/claim`);
      alert(`Batch #${batchId} claimed successfully!`);
    } catch {
      alert(`Batch #${batchId} claim recorded (Demo Stub)`);
    }
  };

  const handleHandoverVerification = async (e) => {
    e.preventDefault();
    if (!pin) return;
    try {
      await client.post(`/batches/${selectedBatchId}/complete`, { confirmationCode: pin });
      setHandoverMsg(`Batch #${selectedBatchId} pickup verified with PIN ${pin}!`);
      setPin('');
    } catch {
      setHandoverMsg(`Handover PIN ${pin} accepted for Batch #${selectedBatchId} (Demo Stub)`);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Shelter Eligible Batches & Handover Feed</h1>
            <p className="text-sm text-slate-500">
              Welcome, {user?.name || 'Shelter Coordinator'} (Max Portions: 50 • Cutoff: 22:00)
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed of Available & Eligible Batches */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Available Surplus Batches Tonight</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                Filtered by Van & Portion Limit
              </span>
            </div>

            <div className="space-y-4">
              {batches.map((batch) => (
                <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{batch.restaurantName}</h3>
                      <p className="text-sm text-slate-600 mt-1">{batch.raw_description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        batch.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <span className="font-semibold text-slate-800">Portions:</span> {batch.total_portions}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Hold Cutoff:</span> {batch.hold_until}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Trays:</span> {batch.has_trays ? 'Yes (Van Required)' : 'Standard Bags'}
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="font-semibold text-slate-800">Pickup Location:</span> {batch.pickup_location}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    {batch.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => handleClaim(batch.id)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition"
                      >
                        Claim Batch
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedBatchId(batch.id)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition"
                      >
                        Verify Handover PIN
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Handover PIN Verification Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-2">Handover PIN Verification</h3>
              <p className="text-xs text-slate-500 mb-4">
                Enter the restaurant's security gate code or pickup PIN to complete handover and update the audit trail.
              </p>

              {handoverMsg && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200">
                  {handoverMsg}
                </div>
              )}

              <form onSubmit={handleHandoverVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch ID</label>
                  <input
                    type="text"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Handover PIN / Gate Code</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="e.g. 4921"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-sm text-center tracking-widest font-mono text-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
                >
                  Verify & Complete Handover
                </button>
              </form>
            </div>

            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="text-xs text-slate-500">
                Member 3: Connect shelter matching via <code className="text-indigo-700 font-mono">/services/matching.js</code> and batch handover.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

