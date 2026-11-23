/**
 * =====================================================================
 * File: /frontend/src/pages/Batches.jsx
 * Owner: Member 3 (feat/frontend-ui)
 * Description: List of surplus food batches with claim and transit controls
 * =====================================================================
 */

import React, { useEffect, useState } from 'react';
import { fetchBatches, claimBatch, notifyOnWay, completeBatch, cancelBatch } from '../api/batches.js';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchBatches(filter ? { status: filter } : {});
      setBatches(res.batches || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleClaim = async (id) => {
    try {
      await claimBatch(id, { claimNotes: 'Claimed via Web UI' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOnWay = async (id) => {
    try {
      await notifyOnWay(id, { etaMinutes: 20 });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeBatch(id, { notes: 'Food received in good condition' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await cancelBatch(id, { reason });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Available Food Batches</h2>
        <div>
          <label style={{ marginRight: '0.5rem' }}>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="claimed">Claimed</option>
            <option value="on-way">On the Way</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading food batches...</p>
      ) : batches.length === 0 ? (
        <p>No food batches found matching criteria.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {batches.map((batch) => (
            <div key={batch.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{batch.title}</h3>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  background: batch.status === 'available' ? '#e8f5e9' : batch.status === 'claimed' ? '#fff3e0' : '#e0f2f1',
                  color: batch.status === 'available' ? '#2e7d32' : batch.status === 'claimed' ? '#e65100' : '#00695c'
                }}>
                  {batch.status}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0', color: '#555' }}>{batch.description}</p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                <strong>Quantity:</strong> {batch.quantity} {batch.unit} | <strong>Pickup:</strong> {batch.pickupAddress}
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#c62828' }}>
                <strong>Closing / Expiry:</strong> {new Date(batch.expiryTime).toLocaleTimeString()} ({new Date(batch.expiryTime).toLocaleDateString()})
              </p>

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                {batch.status === 'available' && (
                  <button onClick={() => handleClaim(batch.id)} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4 }}>
                    Claim Batch
                  </button>
                )}
                {batch.status === 'claimed' && (
                  <button onClick={() => handleOnWay(batch.id)} style={{ background: '#0288d1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4 }}>
                    Mark On The Way
                  </button>
                )}
                {(batch.status === 'claimed' || batch.status === 'on-way') && (
                  <>
                    <button onClick={() => handleComplete(batch.id)} style={{ background: '#388e3c', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4 }}>
                      Confirm Pickup / Complete
                    </button>
                    <button onClick={() => handleCancel(batch.id)} style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4 }}>
                      Cancel Claim
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

