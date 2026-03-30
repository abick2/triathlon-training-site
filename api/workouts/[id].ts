/**
 * GET    /api/workouts/:id   — fetch single workout with segments
 * PUT    /api/workouts/:id   — update workout fields
 * DELETE /api/workouts/:id   — delete workout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { UpdateWorkoutBody, WorkoutWithSegments } from '../../types/index.js';

const VALID_WORKOUT_TYPES = ['Easy', 'Intervals', 'Tempo', 'Long', 'Cross-train', 'Rest', 'Shakeout', 'Race'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateUpdateBody(body: unknown): { valid: true; data: UpdateWorkoutBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  if (Object.keys(b).length === 0) {
    return { valid: false, error: 'Update body must contain at least one field' };
  }
  if (b.workout_date !== undefined && (typeof b.workout_date !== 'string' || !ISO_DATE.test(b.workout_date))) {
    return { valid: false, error: 'workout_date must be ISO format YYYY-MM-DD' };
  }
  if (b.day_of_week !== undefined && !VALID_DAYS.includes(b.day_of_week as string)) {
    return { valid: false, error: `day_of_week must be one of: ${VALID_DAYS.join(', ')}` };
  }
  if (b.workout_type !== undefined && !VALID_WORKOUT_TYPES.includes(b.workout_type as string)) {
    return { valid: false, error: `workout_type must be one of: ${VALID_WORKOUT_TYPES.join(', ')}` };
  }
  if (b.total_miles !== undefined && b.total_miles !== null) {
    if (typeof b.total_miles !== 'number' || (b.total_miles as number) < 0) {
      return { valid: false, error: 'total_miles must be a non-negative number or null' };
    }
  }
  if (b.is_rest_day !== undefined && typeof b.is_rest_day !== 'boolean') {
    return { valid: false, error: 'is_rest_day must be a boolean' };
  }
  if (b.is_race_day !== undefined && typeof b.is_race_day !== 'boolean') {
    return { valid: false, error: 'is_race_day must be a boolean' };
  }
  if (b.is_key_workout !== undefined && typeof b.is_key_workout !== 'boolean') {
    return { valid: false, error: 'is_key_workout must be a boolean' };
  }

  return { valid: true, data: b as unknown as UpdateWorkoutBody };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id as string;
  const id = Number(idParam);

  if (!idParam || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid workout id — must be a positive integer' });
  }

  const supabase = getSupabaseClient();

  // ─── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_segments(*)')
        .eq('id', id)
        .order('segment_order', { referencedTable: 'workout_segments', ascending: true })
        .single();

      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' });
      }
      if (error) {
        console.error(`[GET /api/workouts/${id}] Supabase error:`, error.message);
        return res.status(500).json({ error: 'Failed to fetch workout' });
      }

      return res.status(200).json(data as WorkoutWithSegments);
    } catch (err) {
      console.error(`[GET /api/workouts/${id}] Unexpected error:`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─── PUT ─────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const validation = validateUpdateBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const updates: Record<string, unknown> = {};
      const allowed: (keyof UpdateWorkoutBody)[] = [
        'workout_date', 'day_of_week', 'workout_type',
        'total_miles', 'primary_pace_zone', 'notes',
        'is_rest_day', 'is_race_day', 'is_key_workout',
      ];
      for (const key of allowed) {
        if (key in validation.data) {
          updates[key] = validation.data[key];
        }
      }

      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' });
      }
      if (error) {
        console.error(`[PUT /api/workouts/${id}] Supabase error:`, error.message);
        return res.status(500).json({ error: 'Failed to update workout' });
      }

      return res.status(200).json(data as WorkoutWithSegments);
    } catch (err) {
      console.error(`[PUT /api/workouts/${id}] Unexpected error:`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`[DELETE /api/workouts/${id}] Supabase error:`, error.message);
        return res.status(500).json({ error: 'Failed to delete workout' });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`[DELETE /api/workouts/${id}] Unexpected error:`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
