export type Sport = 'swim' | 'bike' | 'run' | 'brick' | 'rest' | 'strength';
export type Intensity = 'easy' | 'moderate' | 'hard' | 'race' | 'rest';
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TrainingWeek {
  id: string;
  week_number: number;
  start_date: string; // ISO date string YYYY-MM-DD
  end_date: string;
  theme: string;
  notes: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  week_id: string;
  date: string; // ISO date string YYYY-MM-DD
  day_of_week: DayOfWeek;
  sport: Sport;
  title: string;
  description: string;
  duration_min: number | null;
  distance: string | null; // e.g. "1500m", "20 miles", "2200 yards"
  intensity: Intensity;
  completed: boolean;
  notes: string | null;
  created_at: string;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Request/response shapes for the API
export interface CreateWorkoutBody {
  week_id: string;
  date: string;
  day_of_week: DayOfWeek;
  sport: Sport;
  title: string;
  description: string;
  duration_min?: number;
  distance?: string;
  intensity: Intensity;
  completed?: boolean;
  notes?: string;
}

export interface UpdateWorkoutBody {
  date?: string;
  day_of_week?: DayOfWeek;
  sport?: Sport;
  title?: string;
  description?: string;
  duration_min?: number | null;
  distance?: string | null;
  intensity?: Intensity;
  completed?: boolean;
  notes?: string | null;
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
