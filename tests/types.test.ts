/**
 * Type conformance tests.
 * Validates that fixtures match their TypeScript types and that
 * enum values are exhaustively covered.
 */

import { describe, it, expect } from 'vitest';
import type {
  WorkoutType,
  Phase,
  SegmentType,
  DayOfWeek,
} from '../types/index.js';
import {
  fixtureWeek,
  fixtureWorkoutEasy,
  fixtureWorkoutRest,
  fixtureWorkoutIntervals,
  fixtureSegment,
  fixtureCreateWorkoutBody,
  fixtureUpdateWorkoutBody,
  fixtureWeekWithWorkouts,
  fixtureCoachMemory,
  fixturePlan,
  fixturePaceTarget,
  fixturePlanWithPaceTargets,
  fixtureWorkoutWithSegments,
} from './fixtures/index.js';

// ─── Enum coverage ────────────────────────────────────────────────────────────

const VALID_WORKOUT_TYPES: WorkoutType[] = [
  'Easy', 'Intervals', 'Tempo', 'Long', 'Cross-train', 'Rest', 'Shakeout', 'Race',
];
const VALID_PHASES: Phase[] = ['Build', 'Taper', 'Race'];
const VALID_SEGMENT_TYPES: SegmentType[] = [
  'warmup', 'main_set', 'interval_rep', 'cooldown', 'stride', 'cross_train',
];
const VALID_DAYS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

describe('type enums', () => {
  it('covers all 8 workout_type values', () => {
    expect(VALID_WORKOUT_TYPES).toHaveLength(8);
    expect(VALID_WORKOUT_TYPES).toContain('Easy');
    expect(VALID_WORKOUT_TYPES).toContain('Intervals');
    expect(VALID_WORKOUT_TYPES).toContain('Tempo');
    expect(VALID_WORKOUT_TYPES).toContain('Long');
    expect(VALID_WORKOUT_TYPES).toContain('Cross-train');
    expect(VALID_WORKOUT_TYPES).toContain('Rest');
    expect(VALID_WORKOUT_TYPES).toContain('Shakeout');
    expect(VALID_WORKOUT_TYPES).toContain('Race');
  });

  it('covers all 3 phase values', () => {
    expect(VALID_PHASES).toHaveLength(3);
    expect(VALID_PHASES).toContain('Build');
    expect(VALID_PHASES).toContain('Taper');
    expect(VALID_PHASES).toContain('Race');
  });

  it('covers all 6 segment_type values', () => {
    expect(VALID_SEGMENT_TYPES).toHaveLength(6);
  });

  it('covers all 7 days of week', () => {
    expect(VALID_DAYS).toHaveLength(7);
  });
});

// ─── TrainingPlan fixture ─────────────────────────────────────────────────────

describe('TrainingPlan fixture', () => {
  it('has required fields', () => {
    expect(fixturePlan.id).toBeGreaterThan(0);
    expect(typeof fixturePlan.athlete_name).toBe('string');
    expect(typeof fixturePlan.race_name).toBe('string');
    expect(fixturePlan.race_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof fixturePlan.goal_time).toBe('string');
    expect(typeof fixturePlan.goal_pace_per_mile).toBe('string');
    expect(typeof fixturePlan.fitness_level).toBe('string');
  });

  it('pr_time and pr_notes are string or null', () => {
    expect(fixturePlan.pr_time === null || typeof fixturePlan.pr_time === 'string').toBe(true);
    expect(fixturePlan.pr_notes === null || typeof fixturePlan.pr_notes === 'string').toBe(true);
  });
});

// ─── PaceTarget fixture ───────────────────────────────────────────────────────

describe('PaceTarget fixture', () => {
  it('has required fields', () => {
    expect(fixturePaceTarget.id).toBeGreaterThan(0);
    expect(fixturePaceTarget.plan_id).toBe(fixturePlan.id);
    expect(typeof fixturePaceTarget.zone_name).toBe('string');
    expect(fixturePaceTarget.pace_min).toMatch(/^\d+:\d{2}$/);
    expect(fixturePaceTarget.pace_max).toMatch(/^\d+:\d{2}$/);
  });
});

// ─── PlanWithPaceTargets fixture ──────────────────────────────────────────────

