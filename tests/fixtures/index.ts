/**
 * Shared test fixtures used across all test files.
 * These conform to the TypeScript types in types/index.ts.
 */

import type {
  TrainingPlan,
  PaceTarget,
  TrainingWeek,
  Workout,
  WorkoutSegment,
  WeekWithWorkouts,
  WorkoutWithSegments,
  PlanWithPaceTargets,
  CoachMemory,
  CreateWorkoutBody,
  UpdateWorkoutBody,
  ChatMessage,
} from '../../types/index.js';

export const FIXTURE_PLAN_ID = 1;
export const FIXTURE_WEEK_ID = 1;
export const FIXTURE_WORKOUT_ID = 1;
export const FIXTURE_SEGMENT_ID = 1;

export const fixturePlan: TrainingPlan = {
  id: FIXTURE_PLAN_ID,
  athlete_name: 'Andrew',
  race_name: 'Half Marathon',
  race_date: '2026-04-20',
  race_distance: 'Half Marathon (13.1 mi)',
  goal_time: '1:12:00',
  goal_pace_per_mile: '5:29',
  pr_time: '1:15:20',
  pr_notes: 'hilly course',
  current_weekly_mileage_min: 40,
  current_weekly_mileage_max: 50,
  fitness_level: 'Advanced',
  created_at: '2026-01-01T00:00:00.000Z',
};

export const fixturePaceTarget: PaceTarget = {
  id: 1,
  plan_id: FIXTURE_PLAN_ID,
  zone_name: 'Race pace',
  pace_min: '5:29',
  pace_max: '5:29',
  notes: 'Half-marathon goal pace',
};

export const fixturePlanWithPaceTargets: PlanWithPaceTargets = {
  ...fixturePlan,
  pace_targets: [fixturePaceTarget],
};

export const fixtureWeek: TrainingWeek = {
  id: FIXTURE_WEEK_ID,
  plan_id: FIXTURE_PLAN_ID,
  week_number: 1,
  phase: 'Build',
  label: 'Sharpen',
  week_start: '2026-03-27',
  week_end: '2026-04-02',
  target_mileage: 40,
  notes: 'First build week. Establish quality sessions.',
};

export const fixtureWorkoutEasy: Workout = {
  id: FIXTURE_WORKOUT_ID,
  week_id: FIXTURE_WEEK_ID,
  plan_id: FIXTURE_PLAN_ID,
  workout_date: '2026-03-27',
  day_of_week: 'Friday',
  workout_type: 'Easy',
  total_miles: 6,
  primary_pace_zone: 'Easy/Recovery',
  notes: 'Easy effort, conversational pace.',
  is_rest_day: false,
  is_race_day: false,
  is_key_workout: false,
};

export const fixtureWorkoutRest: Workout = {
  id: 2,
  week_id: FIXTURE_WEEK_ID,
  plan_id: FIXTURE_PLAN_ID,
  workout_date: '2026-03-28',
  day_of_week: 'Saturday',
  workout_type: 'Rest',
  total_miles: null,
  primary_pace_zone: null,
  notes: null,
  is_rest_day: true,
  is_race_day: false,
  is_key_workout: false,
};

export const fixtureWorkoutIntervals: Workout = {
  id: 3,
  week_id: FIXTURE_WEEK_ID,
  plan_id: FIXTURE_PLAN_ID,
  workout_date: '2026-03-29',
  day_of_week: 'Sunday',
  workout_type: 'Intervals',
  total_miles: 10,
  primary_pace_zone: 'Intervals',
  notes: 'VO2 max intervals. 2mi WU, 5×1K@5:10–5:20, 2mi CD.',
  is_rest_day: false,
  is_race_day: false,
  is_key_workout: true,
};

export const fixtureSegment: WorkoutSegment = {
  id: FIXTURE_SEGMENT_ID,
  workout_id: FIXTURE_WORKOUT_ID,
  segment_order: 1,
  segment_type: 'warmup',
  description: '2 mile easy warmup',
  reps: null,
  rep_distance: null,
  pace_min: '7:00',
  pace_max: '7:30',
  rest_duration: null,
  distance_miles: 2,
  duration_minutes: 15,
};

export const fixtureWeekWithWorkouts: WeekWithWorkouts = {
  ...fixtureWeek,
  workouts: [fixtureWorkoutEasy, fixtureWorkoutRest, fixtureWorkoutIntervals],
};

export const fixtureWorkoutWithSegments: WorkoutWithSegments = {
  ...fixtureWorkoutEasy,
  workout_segments: [fixtureSegment],
};

export const fixtureCoachMemory: CoachMemory = {
  id: '00000000-0000-0000-0000-000000000005',
  key: 'athlete_notes',
  value: 'Andrew has been running for a very long time. Olympic PR 2:14:23. Mile PR 4:21.',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const fixtureCreateWorkoutBody: CreateWorkoutBody = {
  week_id: FIXTURE_WEEK_ID,
  plan_id: FIXTURE_PLAN_ID,
  workout_date: '2026-03-30',
  day_of_week: 'Monday',
  workout_type: 'Easy',
  total_miles: 5,
  primary_pace_zone: 'Easy/Recovery',
  notes: 'Easy recovery run.',
  is_rest_day: false,
  is_race_day: false,
  is_key_workout: false,
};

export const fixtureUpdateWorkoutBody: UpdateWorkoutBody = {
  notes: 'Felt great, legs very fresh.',
};

export const fixtureChatMessages: ChatMessage[] = [
  { role: 'user', content: 'Can you move my Wednesday run to Thursday?' },
];
