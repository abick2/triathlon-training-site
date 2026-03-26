/**
 * Anthropic client and tool definitions for the triathlon coach.
 *
 * Tool use strategy:
 *   The coach uses these tools to read and modify the training plan in
 *   Supabase. Claude calls them, we execute them, and return results back
 *   to Claude to continue the conversation.
 *
 * Prompt caching strategy:
 *   The system prompt (coach profile + current plan context) is large and
 *   stable across requests. We mark it with cache_control: { type: 'ephemeral' }
 *   so Anthropic caches it for up to 5 minutes, cutting input token costs
 *   significantly on follow-up messages.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getSupabaseClient } from './supabase.js';
import type { CoachToolName } from '../types/index.js';

// ─── Client singleton ─────────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable.');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// ─── Coach profile loader ─────────────────────────────────────────────────────

let _coachProfile: string | null = null;

export function loadCoachProfile(): string {
  if (!_coachProfile) {
    const profilePath = resolve(process.cwd(), 'coach-profile.md');
    _coachProfile = readFileSync(profilePath, 'utf-8');
  }
  return _coachProfile;
}

// For tests — allows injecting a profile string without touching the filesystem
export function setCoachProfileForTest(profile: string) {
  _coachProfile = profile;
}

export function resetCoachProfile() {
  _coachProfile = null;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

export const COACH_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_week' satisfies CoachToolName,
    description:
      'Fetch a single training week with all its workouts by week number. Use this when the athlete asks about a specific week.',
    input_schema: {
      type: 'object',
      properties: {
        week_number: {
          type: 'number',
          description: 'The week number (1–15) to fetch.',
        },
      },
      required: ['week_number'],
    },
  },
  {
    name: 'get_workouts' satisfies CoachToolName,
    description:
      'Fetch workouts for a date range or for a specific week_id. Use this to see what is scheduled across multiple days.',
    input_schema: {
      type: 'object',
      properties: {
        week_id: {
          type: 'string',
          description: 'UUID of the training week to fetch workouts for.',
        },
        start_date: {
          type: 'string',
          description: 'ISO date (YYYY-MM-DD) start of range.',
        },
        end_date: {
          type: 'string',
          description: 'ISO date (YYYY-MM-DD) end of range.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_workout' satisfies CoachToolName,
    description: 'Fetch a single workout by its UUID.',
    input_schema: {
      type: 'object',
      properties: {
        workout_id: {
          type: 'string',
          description: 'UUID of the workout to fetch.',
        },
      },
      required: ['workout_id'],
    },
  },
  {
    name: 'update_workout' satisfies CoachToolName,
    description:
      'Update fields on a single workout. Use this to change the date, sport, title, description, intensity, duration, distance, completed status, or notes. Only include the fields you want to change.',
    input_schema: {
      type: 'object',
      properties: {
        workout_id: {
          type: 'string',
          description: 'UUID of the workout to update.',
        },
        updates: {
          type: 'object',
          description: 'Fields to update. Omit fields you do not want to change.',
          properties: {
            date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
            day_of_week: {
              type: 'string',
              enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
            sport: {
              type: 'string',
              enum: ['swim', 'bike', 'run', 'brick', 'rest', 'strength'],
            },
            title: { type: 'string' },
            description: { type: 'string' },
            duration_min: { type: ['number', 'null'] },
            distance: { type: ['string', 'null'] },
            intensity: {
              type: 'string',
              enum: ['easy', 'moderate', 'hard', 'race', 'rest'],
            },
            completed: { type: 'boolean' },
            notes: { type: ['string', 'null'] },
          },
        },
      },
      required: ['workout_id', 'updates'],
    },
  },
  {
    name: 'swap_workout_days' satisfies CoachToolName,
    description:
      'Swap the dates and day_of_week values between two workouts. Use this when the athlete wants to move a rest day or trade two sessions.',
    input_schema: {
      type: 'object',
      properties: {
        workout_id_a: {
          type: 'string',
          description: 'UUID of the first workout.',
        },
        workout_id_b: {
          type: 'string',
          description: 'UUID of the second workout.',
        },
      },
      required: ['workout_id_a', 'workout_id_b'],
    },
  },
  {
    name: 'add_workout_note' satisfies CoachToolName,
    description:
      'Append a note to a workout. Use after an athlete reports on how a session went.',
    input_schema: {
      type: 'object',
      properties: {
        workout_id: { type: 'string' },
        note: { type: 'string', description: 'Text to append to the workout notes.' },
      },
      required: ['workout_id', 'note'],
    },
  },
  {
    name: 'get_coach_memory' satisfies CoachToolName,
    description:
      'Read a value from the coach memory store by key. Use to retrieve previously learned athlete preferences or notes.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to retrieve.' },
      },
      required: ['key'],
    },
  },
  {
    name: 'update_coach_memory' satisfies CoachToolName,
    description:
      'Write or update a value in the coach memory store. Use to record new athlete preferences, injury notes, or session feedback for future conversations.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key (use snake_case).' },
        value: { type: 'string', description: 'Value to store.' },
      },
      required: ['key', 'value'],
    },
  },
];

// ─── Tool executor ────────────────────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const supabase = getSupabaseClient();

  try {
    switch (name as CoachToolName) {
      case 'get_week': {
        const { data, error } = await supabase
          .from('training_weeks')
          .select('*, workouts(*)')
          .eq('week_number', input.week_number as number)
          .order('date', { referencedTable: 'workouts', ascending: true })
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'get_workouts': {
        // Apply filters before order so the chain always ends with .order()
        let query = supabase.from('workouts').select('*');
        if (input.week_id) query = query.eq('week_id', input.week_id as string);
        if (input.start_date) query = query.gte('date', input.start_date as string);
        if (input.end_date) query = query.lte('date', input.end_date as string);
        const { data, error } = await query.order('date', { ascending: true });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'get_workout': {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', input.workout_id as string)
          .single();
        if (error?.code === 'PGRST116') return { success: false, error: 'Workout not found' };
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'update_workout': {
        const { data, error } = await supabase
          .from('workouts')
          .update(input.updates as Record<string, unknown>)
          .eq('id', input.workout_id as string)
          .select()
          .single();
        if (error?.code === 'PGRST116') return { success: false, error: 'Workout not found' };
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'swap_workout_days': {
        // Fetch both workouts
        const { data: a, error: errA } = await supabase
          .from('workouts')
          .select('id, date, day_of_week')
          .eq('id', input.workout_id_a as string)
          .single();
        const { data: b, error: errB } = await supabase
          .from('workouts')
          .select('id, date, day_of_week')
          .eq('id', input.workout_id_b as string)
          .single();

        if (errA || !a) return { success: false, error: 'First workout not found' };
        if (errB || !b) return { success: false, error: 'Second workout not found' };

        // Swap dates and day_of_week
        const [resA, resB] = await Promise.all([
          supabase
            .from('workouts')
            .update({ date: b.date, day_of_week: b.day_of_week })
            .eq('id', a.id)
            .select()
            .single(),
          supabase
            .from('workouts')
            .update({ date: a.date, day_of_week: a.day_of_week })
            .eq('id', b.id)
            .select()
            .single(),
        ]);

        if (resA.error) return { success: false, error: resA.error.message };
        if (resB.error) return { success: false, error: resB.error.message };

        return { success: true, data: { workout_a: resA.data, workout_b: resB.data } };
      }

      case 'add_workout_note': {
        // Read existing notes first
        const { data: existing, error: fetchErr } = await supabase
          .from('workouts')
          .select('notes')
          .eq('id', input.workout_id as string)
          .single();

        if (fetchErr?.code === 'PGRST116') return { success: false, error: 'Workout not found' };
        if (fetchErr) return { success: false, error: fetchErr.message };

        const newNotes = existing.notes
          ? `${existing.notes}\n\n${input.note}`
          : (input.note as string);

        const { data, error } = await supabase
          .from('workouts')
          .update({ notes: newNotes })
          .eq('id', input.workout_id as string)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'get_coach_memory': {
        const { data, error } = await supabase
          .from('coach_memory')
          .select('*')
          .eq('key', input.key as string)
          .single();
        if (error?.code === 'PGRST116') return { success: false, error: `Memory key '${input.key}' not found` };
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      case 'update_coach_memory': {
        const { data, error } = await supabase
          .from('coach_memory')
          .upsert(
            { key: input.key as string, value: input.value as string, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
          .select()
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error executing tool',
    };
  }
}

// ─── System prompt builder ────────────────────────────────────────────────────

/**
 * Builds the system prompt array with prompt caching.
 * The coach profile is the stable, expensive-to-process block — cache it.
 */
export function buildSystemPrompt(): Anthropic.Beta.BetaTextBlockParam[] {
  const profile = loadCoachProfile();
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      type: 'text',
      text: profile,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: `Today's date is ${today}.`,
    },
  ];
}
