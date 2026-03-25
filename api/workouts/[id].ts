/**
 * GET    /api/workouts/:id   — fetch single workout
 * PUT    /api/workouts/:id   — update workout fields
 * DELETE /api/workouts/:id   — delete workout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase.js';
import type { UpdateWorkoutBody, Workout } from '../../types/index.js';

const VALID_SPORTS = ['swim', 'bike', 'run', 'brick', 'rest', 'strength'];
const VALID_INTENSITIES = ['easy', 'moderate', 'hard', 'race', 'rest'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUpdateBody(body: unknown): { valid: true; data: UpdateWorkoutBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  if (Object.keys(b).length === 0) {
    return { valid: false, error: 'Update body must contain at least one field' };
  }
  if (b.date !== undefined && (typeof b.date !== 'string' || !ISO_DATE.test(b.date))) {
    return { valid: false, error: 'date must be ISO format YYYY-MM-DD' };
  }
  if (b.day_of_week !== undefined && !VALID_DAYS.includes(b.day_of_week as string)) {
    return { valid: false, error: `day_of_week must be one of: ${VALID_DAYS.join(', ')}` };
  }
  if (b.sport !== undefined && !VALID_SPORTS.includes(b.sport as string)) {
    return { valid: false, error: `sport must be one of: ${VALID_SPORTS.join(', ')}` };
  }
  if (b.intensity !== undefined && !VALID_INTENSITIES.includes(b.intensity as string)) {
    return { valid: false, error: `intensity must be one of: ${VALID_INTENSITIES.join(', ')}` };
  }
  if (b.title !== undefined && (typeof b.title !== 'string' || !b.title.trim())) {
    return { valid: false, error: 'title must be a non-empty string' };
  }
  if (b.completed !== undefined && typeof b.completed !== 'boolean') {
    return { valid: false, error: 'completed must be a boolean' };
  }
  if (b.duration_min !== undefined && b.duration_min !== null) {
    if (!Number.isInteger(b.duration_min) || (b.duration_min as number) <= 0) {
      return { valid: false, error: 'duration_min must be a positive integer or null' };
    }
  }

  return { valid: true, data: b as unknown as UpdateWorkoutBody };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (!id || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid workout id — must be a UUID' });
  }

  const supabase = getSupabaseClient();

  // ─── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' });
      }
      if (error) {
        console.error(`[GET /api/workouts/${id}] Supabase error:`, error.message);
        return res.status(500).json({ error: 'Failed to fetch workout' });
      }

      return res.status(200).json(data as Workout);
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
      // Build update object from only provided fields
      const updates: Record<string, unknown> = {};
      const allowed: (keyof UpdateWorkoutBody)[] = [
        'date', 'day_of_week', 'sport', 'title', 'description',
        'duration_min', 'distance', 'intensity', 'completed', 'notes',
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

      return res.status(200).json(data as Workout);
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
