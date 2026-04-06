export const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Quads","Hamstrings","Glutes","Triceps","Biceps","Calves","Core","Forearms"];

export const MC = {
  Chest:"#ef4444",Back:"#3b82f6",Shoulders:"#f59e0b",Quads:"#10b981",
  Hamstrings:"#8b5cf6",Glutes:"#f472b6",Triceps:"#ec4899",Biceps:"#f97316",
  Calves:"#06b6d4",Core:"#a78bfa",Forearms:"#84cc16",
};

export const STL = {
  S:{label:"S",full:"Standard",color:"#818cf8"},
  D:{label:"D",full:"Drop Set",color:"#f59e0b"},
  M:{label:"M",full:"Myo Set",color:"#ef4444"},
};

export const PROGRAM_COLORS = {
  "Push / Pull / Legs":"#818cf8",
  "Upper / Lower":"#10b981",
  "Bro Split":"#f59e0b",
};

export const getProgColor = (name) => PROGRAM_COLORS[name] || "#818cf8";

export const CARDIO_DB = ["Running","Walking","Cycling","Swimming","Rowing","Elliptical","Stair Climber","Jump Rope","Hiking","Sprints","HIIT","Treadmill","Stationary Bike","Skiing","Boxing"];
export const CARDIO_COLOR = "#06b6d4";

export const EXERCISE_DB = {
  "Bench Press":{muscle:"Chest",rest:120},"Incline Bench Press":{muscle:"Chest",rest:120},"Dumbbell Bench Press":{muscle:"Chest",rest:90},
  "Incline Dumbbell Press":{muscle:"Chest",rest:90},"Cable Flyes":{muscle:"Chest",rest:60},"Chest Dips":{muscle:"Chest",rest:90},
  "Pec Deck":{muscle:"Chest",rest:60},"Decline Bench Press":{muscle:"Chest",rest:120},
  "Barbell Rows":{muscle:"Back",rest:90},"Pull-Ups":{muscle:"Back",rest:90},"Seated Cable Rows":{muscle:"Back",rest:90},
  "Lat Pulldowns":{muscle:"Back",rest:90},"Dumbbell Rows":{muscle:"Back",rest:90},"Deadlifts":{muscle:"Back",rest:180},
  "T-Bar Rows":{muscle:"Back",rest:90},"Chin-Ups":{muscle:"Back",rest:90},
  "Overhead Press":{muscle:"Shoulders",rest:90},"Lateral Raises":{muscle:"Shoulders",rest:60},"Face Pulls":{muscle:"Shoulders",rest:60},
  "Arnold Press":{muscle:"Shoulders",rest:90},"Rear Delt Flyes":{muscle:"Shoulders",rest:60},"Front Raises":{muscle:"Shoulders",rest:60},
  "Cable Lateral Raises":{muscle:"Shoulders",rest:60},
  "Squats":{muscle:"Quads",rest:150},"Leg Press":{muscle:"Quads",rest:120},"Leg Extensions":{muscle:"Quads",rest:60},
  "Bulgarian Split Squats":{muscle:"Quads",rest:90},"Lunges":{muscle:"Quads",rest:90},"Hack Squats":{muscle:"Quads",rest:120},
  "Romanian Deadlifts":{muscle:"Hamstrings",rest:120},"Leg Curls":{muscle:"Hamstrings",rest:60},"Stiff-Leg Deadlifts":{muscle:"Hamstrings",rest:120},
  "Hip Thrusts":{muscle:"Glutes",rest:90},"Glute Bridges":{muscle:"Glutes",rest:60},"Cable Kickbacks":{muscle:"Glutes",rest:60},
  "Tricep Pushdowns":{muscle:"Triceps",rest:60},"Overhead Tricep Extension":{muscle:"Triceps",rest:60},"Dips":{muscle:"Triceps",rest:90},
  "Skull Crushers":{muscle:"Triceps",rest:60},"Close-Grip Bench Press":{muscle:"Triceps",rest:90},
  "Barbell Curls":{muscle:"Biceps",rest:60},"Hammer Curls":{muscle:"Biceps",rest:60},"Preacher Curls":{muscle:"Biceps",rest:60},
  "Incline Dumbbell Curls":{muscle:"Biceps",rest:60},"Concentration Curls":{muscle:"Biceps",rest:60},
  "Calf Raises":{muscle:"Calves",rest:60},"Seated Calf Raises":{muscle:"Calves",rest:60},
  "Plank":{muscle:"Core",rest:60},"Cable Crunches":{muscle:"Core",rest:60},"Hanging Leg Raises":{muscle:"Core",rest:60},
  "Ab Rollouts":{muscle:"Core",rest:60},"Russian Twists":{muscle:"Core",rest:60},
  "Wrist Curls":{muscle:"Forearms",rest:60},"Reverse Wrist Curls":{muscle:"Forearms",rest:60},
};

