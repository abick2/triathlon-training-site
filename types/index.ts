export type WorkoutType = 'Easy' | 'Intervals' | 'Tempo' | 'Long' | 'Cross-train' | 'Rest' | 'Shakeout' | 'Race';
export type SegmentType = 'warmup' | 'main_set' | 'interval_rep' | 'cooldown' | 'stride' | 'cross_train';
export type Phase = 'Build' | 'Taper' | 'Race';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'long' | 'rest';
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TrainingPlan {
  id: number;
  athlete_name: string;
  race_name: string;
  race_date: string; // YYYY-MM-DD
  race_distance: string;
  goal_time: string;
  goal_pace_per_mile: string;
  pr_time: string | null;
  pr_notes: string | null;
  current_weekly_mileage_min: number | null;
  current_weekly_mileage_max: number | null;
  fitness_level: string;
  created_at: string;
}

export interface PaceTarget {
  id: number;
  plan_id: number;
  zone_name: string;
  pace_min: string;
  pace_max: string;
  notes: string | null;
}

export interface TrainingWeek {
  id: number;
  plan_id: number;
  week_number: number;
  phase: Phase;
  label: string;
  week_start: string; // YYYY-MM-DD
  week_end: string;   // YYYY-MM-DD
  target_mileage: number | null;
  notes: string | null;
}

export interface Workout {
  id: number;
  week_id: number;
  plan_id: number;
  workout_date: string; // YYYY-MM-DD
  day_of_week: DayOfWeek;
  workout_type: WorkoutType;
  total_miles: number | null;
  primary_pace_zone: string | null;
  notes: string | null;
  is_rest_day: boolean;
  is_race_day: boolean;
  is_key_workout: boolean;
}

export interface WorkoutSegment {
  id: number;
  workout_id: number;
  segment_order: number;
  segment_type: SegmentType;
  description: string | null;
  reps: number | null;
  rep_distance: string | null;
  pace_min: string | null;
  pace_max: string | null;
  rest_duration: string | null;
  distance_miles: number | null;
  duration_minutes: number | null;
}

export interface CoachMemory {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface WeekWithWorkouts extends TrainingWeek {
  workouts: Workout[];
}

export interface WorkoutWithSegments extends Workout {
  workout_segments: WorkoutSegment[];
}

export interface PlanWithPaceTargets extends TrainingPlan {
  pace_targets: PaceTarget[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CreateWorkoutBody {
  week_id: number;
  plan_id: number;
  workout_date: string;
  day_of_week: DayOfWeek;
  workout_type: WorkoutType;
  total_miles?: number | null;
  primary_pace_zone?: string | null;
  notes?: string | null;
  is_rest_day?: boolean;
  is_race_day?: boolean;
  is_key_workout?: boolean;
}

export interface UpdateWorkoutBody {
  workout_date?: string;
  day_of_week?: DayOfWeek;
  workout_type?: WorkoutType;
  total_miles?: number | null;
  primary_pace_zone?: string | null;
  notes?: string | null;
  is_rest_day?: boolean;
  is_race_day?: boolean;
  is_key_workout?: boolean;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
}

// Anthropic tool names used in the coach brain
export type CoachToolName =
  | 'get_week'
  | 'get_workouts'
  | 'get_workout'
  | 'update_workout'
  | 'swap_workout_days'
  | 'add_workout_note'
  | 'get_coach_memory'
  | 'update_coach_memory';
