/**
 * =====================================================================
 * File: /frontend/src/pages/CreateBatch.jsx
 * Owner: Member 3 (feat/frontend-ui)
 * Description: Form for donors to post surplus food batches before closing
 * =====================================================================
 */

import React, { useState } from 'react';
import { createBatch } from '../api/batches.js';

export default function CreateBatch({ onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bakery',
    quantity: '',
    unit: 'items',
    expiryTime: '',
    pickupAddress: '',
    allergens: '',
    dietaryFlags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createBatch({
        ...formData,
        quantity: Number(formData.quantity),
        allergens: formData.allergens ? formData.allergens.split(',').map(s => s.trim()) : [],
        dietaryFlags: formData.dietaryFlags ? formData.dietaryFlags.split(',').map(s => s.trim()) : []
      });
      alert('Surplus food batch published successfully!');
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 550, margin: '1.5rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Post Surplus Food at Closing Time</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Batch Title</label>
          <input
            type="text"
            required
            placeholder="e.g. 20 Assorted Pastries & Croissants"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Description</label>
          <textarea
            rows={3}
            placeholder="Description of food condition and packaging..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block' }}>Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block' }}>Unit</label>
            <input
              type="text"
              placeholder="e.g. boxes, kg, portions"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="bakery">Bakery & Pastries</option>
            <option value="prepared_meals">Prepared Meals & Boxed Lunches</option>
            <option value="produce">Fresh Produce / Fruit & Veg</option>
            <option value="dairy">Dairy & Refrigerated</option>
            <option value="groceries">Dry Goods & Groceries</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Closing / Pickup Expiry Time</label>
          <input
            type="datetime-local"
            required
            value={formData.expiryTime}
            onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Pickup Location Address</label>
          <input
            type="text"
            required
            placeholder="123 Main Street, Suite 4B"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4 }}>
          {loading ? 'Posting...' : 'Publish Batch'}
        </button>
      </form>
    </div>
  );
}

