/**
 * Shared test fixtures used across all test files.
 * These conform to the TypeScript types in types/index.ts.
 */

import type {
  TrainingWeek,
  Workout,
  WeekWithWorkouts,
  CoachMemory,
  CreateWorkoutBody,
  UpdateWorkoutBody,
  ChatMessage,
} from '../../types/index.js';

export const FIXTURE_WEEK_ID = '00000000-0000-0000-0000-000000000001';
export const FIXTURE_WORKOUT_ID = '00000000-0000-0000-0000-000000000002';

export const fixtureWeek: TrainingWeek = {
  id: FIXTURE_WEEK_ID,
  week_number: 10,
  start_date: '2026-03-23',
  end_date: '2026-03-29',
  theme: 'Recovery Week — Week 10',
  notes: 'Planned recovery week after Build 2 block.',
  created_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureWorkoutSwim: Workout = {
  id: FIXTURE_WORKOUT_ID,
  week_id: FIXTURE_WEEK_ID,
  date: '2026-03-24',
  day_of_week: 'Tuesday',
  sport: 'swim',
  title: 'Aerobic Base Swim',
  description: `Warm-Up (400 yards):
  - 200 easy freestyle, focus on long catch
  - 4×50 drill: fingertip drag, 15 sec rest

Main Set (1600 yards):
  - 4×400 at easy effort (RPE 5/10), 30 sec rest

Cool-Down (200 yards):
  - 200 easy backstroke`,
  duration_min: 50,
  distance: '2200 yards',
  intensity: 'easy',
  completed: false,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureWorkoutRun: Workout = {
  id: '00000000-0000-0000-0000-000000000003',
  week_id: FIXTURE_WEEK_ID,
  date: '2026-03-25',
  day_of_week: 'Wednesday',
  sport: 'run',
  title: 'Easy Recovery Run',
  description: 'Easy conversational pace (RPE 4/10).',
  duration_min: 40,
  distance: '5 miles',
  intensity: 'easy',
  completed: false,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureWorkoutRest: Workout = {
  id: '00000000-0000-0000-0000-000000000004',
  week_id: FIXTURE_WEEK_ID,
  date: '2026-03-23',
  day_of_week: 'Monday',
  sport: 'rest',
  title: 'Rest Day',
  description: 'Full rest.',
  duration_min: null,
  distance: null,
  intensity: 'rest',
  completed: false,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureWeekWithWorkouts: WeekWithWorkouts = {
  ...fixtureWeek,
  workouts: [fixtureWorkoutRest, fixtureWorkoutSwim, fixtureWorkoutRun],
};

export const fixtureCoachMemory: CoachMemory = {
  id: '00000000-0000-0000-0000-000000000005',
  key: 'athlete_notes',
  value: 'Andrew has been running for a very long time. Olympic PR 2:14:23. Mile PR 4:21.',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureCreateWorkoutBody: CreateWorkoutBody = {
  week_id: FIXTURE_WEEK_ID,
  date: '2026-03-26',
  day_of_week: 'Thursday',
  sport: 'bike',
  title: 'Recovery Spin',
  description: 'Easy spin at RPE 4/10.',
  duration_min: 60,
  distance: '18 miles',
  intensity: 'easy',
};

export const fixtureUpdateWorkoutBody: UpdateWorkoutBody = {
  completed: true,
  notes: 'Felt great, legs very fresh.',
};

export const fixtureChatMessages: ChatMessage[] = [
  { role: 'user', content: 'Can you move my Wednesday run to Thursday?' },
];