describe('PlanWithPaceTargets fixture', () => {
  it('contains the plan fields', () => {
    expect(fixturePlanWithPaceTargets.id).toBe(fixturePlan.id);
    expect(fixturePlanWithPaceTargets.race_name).toBe(fixturePlan.race_name);
  });

  it('pace_targets is a non-empty array', () => {
    expect(Array.isArray(fixturePlanWithPaceTargets.pace_targets)).toBe(true);
    expect(fixturePlanWithPaceTargets.pace_targets.length).toBeGreaterThan(0);
  });
});

// ─── TrainingWeek fixture ─────────────────────────────────────────────────────

describe('TrainingWeek fixture', () => {
  it('has required fields', () => {
    expect(fixtureWeek.id).toBeGreaterThan(0);
    expect(typeof fixtureWeek.week_number).toBe('number');
    expect(fixtureWeek.week_number).toBeGreaterThan(0);
    expect(fixtureWeek.week_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fixtureWeek.week_end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VALID_PHASES).toContain(fixtureWeek.phase);
    expect(typeof fixtureWeek.label).toBe('string');
  });

  it('week_end is on or after week_start', () => {
    expect(fixtureWeek.week_end >= fixtureWeek.week_start).toBe(true);
  });

  it('notes is string or null', () => {
    expect(fixtureWeek.notes === null || typeof fixtureWeek.notes === 'string').toBe(true);
  });

  it('target_mileage is a number or null', () => {
    expect(
      fixtureWeek.target_mileage === null || typeof fixtureWeek.target_mileage === 'number'
    ).toBe(true);
  });
});

// ─── Workout fixtures ─────────────────────────────────────────────────────────

