/**
 * GET  /api/workouts   — list all workouts (optional ?week_id= filter)
 * POST /api/workouts   — create a new workout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { CreateWorkoutBody, Workout } from '../../types/index.js';

const VALID_WORKOUT_TYPES = ['Easy', 'Intervals', 'Tempo', 'Long', 'Cross-train', 'Rest', 'Shakeout', 'Race'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateCreateBody(body: unknown): { valid: true; data: CreateWorkoutBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  const required = ['week_id', 'plan_id', 'workout_date', 'day_of_week', 'workout_type'];
  for (const field of required) {
    if (b[field] === undefined || b[field] === null || b[field] === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (!Number.isInteger(b.week_id) || (b.week_id as number) <= 0) {
    return { valid: false, error: 'week_id must be a positive integer' };
  }
  if (!Number.isInteger(b.plan_id) || (b.plan_id as number) <= 0) {
    return { valid: false, error: 'plan_id must be a positive integer' };
  }
  if (typeof b.workout_date !== 'string' || !ISO_DATE.test(b.workout_date)) {
    return { valid: false, error: 'workout_date must be ISO format YYYY-MM-DD' };
  }
  if (!VALID_DAYS.includes(b.day_of_week as string)) {
    return { valid: false, error: `day_of_week must be one of: ${VALID_DAYS.join(', ')}` };
  }
  if (!VALID_WORKOUT_TYPES.includes(b.workout_type as string)) {
    return { valid: false, error: `workout_type must be one of: ${VALID_WORKOUT_TYPES.join(', ')}` };
  }
  if (b.total_miles !== undefined && b.total_miles !== null) {
    if (typeof b.total_miles !== 'number' || (b.total_miles as number) < 0) {
      return { valid: false, error: 'total_miles must be a non-negative number or null' };
    }
  }

  return { valid: true, data: b as unknown as CreateWorkoutBody };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabaseClient();

  // ─── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      let query = supabase
        .from('workouts')
        .select('*')
        .order('workout_date', { ascending: true });

      if (req.query.week_id) {
        query = query.eq('week_id', Number(req.query.week_id));
      }

      const { data, error } = await query;

      if (error) {
        console.error('[GET /api/workouts] Supabase error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch workouts' });
      }

      return res.status(200).json(data as Workout[]);
    } catch (err) {
      console.error('[GET /api/workouts] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const validation = validateCreateBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          week_id: validation.data.week_id,
          plan_id: validation.data.plan_id,
          workout_date: validation.data.workout_date,
          day_of_week: validation.data.day_of_week,
          workout_type: validation.data.workout_type,
          total_miles: validation.data.total_miles ?? null,
          primary_pace_zone: validation.data.primary_pace_zone ?? null,
          notes: validation.data.notes ?? null,
          is_rest_day: validation.data.is_rest_day ?? false,
          is_race_day: validation.data.is_race_day ?? false,
          is_key_workout: validation.data.is_key_workout ?? false,
        })
        .select()
        .single();

      if (error) {
        // FK violation = week_id or plan_id not found
        if (error.code === '23503') {
          return res.status(404).json({ error: 'week_id or plan_id not found' });
        }
        console.error('[POST /api/workouts] Supabase error:', error.message);
        return res.status(500).json({ error: 'Failed to create workout' });
      }

      return res.status(201).json(data as Workout);
    } catch (err) {
      console.error('[POST /api/workouts] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
