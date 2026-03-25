/**
 * Seed script — populates the DB with 15 weeks of filler training data.
 * Race date: May 3, 2026.
 * Run with: npm run seed
 *
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY in .env.local
 * WARNING: Clears existing data before seeding.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually since this runs outside Vercel
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  } catch {
    console.warn('No .env.local found — relying on existing env vars.');
  }
}

loadEnv();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ─── Date Helpers ────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

function dayName(date: Date) {
  return DAY_NAMES[date.getDay()];
}

// ─── Workout Templates ───────────────────────────────────────────────────────

const SWIM_TEMPLATES = [
  {
    title: 'Aerobic Base Swim',
    description: `Warm-Up (400 yards):
  - 200 easy freestyle, focus on long catch and high elbow recovery
  - 4×50 drill: fingertip drag, 15 sec rest between reps

Main Set (1600 yards):
  - 4×400 at easy effort (RPE 5/10), 30 sec rest
    Focus: steady breathing pattern, relaxed turnover, feel the water

Cool-Down (200 yards):
  - 200 easy backstroke or choice`,
    duration_min: 50,
    distance: '2200 yards',
    intensity: 'easy' as const,
  },
  {
    title: 'Endurance Swim with Drill Focus',
    description: `Warm-Up (500 yards):
  - 300 easy freestyle, bilateral breathing every 3 strokes
  - 4×50 drill: catch-up drill, 15 sec rest

Main Set (1800 yards):
  - 6×200 at moderate effort (RPE 6/10), 20 sec rest
    Focus: maintain stroke length as fatigue builds, strong finish each rep
  - 4×50 kick-only on back, 15 sec rest

Cool-Down (200 yards):
  - 200 easy freestyle`,
    duration_min: 55,
    distance: '2500 yards',
    intensity: 'moderate' as const,
  },
  {
    title: 'Race-Pace Swim',
    description: `Warm-Up (400 yards):
  - 200 easy freestyle
  - 4×50 build: start easy, finish at race effort, 20 sec rest

Main Set (1500 yards):
  - 3×500 at race effort (RPE 7–8/10), 45 sec rest
    Focus: settle into race rhythm, sight every 10 strokes, strong pull-through

Cool-Down (300 yards):
  - 200 easy freestyle
  - 2×50 easy backstroke`,
    duration_min: 55,
    distance: '2200 yards',
    intensity: 'hard' as const,
  },
  {
    title: 'Technique and Speed Swim',
    description: `Warm-Up (400 yards):
  - 200 easy freestyle
  - 4×50 drill: single-arm freestyle (alternate arms each lap), 15 sec rest

Main Set (1400 yards):
  - 8×100 descending effort across the set (start RPE 5, finish RPE 8), 20 sec rest
    Focus: high elbow catch on each stroke, hip rotation driving the pull
  - 4×50 easy with fist drill, 15 sec rest
    Focus: feel the forearm engage when you open your fist

Cool-Down (200 yards):
  - 200 easy choice`,
    duration_min: 50,
    distance: '2000 yards',
    intensity: 'moderate' as const,
  },
];

const RUN_TEMPLATES = [
  {
    title: 'Easy Recovery Run',
    description: 'Easy conversational pace (RPE 4/10). Focus on relaxed form and cadence ~170–175 spm. No watch-staring — keep it genuinely easy.',
    duration_min: 40,
    distance: '5 miles',
    intensity: 'easy' as const,
  },
  {
    title: 'Long Run',
    description: 'Long aerobic run at easy-to-moderate effort (RPE 5–6/10). First 2/3 easy, last 1/3 you can drift to moderate. Hydrate every 30 min.',
    duration_min: 90,
    distance: '11 miles',
    intensity: 'moderate' as const,
  },
  {
    title: 'Tempo Run',
    description: `2 mile warm-up at easy pace.
4 miles at tempo effort (RPE 7/10, comfortably hard — can speak in short phrases).
2 mile cool-down at easy pace.
Total: 8 miles.`,
    duration_min: 65,
    distance: '8 miles',
    intensity: 'hard' as const,
  },
  {
    title: 'Run Intervals',
    description: `2 mile warm-up.
Main set: 6×1 mile at hard effort (RPE 8/10, ~5:30–5:45/mi target), 90 sec standing rest between reps.
2 mile cool-down.
Total: 10 miles.`,
    duration_min: 80,
    distance: '10 miles',
    intensity: 'hard' as const,
  },
  {
    title: 'Off-the-Bike Run',
    description: '20-min run directly off the bike. Legs will feel heavy for the first 5 min — that\'s the point. Hold easy-to-moderate effort (RPE 5–6/10) and let your running legs come back.',
    duration_min: 20,
    distance: '2.5 miles',
    intensity: 'moderate' as const,
  },
];

const BIKE_TEMPLATES = [
  {
    title: 'Endurance Ride',
    description: 'Long steady aerobic ride (RPE 5–6/10). Maintain a comfortable cadence of 85–90 rpm. Eat and drink every 30 min — practice race nutrition. No heroics.',
    duration_min: 180,
    distance: '55 miles',
    intensity: 'moderate' as const,
  },
  {
    title: 'Recovery Spin',
    description: 'Easy spin at RPE 4/10 or lower. High cadence (95–100 rpm), small gear, no strain. This is active recovery — if it feels like a workout you\'re going too hard.',
    duration_min: 60,
    distance: '18 miles',
    intensity: 'easy' as const,
  },
  {
    title: 'Bike Intervals',
    description: `10 min warm-up spin.
Main set: 5×8 min at hard effort (RPE 8/10), 4 min easy recovery between reps.
10 min cool-down spin.
Focus on smooth power output — no surging.`,
    duration_min: 90,
    distance: '28 miles',
    intensity: 'hard' as const,
  },
  {
    title: 'Race-Pace Ride',
    description: `15 min warm-up.
45 min at race pace (RPE 7/10 — steady, controlled effort you can sustain for 3 hours).
15 min easy.
Focus on aero position and fueling practice.`,
    duration_min: 75,
    distance: '25 miles',
    intensity: 'moderate' as const,
  },
];

const BRICK_TEMPLATES = [
  {
    title: 'Brick — Bike + Run',
    description: `Bike: 40 miles at moderate effort (RPE 6/10), practice race nutrition (gel every 30 min, water every 15 min).
Transition: quick change, no sitting.
Run: 4 miles easy-to-moderate (RPE 5–6/10). First mile will feel odd — that\'s normal.`,
    duration_min: 150,
    distance: 'Bike 40 mi / Run 4 mi',
    intensity: 'moderate' as const,
  },
  {
    title: 'Long Brick — Race Simulation',
    description: `Bike: 56 miles at race effort (RPE 6–7/10). Execute your full race nutrition plan.
Transition: race-speed T2.
Run: 6 miles at race effort (RPE 6–7/10). Hold form through the fatigue.`,
    duration_min: 240,
    distance: 'Bike 56 mi / Run 6 mi',
    intensity: 'hard' as const,
  },
];

const STRENGTH_TEMPLATE = {
  title: 'Strength & Mobility',
  description: `Hip hinge pattern: 3×10 Romanian deadlifts (moderate weight)
Single-leg stability: 3×12 single-leg RDL with bodyweight
Core circuit: 3 rounds — plank 60 sec, side plank 30 sec each side, dead bug 10 reps
Mobility cooldown: hip flexor stretch, pigeon pose, thoracic rotation — 2 min each`,
  duration_min: 45,
  distance: null,
  intensity: 'easy' as const,
};

const REST_TEMPLATE = {
  title: 'Rest Day',
  description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling. No structured training.',
  duration_min: null,
  distance: null,
  intensity: 'rest' as const,
};

// ─── Week Definitions ─────────────────────────────────────────────────────────
// Race: May 3, 2026 (Sunday) = end of Week 15
// Week 15 starts: Apr 27 | Week 1 starts: Jan 19

interface DayWorkout {
  offsetFromMonday: number; // 0=Mon, 1=Tue, ... 6=Sun
  sport: 'swim' | 'bike' | 'run' | 'brick' | 'rest' | 'strength';
  templateIndex: number; // index into the sport's template array, or 0 for brick/strength/rest
}

interface WeekDef {
  theme: string;
  notes: string;
  days: DayWorkout[];
}

const WEEK_DEFS: WeekDef[] = [
  // Week 1 — Base building
  {
    theme: 'Base Building — Week 1',
    notes: 'Establishing aerobic base. Keep all efforts easy. Focus on consistency.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 3, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 4, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 2 — Base building
  {
    theme: 'Base Building — Week 2',
    notes: 'Add strength session. Bike volume creeping up.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 1 },
      { offsetFromMonday: 2, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 3, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 4, sport: 'strength', templateIndex: 0 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 3 — Base building
  {
    theme: 'Base Building — Week 3',
    notes: 'First quality run session of the block. All other work easy.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 4 — Build 1
  {
    theme: 'Build 1 — Week 4',
    notes: 'First brick of the season. Short and controlled. Note how legs transition.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 2 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 1 },
      { offsetFromMonday: 5, sport: 'brick', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 5 — Build 1
  {
    theme: 'Build 1 — Week 5',
    notes: 'Volume step up. Long bike at 55 miles for first time this season.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 2, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 4, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 6 — Build 1
  {
    theme: 'Build 1 — Week 6',
    notes: 'Race-pace swim introduced. Hold threshold bike intervals.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 2 },
      { offsetFromMonday: 2, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 3, sport: 'run', templateIndex: 3 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 1 },
      { offsetFromMonday: 5, sport: 'brick', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 7 — Build 2 (peak volume)
  {
    theme: 'Build 2 — Week 7',
    notes: 'Highest volume week approaching. Stay disciplined on easy days.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 8 — Build 2 (peak volume)
  {
    theme: 'Build 2 — Week 8',
    notes: 'Peak volume week. Long brick on Saturday is the anchor session.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 2 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 4, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 5, sport: 'brick', templateIndex: 1 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 9 — Build 2 (peak volume)
  {
    theme: 'Build 2 — Week 9',
    notes: 'Another high-volume week. Race-pace bike effort on Wednesday.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 1 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 3 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 3 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 5, sport: 'bike', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 10 — Recovery week (current week)
  {
    theme: 'Recovery Week — Week 10',
    notes: 'Planned recovery week after the Build 2 block. Volume drops ~30%. Aerobic maintenance only.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 5, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'bike', templateIndex: 1 },
    ],
  },
  // Week 11 — Race-specific
  {
    theme: 'Race-Specific — Week 11',
    notes: 'Back to quality. Race-pace efforts in all three sports this week.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 2 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 3 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 3 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 1 },
      { offsetFromMonday: 5, sport: 'brick', templateIndex: 1 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 12 — Race-specific
  {
    theme: 'Race-Specific — Week 12',
    notes: 'Last high-intensity week. Execute the long brick confidently.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 2, sport: 'bike', templateIndex: 2 },
      { offsetFromMonday: 3, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 2 },
      { offsetFromMonday: 5, sport: 'brick', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'run', templateIndex: 1 },
    ],
  },
  // Week 13 — Taper begins
  {
    theme: 'Taper — Week 13',
    notes: 'Volume drops significantly. Keep the intensity in short doses. Trust the training.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 2 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 3 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 5, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'bike', templateIndex: 1 },
    ],
  },
  // Week 14 — Deep taper
  {
    theme: 'Taper — Week 14',
    notes: 'Deep taper. Short, sharp efforts to stay fresh. No heroics. Legs should feel springy by Friday.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 4, sport: 'swim', templateIndex: 3 },
      { offsetFromMonday: 5, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 6, sport: 'brick', templateIndex: 0 },
    ],
  },
  // Week 15 — Race week
  {
    theme: 'Race Week — May 3',
    notes: 'Race week. Minimal training, maximum rest. Legs should feel fresh and a little antsy.',
    days: [
      { offsetFromMonday: 0, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 1, sport: 'swim', templateIndex: 0 },
      { offsetFromMonday: 2, sport: 'run', templateIndex: 0 },
      { offsetFromMonday: 3, sport: 'bike', templateIndex: 1 },
      { offsetFromMonday: 4, sport: 'rest', templateIndex: 0 },
      { offsetFromMonday: 5, sport: 'rest', templateIndex: 0 },
      // Sunday May 3 = RACE DAY (not seeded as a training workout)
    ],
  },
];

// ─── Seeding Logic ────────────────────────────────────────────────────────────

function getTemplate(sport: string, index: number) {
  switch (sport) {
    case 'swim':   return SWIM_TEMPLATES[index % SWIM_TEMPLATES.length];
    case 'run':    return RUN_TEMPLATES[index % RUN_TEMPLATES.length];
    case 'bike':   return BIKE_TEMPLATES[index % BIKE_TEMPLATES.length];
    case 'brick':  return BRICK_TEMPLATES[index % BRICK_TEMPLATES.length];
    case 'strength': return STRENGTH_TEMPLATE;
    case 'rest':   return REST_TEMPLATE;
    default:       return REST_TEMPLATE;
  }
}

async function seed() {
  console.log('🌱 Starting seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await supabase.from('workouts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('training_weeks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('coach_memory').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Week 1 Monday = Jan 19, 2026
  const week1Monday = new Date('2026-01-19');
  // Today is ~Mar 24 = week 10, so weeks 1-9 can be marked completed
  const today = new Date('2026-03-24');

  for (let i = 0; i < WEEK_DEFS.length; i++) {
    const weekDef = WEEK_DEFS[i];
    const weekNum = i + 1;
    const monday = addDays(week1Monday, i * 7);
    const sunday = addDays(monday, 6);

    // Insert week
    const { data: week, error: weekErr } = await supabase
      .from('training_weeks')
      .insert({
        week_number: weekNum,
        start_date: fmt(monday),
        end_date: fmt(sunday),
        theme: weekDef.theme,
        notes: weekDef.notes,
      })
      .select()
      .single();

    if (weekErr || !week) {
      console.error(`Failed to insert week ${weekNum}:`, weekErr);
      process.exit(1);
    }

    // Insert workouts
    const workoutRows = weekDef.days.map(({ offsetFromMonday, sport, templateIndex }) => {
      const date = addDays(monday, offsetFromMonday);
      const tmpl = getTemplate(sport, templateIndex);
      const isPast = date < today;

      return {
        week_id: week.id,
        date: fmt(date),
        day_of_week: dayName(date),
        sport,
        title: tmpl.title,
        description: tmpl.description,
        duration_min: tmpl.duration_min,
        distance: tmpl.distance,
        intensity: tmpl.intensity,
        completed: isPast && sport !== 'rest',
        notes: null,
      };
    });

    const { error: workoutErr } = await supabase.from('workouts').insert(workoutRows);
    if (workoutErr) {
      console.error(`Failed to insert workouts for week ${weekNum}:`, workoutErr);
      process.exit(1);
    }

    console.log(`  ✓ Week ${weekNum}: ${weekDef.theme}`);
  }

  // Seed initial coach memory
  const memoryEntries = [
    {
      key: 'athlete_notes',
      value: 'Andrew has been running for a very long time and doing triathlons for 3 years. Very good current fitness. Olympic triathlon PR 2:14:23. Mile PR 4:21. Half marathon PR 1:15:21.',
    },
    {
      key: 'swim_preference',
      value: 'Andrew does not do well with traditional interval-style swim workouts. All swim workouts must be fully scripted with named sets, specific drill names, per-rep distances, and rest intervals spelled out. See coach-profile.md for full details and example format.',
    },
    {
      key: 'race_info',
      value: 'Half-iron distance triathlon, May 3 2026. Currently in week 10 (recovery week) of a 15-week plan.',
    },
  ];

  const { error: memErr } = await supabase.from('coach_memory').insert(memoryEntries);
  if (memErr) {
    console.error('Failed to insert coach memory:', memErr);
    process.exit(1);
  }

  console.log('\n✅ Seed complete. 15 weeks + coach memory inserted.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
