const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('./firebase');

// In-memory fallback storage (used when Firestore is not configured)
const memoryStore = new Map();

function getInvestorCollection(founderId) {
  const db = getFirestore();
  if (!db) return null;
  return db.collection('pipelines').doc(founderId).collection('investors');
}

// Helper: compute stats from array of investors
function computeStats(data) {
  return {
    total: data.length,
    contacted: data.filter(i => i.status === 'contacted').length,
    replied: data.filter(i => i.status === 'replied').length,
    booked: data.filter(i => i.status === 'booked').length,
    notInterested: data.filter(i => i.status === 'not_interested').length,
  };
}

/**
 * Get pipeline data for a founder
 */
async function getPipelineData(founderId) {
  try {
    const col = getInvestorCollection(founderId);
    let data = [];

    if (col) {
      const snap = await col.get();
      data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      data = memoryStore.get(founderId) || [];
    }

    return {
      investors: data,
      stats: computeStats(data),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting pipeline data:', error);
    throw error;
  }
}

/**
 * Update pipeline status for an investor
 */
async function updatePipeline({ investorId, investorEmail, status, metadata, timestamp, founderId }) {
  try {
    const id = founderId || 'default';
    const now = timestamp ? new Date(timestamp) : new Date();
    const col = getInvestorCollection(id);

    // Ensure we have an investor identifier
    const docId = investorId || investorEmail || uuidv4();
    const updatePayload = {
      investorId: docId,
      email: investorEmail,
      status,
      lastUpdated: now.toISOString(),
      ...metadata,
    };

    if (col) {
      await col.doc(docId).set(
        {
          createdAt: adminTimestamp(now),
          ...updatePayload,
        },
        { merge: true }
      );
    } else {
      const arr = memoryStore.get(id) || [];
      const idx = arr.findIndex(i => i.investorId === docId || i.email === investorEmail);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...updatePayload };
      } else {
        arr.push({ createdAt: now.toISOString(), ...updatePayload });
      }
      memoryStore.set(id, arr);
    }

    console.log('📊 Pipeline updated:', {
      founderId: id,
      investorId: docId,
      status,
      timestamp: now.toISOString(),
    });

    return { success: true, investorId: docId, status, timestamp: now.toISOString() };
  } catch (error) {
    console.error('Error updating pipeline:', error);
    throw error;
  }
}

function adminTimestamp(date) {
  // Store plain ISO string; Firestore will keep it as string unless using FieldValue
  return date.toISOString();
}

/**
 * Get pipeline statistics
 */
async function getPipelineStats(founderId) {
  const data = (await getPipelineData(founderId)).investors;
  const s = computeStats(data);
  const contacted = data.filter(i => i.status !== 'not_contacted').length;
  const replied = data.filter(i => ['replied', 'booked'].includes(i.status)).length;
  const booked = data.filter(i => i.status === 'booked').length;
  return {
    total: s.total,
    contacted,
    replied,
    booked,
    responseRate: contacted > 0 ? (replied / contacted * 100).toFixed(1) : 0,
    bookingRate: replied > 0 ? (booked / replied * 100).toFixed(1) : 0,
    conversionRate: contacted > 0 ? (booked / contacted * 100).toFixed(1) : 0,
  };
}

/**
 * Bulk update pipeline statuses
 */
async function bulkUpdatePipeline(updates, founderId) {
  const results = [];
  for (const update of updates) {
    const result = await updatePipeline({ ...update, founderId });
    results.push(result);
  }
  return { success: true, updated: results.length, results };
}

/**
 * Get investors by status
 */
async function getInvestorsByStatus(founderId, status) {
  const col = getInvestorCollection(founderId);
  if (col) {
    const snap = await col.where('status', '==', status).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const data = memoryStore.get(founderId) || [];
  return data.filter(i => i.status === status);
}

/**
 * Clear pipeline data (for testing)
 */
async function clearPipelineData(founderId) {
  const col = getInvestorCollection(founderId);
  if (col) {
    const snap = await col.get();
    const batch = col.firestore.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  } else {
    if (founderId) memoryStore.delete(founderId);
    else memoryStore.clear();
  }
  return { success: true };
}

module.exports = {
  getPipelineData,
  updatePipeline,
  getPipelineStats,
  bulkUpdatePipeline,
  getInvestorsByStatus,
  clearPipelineData,
};
