import { api } from '../utils/api';

/**
 * Obtiene todos los datos necesarios para el dashboard
 */
export async function getDashboardData() {
  try {
    // Obtener datos en paralelo para mejor rendimiento
    const [stats, activity, pendingDocs] = await Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/dashboard/activity'),
      api.get('/api/dashboard/pending')
    ]);

    return {
      stats: stats.data,
      activity: activity.data.activities,
      pendingDocuments: pendingDocs.data.documents
    };
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    throw error;
  }
} 