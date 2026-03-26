/**
 * Seed script — 15-week half-iron training plan for Andrew.
 * Race date: May 3, 2026 (Sunday).
 * Run with: npm run seed
 *
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY in .env.local
 * WARNING: Clears existing data before seeding.
 *
 * Plan structure:
 *   Weeks  1–3:  Base Building
 *   Weeks  4–6:  Build Phase 1
 *   Weeks  7–9:  Build Phase 2 (peak volume)
 *   Week   10:   Recovery
 *   Weeks 11–12: Race-Specific
 *   Weeks 13–14: Taper
 *   Week   15:   Race Week (May 3)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const;
function dayName(date: Date) { return DAY_NAMES[date.getDay()]; }

// ─── Workout Definitions ──────────────────────────────────────────────────────
// Each week is an array of explicit workout objects.
// offsetFromMonday: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

type Sport = 'swim' | 'bike' | 'run' | 'brick' | 'rest' | 'strength';
type Intensity = 'easy' | 'moderate' | 'hard' | 'race' | 'rest';

interface WorkoutDef {
  offsetFromMonday: number;
  sport: Sport;
  title: string;
  description: string;
  duration_min: number | null;
  distance: string | null;
  intensity: Intensity;
}

interface WeekDef {
  theme: string;
  notes: string;
  workouts: WorkoutDef[];
}

// Week 1 starts Monday Jan 19 2026
const WEEK1_MONDAY = new Date('2026-01-19');

// ─── WEEK 1 — Base Building ───────────────────────────────────────────────────
const week1: WeekDef = {
  theme: 'Base Building — Week 1',
  notes: 'First week. Establish the habit of all three sports. Nothing should feel hard. Easy is the goal.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Easy Run',
      description: 'Easy conversational pace (RPE 4/10). Focus on relaxed form, cadence ~170–175 spm. If you can\'t hold a full conversation, slow down.',
      duration_min: 40, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Technique Foundation Swim',
      description: `Warm-Up (400 yards):
  - 200 easy freestyle, focus on reaching forward on entry and long catch
  - 4×50 drill: fingertip drag (fingertips skim the water surface on recovery), 15 sec rest

Main Set (1000 yards):
  - 4×200 easy (RPE 4/10), 30 sec rest
    Focus: bilateral breathing every 3 strokes, relax your shoulders and neck
  - 4×50 easy, 20 sec rest
    Focus: let your hips rotate naturally with each stroke, don't lock your core rigid

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 very easy freestyle

Total: 1800 yards. Purpose: establish feel for the water, reinforce bilateral breathing.`,
      duration_min: 45, distance: '1800 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Easy Recovery Spin',
      description: 'Easy spin (RPE 4/10). High cadence (90–95 rpm), small gear, no strain. Goal is to get comfortable on the bike without accumulating fatigue.',
      duration_min: 60, distance: '18 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Base Endurance Ride',
      description: 'Long easy aerobic ride (RPE 4–5/10). Maintain steady cadence 85–90 rpm. Practice eating every 30 min even at easy effort — build the nutrition habit now. Flat or rolling terrain.',
      duration_min: 90, distance: '27 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Easy Run',
      description: 'Long aerobic run (RPE 4–5/10). Entirely conversational. This is time on feet, not pace — no watch staring. Run by feel and finish feeling like you could have gone 20 min more.',
      duration_min: 55, distance: '7 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 2 — Base Building ───────────────────────────────────────────────────
const week2: WeekDef = {
  theme: 'Base Building — Week 2',
  notes: 'Add a strength session. Bike volume ticks up. Keep all cardio easy.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Easy Run',
      description: 'Easy aerobic run (RPE 4/10). Focus on smooth, relaxed form. No pace pressure — just accumulate easy time on feet.',
      duration_min: 40, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Aerobic Base Swim',
      description: `Warm-Up (400 yards):
  - 200 easy freestyle, focus on relaxed hand entry and long pull-through
  - 4×50 drill: catch-up drill (one arm fully extended ahead before the other begins its pull), 15 sec rest

Main Set (1200 yards):
  - 3×300 at easy effort (RPE 5/10), 25 sec rest
    Focus: count strokes per length — aim for 18–20 strokes per 25 yards
  - 4×75 easy, 20 sec rest
    Focus: smooth hip rotation driving each stroke, not just arm pulling

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 easy freestyle

Total: 2000 yards. Purpose: aerobic base, build stroke awareness and efficiency.`,
      duration_min: 50, distance: '2000 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Easy Spin',
      description: 'Easy aerobic ride (RPE 4/10). 70 min of steady spinning. High cadence, small gear. Stay in the aerobic zone the whole time.',
      duration_min: 70, distance: '21 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 4, sport: 'strength',
      title: 'Strength & Mobility',
      description: `Hip strength circuit (3 rounds):
  - Single-leg Romanian deadlift: 10 reps each leg (light weight, focus on balance)
  - Lateral band walk: 15 steps each direction
  - Glute bridge: 15 reps, hold 2 sec at top

Core stability (3 rounds):
  - Plank: 45 sec
  - Side plank: 30 sec each side
  - Dead bug: 8 reps each side

Mobility cooldown (2 min each):
  - Hip flexor stretch (lunge position)
  - Pigeon pose
  - Thoracic rotation on foam roller

Purpose: injury prevention and power transfer. Strong hips and core = faster bike and run.`,
      duration_min: 40, distance: null, intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Base Endurance Ride',
      description: 'Longer easy aerobic ride (RPE 5/10). Tick up duration from last week. Keep cadence 85–90 rpm. Practice fueling: eat a gel or bar at 45 min. Focus on comfortable aero position when possible.',
      duration_min: 105, distance: '32 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Easy Run',
      description: 'Long aerobic run (RPE 4–5/10). First 2/3 easy, last 1/3 can drift slightly to moderate. Hydrate. This is your weekly long run — protect the easy effort.',
      duration_min: 60, distance: '8 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 3 — Base Building ───────────────────────────────────────────────────
const week3: WeekDef = {
  theme: 'Base Building — Week 3',
  notes: 'First tempo run of the plan. All other sessions stay easy. Establish the hard/easy pattern.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Intro Tempo Run',
      description: `2 mile easy warm-up (RPE 4/10).
3 miles at tempo effort (RPE 7/10 — comfortably hard, can speak in short phrases, not full sentences). Pace around 6:00–6:15/mi given your fitness.
2 mile easy cool-down.
Total: 7 miles. First quality session — gauge effort by feel, not GPS.`,
      duration_min: 55, distance: '7 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Endurance Build Swim',
      description: `Warm-Up (500 yards):
  - 300 easy freestyle, bilateral breathing every 3 strokes
  - 4×50 drill: 6-3-6 kick drill (6 kicks on side → 3 full strokes → 6 kicks on other side), 20 sec rest
    Purpose: feel proper body rotation and balance

Main Set (1400 yards):
  - 2×400 at easy effort (RPE 5/10), 30 sec rest
    Focus: maintain stroke length under mild fatigue, smooth flip turns
  - 4×100 at easy-moderate effort (RPE 5–6/10), 20 sec rest
    Focus: press chest slightly down to lift hips, reduce drag

Cool-Down (300 yards):
  - 200 easy backstroke
  - 100 easy freestyle

Total: 2200 yards. Purpose: extend aerobic swim capacity, improve body position.`,
      duration_min: 55, distance: '2200 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Easy Recovery Spin',
      description: 'Easy spin (RPE 4/10) after yesterday\'s hard run. High cadence, zero pressure. This is recovery — your legs should feel better at the end than the start.',
      duration_min: 60, distance: '18 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Base Endurance Ride',
      description: 'Longer easy aerobic ride (RPE 5/10). Focus on comfortable aero position for extended periods. Practice nutrition: aim to consume 200–250 calories per hour. Rolling terrain if available.',
      duration_min: 110, distance: '33 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Easy Run',
      description: 'Long aerobic run (RPE 4–5/10). Pure easy effort — this is recovery from a hard week. Run by feel, no watch pressure. Finish strong and relaxed.',
      duration_min: 65, distance: '8 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 4 — Build Phase 1 ───────────────────────────────────────────────────
const week4: WeekDef = {
  theme: 'Build Phase 1 — Week 4',
  notes: 'First brick of the plan. Quality sessions introduced on bike. Swim volume steps up.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Tempo Run',
      description: `2 mile easy warm-up.
4 miles at tempo effort (RPE 7–7.5/10). Aim for 6:00–6:10/mi. Sustain — no fading the last mile.
2 mile easy cool-down.
Total: 8 miles. Focus on running through fatigue in the final tempo mile.`,
      duration_min: 62, distance: '8 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Endurance Swim',
      description: `Warm-Up (500 yards):
  - 300 easy freestyle
  - 4×50 drill: fist swimming (make a fist — feel the forearm catch the water), 15 sec rest
    When you open your fist mid-rep, notice the difference in "grab"

Main Set (1600 yards):
  - 4×300 at moderate effort (RPE 6/10), 25 sec rest
    Focus: strong pull-through past your hip on every stroke — finish the pull, don't slice short
  - 4×100 at moderate effort (RPE 6/10), 20 sec rest
    Focus: maintain stroke count from the warm-up — efficiency under moderate load

Cool-Down (300 yards):
  - 200 easy backstroke
  - 100 easy freestyle

Total: 2400 yards. Purpose: build aerobic swim endurance, introduce moderate effort.`,
      duration_min: 60, distance: '2400 yards', intensity: 'moderate',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Sweet Spot Ride',
      description: `10 min easy warm-up spin.
Main set: 3×12 min at sweet spot effort (RPE 7/10 — just below threshold, sustainable but clearly working), 5 min easy between reps.
10 min easy cool-down.
Total: ~80 min. Focus: smooth, powerful pedal stroke. Don't blow up on rep 1.`,
      duration_min: 80, distance: '25 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10). Keep it short and genuinely easy after the hard bike. Legs should loosen up, not work hard.',
      duration_min: 32, distance: '4 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Brick — First Brick of the Season',
      description: `Bike (90 min, RPE 5–6/10): Easy-moderate aerobic ride. Smooth effort, nothing heroic. Practice fueling — gel at 45 min, water every 15 min.
Transition: rack bike, change shoes quickly. No sitting. Go.
Run (20 min, RPE 5–6/10): Legs will feel like cement for the first 5 min. Hold easy-moderate effort and let your running legs come back. Note what minute they feel "normal."

Purpose: your first bike-to-run transition of the season. The goal is experience, not performance.`,
      duration_min: 110, distance: 'Bike ~27 mi / Run ~2.5 mi', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Long aerobic run (RPE 5/10). Easy-to-moderate throughout. Hydrate every 30 min. Focus on time on feet, not pace. Finish relaxed.',
      duration_min: 70, distance: '9 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 5 — Build Phase 1 ───────────────────────────────────────────────────
const week5: WeekDef = {
  theme: 'Build Phase 1 — Week 5',
  notes: 'First full race-distance bike ride (56 miles). Run intervals introduced. Volume step-up week.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Run Intervals',
      description: `2 mile easy warm-up.
Main set: 6×1 mile at hard effort (RPE 8/10 — about 5K race effort, ~5:30–5:45/mi), 90 sec standing rest between reps.
2 mile easy cool-down.
Total: 10 miles. Don't start too fast — rep 1 should feel like a 7 out of 10.`,
      duration_min: 80, distance: '10 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Endurance with Race-Pace Segments',
      description: `Warm-Up (500 yards):
  - 200 easy freestyle
  - 4×50 drill: single-arm freestyle (right arm only × 25, left arm only × 25, full stroke × 25, repeat), 15 sec rest
  - 100 easy, bilateral breathing

Main Set (1700 yards):
  - 3×400 at moderate effort (RPE 6/10), 30 sec rest
    Focus: consistent stroke count per length, breathe bilateral every 3 strokes
  - 4×75 at race effort (RPE 7–8/10), 20 sec rest
    Focus: settle into race rhythm quickly after the hard opening — don't sprint and blow up

Cool-Down (300 yards):
  - 200 easy backstroke
  - 100 easy freestyle, long glide on each stroke

Total: 2500 yards. Purpose: extend aerobic endurance, introduce first race-intensity segments.`,
      duration_min: 65, distance: '2500 yards', intensity: 'moderate',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Bike Intervals',
      description: `10 min easy warm-up spin.
Main set: 5×8 min at hard effort (RPE 8/10), 4 min easy recovery between reps.
10 min easy cool-down.
Total: ~90 min. Focus: smooth power output — no surging. Hold effort steady across all 5 reps.`,
      duration_min: 90, distance: '28 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10) after a hard bike. Short and genuinely easy. Legs should feel better at the end than the start.',
      duration_min: 32, distance: '4 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'First Race-Distance Ride — 56 Miles',
      description: `Your first time riding the full race distance. Treat it as an aerobic training ride, not a race effort.
RPE 5–6/10 throughout. Aim for ~20 mph average (2hr45min target).
Nutrition plan: eat 200–250 cal/hr starting at 30 min, drink every 15 min regardless of thirst.
Focus: hold aero position for extended sections. Practice fueling while riding. Note any bike fit discomfort.`,
      duration_min: 165, distance: '56 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Long aerobic run (RPE 5/10) the day after your longest ride. Legs will be somewhat fatigued — that\'s intentional. Easy-to-moderate. Hydrate well. Focus on time on feet.',
      duration_min: 75, distance: '10 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 6 — Build Phase 1 ───────────────────────────────────────────────────
const week6: WeekDef = {
  theme: 'Build Phase 1 — Week 6',
  notes: 'Race-pace swim introduced. Long brick replaces the Saturday long ride. Final week of Build 1.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Optional: 10–15 min gentle mobility or foam rolling.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Tempo Run',
      description: `2 mile easy warm-up.
5 miles at tempo effort (RPE 7–7.5/10). Aim for 6:00/mi. This is the longest tempo segment yet — stay controlled.
1 mile easy cool-down.
Total: 8 miles.`,
      duration_min: 62, distance: '8 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Race-Pace Introduction Swim',
      description: `Warm-Up (600 yards):
  - 300 easy freestyle
  - 6×50 build: each 50 slightly faster, last 50 at race effort, 15 sec rest
    Focus: controlled acceleration — you're teaching your body to ramp up without blowing up

Main Set (1600 yards):
  - 4×200 at race effort (RPE 7–8/10), 25 sec rest
    Focus: race rhythm — this is the pace you'll need to hold for 1.2 miles on race day
  - 4×200 at easy effort (RPE 5/10), 20 sec rest
    Focus: deliberate recovery — notice the contrast between race effort and easy effort

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 easy freestyle

Total: 2600 yards. Purpose: first real race-pace swim work. Teach your body to recognize and sustain race effort.`,
      duration_min: 65, distance: '2600 yards', intensity: 'moderate',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Sweet Spot Ride',
      description: `10 min easy warm-up.
Main set: 4×12 min at sweet spot (RPE 7/10), 4 min easy recovery between reps.
10 min cool-down.
Total: 90 min. Build on week 4 — one more rep. Hold the same quality.`,
      duration_min: 90, distance: '28 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10). Short and honest — don\'t let the easy run become a tempo.',
      duration_min: 38, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Long Brick — Bike + Run',
      description: `Bike (2.5 hrs, RPE 6/10): Steady aerobic effort. Rolling terrain. Practice full race-nutrition plan. Get comfortable in the aero position for 20–30 min at a stretch.
Transition: race-speed T2. Goal under 2 min.
Run (30 min, RPE 5–6/10): Start easy, let the legs settle. By 10 min you should be feeling fluid. Finish the last 10 min at comfortable run pace (RPE 6/10).

Purpose: building the bike-run connection. The run should feel manageable, not survival.`,
      duration_min: 180, distance: 'Bike ~50 mi / Run ~4 mi', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Long run the day after a long brick (RPE 5/10). Legs will feel it — that\'s the point. Easy-to-moderate, hydrate well. Time on feet.',
      duration_min: 75, distance: '10 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 7 — Build Phase 2 ───────────────────────────────────────────────────
const week7: WeekDef = {
  theme: 'Build Phase 2 — Week 7',
  notes: 'Volume and intensity both step up. Longest bike ride yet. Protect the easy days.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Non-negotiable after last week\'s long brick. Optional: light stretching.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Run Intervals',
      description: `2 mile easy warm-up.
Main set: 10×800m at hard effort (RPE 8–8.5/10, ~2:40–2:50 per 800), 60 sec rest between reps.
2 mile easy cool-down.
Total: 10 miles. Key session: don't go out too hot. Reps 7–10 should be your fastest, not your slowest.`,
      duration_min: 80, distance: '10 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'High Volume Endurance Swim',
      description: `Warm-Up (600 yards):
  - 200 easy freestyle
  - 4×50 drill: fingertip drag, 15 sec rest
  - 200 easy moderate, bilateral breathing
  - 4×50 drill: catch-up, 15 sec rest

Main Set (1800 yards):
  - 6×200 at moderate effort (RPE 6/10), 20 sec rest
    Focus: hold stroke efficiency as fatigue builds, finish each 200 with a strong turn
  - 6×50 with descending rest (start 20 sec, end 10 sec by rep 6)
    Focus: manage pace without extra rest — simulates race conditions where you can't stop

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 easy freestyle

Total: 2800 yards. Purpose: highest swim volume so far. Aerobic ceiling development.`,
      duration_min: 70, distance: '2800 yards', intensity: 'moderate',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Threshold Bike',
      description: `10 min easy warm-up.
Main set: 2×20 min at threshold effort (RPE 8/10 — hard but controlled), 10 min easy between reps.
10 min easy cool-down.
Total: ~100 min. Threshold is the hardest sustainable effort — at the edge of your comfort zone. Hold it.`,
      duration_min: 100, distance: '32 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10). Keep this genuinely easy — you have a long bike tomorrow.',
      duration_min: 38, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Long Endurance Ride',
      description: `3-hour steady aerobic ride (RPE 5–6/10). Longest ride of the plan so far.
Nutrition: aim for 250 cal/hr starting at 30 min. Water every 15 min. Practice eating on the bike at effort.
Focus: hold aero position for extended blocks, cadence 85–90 rpm. Mental note on how legs feel at the 2-hour mark — that\'s the equivalent point in the race.`,
      duration_min: 180, distance: '60 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Long run after yesterday\'s biggest ride (RPE 5/10). Expect the first few miles to feel heavy. Easy-to-moderate throughout. Time on feet. Hydrate.',
      duration_min: 85, distance: '11 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 8 — Build Phase 2 (Peak Volume) ────────────────────────────────────
const week8: WeekDef = {
  theme: 'Build Phase 2 — Week 8',
  notes: 'Peak volume week. The long brick Saturday is the anchor session of the entire plan. Execute it well.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Mandatory after the biggest week so far. Sleep and eat well.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Race-Pace Run Intervals',
      description: `2 mile easy warm-up.
Main set: 4×2 miles at race-pace half marathon effort (RPE 7.5/10, ~5:50–6:00/mi), 2 min easy jog between reps.
2 mile easy cool-down.
Total: 12 miles. This is your race-pace work — you\'re training your legs to sustain half-iron run pace under fatigue.`,
      duration_min: 90, distance: '12 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Race-Pace Focus Swim',
      description: `Warm-Up (600 yards):
  - 300 easy freestyle
  - 6×50 build to race effort, 15 sec rest

Main Set (1800 yards):
  - 3×600 at race effort (RPE 7–8/10), 40 sec rest
    600 yards ≈ 12 min at race pace — hold steady rhythm and find your breathing pattern
    Sight every 8–10 strokes as you would in open water
    Strong finish on the last 50 of each rep
  - 4×50 at hard effort (RPE 8–9/10), 30 sec rest
    Simulate a hard race start — practice recovering quickly

Cool-Down (400 yards):
  - 400 very easy freestyle and backstroke mix

Total: 2800 yards. Purpose: race-specific pacing, open-water mindset.`,
      duration_min: 70, distance: '2800 yards', intensity: 'hard',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Long Threshold Ride',
      description: `10 min easy warm-up.
Main set: 3×15 min at threshold (RPE 8/10), 7 min easy between reps.
10 min easy cool-down.
Total: ~110 min. Building power at the edge. Third rep will be hard — hold the effort, don't back off.`,
      duration_min: 110, distance: '35 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10). Short and easy — tomorrow is the biggest session of the plan.',
      duration_min: 38, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Long Brick — Race Simulation',
      description: `The key session of the build block. Treat this like a practice race.

Bike (3 hrs, RPE 6–7/10): Execute your full race nutrition plan. Ride the same effort you plan to race. Hold aero position for 20+ min stretches. At the 90-min mark, ask yourself if you can sustain this for another 90 — that's your race-day check.
Transition: fast T2 — goal under 2 min. Run number, shoes, go.
Run (40 min, RPE 6/10): First 10 min will feel rough. By 15 min you should be into your run. Hold controlled, honest effort — not a death march, not a sprint. This is race-pace training.

Purpose: the most important training day before race week. Build your race-day confidence here.`,
      duration_min: 220, distance: 'Bike 60 mi / Run 5 mi', intensity: 'hard',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run the day after the biggest session of your plan (RPE 4/10). Keep it very easy — 45 min, conversational, no expectations. This is just moving, not training.',
      duration_min: 45, distance: '5 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 9 — Build Phase 2 (Peak Volume) ────────────────────────────────────
const week9: WeekDef = {
  theme: 'Build Phase 2 — Week 9',
  notes: 'Second peak volume week. Includes a full race-distance swim benchmark. Recovery week follows — you will earn it.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Mandatory recovery from last week\'s long brick.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Run Intervals',
      description: `2 mile easy warm-up.
Main set: 8×1 mile at hard effort (RPE 8/10, ~5:30–5:45/mi), 90 sec standing rest between reps.
2 mile easy cool-down.
Total: 12 miles. This is your highest run interval volume — execute rep 1 conservatively.`,
      duration_min: 92, distance: '12 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Race-Distance Benchmark Swim',
      description: `Warm-Up (400 yards):
  - 4×100 building effort: 100 easy → 100 moderate → 100 moderate-hard → 100 race-pace, 15 sec rest

Main Set (2000 yards — straight):
  - 1×2000 continuous at race effort (RPE 7/10)
    This is your race distance (1.2 miles ≈ 2100 yards). Find your rhythm and hold it.
    Bilateral breathing, sight every 10 strokes as in open water. No stopping.
    Note your finish time — this is your swim benchmark for race-day planning.

Cool-Down (400 yards):
  - 400 easy choice

Total: 2800 yards. Purpose: full race-distance swim under realistic conditions. Builds confidence and sets your race time expectation.`,
      duration_min: 70, distance: '2800 yards', intensity: 'hard',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Race-Pace Ride',
      description: `15 min easy warm-up.
60 min at race pace (RPE 7/10 — the effort you plan to sustain for 56 miles on May 3).
15 min easy cool-down.
Total: ~100 min. Focus: hold true race effort — not too hard, not sandbagging. Practice your race nutrition during the 60-min block.`,
      duration_min: 100, distance: '32 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy recovery run (RPE 4/10). The week is getting heavy — keep this short and honest.',
      duration_min: 38, distance: '5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Long Endurance Ride',
      description: `3-hour aerobic ride (RPE 5–6/10). Second 3-hour ride of the plan.
You know this distance now — execute it confidently. Full nutrition plan: 250 cal/hr, water every 15 min.
Spend extended time in aero position. Mental rehearsal: imagine yourself 90 min into the race bike leg.`,
      duration_min: 180, distance: '60 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run — Longest of the Plan',
      description: 'Long run — the longest of the training cycle (RPE 5–6/10). Start easy, finish moderate. Hydrate every 30 min. Run by effort, not pace. Recovery week starts tomorrow.',
      duration_min: 90, distance: '12 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 10 — Recovery ───────────────────────────────────────────────────────
const week10: WeekDef = {
  theme: 'Recovery Week — Week 10',
  notes: 'Planned recovery after the Build 2 block. Volume drops ~35%. Aerobic maintenance only — no intensity. Let the fitness absorb.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. You have just completed the hardest training block of the plan. Sleep extra if possible.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Very easy run (RPE 4/10). Short and relaxed. No pace pressure — if your GPS shows something fast, it\'s lying. Keep it easy.',
      duration_min: 30, distance: '4 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Technique Recovery Swim',
      description: `Warm-Up (400 yards):
  - 200 very easy freestyle
  - 4×50 drill: 6-3-6 kick drill, 20 sec rest

Main Set (1200 yards):
  - 4×200 easy (RPE 4/10), 30 sec rest
    Focus: pure technique — long slow strokes, count strokes, feel the water
  - 4×100 drill choice (fingertip drag, catch-up, or fist drill), 20 sec rest
    Pick whichever drill you felt weakest on during the build block

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 very easy freestyle

Total: 2000 yards. Purpose: recovery week — technique reinforcement, zero intensity.`,
      duration_min: 50, distance: '2000 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Easy Recovery Spin',
      description: 'Easy spin (RPE 4/10). 60 min, high cadence, tiny gear. If you feel restless, that\'s a good sign — it means recovery is working.',
      duration_min: 60, distance: '18 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'bike',
      title: 'Moderate Endurance Ride',
      description: 'Moderate aerobic ride (RPE 5/10). 90 min, steady. Not a hard workout — just keeping the legs ticking. Nutrition practice as always.',
      duration_min: 90, distance: '27 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Easy Run',
      description: 'Easy aerobic run (RPE 4–5/10). 45 min, conversational pace. Notice if your legs feel fresher than last week — they should. Recovery is working.',
      duration_min: 45, distance: '6 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 11 — Race-Specific ──────────────────────────────────────────────────
const week11: WeekDef = {
  theme: 'Race-Specific — Week 11',
  notes: 'Back to quality. Race-pace efforts in all three sports. The fitness from the build block starts to express itself here.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. You should be feeling fresh and a little restless after recovery week — that\'s exactly right.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Race-Pace Run Intervals',
      description: `2 mile easy warm-up.
Main set: 3×2 miles at half-iron run race pace (RPE 7.5/10, ~6:00–6:20/mi — you\'ll be starting the run after 1.2mi swim + 56mi bike, so this is conservative and smart), 2 min easy jog between reps.
2 mile easy cool-down.
Total: 10 miles. Practice holding race pace without blowing up — this is your pacing lesson.`,
      duration_min: 78, distance: '10 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Race-Pace Swim',
      description: `Warm-Up (600 yards):
  - 300 easy freestyle
  - 6×50 build to race effort, 15 sec rest

Main Set (1800 yards):
  - 3×500 at race effort (RPE 7–8/10), 40 sec rest
    Start each rep with the first 50 at hard effort (mass-start simulation), then settle to race pace
    Focus: recover your breath quickly after the hard start — this is critical on race day
  - 4×75 at race effort (RPE 7–8/10), 20 sec rest
    Simulates the final push of the swim

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 easy freestyle

Total: 2800 yards. Purpose: race-specific pacing at peak swim volume.`,
      duration_min: 70, distance: '2800 yards', intensity: 'hard',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Race-Pace Ride',
      description: `15 min easy warm-up.
60 min at race effort (RPE 6–7/10). Lock in the pace you plan to ride on May 3.
15 min easy cool-down.
Total: 90 min. Note how the race effort feels now versus week 9 — it should feel more controlled.`,
      duration_min: 90, distance: '29 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 4, sport: 'run',
      title: 'Easy Recovery Run',
      description: 'Easy run (RPE 4/10). Short and honest. Prep for tomorrow\'s long brick.',
      duration_min: 30, distance: '4 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Long Brick — Race Simulation',
      description: `Bike (2.5 hrs, RPE 6–7/10): Race-effort ride. Execute your full nutrition plan. Spend the majority of time in aero position. At the 90 min mark, check in — you should feel controlled, not struggling.
Transition: race-speed T2.
Run (30 min, RPE 6–7/10): Race effort run. By 10 min your legs should be turning over. Hold race pace — this is your dress rehearsal.

Purpose: highest-quality brick in the plan. Race-pace throughout. Execute flawlessly.`,
      duration_min: 180, distance: 'Bike 50 mi / Run 4 mi', intensity: 'hard',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Long aerobic run (RPE 5/10) after yesterday\'s race-specific brick. This will test your race-day fatigue tolerance. Easy-to-moderate throughout. Hydrate well.',
      duration_min: 80, distance: '11 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 12 — Race-Specific ──────────────────────────────────────────────────
const week12: WeekDef = {
  theme: 'Race-Specific — Week 12',
  notes: 'Last hard week. The open-water swim simulation is critical — practice race-start chaos. Taper begins next week.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Last hard block begins this week — recover well before Tuesday.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Tempo Run',
      description: `2 mile easy warm-up.
5 miles at tempo effort (RPE 7.5/10, ~5:55–6:05/mi). Strong, sustained effort — the last real tempo session before the taper.
1 mile easy cool-down.
Total: 8 miles.`,
      duration_min: 62, distance: '8 miles', intensity: 'hard',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Open Water Race Simulation Swim',
      description: `Warm-Up (600 yards):
  - 200 easy freestyle
  - 4×50 build, 15 sec rest
  - 200 easy with eyes closed every 4 strokes (trains straight-line swimming without visual cues)

Main Set (1800 yards):
  - 4×450 at race effort (RPE 7–8/10), 40 sec rest
    Each 450: start with 50 at hard effort (simulate mass start chaos), then immediately settle to race pace
    Focus: recover your breath fast after the hard start — if you blow up in the first 50, you blow the whole swim
  - 4×50 easy fist drill, 15 sec rest

Cool-Down (400 yards):
  - 200 easy backstroke
  - 200 easy freestyle

Total: 2800 yards. Purpose: last hard swim. Simulate race-start conditions — critical mental and physical prep.`,
      duration_min: 70, distance: '2800 yards', intensity: 'hard',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Race-Pace Long Ride',
      description: `2-hour ride at race pace (RPE 6–7/10). Full nutrition plan active the entire time.
Focus: settle into exactly the effort you plan to hold on May 3 — not harder. Note how you feel at 90 min. You need to run a half-marathon after this.`,
      duration_min: 120, distance: '40 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 4, sport: 'rest',
      title: 'Rest Day',
      description: 'Rest day mid-week. You have a race-simulation brick Saturday — recover.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Race-Simulation Brick',
      description: `Bike (2 hrs, RPE 6–7/10): Race-effort ride with full nutrition. The last long brick before race day.
Transition: race-speed T2.
Run (25 min, RPE 6–7/10): Race-pace run. Your legs know this now. Hold form through the first 10 min and find your stride.

Note everything: how you feel at each transition, what the effort felt like, what you\'d change on race day.`,
      duration_min: 145, distance: 'Bike 40 mi / Run 3 mi', intensity: 'hard',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Long Run',
      description: 'Last long run of the training plan (RPE 5/10). Moderate and steady. Nothing heroic — you\'ve done the work. Run by feel and finish feeling strong.',
      duration_min: 75, distance: '10 miles', intensity: 'moderate',
    },
  ],
};

// ─── WEEK 13 — Taper ─────────────────────────────────────────────────────────
const week13: WeekDef = {
  theme: 'Taper — Week 13',
  notes: 'Volume drops significantly. Short, sharp intensity bursts to stay sharp. Trust the taper — feeling sluggish is normal and temporary.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. The taper has begun. Resist the urge to do extra — the adaptation happens when you rest.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Short Tempo Run',
      description: `1.5 mile easy warm-up.
3 miles at tempo effort (RPE 7/10). Shorter than usual — the goal is sharpness, not volume.
1.5 mile easy cool-down.
Total: 6 miles. Should feel controlled and crisp.`,
      duration_min: 48, distance: '6 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Taper Swim',
      description: `Warm-Up (400 yards):
  - 200 easy freestyle
  - 4×50 drill: catch-up, 15 sec rest

Main Set (1200 yards):
  - 3×200 at moderate effort (RPE 6/10), 25 sec rest
  - 4×100 at race effort (RPE 7–8/10), 25 sec rest
    Focus: stroke efficiency — get fast by being smoother, not by pulling harder
  - 4×50 easy, 15 sec rest

Cool-Down (400 yards):
  - 400 easy choice

Total: 2000 yards. Purpose: maintain feel for the water, first week of volume reduction.`,
      duration_min: 50, distance: '2000 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Moderate Taper Ride',
      description: `15 min easy warm-up.
40 min at moderate-to-race effort (RPE 6–7/10). A few short race-pace bursts (3×3 min at race effort, 2 min easy between) in the middle to stay sharp.
15 min easy cool-down.
Total: 70 min. Keep legs feeling snappy.`,
      duration_min: 70, distance: '22 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 4, sport: 'rest',
      title: 'Rest Day',
      description: 'Rest day. You\'re in taper — this is now how you train. Embrace it.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Short Taper Brick',
      description: `Bike (60 min, RPE 6/10): Easy-moderate with a few 5-min race-pace surges to keep the legs sharp. Practice race nutrition.
Transition: smooth, practiced.
Run (20 min, RPE 6/10): Easy race-pace run. Legs should feel more responsive than in week 12.

Purpose: keep the neuromuscular connection sharp without adding fatigue.`,
      duration_min: 80, distance: 'Bike 18 mi / Run 2.5 mi', intensity: 'moderate',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Easy Long Run',
      description: 'Shorter long run (RPE 4–5/10). Easy and relaxed. 55 min max. Notice if your legs feel springier than last week — taper is working.',
      duration_min: 55, distance: '7 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 14 — Deep Taper ─────────────────────────────────────────────────────
const week14: WeekDef = {
  theme: 'Taper — Week 14',
  notes: 'Deep taper. Volume at ~40% of peak. Short and sharp. Legs should feel springy and fast by Thursday. Race week follows.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. One more week. Stay off your feet as much as possible today.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Short Run with Strides',
      description: `2 miles easy.
6×20-second strides at mile effort (fast but not all-out), full recovery walk between each.
1 mile easy cool-down.
Total: 4 miles. Purpose: keep fast-twitch fibers awake. The strides should feel effortless and quick.`,
      duration_min: 32, distance: '4 miles', intensity: 'moderate',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Sharp Taper Swim',
      description: `Warm-Up (400 yards):
  - 200 easy freestyle
  - 4×50 drill: fingertip drag, 15 sec rest

Main Set (1000 yards):
  - 2×200 at moderate effort (RPE 6/10), 30 sec rest
  - 4×100 at race effort (RPE 7–8/10), 25 sec rest
    Focus: crisp and efficient — you\'re sharpening, not building. Each rep should feel cleaner than the last.
  - 4×50 at race effort (RPE 7–8/10), 20 sec rest

Cool-Down (400 yards):
  - 400 easy choice

Total: 1800 yards. Purpose: stay sharp and confident. Don\'t add fatigue.`,
      duration_min: 45, distance: '1800 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'bike',
      title: 'Easy Taper Spin',
      description: `50 min easy spin (RPE 4–5/10). A few 2-min segments at race effort mid-ride to feel the power is still there.
No heroics. Just moving.`,
      duration_min: 50, distance: '15 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 4, sport: 'rest',
      title: 'Rest Day',
      description: 'Rest. Stay off your feet. Eat well, hydrate well, sleep well.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 5, sport: 'brick',
      title: 'Short Activation Brick',
      description: `Bike (40 min, RPE 5/10): Easy spin with 2×3 min at race effort. Legs should feel fast and light.
Transition: practice your exact race-day T2 setup.
Run (15 min, RPE 5/10): Easy, smooth running. Just reminding your legs of the movement.

Purpose: final tune-up. Should feel easy and leave you excited for race day.`,
      duration_min: 55, distance: 'Bike 12 mi / Run 2 mi', intensity: 'easy',
    },
    {
      offsetFromMonday: 6, sport: 'run',
      title: 'Easy Shakeout Run',
      description: 'Short easy run (RPE 4/10). 30 min maximum. Legs should feel bouncy and a little restless. That\'s exactly where you want to be going into race week.',
      duration_min: 30, distance: '4 miles', intensity: 'easy',
    },
  ],
};

// ─── WEEK 15 — Race Week ──────────────────────────────────────────────────────
const week15: WeekDef = {
  theme: 'Race Week — May 3',
  notes: 'Race week. Minimal training, maximum rest. Hydrate more than usual. Trust every workout you\'ve done.',
  workouts: [
    {
      offsetFromMonday: 0, sport: 'rest',
      title: 'Rest Day',
      description: 'Full rest. Race week has started. The work is done — now let it absorb.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 1, sport: 'run',
      title: 'Race-Week Shakeout Run',
      description: '20 min easy run (RPE 4/10). Include 4×15-second strides at the end to wake up fast-twitch fibers. Keep it very short. You don\'t need this — you\'re just maintaining feel.',
      duration_min: 20, distance: '2.5 miles', intensity: 'easy',
    },
    {
      offsetFromMonday: 2, sport: 'swim',
      title: 'Race-Week Activation Swim',
      description: `Warm-Up (300 yards):
  - 300 easy freestyle, very relaxed

Main Set (600 yards):
  - 4×100 at easy-moderate effort (RPE 5–6/10), 25 sec rest
    Focus: feel the water, confirm your catch is dialed, remind your body of race-pace rhythm
  - 4×50 at race effort (RPE 7/10), 20 sec rest
    Short and crisp — you\'re activating, not training

Cool-Down (300 yards):
  - 300 very easy freestyle and backstroke

Total: 1200 yards. Purpose: pre-race activation. Get comfortable, dial in your stroke. Nothing hard.`,
      duration_min: 30, distance: '1200 yards', intensity: 'easy',
    },
    {
      offsetFromMonday: 3, sport: 'brick',
      title: 'Easy Bike + Run Activation',
      description: `Bike (30 min, RPE 4/10): Easy spin. Include 3×1 min at race effort to confirm your legs are ready. Practice exactly what you\'ll wear and use on race day.
Run (10 min, RPE 4/10): Very easy jog directly off the bike.

Purpose: confirm everything works. Gear, nutrition mix, transition routine. No surprises on Sunday.`,
      duration_min: 40, distance: 'Bike 9 mi / Run 1.2 mi', intensity: 'easy',
    },
    {
      offsetFromMonday: 4, sport: 'rest',
      title: 'Rest — Travel / Packet Pickup',
      description: 'Full rest. Packet pickup day. Stay off your feet, stay hydrated, eat normal meals. Lay out your race kit tonight.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 5, sport: 'rest',
      title: 'Rest — Race Eve',
      description: 'Full rest. Do not run. Do not swim. Do not do yoga. Eat your normal pre-race dinner, hydrate well, be in bed by 9pm. Nerves are normal — they mean you care.',
      duration_min: null, distance: null, intensity: 'rest',
    },
    {
      offsetFromMonday: 6, sport: 'brick',
      title: '🏁 RACE DAY — Half-Iron May 3',
      description: `You\'re ready. 15 weeks of work comes down to this.

Swim (1.2 miles): Start easy in the first 200m — let the chaos settle. Find your rhythm, bilateral breathing, sight every 10 strokes. Trust the 2000-yard straight you swam in week 9.

Bike (56 miles): Ride your race, not someone else\'s. Hold RPE 6–7/10 for the first 30 miles. Do not chase. Execute your nutrition plan: 250 cal/hr, drink every 15 min. Check in at mile 30 — you should feel controlled.

Run (13.1 miles): The first mile off the bike will feel heavy. Don\'t panic. By mile 2 you\'ll have your legs. Run conservative miles 1–4, settle into pace miles 5–10, leave nothing on the table miles 10–13.1.

Race smart. You\'ve done the work. Enjoy it.`,
      duration_min: 300, distance: 'Swim 1.2 mi / Bike 56 mi / Run 13.1 mi', intensity: 'race',
    },
  ],
};

// ─── All weeks in order ───────────────────────────────────────────────────────

const ALL_WEEKS: WeekDef[] = [
  week1, week2, week3,
  week4, week5, week6,
  week7, week8, week9,
  week10, week11, week12,
  week13, week14, week15,
];

// Workouts before this date are marked completed (weeks 1-9 are in the past)
const COMPLETED_BEFORE = new Date('2026-03-23');

// ─── Seeding Logic ────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...\n');

  console.log('Clearing existing data...');
  await supabase.from('workouts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('training_weeks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('coach_memory').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (let i = 0; i < ALL_WEEKS.length; i++) {
    const weekDef = ALL_WEEKS[i];
    const weekNum = i + 1;
    const monday = addDays(WEEK1_MONDAY, i * 7);
    const sunday = addDays(monday, 6);

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

    const workoutRows = weekDef.workouts.map((w) => {
      const date = addDays(monday, w.offsetFromMonday);
      const isPast = date < COMPLETED_BEFORE;
      return {
        week_id: week.id,
        date: fmt(date),
        day_of_week: dayName(date),
        sport: w.sport,
        title: w.title,
        description: w.description,
        duration_min: w.duration_min,
        distance: w.distance,
        intensity: w.intensity,
        completed: isPast && w.sport !== 'rest',
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

  // Seed coach memory
  const memoryEntries = [
    {
      key: 'athlete_notes',
      value: 'Andrew: long-time competitive runner (4:21 mile, 1:15:21 HM), 3 years triathlon. Olympic tri PR 2:14:23. Very good current fitness. Goal race: half-iron May 3 2026.',
    },
    {
      key: 'swim_preference',
      value: 'Andrew requires fully scripted swim workouts — named sets, specific drills with technique cues, per-rep distances, and rest intervals. No generic interval notation (e.g., "200×8 at threshold"). See coach-profile.md for the required format.',
    },
    {
      key: 'race_targets',
      value: 'Half-iron May 3 2026. Conservative targets: Swim 38-40 min (race pace ~2:00/100yd), Bike 2:35-2:45 (56mi at ~20-21mph, RPE 6-7/10), Run 1:28-1:35 (6:45-7:15/mi — conservative given fatigue from swim+bike). Total: ~4:45-5:05.',
    },
    {
      key: 'race_info',
      value: 'Half-iron distance triathlon, May 3 2026. 15-week plan: Base (wks 1-3), Build 1 (4-6), Build 2 (7-9), Recovery (10), Race-Specific (11-12), Taper (13-14), Race Week (15). Currently in week 10 (recovery).',
    },
    {
      key: 'nutrition_plan',
      value: 'Race nutrition: 250 cal/hr on bike (gels every 30 min + water every 15 min). Salt/electrolytes every hour on bike. Run: gel at mile 4 and mile 9, water at every aid station. Practice this in every long brick.',
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
