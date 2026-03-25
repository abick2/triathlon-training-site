/**
 * GET  /api/workouts          — list all workouts (optional ?week_id= filter)
 * POST /api/workouts          — create a new workout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { CreateWorkoutBody, Workout } from '../../types/index.js';

const VALID_SPORTS = ['swim', 'bike', 'run', 'brick', 'rest', 'strength'];
const VALID_INTENSITIES = ['easy', 'moderate', 'hard', 'race', 'rest'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateCreateBody(body: unknown): { valid: true; data: CreateWorkoutBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  const required = ['week_id', 'date', 'day_of_week', 'sport', 'title', 'description', 'intensity'];
  for (const field of required) {
    if (!b[field] && b[field] !== false) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (typeof b.week_id !== 'string' || !b.week_id) {
    return { valid: false, error: 'week_id must be a non-empty string' };
  }
  if (typeof b.date !== 'string' || !ISO_DATE.test(b.date)) {
    return { valid: false, error: 'date must be ISO format YYYY-MM-DD' };
  }
  if (!VALID_DAYS.includes(b.day_of_week as string)) {
    return { valid: false, error: `day_of_week must be one of: ${VALID_DAYS.join(', ')}` };
  }
  if (!VALID_SPORTS.includes(b.sport as string)) {
    return { valid: false, error: `sport must be one of: ${VALID_SPORTS.join(', ')}` };
  }
  if (typeof b.title !== 'string' || !b.title.trim()) {
    return { valid: false, error: 'title must be a non-empty string' };
  }
  if (typeof b.description !== 'string') {
    return { valid: false, error: 'description must be a string' };
  }
  if (!VALID_INTENSITIES.includes(b.intensity as string)) {
    return { valid: false, error: `intensity must be one of: ${VALID_INTENSITIES.join(', ')}` };
  }
  if (b.duration_min !== undefined && b.duration_min !== null) {
    if (!Number.isInteger(b.duration_min) || (b.duration_min as number) <= 0) {
      return { valid: false, error: 'duration_min must be a positive integer' };
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
        .order('date', { ascending: true });

      if (req.query.week_id) {
        query = query.eq('week_id', req.query.week_id as string);
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
          date: validation.data.date,
          day_of_week: validation.data.day_of_week,
          sport: validation.data.sport,
          title: validation.data.title.trim(),
          description: validation.data.description,
          duration_min: validation.data.duration_min ?? null,
          distance: validation.data.distance ?? null,
          intensity: validation.data.intensity,
          completed: validation.data.completed ?? false,
          notes: validation.data.notes ?? null,
        })
        .select()
        .single();

      if (error) {
        // FK violation = week_id not found
        if (error.code === '23503') {
          return res.status(404).json({ error: 'week_id not found' });
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
