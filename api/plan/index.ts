/**
 * GET /api/plan
 * Returns the training plan with nested pace targets.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { PlanWithPaceTargets } from '../../types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('training_plans')
      .select(`
        *,
        pace_targets (*)
      `)
      .single();

    if (error?.code === 'PGRST116') {
      return res.status(404).json({ error: 'No training plan found' });
    }
    if (error) {
      console.error('[GET /api/plan] Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch plan' });
    }

    return res.status(200).json(data as PlanWithPaceTargets);
  } catch (err) {
    console.error('[GET /api/plan] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
