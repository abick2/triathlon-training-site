/**
 * GET /api/weeks
 * Returns all training weeks with their nested workouts, ordered by week_number.
 */

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { WeekWithWorkouts } from '../../types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('training_weeks')
      .select(`
        *,
        workouts (*)
      `)
      .order('week_number', { ascending: true })
      .order('date', { referencedTable: 'workouts', ascending: true });

    if (error) {
      console.error('[GET /api/weeks] Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch weeks' });
    }

    return res.status(200).json(data as WeekWithWorkouts[]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/weeks] Unexpected error:', err);
    return res.status(500).json({ error: msg });
  }
}