export const DEFAULT_EXERCISE_DB = {...EXERCISE_DB};

export const THEMES = {
  dark: {
    name:"Carbon Steel",bg:"#0a0a0a",surface:"#1c1c1e",surfaceAlt:"#2c2c2e",border:"#38383a",borderLight:"#38383a80",
    text:"#f5f5f7",textDim:"#e5e5e7",textSec:"#98989d",textMuted:"#636366",textFaint:"#48484a",
    accent:"#818cf8",accentDark:"#6366f1",accentBg:"#818cf815",
    green:"#30d158",greenDark:"#28a745",greenBg:"#30d15820",
    orange:"#ff9f0a",orangeBg:"#ff9f0a15",red:"#ff453a",redBg:"#ff453a20",
    yellow:"#ffd60a",yellowBg:"#ffd60a15",inputBg:"#0a0a0a",
    headerGrad:"linear-gradient(135deg,#1c1c1e,#0a0a0a)",restGrad:"linear-gradient(135deg,#0a0a0a,#1a1a2e)",
    startGrad:"linear-gradient(135deg,#818cf8,#6366f1)",finishGrad:"linear-gradient(135deg,#30d158,#28a745)",
    overlay:"rgba(0,0,0,0.75)",
  },
  light: {
    name:"Concrete",bg:"#f2f2f7",surface:"#ffffff",surfaceAlt:"#e5e5ea",border:"#c6c6c8",borderLight:"#d1d1d680",
    text:"#1c1c1e",textDim:"#3a3a3c",textSec:"#636366",textMuted:"#8e8e93",textFaint:"#aeaeb2",
    accent:"#5856d6",accentDark:"#4a48c4",accentBg:"#5856d612",
    green:"#34c759",greenDark:"#248a3d",greenBg:"#34c75918",
    orange:"#ff9500",orangeBg:"#ff950012",red:"#ff3b30",redBg:"#ff3b3015",
    yellow:"#ffcc00",yellowBg:"#ffcc0012",inputBg:"#f2f2f7",
    headerGrad:"linear-gradient(135deg,#ffffff,#f2f2f7)",restGrad:"linear-gradient(135deg,#f2f2f7,#e8e8f0)",
    startGrad:"linear-gradient(135deg,#5856d6,#4a48c4)",finishGrad:"linear-gradient(135deg,#34c759,#248a3d)",
    overlay:"rgba(0,0,0,0.4)",
  },
};

export const DEFAULT_PROGRAMS = [
  { id:"ppl", name:"Push / Pull / Legs", splits:[
    { name:"Push", exercises:[{name:"Bench Press",muscle:"Chest"},{name:"Overhead Press",muscle:"Shoulders"},{name:"Incline Dumbbell Press",muscle:"Chest"},{name:"Lateral Raises",muscle:"Shoulders"},{name:"Tricep Pushdowns",muscle:"Triceps"},{name:"Overhead Tricep Extension",muscle:"Triceps"}]},
    { name:"Pull", exercises:[{name:"Barbell Rows",muscle:"Back"},{name:"Pull-Ups",muscle:"Back"},{name:"Seated Cable Rows",muscle:"Back"},{name:"Face Pulls",muscle:"Shoulders"},{name:"Barbell Curls",muscle:"Biceps"},{name:"Hammer Curls",muscle:"Biceps"}]},
    { name:"Legs", exercises:[{name:"Squats",muscle:"Quads"},{name:"Romanian Deadlifts",muscle:"Hamstrings"},{name:"Leg Press",muscle:"Quads"},{name:"Leg Curls",muscle:"Hamstrings"},{name:"Calf Raises",muscle:"Calves"},{name:"Bulgarian Split Squats",muscle:"Quads"}]},
  ]},
];

export const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const FRIEND_COLORS = ["#3b82f6","#f59e0b","#ef4444","#10b981","#8b5cf6","#f472b6","#06b6d4","#84cc16"];
export const SPLIT_COLORS = ["#818cf8","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f472b6","#84cc16"];