describe('Workout fixtures', () => {
  const workouts = [fixtureWorkoutEasy, fixtureWorkoutRest, fixtureWorkoutIntervals];

  it.each(workouts)('workout (id=$id) has required fields', (workout) => {
    expect(workout.id).toBeGreaterThan(0);
    expect(workout.week_id).toBeGreaterThan(0);
    expect(workout.plan_id).toBeGreaterThan(0);
    expect(workout.workout_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VALID_DAYS).toContain(workout.day_of_week);
    expect(VALID_WORKOUT_TYPES).toContain(workout.workout_type);
    expect(typeof workout.is_rest_day).toBe('boolean');
    expect(typeof workout.is_race_day).toBe('boolean');
    expect(typeof workout.is_key_workout).toBe('boolean');
  });

  it('rest workout has correct flags', () => {
    expect(fixtureWorkoutRest.workout_type).toBe('Rest');
    expect(fixtureWorkoutRest.is_rest_day).toBe(true);
    expect(fixtureWorkoutRest.total_miles).toBeNull();
    expect(fixtureWorkoutRest.primary_pace_zone).toBeNull();
  });

  it('intervals workout is flagged as key workout', () => {
    expect(fixtureWorkoutIntervals.workout_type).toBe('Intervals');
    expect(fixtureWorkoutIntervals.is_key_workout).toBe(true);
    expect(fixtureWorkoutIntervals.total_miles).toBeGreaterThan(0);
  });

  it('total_miles is a non-negative number or null', () => {
    workouts.forEach((w) => {
      if (w.total_miles !== null) {
        expect(typeof w.total_miles).toBe('number');
        expect(w.total_miles).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// ─── WorkoutSegment fixture ───────────────────────────────────────────────────

describe('WorkoutSegment fixture', () => {
  it('has required fields', () => {
    expect(fixtureSegment.id).toBeGreaterThan(0);
    expect(fixtureSegment.workout_id).toBeGreaterThan(0);
    expect(fixtureSegment.segment_order).toBeGreaterThan(0);
    expect(VALID_SEGMENT_TYPES).toContain(fixtureSegment.segment_type);
  });

  it('nullable fields are correct types', () => {
    expect(fixtureSegment.reps === null || typeof fixtureSegment.reps === 'number').toBe(true);
    expect(fixtureSegment.distance_miles === null || typeof fixtureSegment.distance_miles === 'number').toBe(true);
    expect(fixtureSegment.duration_minutes === null || typeof fixtureSegment.duration_minutes === 'number').toBe(true);
  });
});

// ─── WorkoutWithSegments fixture ──────────────────────────────────────────────

describe('WorkoutWithSegments fixture', () => {
  it('contains workout fields and segments array', () => {
    expect(fixtureWorkoutWithSegments.id).toBe(fixtureWorkoutEasy.id);
    expect(Array.isArray(fixtureWorkoutWithSegments.workout_segments)).toBe(true);
    expect(fixtureWorkoutWithSegments.workout_segments.length).toBeGreaterThan(0);
  });

  it('all segments belong to this workout', () => {
    fixtureWorkoutWithSegments.workout_segments.forEach((s) => {
      expect(s.workout_id).toBe(fixtureWorkoutWithSegments.id);
    });
  });
});

// ─── WeekWithWorkouts fixture ─────────────────────────────────────────────────

describe('WeekWithWorkouts fixture', () => {
  it('contains the week fields', () => {
    expect(fixtureWeekWithWorkouts.id).toBe(fixtureWeek.id);
    expect(fixtureWeekWithWorkouts.week_number).toBe(fixtureWeek.week_number);
  });

  it('workouts array is non-empty', () => {
    expect(fixtureWeekWithWorkouts.workouts.length).toBeGreaterThan(0);
  });

  it('all workouts belong to the week', () => {
    fixtureWeekWithWorkouts.workouts.forEach((w) => {
      expect(w.week_id).toBe(fixtureWeek.id);
    });
  });
});

// ─── CoachMemory fixture ──────────────────────────────────────────────────────

describe('CoachMemory fixture', () => {
  it('has required fields', () => {
    expect(fixtureCoachMemory.id).toBeTruthy();
    expect(typeof fixtureCoachMemory.key).toBe('string');
    expect(typeof fixtureCoachMemory.value).toBe('string');
    expect(fixtureCoachMemory.key.length).toBeGreaterThan(0);
    expect(fixtureCoachMemory.value.length).toBeGreaterThan(0);
  });
});

// ─── CreateWorkoutBody fixture ────────────────────────────────────────────────

describe('CreateWorkoutBody fixture', () => {
  it('has required fields', () => {
    expect(fixtureCreateWorkoutBody.week_id).toBeGreaterThan(0);
    expect(fixtureCreateWorkoutBody.plan_id).toBeGreaterThan(0);
    expect(fixtureCreateWorkoutBody.workout_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VALID_DAYS).toContain(fixtureCreateWorkoutBody.day_of_week);
    expect(VALID_WORKOUT_TYPES).toContain(fixtureCreateWorkoutBody.workout_type);
  });
});

// ─── UpdateWorkoutBody fixture ────────────────────────────────────────────────

describe('UpdateWorkoutBody fixture', () => {
  it('all present fields are valid types', () => {
    if (fixtureUpdateWorkoutBody.workout_type !== undefined) {
      expect(VALID_WORKOUT_TYPES).toContain(fixtureUpdateWorkoutBody.workout_type);
    }
    if (fixtureUpdateWorkoutBody.is_rest_day !== undefined) {
      expect(typeof fixtureUpdateWorkoutBody.is_rest_day).toBe('boolean');
    }
    if (fixtureUpdateWorkoutBody.workout_date !== undefined) {
      expect(fixtureUpdateWorkoutBody.workout_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    if (fixtureUpdateWorkoutBody.notes !== undefined) {
      expect(
        fixtureUpdateWorkoutBody.notes === null || typeof fixtureUpdateWorkoutBody.notes === 'string'
      ).toBe(true);
    }
  });
});

// ─── Date format helper ───────────────────────────────────────────────────────

describe('date format validation', () => {
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  it('fixture dates are ISO YYYY-MM-DD', () => {
    expect(fixtureWeek.week_start).toMatch(ISO_DATE);
    expect(fixtureWeek.week_end).toMatch(ISO_DATE);
    expect(fixtureWorkoutEasy.workout_date).toMatch(ISO_DATE);
    expect(fixtureWorkoutIntervals.workout_date).toMatch(ISO_DATE);
    expect(fixtureCreateWorkoutBody.workout_date).toMatch(ISO_DATE);
  });
});
