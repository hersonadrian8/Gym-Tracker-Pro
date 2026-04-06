import React, { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "./supabaseClient";
import { syncPerformanceStats, fetchFriendStats, syncCustomExercises, syncAppData, fetchAppData } from "./utils/syncPerformance";

const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Quads","Hamstrings","Glutes","Triceps","Biceps","Calves","Core","Forearms"];
const MC = { Chest:"#ef4444",Back:"#3b82f6",Shoulders:"#f59e0b",Quads:"#10b981",Hamstrings:"#8b5cf6",Glutes:"#f472b6",Triceps:"#ec4899",Biceps:"#f97316",Calves:"#06b6d4",Core:"#a78bfa",Forearms:"#84cc16" };
const STL = { S:{label:"S",full:"Standard",color:"#818cf8"}, D:{label:"D",full:"Drop Set",color:"#f59e0b"}, M:{label:"M",full:"Myo Set",color:"#ef4444"} };
const PROGRAM_COLORS = { "Push / Pull / Legs":"#818cf8", "Upper / Lower":"#10b981", "Bro Split":"#f59e0b" };
const getProgColor = (name) => PROGRAM_COLORS[name] || "#818cf8";

const EXERCISE_DB = {
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
const DEFAULT_EXERCISE_DB = {...EXERCISE_DB};

const THEMES = {
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

const DEFAULT_PROGRAMS = [
  { id:"ppl", name:"Push / Pull / Legs", splits:[
    { name:"Push", exercises:[{name:"Bench Press",muscle:"Chest"},{name:"Overhead Press",muscle:"Shoulders"},{name:"Incline Dumbbell Press",muscle:"Chest"},{name:"Lateral Raises",muscle:"Shoulders"},{name:"Tricep Pushdowns",muscle:"Triceps"},{name:"Overhead Tricep Extension",muscle:"Triceps"}]},
    { name:"Pull", exercises:[{name:"Barbell Rows",muscle:"Back"},{name:"Pull-Ups",muscle:"Back"},{name:"Seated Cable Rows",muscle:"Back"},{name:"Face Pulls",muscle:"Shoulders"},{name:"Barbell Curls",muscle:"Biceps"},{name:"Hammer Curls",muscle:"Biceps"}]},
    { name:"Legs", exercises:[{name:"Squats",muscle:"Quads"},{name:"Romanian Deadlifts",muscle:"Hamstrings"},{name:"Leg Press",muscle:"Quads"},{name:"Leg Curls",muscle:"Hamstrings"},{name:"Calf Raises",muscle:"Calves"},{name:"Bulgarian Split Squats",muscle:"Quads"}]},
  ]},
];


const toLocalISO=(d)=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;};
const fc=(s)=>{const a=Math.abs(s);return `${Math.floor(a/60)}:${(a%60).toString().padStart(2,"0")}`;};
const fcSigned=(s)=>s>=0?fc(s):`+${fc(s)}`;
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const getSunday=(d)=>{const dt=new Date(d);dt.setDate(dt.getDate()-dt.getDay());dt.setHours(0,0,0,0);return dt;};

const FRIEND_COLORS=["#3b82f6","#f59e0b","#ef4444","#10b981","#8b5cf6","#f472b6","#06b6d4","#84cc16"];

export default function GymTracker({ user, signOut }){
  const [tab,setTab]=useState("log");
  const [programs,setPrograms]=useState(()=>{try{const s=localStorage.getItem("gt_programs");return s?JSON.parse(s):[...DEFAULT_PROGRAMS];}catch{return [...DEFAULT_PROGRAMS];}});
  const [history,setHistory]=useState(()=>{try{const s=localStorage.getItem("gt_history");return s?JSON.parse(s):[];}catch{return [];}});
  const [friends,setFriends]=useState([]);
  const [selFriend,setSelFriend]=useState(0);
  const [logPhase,setLogPhase]=useState("home");
  const [selProgIdx,setSelProgIdx]=useState(0);
  const [selSplitIdx,setSelSplitIdx]=useState(null);
  const [workoutLog,setWorkoutLog]=useState({});
  const [setCounts,setSetCounts]=useState({});
  const [manuallyEdited,setManuallyEdited]=useState({});
  const [rSecs,setRSecs]=useState(0);const [rTotal,setRTotal]=useState(0);const [rActive,setRActive]=useState(false);const [rAfterEx,setRAfterEx]=useState(null);const [rAfterSet,setRAfterSet]=useState(null);const rRef=useRef(null);
  const [editing,setEditing]=useState(false);const [showAddProg,setShowAddProg]=useState(false);const [newProgName,setNewProgName]=useState("");const [showAddSplit,setShowAddSplit]=useState(false);const [newSplitName,setNewSplitName]=useState("");const [showAddEx,setShowAddEx]=useState(false);const [newExName,setNewExName]=useState("");const [newExMuscle,setNewExMuscle]=useState("Chest");
  const [exSearch,setExSearch]=useState("");
  const [chartEx,setChartEx]=useState("Bench Press");
  const [primaryProgIdx,setPrimaryProgIdx]=useState(()=>{try{return parseInt(localStorage.getItem("gt_primary_prog"))||0;}catch{return 0;}});
  const [calMonth,setCalMonth]=useState(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1);});
  const [calSelDay,setCalSelDay]=useState(null);
  const [weekSelDay,setWeekSelDay]=useState(null);
  const [showFinishConfirm,setShowFinishConfirm]=useState(false);
  const [editingHistory,setEditingHistory]=useState(null);
  const [workoutSummary,setWorkoutSummary]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [settingsTab,setSettingsTab]=useState("profile");
  const [profileName,setProfileName]=useState("");
  const [profileDraft,setProfileDraft]=useState("");
  const [friendCode,setFriendCode]=useState("");
  const [appearance,setAppearance]=useState(()=>localStorage.getItem("gt_appearance")||"auto");
  const [codeCopied,setCodeCopied]=useState(false);
  const [nameConfirmed,setNameConfirmed]=useState(false);
  const [confirmedSets,setConfirmedSets]=useState({});
  const [dbMuscleFilter,setDbMuscleFilter]=useState("All");
  const [customRestTimes,setCustomRestTimes]=useState(()=>{try{return JSON.parse(localStorage.getItem("gt_custom_rest"))||{};}catch{return {};}});
  const [customExercises,setCustomExercises]=useState(()=>{try{return JSON.parse(localStorage.getItem("gt_custom_exercises"))||{};}catch{return {};}});
  const [editingRestEx,setEditingRestEx]=useState(null);
  const [editingRestVal,setEditingRestVal]=useState("");
  const [editingMuscleEx,setEditingMuscleEx]=useState(null);
  const [editingDb,setEditingDb]=useState(false);
  const [hiddenExercises,setHiddenExercises]=useState(()=>{try{const s=localStorage.getItem("gt_hidden_exercises");return s?new Set(JSON.parse(s)):new Set();}catch{return new Set();}});
  const [progressMuscleFilter,setProgressMuscleFilter]=useState("All");
  const [favoriteExercises,setFavoriteExercises]=useState(()=>{try{const s=localStorage.getItem("gt_favorites");return s?new Set(JSON.parse(s)):new Set(["Bench Press","Squats","Deadlifts","Overhead Press","Barbell Rows","Romanian Deadlifts","Pull-Ups","Leg Press"]);}catch{return new Set(["Bench Press","Squats","Deadlifts","Overhead Press","Barbell Rows","Romanian Deadlifts","Pull-Ups","Leg Press"]);}});
  const [progressView,setProgressView]=useState("favorites");
  const [swappingExIdx,setSwappingExIdx]=useState(null);
  const [swapSearch,setSwapSearch]=useState("");
  const [editSwapIdx,setEditSwapIdx]=useState(null);
  const [editSwapSplit,setEditSwapSplit]=useState(null);
  const [editSwapSearch,setEditSwapSearch]=useState("");
  const [friendsCompareView,setFriendsCompareView]=useState("favorites");
  const [friendsMuscleFilter,setFriendsMuscleFilter]=useState("Chest");
  const [showAddFriend,setShowAddFriend]=useState(false);
  const [addFriendCode,setAddFriendCode]=useState("");
  const [friendInfoDismissed,setFriendInfoDismissed]=useState(()=>localStorage.getItem("gt_friend_info_dismissed")==="true");
  const [workoutStart,setWorkoutStart]=useState(null);
  const [sessionElapsed,setSessionElapsed]=useState(0);
  const [systemDark,setSystemDark]=useState(()=>window.matchMedia?.("(prefers-color-scheme: dark)").matches??true);
  const [addFriendError,setAddFriendError]=useState("");
  const [addFriendSuccess,setAddFriendSuccess]=useState(false);
  const [friendsLoading,setFriendsLoading]=useState(false);
  const [importPreview,setImportPreview]=useState(null);
  const [importSelected,setImportSelected]=useState(new Set());
  const [importError,setImportError]=useState("");
  const importRef=useRef(null);

  // Theme
  useEffect(()=>{const mq=window.matchMedia("(prefers-color-scheme: dark)");const h=(e)=>setSystemDark(e.matches);mq.addEventListener("change",h);return()=>mq.removeEventListener("change",h);},[]);
  const t=THEMES[appearance==="auto"?(systemDark?"dark":"light"):appearance]||THEMES.dark;

  // Load profile + app data from Supabase on login
  const [cloudLoaded,setCloudLoaded]=useState(false);
  useEffect(()=>{if(!user)return;(async()=>{try{
    const {data,error}=await supabase.from("profiles").select("username,friend_code,custom_exercises").eq("id",user.id).single();
    if(!error&&data){setFriendCode(data.friend_code||"");if(data.username){setProfileName(data.username);setProfileDraft(data.username);}if(data.custom_exercises&&typeof data.custom_exercises==="object"){setCustomExercises(prev=>({...data.custom_exercises,...prev}));}}
    // Load full app data from cloud
    const cloud=await fetchAppData(user.id);
    if(cloud){
      if(cloud.programs&&cloud.programs.length)setPrograms(prev=>{const local=prev;const remote=cloud.programs;return remote.length>=local.length||(JSON.stringify(local)===JSON.stringify([...DEFAULT_PROGRAMS]))?remote:local;});
      if(cloud.history&&cloud.history.length)setHistory(prev=>{const merged=[...prev];cloud.history.forEach(ch=>{if(!merged.find(h=>h.exercise===ch.exercise&&h.isoDate===ch.isoDate&&h.split===ch.split))merged.push(ch);});return merged;});
      if(cloud.primaryProgIdx!=null)setPrimaryProgIdx(prev=>prev===0?cloud.primaryProgIdx:prev);
      if(cloud.appearance)setAppearance(prev=>prev==="auto"?cloud.appearance:prev);
      if(cloud.customRestTimes)setCustomRestTimes(prev=>({...cloud.customRestTimes,...prev}));
      if(cloud.favoriteExercises&&cloud.favoriteExercises.length)setFavoriteExercises(prev=>{const merged=new Set([...prev,...cloud.favoriteExercises]);return merged;});
      if(cloud.hiddenExercises&&cloud.hiddenExercises.length)setHiddenExercises(prev=>{const merged=new Set([...prev,...cloud.hiddenExercises]);return merged;});
      console.log("[AppSync] Loaded from cloud");
    }
    setCloudLoaded(true);
  }catch(e){console.warn("[AppSync] Load failed:",e.message);setCloudLoaded(true);}})();},[user]);

  // Load friends from Supabase
  const loadFriends=useCallback(async()=>{if(!user)return;setFriendsLoading(true);try{
    const {data:ships,error:sErr}=await supabase.from("friendships").select("friend_id").eq("user_id",user.id);
    if(sErr||!ships||!ships.length){setFriends([]);setFriendsLoading(false);return;}
    const friendIds=ships.map(s=>s.friend_id);
    const {data:profiles,error:pErr}=await supabase.from("profiles").select("id,username,custom_exercises").in("id",friendIds);
    if(pErr){setFriendsLoading(false);return;}
    const friendsList=await Promise.all((profiles||[]).map(async(p,i)=>{
      const hist=await fetchFriendStats(p.id);
      const friendCustomEx=p.custom_exercises&&typeof p.custom_exercises==="object"?p.custom_exercises:{};
      return{id:p.id,name:p.username||"Friend",history:hist,customExercises:friendCustomEx,color:FRIEND_COLORS[i%FRIEND_COLORS.length]};
    }));
    setFriends(friendsList);
  }catch(e){/* offline */}setFriendsLoading(false);},[user]);
  useEffect(()=>{loadFriends();},[loadFriends]);

  // Sync performance stats on mount
  useEffect(()=>{console.log("[Sync trigger] user:",!!user,"history:",history.length);if(user&&history.length)syncPerformanceStats(user.id,history,{...EXERCISE_DB,...customExercises}).then(()=>console.log("[Sync] done")).catch(e=>console.error("[Sync] error:",e));},[user,history.length]);
  // Sync custom exercises to Supabase
  useEffect(()=>{if(user&&Object.keys(customExercises).length>0)syncCustomExercises(user.id,customExercises);},[user,customExercises]);

  // Sync all app data to Supabase (debounced)
  const syncTimerRef=useRef(null);
  useEffect(()=>{
    if(!user||!cloudLoaded)return;
    if(syncTimerRef.current)clearTimeout(syncTimerRef.current);
    syncTimerRef.current=setTimeout(()=>{
      const appData={
        programs,
        history,
        primaryProgIdx,
        appearance,
        customRestTimes,
        favoriteExercises:[...favoriteExercises],
        hiddenExercises:[...hiddenExercises],
      };
      syncAppData(user.id,appData);
    },2000);
    return()=>{if(syncTimerRef.current)clearTimeout(syncTimerRef.current);};
  },[user,cloudLoaded,programs,history,primaryProgIdx,appearance,customRestTimes,favoriteExercises,hiddenExercises]);

  // Persist state to localStorage
  useEffect(()=>{localStorage.setItem("gt_programs",JSON.stringify(programs));},[programs]);
  useEffect(()=>{localStorage.setItem("gt_history",JSON.stringify(history));},[history]);
  useEffect(()=>{localStorage.setItem("gt_primary_prog",String(primaryProgIdx));},[primaryProgIdx]);
  useEffect(()=>{localStorage.setItem("gt_appearance",appearance);},[appearance]);
  useEffect(()=>{localStorage.setItem("gt_custom_rest",JSON.stringify(customRestTimes));},[customRestTimes]);
  useEffect(()=>{localStorage.setItem("gt_custom_exercises",JSON.stringify(customExercises));},[customExercises]);
  useEffect(()=>{localStorage.setItem("gt_favorites",JSON.stringify([...favoriteExercises]));},[favoriteExercises]);
  useEffect(()=>{localStorage.setItem("gt_friend_info_dismissed",String(friendInfoDismissed));},[friendInfoDismissed]);
  useEffect(()=>{localStorage.setItem("gt_hidden_exercises",JSON.stringify([...hiddenExercises]));},[hiddenExercises]);
  const fullExDB={...EXERCISE_DB,...customExercises};
  const getExRest=(name)=>customRestTimes[name]??(isUnplanned?unplannedExercises:exercises).find(e=>e.name===name)?.rest??fullExDB[name]?.rest??90;
  const EXERCISE_LIST=Object.entries(fullExDB).filter(([name])=>!hiddenExercises.has(name)).map(([name,v])=>({name,muscle:v.muscle,rest:customRestTimes[name]??v.rest})).sort((a,b)=>{const mi=MUSCLE_GROUPS.indexOf(a.muscle),mj=MUSCLE_GROUPS.indexOf(b.muscle);if(mi!==mj)return(mi===-1?99:mi)-(mj===-1?99:mj);return a.name.localeCompare(b.name);});

  const prog=programs[selProgIdx];const split=selSplitIdx!==null?prog?.splits[selSplitIdx]:null;const exercises=split?.exercises||[];const allLoggedEx=[...new Set(history.map(h=>h.exercise))].sort();
  const allDbExNames=Object.keys(fullExDB);
  const allProgressEx=[...new Set([...allLoggedEx,...allDbExNames])].sort();

  const addProg=()=>{if(!newProgName.trim())return;setPrograms(p=>[...p,{id:`p${Date.now()}`,name:newProgName.trim(),splits:[]}]);setNewProgName("");setShowAddProg(false);};
  const delProg=(i)=>{if(programs.length<=1)return;setPrograms(p=>p.filter((_,j)=>j!==i));if(selProgIdx>=i&&selProgIdx>0)setSelProgIdx(selProgIdx-1);if(primaryProgIdx>=i&&primaryProgIdx>0)setPrimaryProgIdx(primaryProgIdx-1);};
  const addSplit=()=>{if(!newSplitName.trim()||!prog)return;const u=[...programs];u[selProgIdx]={...prog,splits:[...prog.splits,{name:newSplitName.trim(),exercises:[]}]};setPrograms(u);setNewSplitName("");setShowAddSplit(false);};
  const delSplit=(i)=>{const u=[...programs];u[selProgIdx]={...prog,splits:prog.splits.filter((_,j)=>j!==i)};setPrograms(u);};
  const addExercise=()=>{if(!newExName.trim()||!split)return;const u=[...programs];const ns=[...prog.splits];const exName=newExName.trim();const rest=fullExDB[exName]?.rest||90;ns[selSplitIdx]={...split,exercises:[...split.exercises,{name:exName,muscle:newExMuscle,sets:3,rest}]};u[selProgIdx]={...prog,splits:ns};setPrograms(u);if(!EXERCISE_DB[exName])setCustomExercises(prev=>({...prev,[exName]:{muscle:newExMuscle,rest}}));setNewExName("");setExSearch("");setShowAddEx(false);};
  const updateExField=(splitIdx,exIdx,field,value)=>{const u=[...programs];const ns=[...prog.splits];const ne=[...ns[splitIdx].exercises];ne[exIdx]={...ne[exIdx],[field]:value};ns[splitIdx]={...ns[splitIdx],exercises:ne};u[selProgIdx]={...prog,splits:ns};setPrograms(u);};
  const editSwapExercise=(splitIdx,exIdx,newEx)=>{const u=[...programs];const ns=[...prog.splits];const ne=[...ns[splitIdx].exercises];const old=ne[exIdx];ne[exIdx]={name:newEx.name,muscle:newEx.muscle,sets:old.sets||3,rest:newEx.rest||old.rest||90};ns[splitIdx]={...ns[splitIdx],exercises:ne};u[selProgIdx]={...prog,splits:ns};setPrograms(u);setEditSwapIdx(null);setEditSwapSplit(null);setEditSwapSearch("");};
  const pickExFromDB=(ex)=>{setNewExName(ex.name);setNewExMuscle(ex.muscle);};
  const delExercise=(i)=>{const u=[...programs];const ns=[...prog.splits];ns[selSplitIdx]={...split,exercises:split.exercises.filter((_,j)=>j!==i)};u[selProgIdx]={...prog,splits:ns};setPrograms(u);};
  const moveEx=(i,d)=>{const ni=i+d;if(ni<0||ni>=exercises.length)return;const u=[...programs];const ns=[...prog.splits];const ne=[...split.exercises];[ne[i],ne[ni]]=[ne[ni],ne[i]];ns[selSplitIdx]={...split,exercises:ne};u[selProgIdx]={...prog,splits:ns};setPrograms(u);};

  // Set logging with weight cascade
  const gk=(ex,si,sub)=>`${ex}__${si}${sub!==undefined?`__${sub}`:""}`;
  const getS=(ex,si,sub)=>workoutLog[gk(ex,si,sub)]||{weight:"",reps:""};
  const getType=(ex,si)=>workoutLog[`${ex}__${si}__type`]||"S";
  const setTypeVal=(ex,si,t)=>setWorkoutLog(l=>({...l,[`${ex}__${si}__type`]:t}));
  const getEffectiveWeight=(ex,si)=>{const direct=getS(ex,si).weight;if(direct!==""&&direct!==undefined)return direct;if(si>0&&!manuallyEdited[`${ex}__${si}`]){const s0=getS(ex,0).weight;if(s0!==""&&s0!==undefined)return s0;}return "";};
  const upS=(ex,si,f,v,sub)=>{
    if(f==="weight"&&si===0&&sub===undefined){const count=getSC(ex);setWorkoutLog(l=>{const u={...l,[gk(ex,0)]:{...(l[gk(ex,0)]||{weight:"",reps:""}),weight:v}};for(let s=1;s<count;s++){if(!manuallyEdited[`${ex}__${s}`])u[gk(ex,s)]={...(l[gk(ex,s)]||{weight:"",reps:""}),weight:v};}return u;});return;}
    if(f==="weight"&&si>0&&sub===undefined)setManuallyEdited(t=>({...t,[`${ex}__${si}`]:true}));
    setWorkoutLog(l=>({...l,[gk(ex,si,sub)]:{...(l[gk(ex,si,sub)]||{weight:"",reps:""}),[f]:v}}));
  };
  const getSC=(ex)=>setCounts[ex]||(isUnplanned?unplannedExercises:exercises).find(e=>e.name===ex)?.sets||3;const addSC=(ex)=>setSetCounts(s=>({...s,[ex]:(s[ex]||3)+1}));const remSC=(ex)=>{const c=getSC(ex);if(c<=1)return;setSetCounts(s=>({...s,[ex]:c-1}));};
  const getLastSession=(exName)=>{const e=history.filter(h=>h.exercise===exName);if(!e.length)return null;return[...e].sort((a,b)=>(b.isoDate||"0").localeCompare(a.isoDate||"0"))[0];};

  // Rest timer (counts past 0 into overtime)
  const startR=(s,exIdx,setIdx)=>{if(rRef.current)clearInterval(rRef.current);setRSecs(s);setRTotal(s);setRActive(true);setRAfterEx(exIdx);setRAfterSet(setIdx);};
  const stopR=useCallback(()=>{if(rRef.current)clearInterval(rRef.current);setRActive(false);setRSecs(0);setRAfterEx(null);setRAfterSet(null);},[]);
  useEffect(()=>{if(rActive){rRef.current=setInterval(()=>{setRSecs(p=>p-1);},1000);return()=>clearInterval(rRef.current);}},[rActive]);

  // Session timer
  useEffect(()=>{if(logPhase==="active"&&workoutStart){const id=setInterval(()=>{setSessionElapsed(Math.floor((Date.now()-workoutStart)/1000));},1000);return()=>clearInterval(id);}else{setSessionElapsed(0);}},[logPhase,workoutStart]);

  const [unplannedExercises,setUnplannedExercises]=useState([]);
  const [showAddWorkoutEx,setShowAddWorkoutEx]=useState(false);
  const [workoutExSearch,setWorkoutExSearch]=useState("");
  const isUnplanned=logPhase==="active"&&selSplitIdx===null;
  const activeExercises=isUnplanned?unplannedExercises:exercises;
  const startWorkout=(pIdx,sIdx)=>{const pi=pIdx!==undefined?pIdx:selProgIdx;const si=sIdx!==undefined?sIdx:selSplitIdx;if(si===null)return;setSelProgIdx(pi);setSelSplitIdx(si);setLogPhase("active");setWorkoutLog({});setSetCounts({});setManuallyEdited({});setConfirmedSets({});setWorkoutStart(Date.now());setUnplannedExercises([]);};
  const startUnplanned=()=>{setLogPhase("active");setWorkoutLog({});setSetCounts({});setManuallyEdited({});setConfirmedSets({});setWorkoutStart(Date.now());setSelSplitIdx(null);setUnplannedExercises([]);};
  const addWorkoutExercise=(ex)=>{setUnplannedExercises(prev=>[...prev,{name:ex.name,muscle:ex.muscle,sets:3,rest:ex.rest||90}]);setShowAddWorkoutEx(false);setWorkoutExSearch("");};
  const removeWorkoutExercise=(idx)=>{setUnplannedExercises(prev=>prev.filter((_,i)=>i!==idx));};
  const cancelWorkout=()=>{setLogPhase("home");setWorkoutLog({});setSetCounts({});setManuallyEdited({});setConfirmedSets({});setSelSplitIdx(null);setWorkoutStart(null);setUnplannedExercises([]);stopR();};
  const finishWorkout=()=>{const now=new Date();const d=now.toLocaleDateString("en-US",{month:"short",day:"numeric"});const iso=toLocalISO(now);const entries=[];
    const exList=isUnplanned?unplannedExercises:exercises;const pName=isUnplanned?"Freestyle":prog.name;const sName=isUnplanned?"Unplanned":split.name;
    exList.forEach(ex=>{const c=getSC(ex.name);let maxW=0,tR=0,valid=0;const setDetails=[];
      for(let i=0;i<c;i++){const tp=getType(ex.name,i);if(tp==="D"){const drops=[];for(let dd=0;dd<3;dd++){const s=getS(ex.name,i,dd);const w=parseFloat(s.weight),r=parseInt(s.reps);if(w>0){drops.push({weight:w,reps:r||0});if(w>maxW)maxW=w;if(r>0){tR+=r;valid++;}}}if(drops.length>0)setDetails.push({type:"D",drops});}else{const wVal=getEffectiveWeight(ex.name,i);const s=getS(ex.name,i);const w=parseFloat(wVal),r=parseInt(s.reps);if(w>0&&r>0){if(w>maxW)maxW=w;tR+=r;valid++;setDetails.push({type:tp,weight:w,reps:r});}}}
      if(valid>0)entries.push({exercise:ex.name,date:d,isoDate:iso,weight:maxW,reps:Math.round(tR/valid),sets:valid,program:pName,split:sName,setDetails});});
    if(entries.length>0){const topLift=[...entries].sort((a,b)=>b.weight-a.weight)[0];const elapsed=workoutStart?Math.floor((Date.now()-workoutStart)/1000):0;setWorkoutSummary({split:sName,program:pName,entries,topLift,date:d,duration:elapsed});setHistory(h=>{const next=[...h,...entries];if(user)syncPerformanceStats(user.id,next,fullExDB);return next;});setWorkoutLog({});setSetCounts({});setManuallyEdited({});setLogPhase("home");setSelSplitIdx(null);setWorkoutStart(null);setUnplannedExercises([]);stopR();}};

  const confirmSet=(exName,exIdx,setIdx)=>{const key=`${exName}__${setIdx}`;setConfirmedSets(p=>({...p,[key]:true}));startR(getExRest(exName),exIdx,setIdx);};
  const isSetConfirmed=(exName,setIdx)=>!!confirmedSets[`${exName}__${setIdx}`];
  const hasLog=Object.values(workoutLog).some(s=>s.weight||s.reps);

  // Swap exercise in active workout
  const swapExercise=(exIdx,newEx)=>{if(selSplitIdx===null)return;const u=[...programs];const ns=[...prog.splits];const ne=[...ns[selSplitIdx].exercises];const old=ne[exIdx];ne[exIdx]={name:newEx.name,muscle:newEx.muscle,sets:old.sets||3,rest:newEx.rest||old.rest||90};ns[selSplitIdx]={...ns[selSplitIdx],exercises:ne};u[selProgIdx]={...prog,splits:ns};setPrograms(u);setSwappingExIdx(null);setSwapSearch("");};
  const saveRestTime=(exName,secs)=>{if(secs>0)setCustomRestTimes(p=>({...p,[exName]:secs}));setEditingRestEx(null);setEditingRestVal("");};
  const changeExMuscle=(exName,newMuscle)=>{setCustomExercises(prev=>({...prev,[exName]:{...(prev[exName]||fullExDB[exName]||{rest:90}),muscle:newMuscle}}));setEditingMuscleEx(null);};
  const deleteExercise=(exName)=>{if(customExercises[exName]){setCustomExercises(prev=>{const next={...prev};delete next[exName];return next;});}else{setHiddenExercises(prev=>{const next=new Set(prev);next.add(exName);return next;});}setFavoriteExercises(prev=>{const next=new Set(prev);next.delete(exName);return next;});};
  const restoreExercise=(exName)=>{setHiddenExercises(prev=>{const next=new Set(prev);next.delete(exName);return next;});};
  const toggleFavorite=(exName)=>{setFavoriteExercises(prev=>{const next=new Set(prev);if(next.has(exName))next.delete(exName);else next.add(exName);return next;});};

  const startEditHistory=(entries)=>{setEditingHistory(entries.map(h=>({...h})));};
  const updateEditEntry=(idx,field,val)=>{setEditingHistory(prev=>prev.map((h,i)=>i===idx?{...h,[field]:field==="weight"?parseFloat(val)||0:field==="reps"||field==="sets"?parseInt(val)||0:val}:h));};
  const saveEditHistory=()=>{if(!editingHistory)return;setHistory(prev=>{const updated=[...prev];editingHistory.forEach(edited=>{const idx=updated.findIndex(h=>h.exercise===edited._origExercise&&h.isoDate===edited.isoDate&&h.split===edited.split);if(idx!==-1)updated[idx]={...updated[idx],weight:edited.weight,reps:edited.reps,sets:edited.sets};});return updated;});setEditingHistory(null);};
  const deleteHistoryEntry=(idx)=>{if(!editingHistory)return;const entry=editingHistory[idx];setHistory(prev=>prev.filter(h=>!(h.exercise===entry._origExercise&&h.isoDate===entry.isoDate&&h.split===entry.split)));setEditingHistory(prev=>{const next=prev.filter((_,i)=>i!==idx);if(next.length===0){setEditingHistory(null);setCalSelDay(null);}return next.length?next:prev;});if(editingHistory.length<=1){setEditingHistory(null);setCalSelDay(null);}};
  const getPR=(hist,ex)=>{const e=hist.filter(h=>h.exercise===ex);return e.length?Math.max(...e.map(x=>x.weight)):0;};
  const getCD=(hist,ex)=>hist.filter(h=>h.exercise===ex).map(h=>({date:h.date,weight:h.weight}));

  // Import/Export
  const exportPrograms=()=>{const data=JSON.stringify(programs,null,2);const blob=new Blob([data],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="gym-tracker-programs.json";a.click();URL.revokeObjectURL(url);};
  const handleImportFile=(e)=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>{try{const imp=JSON.parse(ev.target.result);if(Array.isArray(imp)&&imp.length>0){setImportPreview(imp);setImportSelected(new Set(imp.map((_,i)=>i)));setImportError("");}else{setImportError("No valid programs found in file.");}}catch(err){setImportError("Invalid file format.");}};reader.readAsText(file);e.target.value="";};
  const confirmImport=()=>{if(!importPreview)return;const selected=importPreview.filter((_,i)=>importSelected.has(i));if(!selected.length)return;setPrograms(prev=>[...prev,...selected.map(p=>({...p,id:`p${Date.now()}_${Math.random().toString(36).slice(2,6)}`}))]);setImportPreview(null);setImportSelected(new Set());};
  const toggleImportItem=(idx)=>{setImportSelected(prev=>{const next=new Set(prev);if(next.has(idx))next.delete(idx);else next.add(idx);return next;});};

  const primaryProg=programs[primaryProgIdx];
  const getNextSplit=()=>{if(!primaryProg||!primaryProg.splits.length)return null;const ph=history.filter(h=>h.program===primaryProg.name);if(!ph.length)return{splitIdx:0,splitName:primaryProg.splits[0].name};const maxDate=ph.reduce((m,h)=>(h.isoDate||"0")>m?(h.isoDate||"0"):m,"0");const lastDayEntries=ph.filter(h=>h.isoDate===maxDate);const lastSplit=lastDayEntries[lastDayEntries.length-1].split;const li=primaryProg.splits.findIndex(s=>s.name===lastSplit);return{splitIdx:(li+1)%primaryProg.splits.length,splitName:primaryProg.splits[(li+1)%primaryProg.splits.length].name};};
  const nextSplit=getNextSplit();
  const getWeekDots=()=>{const sun=getSunday(new Date());const todayIso=toLocalISO(new Date());const dots=[];for(let i=0;i<7;i++){const dt=new Date(sun);dt.setDate(sun.getDate()+i);const iso=toLocalISO(dt);const de=history.filter(h=>h.isoDate===iso);dots.push({day:DOW[i],iso,worked:de.length>0,program:de.length>0?de[0].program:null,isToday:iso===todayIso,entries:de});}return dots;};
  const weekDots=getWeekDots();
  const getRecentPRs=()=>{const tw=new Date();tw.setDate(tw.getDate()-14);const twi=toLocalISO(tw);const prs=[];[...new Set(history.map(h=>h.exercise))].forEach(ex=>{const all=history.filter(h=>h.exercise===ex);const recent=all.filter(h=>(h.isoDate||"9")>=twi);const older=all.filter(h=>(h.isoDate||"0")<twi);if(!recent.length)return;const rm=Math.max(...recent.map(h=>h.weight));const om=older.length?Math.max(...older.map(h=>h.weight)):0;if(rm>om&&om>0)prs.push({exercise:ex,weight:rm,prev:om,gain:rm-om,date:recent.find(h=>h.weight===rm)?.date});});return prs;};
  const recentPRs=getRecentPRs();
  const getLastWorkout=()=>{if(!history.length)return null;const sorted=[...history].sort((a,b)=>(b.isoDate||"0").localeCompare(a.isoDate||"0"));const ld=sorted[0].isoDate;const lday=sorted.filter(h=>h.isoDate===ld);return{date:lday[0].date,split:lday[0].split,program:lday[0].program,exercises:lday,topLift:[...lday].sort((a,b)=>b.weight-a.weight)[0]};};
  const lastWorkout=getLastWorkout();
  const getCalDays=()=>{const y=calMonth.getFullYear(),m=calMonth.getMonth();const ld=new Date(y,m+1,0);const sd=new Date(y,m,1).getDay();const days=[];for(let i=0;i<sd;i++)days.push(null);for(let d=1;d<=ld.getDate();d++){const dt=new Date(y,m,d);const iso=toLocalISO(dt);days.push({day:d,iso,entries:history.filter(h=>h.isoDate===iso)});}return days;};

  const SPLIT_COLORS=["#818cf8","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f472b6","#84cc16"];
  const getSplitColor=(splitName)=>{if(!primaryProg)return SPLIT_COLORS[0];const idx=primaryProg.splits.findIndex(s=>s.name===splitName);return idx>=0?SPLIT_COLORS[idx%SPLIT_COLORS.length]:SPLIT_COLORS[0];};
  const card={background:t.surface,borderRadius:10,border:`1px solid ${t.border}`};
  const cardWithLeft=(color)=>({background:t.surface,borderRadius:10,borderTop:`1px solid ${t.border}`,borderRight:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`,borderLeft:`3px solid ${color}`});
  const cardWithTop=(color)=>({background:t.surface,borderRadius:10,borderLeft:`1px solid ${t.border}`,borderRight:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`,borderTop:`3px solid ${color}`});
  const pill=(a,col)=>({padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:a?`2px solid ${col}`:"2px solid transparent",background:a?`${col}20`:t.bg,color:a?col:t.textMuted});
  const rProg=rTotal>0?Math.max(0,1-rSecs/rTotal):0;
  const isOvertime=rSecs<0;

  // Filtered exercise DB for add-exercise search
  const filteredExDB=exSearch.trim()?EXERCISE_LIST.filter(e=>e.name.toLowerCase().includes(exSearch.toLowerCase())):[];

  // Set detail rendering helper
  const renderSetBadges=(details)=>{if(!details||!details.length)return null;return <div style={{display:"flex",gap:2,marginTop:2}}>{details.map((s,i)=>{const col=STL[s.type]?.color||t.textMuted;return <span key={i} style={{fontSize:8,fontWeight:700,color:col,background:`${col}20`,padding:"1px 4px",borderRadius:3}}>{s.type}{s.type==="D"?`×${s.drops?.length||0}`:""}</span>;})}</div>;};

  const RestTimerInline=()=>(
    <div style={{background:t.restGrad,borderRadius:10,border:`1px solid ${isOvertime?"#ff453a30":t.orange+"30"}`,padding:"10px 14px",margin:"4px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:10,color:isOvertime?t.red:t.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{isOvertime?"Over":"Rest"}</div>
        <div style={{fontSize:28,fontWeight:800,color:isOvertime?t.red:t.orange,fontVariantNumeric:"tabular-nums"}}>{fcSigned(rSecs)}</div>
      </div>
      <div style={{flex:1,margin:"0 12px"}}><div style={{width:"100%",height:4,background:t.surface,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:isOvertime?`linear-gradient(90deg,${t.red},${t.orange})`:`linear-gradient(90deg,${t.orange},${t.red})`,width:`${Math.min(rProg*100,100)}%`,transition:"width 1s linear"}}/></div></div>
      <button onClick={stopR} style={{padding:"5px 14px",borderRadius:6,border:`1px solid ${t.border}`,background:"transparent",color:isOvertime?t.red:t.textSec,fontWeight:600,fontSize:11,cursor:"pointer"}}>{isOvertime?"End Rest":"Skip"}</button>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:t.bg,color:t.textDim,fontFamily:"system-ui,-apple-system,sans-serif",WebkitTextSizeAdjust:"100%",overflowX:"hidden"}}>
      <style>{`*,*::before,*::after{box-sizing:border-box}body{margin:0;padding:0;overflow-x:hidden;background:${t.bg}}input{font-size:16px!important}button{-webkit-tap-highlight-color:transparent}`}</style>

      {/* Header */}
      <div style={{background:t.headerGrad,borderBottom:`1px solid ${t.surface}`,padding:"20px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:rActive?t.orange:logPhase==="active"?t.accent:t.green,boxShadow:`0 0 6px ${rActive?t.orange+"66":logPhase==="active"?t.accent+"66":t.green+"66"}`}}/>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:1.5,color:t.textMuted,textTransform:"uppercase"}}>{rActive?`Rest — ${fcSigned(rSecs)}`:logPhase==="active"?(isUnplanned?"Freestyle — Unplanned":`${prog?.name} — ${split?.name}`):"Gym Tracker"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <h1 style={{fontSize:22,fontWeight:700,margin:"4px 0 0",color:t.text}}>{profileName||"Gym Tracker"}</h1>
            <button onClick={()=>setShowSettings(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,marginTop:4}} aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"14px 14px 40px"}}>
        {/* Tabs */}
        <div style={{display:"flex",gap:3,marginBottom:14,background:t.surface,borderRadius:10,padding:3}}>
          {[{id:"log",l:"Log"},{id:"history",l:"History"},{id:"progress",l:"Progress"},{id:"friends",l:"Friends"}].map(tb=>(
            <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:tab===tb.id?t.surfaceAlt:"transparent",color:tab===tb.id?t.text:t.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}}>{tb.l}</button>
          ))}
        </div>

        {/* ==================== LOG HOME ==================== */}
        {tab==="log"&&logPhase==="home"&&(
          <div>
            {/* 1. PROGRAMS */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Select Program</span>
                <button onClick={()=>{setEditing(!editing);setShowAddProg(false);setShowAddSplit(false);setShowAddEx(false);}} style={{background:"none",border:"none",color:editing?t.yellow:t.textFaint,cursor:"pointer",fontSize:10,fontWeight:600}}>{editing?"✓ Done":"✎ Edit"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {programs.map((p,pi)=>{const isPri=primaryProgIdx===pi;const isSel=selProgIdx===pi&&!editing;return(
                  <button key={p.id} onClick={()=>{if(!editing){setSelProgIdx(pi);setSelSplitIdx(null);}}} style={{...(isSel?cardWithLeft(getProgColor(p.name)):card),padding:"12px 14px",cursor:editing?"default":"pointer",textAlign:"left",opacity:editing?0.8:1,position:"relative"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:14,fontWeight:700,color:isSel?t.text:t.textSec}}>{p.name}</div>
                      {isPri&&!editing&&<div style={{fontSize:8,fontWeight:700,color:getProgColor(p.name),background:`${getProgColor(p.name)}20`,padding:"2px 8px",borderRadius:10,textTransform:"uppercase",letterSpacing:0.5}}>Primary</div>}
                    </div>
                    <div style={{fontSize:10,color:t.textFaint,marginTop:2}}>{p.splits.map(s=>s.name).join(" · ")||"No splits"}</div>
                    {!editing&&!isPri&&isSel&&<button onClick={e=>{e.stopPropagation();setPrimaryProgIdx(pi);}} style={{marginTop:6,padding:"4px 10px",borderRadius:6,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontSize:9,fontWeight:600,cursor:"pointer"}}>★ Set as Primary</button>}
                    {editing&&programs.length>1&&<button onClick={e=>{e.stopPropagation();delProg(pi);}} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:16}}>×</button>}
                  </button>);
                })}
                {editing&&(!showAddProg?<button onClick={()=>setShowAddProg(true)} style={{padding:14,borderRadius:10,border:`2px dashed ${t.border}`,background:"transparent",color:t.textFaint,fontWeight:600,fontSize:13,cursor:"pointer"}}>+ New Program</button>:(
                  <div style={{display:"flex",gap:6}}><input value={newProgName} onChange={e=>setNewProgName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProg()} placeholder="Program name..." autoFocus style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:14,outline:"none"}}/><button onClick={addProg} style={{padding:"10px 16px",borderRadius:10,border:"none",background:t.accent,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Add</button></div>
                ))}
              </div>
            </div>

            {/* Splits */}
            {!editing&&prog&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Choose Split</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{prog.splits.map((s,si)=>(
                <button key={si} onClick={()=>setSelSplitIdx(selSplitIdx===si?null:si)} style={{...(selSplitIdx===si?cardWithLeft(t.green):{...card}),padding:"10px 14px",cursor:"pointer",textAlign:"left",flex:"1 1 calc(50% - 3px)",minWidth:90,background:selSplitIdx===si?t.greenBg:t.surface}}>
                  <div style={{fontSize:13,fontWeight:700,color:selSplitIdx===si?t.green:t.textSec}}>{s.name}</div>
                  <div style={{fontSize:9,color:t.textFaint,marginTop:1}}>{s.exercises.length} exercises</div>
                </button>
              ))}</div>
            </div>}

            {/* Start */}
            {!editing&&selSplitIdx!==null&&<button onClick={()=>startWorkout()} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:t.startGrad,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:8}}>Start {split?.name} Workout</button>}
            {!editing&&<button onClick={startUnplanned} style={{width:"100%",padding:12,borderRadius:12,border:`1px solid ${t.orange}40`,background:t.orangeBg,color:t.orange,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:16}}>⚡ Unplanned Workout</button>}

            {/* Edit panel */}
            {editing&&prog&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Splits in {prog.name}</div>
              {prog.splits.map((s,si)=><div key={si} style={{...card,padding:10,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:14,fontWeight:700,color:t.green}}>{s.name}</span><button onClick={()=>delSplit(si)} style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:18,padding:"4px 6px"}}>×</button></div>
                {s.exercises.map((ex,ei)=>{const exSets=ex.sets||3;const exRest=ex.rest||fullExDB[ex.name]?.rest||90;const isSwapping=editSwapSplit===si&&editSwapIdx===ei;return(
                  <div key={ei} style={{padding:"10px 0",borderTop:ei>0?`1px solid ${t.borderLight}`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,color:t.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.name}</div>
                        <div style={{fontSize:10,color:MC[ex.muscle]||t.textSec,fontWeight:600,marginTop:2}}>{ex.muscle}</div>
                      </div>
                      <button onClick={()=>{if(isSwapping){setEditSwapIdx(null);setEditSwapSplit(null);setEditSwapSearch("");}else{setEditSwapIdx(ei);setEditSwapSplit(si);setEditSwapSearch("");}}} style={{background:"none",border:`1px solid ${isSwapping?t.accent:t.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}} title="Swap exercise"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isSwapping?t.accent:t.textFaint} strokeWidth="2.5" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg><span style={{fontSize:10,fontWeight:600,color:isSwapping?t.accent:t.textFaint}}>Swap</span></button>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}><button onClick={()=>{setSelSplitIdx(si);moveEx(ei,-1);}} disabled={ei===0} style={{background:"none",border:"none",color:ei===0?t.border:t.textMuted,fontSize:14,padding:"2px 4px",cursor:ei===0?"default":"pointer",lineHeight:1}}>▲</button><button onClick={()=>{setSelSplitIdx(si);moveEx(ei,1);}} disabled={ei===s.exercises.length-1} style={{background:"none",border:"none",color:ei===s.exercises.length-1?t.border:t.textMuted,fontSize:14,padding:"2px 4px",cursor:ei===s.exercises.length-1?"default":"pointer",lineHeight:1}}>▼</button></div>
                      <button onClick={()=>{setSelSplitIdx(si);delExercise(ei);}} style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:18,padding:"2px 4px"}}>×</button>
                    </div>
                    {/* Swap picker */}
                    {isSwapping&&<div style={{marginBottom:6,padding:10,background:t.bg,borderRadius:10,border:`1px solid ${t.border}`}}>
                      <div style={{fontSize:10,color:t.textMuted,fontWeight:600,marginBottom:6}}>SWAP WITH</div>
                      <input value={editSwapSearch} onChange={e=>setEditSwapSearch(e.target.value)} placeholder="Search exercises..." autoFocus style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${t.border}`,background:t.surface,color:t.text,fontSize:14,outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
                      <div style={{maxHeight:180,overflowY:"auto"}}>
                        {EXERCISE_LIST.filter(e=>e.name!==ex.name&&(editSwapSearch.trim()?e.name.toLowerCase().includes(editSwapSearch.toLowerCase()):e.muscle===ex.muscle)).slice(0,10).map(e=><button key={e.name} onClick={()=>editSwapExercise(si,ei,e)} style={{width:"100%",padding:"10px 10px",border:"none",borderBottom:`1px solid ${t.borderLight}`,background:t.surface,color:t.textDim,fontSize:13,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between"}}><span>{e.name}</span><span style={{color:MC[e.muscle]||t.textSec,fontSize:10}}>{e.muscle} · {fc(e.rest)}</span></button>)}
                        {EXERCISE_LIST.filter(e=>e.name!==ex.name&&(editSwapSearch.trim()?e.name.toLowerCase().includes(editSwapSearch.toLowerCase()):e.muscle===ex.muscle)).length===0&&<div style={{padding:10,textAlign:"center",fontSize:12,color:t.textFaint}}>No matches</div>}
                      </div>
                      <button onClick={()=>{setEditSwapIdx(null);setEditSwapSplit(null);setEditSwapSearch("");}} style={{marginTop:6,width:"100%",padding:"8px 0",borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}}>Cancel</button>
                    </div>}
                    {/* Sets & Rest controls */}
                    {!isSwapping&&<div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:10,color:t.textMuted,fontWeight:600}}>SETS</span>
                        <button onClick={()=>updateExField(si,ei,"sets",Math.max(1,exSets-1))} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textSec,fontWeight:700,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <span style={{fontSize:16,fontWeight:700,color:t.text,minWidth:20,textAlign:"center"}}>{exSets}</span>
                        <button onClick={()=>updateExField(si,ei,"sets",exSets+1)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textSec,fontWeight:700,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                      <div style={{width:1,height:20,background:t.border}}/>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:10,color:t.textMuted,fontWeight:600}}>REST</span>
                        <button onClick={()=>updateExField(si,ei,"rest",Math.max(15,exRest-15))} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textSec,fontWeight:700,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <span style={{fontSize:14,fontWeight:600,color:t.text,minWidth:36,textAlign:"center"}}>{fc(exRest)}</span>
                        <button onClick={()=>updateExField(si,ei,"rest",exRest+15)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textSec,fontWeight:700,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                    </div>}
                  </div>);})}
                {showAddEx&&selSplitIdx===si?<div style={{marginTop:6,padding:8,background:t.bg,borderRadius:8}}>
                  <input value={exSearch} onChange={e=>{setExSearch(e.target.value);if(!newExName)setNewExName("");}} placeholder="Search exercises..." autoFocus style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${t.border}`,background:t.surface,color:t.text,fontSize:13,outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
                  {filteredExDB.length>0&&<div style={{maxHeight:120,overflowY:"auto",marginBottom:4,borderRadius:6,border:`1px solid ${t.border}`}}>
                    {filteredExDB.slice(0,8).map(ex=><button key={ex.name} onClick={()=>pickExFromDB(ex)} style={{width:"100%",padding:"6px 8px",border:"none",borderBottom:`1px solid ${t.borderLight}`,background:newExName===ex.name?t.accentBg:t.surface,color:t.textDim,fontSize:11,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between"}}><span>{ex.name}</span><span style={{color:MC[ex.muscle]||t.textSec,fontSize:9}}>{ex.muscle} · {fc(ex.rest)}</span></button>)}
                  </div>}
                  <input value={newExName} onChange={e=>setNewExName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addExercise()} placeholder="Exercise name..." style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${t.border}`,background:t.surface,color:t.text,fontSize:13,outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{MUSCLE_GROUPS.map(m=><button key={m} onClick={()=>setNewExMuscle(m)} style={{padding:"4px 10px",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",border:newExMuscle===m?`1px solid ${MC[m]}`:`1px solid ${t.border}`,background:newExMuscle===m?`${MC[m]}20`:"transparent",color:newExMuscle===m?MC[m]:t.textFaint}}>{m}</button>)}</div>
                  <div style={{display:"flex",gap:6}}><button onClick={addExercise} style={{padding:"8px 16px",borderRadius:8,border:"none",background:t.green,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Add</button><button onClick={()=>{setShowAddEx(false);setExSearch("");setNewExName("");}} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button></div>
                </div>:<button onClick={()=>{setSelSplitIdx(si);setShowAddEx(true);setExSearch("");setNewExName("");}} style={{marginTop:8,background:"none",border:"none",color:t.accent,fontSize:12,fontWeight:600,cursor:"pointer",padding:"4px 0"}}>+ Add Exercise</button>}
              </div>)}
              {!showAddSplit?<button onClick={()=>setShowAddSplit(true)} style={{padding:14,borderRadius:10,border:`2px dashed ${t.border}`,background:"transparent",color:t.textFaint,fontWeight:600,fontSize:13,cursor:"pointer",width:"100%"}}>+ New Split</button>:<div style={{display:"flex",gap:6}}><input value={newSplitName} onChange={e=>setNewSplitName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSplit()} placeholder="Split name..." autoFocus style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:14,outline:"none"}}/><button onClick={addSplit} style={{padding:"10px 16px",borderRadius:10,border:"none",background:t.green,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Add</button></div>}
            </div>}

            {/* 2. NEXT UP */}
            {!editing&&nextSplit&&primaryProg&&<div style={{marginBottom:14}}>
              <div style={{...cardWithLeft(getProgColor(primaryProg.name)),padding:"12px 14px",background:`linear-gradient(135deg,${t.surface},${getProgColor(primaryProg.name)}08)`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Next Up</div>
                  <div style={{fontSize:9,color:t.textFaint}}>{primaryProg.name}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:t.text}}>{nextSplit.splitName}</div><div style={{fontSize:10,color:t.textMuted}}>{primaryProg.splits[nextSplit.splitIdx]?.exercises.length||0} exercises</div></div>
                  <button onClick={()=>startWorkout(primaryProgIdx,nextSplit.splitIdx)} style={{padding:"10px 18px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${getProgColor(primaryProg.name)},${getProgColor(primaryProg.name)}cc)`,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Start →</button>
                </div>
              </div>
            </div>}

            {/* 3. WEEKLY (tappable) */}
            {!editing&&<div style={{marginBottom:weekSelDay?6:14}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>This Week</div>
              <div style={{display:"flex",gap:2}}>{weekDots.map(d=>{const isSel=weekSelDay===d.iso;return(
                <div key={d.day} style={{flex:1,textAlign:"center",cursor:"pointer",padding:"3px 0"}} onClick={()=>setWeekSelDay(isSel?null:d.iso)}>
                  <div style={{fontSize:9,color:d.isToday?t.text:t.textFaint,fontWeight:d.isToday?700:500,marginBottom:4}}>{d.day}</div>
                  <div style={{width:24,height:24,borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",background:d.worked?getSplitColor(d.entries[0]?.split):(d.isToday?t.surfaceAlt:t.surface),border:isSel?`2px solid ${t.text}`:(d.isToday&&!d.worked?`2px solid ${t.textFaint}`:"2px solid transparent"),boxShadow:d.worked?`0 0 6px ${getSplitColor(d.entries[0]?.split)}40`:"none"}}>{d.worked&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}</div>
                </div>);
              })}</div>
            </div>}

            {/* Week detail */}
            {!editing&&weekSelDay&&(()=>{const dd=weekDots.find(d=>d.iso===weekSelDay);if(!dd)return null;const dn=new Date(weekSelDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
              if(!dd.worked) return <div style={{...card,padding:"10px 12px",marginBottom:14,textAlign:"center"}}><div style={{fontSize:11,color:t.textFaint}}>{dn} — Rest day</div></div>;
              const bs={};dd.entries.forEach(h=>{const k=h.split||"W";if(!bs[k])bs[k]=[];bs[k].push(h);});
              return <div style={{...cardWithTop(getSplitColor(dd.entries[0]?.split)),padding:"10px 14px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{fontSize:12,fontWeight:700,color:t.text}}>{dn}</div><div style={{fontSize:8,color:getProgColor(dd.program),fontWeight:600,background:`${getProgColor(dd.program)}15`,padding:"2px 6px",borderRadius:6}}>{dd.program}</div></div>
                {Object.entries(bs).map(([sn,entries])=><div key={sn}><div style={{fontSize:9,fontWeight:700,color:t.green,marginBottom:2,textTransform:"uppercase"}}>{sn}</div>{entries.map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}><div style={{color:t.textSec}}>{h.exercise}{renderSetBadges(h.setDetails)}</div><div style={{display:"flex",gap:8}}><span style={{color:t.orange,fontWeight:600}}>{h.weight}lbs</span><span style={{color:t.textMuted}}>{h.sets}×{h.reps}</span></div></div>)}</div>)}
              </div>;
            })()}

            {/* 4. LAST WORKOUT */}
            {!editing&&lastWorkout&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Last Workout</div>
              <div style={{...card,padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div><span style={{fontSize:13,fontWeight:700,color:t.text}}>{lastWorkout.split}</span><span style={{fontSize:10,color:t.textFaint,marginLeft:6}}>{lastWorkout.date}</span></div><div style={{fontSize:8,color:getProgColor(lastWorkout.program),fontWeight:600,background:`${getProgColor(lastWorkout.program)}15`,padding:"2px 6px",borderRadius:6}}>{lastWorkout.program}</div></div>
                {lastWorkout.exercises.slice(0,4).map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}><div style={{color:t.textSec}}>{h.exercise}{renderSetBadges(h.setDetails)}</div><div style={{display:"flex",gap:8}}><span style={{color:t.orange,fontWeight:600}}>{h.weight}lbs</span><span style={{color:t.textMuted}}>{h.sets}×{h.reps}</span></div></div>)}
                {lastWorkout.exercises.length>4&&<div style={{fontSize:9,color:t.textFaint,textAlign:"center",paddingTop:2}}>+{lastWorkout.exercises.length-4} more</div>}
                {lastWorkout.topLift&&<div style={{marginTop:6,padding:"5px 8px",background:t.yellowBg,borderRadius:6,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>&#127942;</span><span style={{fontSize:10,color:t.yellow,fontWeight:600}}>Top: {lastWorkout.topLift.exercise} — {lastWorkout.topLift.weight}lbs</span></div>}
              </div>
            </div>}

            {/* 5. RECENT PRs */}
            {!editing&&recentPRs.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Recent PRs</div>
              {recentPRs.map(pr=><div key={pr.exercise} style={{...card,padding:"8px 14px",marginBottom:5,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:12,fontWeight:600,color:t.text}}>{pr.exercise}</div><div style={{fontSize:9,color:t.textFaint}}>{pr.date}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14,fontWeight:800,color:t.yellow}}>{pr.weight}lbs</span><div style={{fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:6,background:t.greenBg,color:t.green}}>+{pr.gain}</div></div></div>)}
            </div>}
          </div>
        )}

        {/* ===== ACTIVE WORKOUT ===== */}
        {tab==="log"&&logPhase==="active"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:700,color:t.text}}>{isUnplanned?"Freestyle — Unplanned":`${prog?.name} — ${split?.name}`}</div>
            <button onClick={cancelWorkout} style={{background:"none",border:"none",color:t.red,fontSize:10,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          </div>
          {/* Session timer */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"6px 10px",background:t.surface,borderRadius:8,border:`1px solid ${t.border}`}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:isUnplanned?t.orange:t.green,boxShadow:`0 0 4px ${isUnplanned?t.orange:t.green}66`}}/>
            <span style={{fontSize:10,color:t.textMuted,fontWeight:600}}>SESSION</span>
            <span style={{fontSize:14,fontWeight:800,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fc(sessionElapsed)}</span>
            <span style={{fontSize:9,color:t.textFaint,marginLeft:"auto"}}>{activeExercises.length} exercises</span>
          </div>
          {activeExercises.map((ex,exIdx)=>{const mc=MC[ex.muscle]||t.textSec;const count=getSC(ex.name);const lastTime=getLastSession(ex.name);const restTime=getExRest(ex.name);return(
            <div key={`${ex.name}-${exIdx}`}>
              <div style={{...cardWithLeft(mc),marginBottom:0,overflow:"hidden"}}>
                <div style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,fontWeight:600,color:t.text}}>{ex.name}</span><button onClick={()=>{setSwappingExIdx(swappingExIdx===exIdx?null:exIdx);setSwapSearch("");}} style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex",alignItems:"center"}} title="Swap exercise"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg></button></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:9,fontWeight:700,color:mc,textTransform:"uppercase"}}>{ex.muscle}</span><span style={{fontSize:8,color:t.textFaint}}>Rest: {fc(restTime)}</span></div></div>
                    {getPR(history,ex.name)>0&&<div style={{fontSize:9,color:t.yellow,fontWeight:700,background:t.yellowBg,padding:"2px 6px",borderRadius:6}}>PR: {getPR(history,ex.name)}lbs</div>}
                  </div>
                  {/* Swap exercise picker */}
                  {swappingExIdx===exIdx&&<div style={{marginBottom:6,padding:8,background:t.bg,borderRadius:8,border:`1px solid ${t.border}`}}>
                    <div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginBottom:4}}>SWAP WITH</div>
                    <input value={swapSearch} onChange={e=>setSwapSearch(e.target.value)} placeholder="Search exercises..." autoFocus style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${t.border}`,background:t.surface,color:t.text,fontSize:13,outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
                    <div style={{maxHeight:140,overflowY:"auto"}}>
                      {EXERCISE_LIST.filter(e=>e.name!==ex.name&&(swapSearch.trim()?e.name.toLowerCase().includes(swapSearch.toLowerCase()):e.muscle===ex.muscle)).slice(0,10).map(e=><button key={e.name} onClick={()=>swapExercise(exIdx,e)} style={{width:"100%",padding:"6px 8px",border:"none",borderBottom:`1px solid ${t.borderLight}`,background:t.surface,color:t.textDim,fontSize:11,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between"}}><span>{e.name}</span><span style={{color:MC[e.muscle]||t.textSec,fontSize:9}}>{e.muscle} · {fc(e.rest)}</span></button>)}
                      {EXERCISE_LIST.filter(e=>e.name!==ex.name&&(swapSearch.trim()?e.name.toLowerCase().includes(swapSearch.toLowerCase()):e.muscle===ex.muscle)).length===0&&<div style={{padding:8,textAlign:"center",fontSize:10,color:t.textFaint}}>No matches</div>}
                    </div>
                    <button onClick={()=>{setSwappingExIdx(null);setSwapSearch("");}} style={{marginTop:4,width:"100%",padding:"5px 0",borderRadius:6,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:10,cursor:"pointer"}}>Cancel</button>
                  </div>}
                  {lastTime&&swappingExIdx!==exIdx&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,padding:"4px 8px",background:t.accentBg,borderRadius:6,border:`1px solid ${t.accent}20`}}><div style={{fontSize:8,color:t.textMuted,fontWeight:600}}>LAST:</div><div style={{fontSize:11,fontWeight:700,color:t.accent}}>{lastTime.weight}lbs</div><div style={{fontSize:8,color:t.textFaint}}>×</div><div style={{fontSize:11,fontWeight:600,color:t.textSec}}>{lastTime.reps}reps</div><div style={{fontSize:8,color:t.textFaint}}>·</div><div style={{fontSize:8,color:t.textFaint}}>{lastTime.sets}sets</div><div style={{fontSize:8,color:t.textFaint,marginLeft:"auto"}}>{lastTime.date}</div></div>}
                  {Array.from({length:count}).map((_,si)=>{const tp=getType(ex.name,si);const s=getS(ex.name,si);const ew=getEffectiveWeight(ex.name,si);const filled=tp!=="D"?(ew&&s.reps):getS(ex.name,si,0).weight;const confirmed=isSetConfirmed(ex.name,si);return(
                    <div key={si}>
                      <div style={{marginBottom:3}}>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <div style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0,background:confirmed?t.greenBg:t.surfaceAlt,color:confirmed?t.green:t.textMuted}}>{si+1}</div>
                          <div style={{display:"flex",gap:2,flexShrink:0}}>{["S","D","M"].map(st=><button key={st} onClick={()=>setTypeVal(ex.name,si,st)} style={{width:20,height:20,borderRadius:4,fontSize:8,fontWeight:800,cursor:"pointer",border:tp===st?`1px solid ${STL[st].color}`:`1px solid ${t.border}`,background:tp===st?`${STL[st].color}25`:"transparent",color:tp===st?STL[st].color:t.textFaint,display:"flex",alignItems:"center",justifyContent:"center"}}>{st}</button>)}</div>
                          {tp==="D"?<div style={{flex:1,display:"flex",gap:2,minWidth:0}}>{[0,1,2].map(d=>{const ds=getS(ex.name,si,d);return <div key={d} style={{flex:1,display:"flex",gap:1,minWidth:0}}><input inputMode="decimal" value={ds.weight} onChange={e=>upS(ex.name,si,"weight",e.target.value.replace(/[^\d.]/g,""),d)} placeholder="lbs" style={{flex:1,padding:"6px 2px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",minWidth:0,boxSizing:"border-box"}}/><input inputMode="numeric" value={ds.reps} onChange={e=>upS(ex.name,si,"reps",e.target.value.replace(/\D/g,""),d)} placeholder="r" style={{flex:"0 0 28px",padding:"6px 1px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",minWidth:0,boxSizing:"border-box"}}/></div>})}</div>:(
                            <div style={{flex:1,display:"flex",gap:5,minWidth:0}}>
                              <input inputMode="decimal" value={ew} onChange={e=>upS(ex.name,si,"weight",e.target.value.replace(/[^\d.]/g,""))} placeholder="Weight" style={{flex:1,padding:"7px 6px",borderRadius:8,border:`1px solid ${t.border}`,background:si>0&&!manuallyEdited[`${ex.name}__${si}`]&&ew?t.accentBg:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",minWidth:0,boxSizing:"border-box"}}/>
                              <input inputMode="numeric" value={s.reps} onChange={e=>upS(ex.name,si,"reps",e.target.value.replace(/\D/g,""))} placeholder="Reps" style={{flex:1,padding:"7px 6px",borderRadius:8,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",minWidth:0,boxSizing:"border-box"}}/>
                            </div>
                          )}
                          {filled&&!confirmed?<button onClick={()=>confirmSet(ex.name,exIdx,si)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${t.green}60`,background:t.greenBg,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:3}} title="Confirm set & start rest"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span style={{fontSize:8,fontWeight:700,color:t.green}}>Done</span></button>:confirmed?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="3" strokeLinecap="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>:<div style={{width:14}}/>}
                        </div>
                        {tp==="D"&&<div style={{fontSize:8,color:t.yellow,marginLeft:46,marginTop:1}}>Drop 1 → 2 → 3</div>}
                        {tp==="M"&&si===0&&<div style={{fontSize:8,color:t.red,marginLeft:46,marginTop:1}}>Activation set</div>}
                        {tp==="M"&&si>0&&<div style={{fontSize:8,color:t.red,marginLeft:46,marginTop:1}}>Myo rep {si}</div>}
                      </div>
                      {rActive&&rAfterEx===exIdx&&rAfterSet===si&&si<count-1&&<RestTimerInline/>}
                    </div>);
                  })}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5}}>
                    <div style={{display:"flex",gap:6}}><button onClick={()=>addSC(ex.name)} style={{background:"none",border:"none",color:t.accent,fontSize:10,fontWeight:600,cursor:"pointer",padding:0}}>+ Set</button>{count>1&&<button onClick={()=>remSC(ex.name)} style={{background:"none",border:"none",color:t.textMuted,fontSize:10,fontWeight:600,cursor:"pointer",padding:0}}>- Remove</button>}</div>
                  </div>
                </div>
              </div>
              {rActive&&rAfterEx===exIdx&&rAfterSet===count-1&&<div style={{margin:"3px 0"}}><RestTimerInline/></div>}
              <div style={{height:8}}/>
            </div>);
          })}
          {/* Add exercise button (always for unplanned, or as extra for planned) */}
          {!showAddWorkoutEx?<button onClick={()=>{setShowAddWorkoutEx(true);setWorkoutExSearch("");}} style={{width:"100%",padding:12,borderRadius:10,border:`2px dashed ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:13,cursor:"pointer",marginTop:4,marginBottom:4}}>+ Add Exercise</button>:
          <div style={{...card,padding:12,marginTop:4,marginBottom:4}}>
            <div style={{fontSize:10,color:t.textMuted,fontWeight:600,marginBottom:6}}>ADD EXERCISE</div>
            <input value={workoutExSearch} onChange={e=>setWorkoutExSearch(e.target.value)} placeholder="Search exercises..." autoFocus style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:14,outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
            <div style={{maxHeight:200,overflowY:"auto",marginBottom:6}}>
              {EXERCISE_LIST.filter(e=>workoutExSearch.trim()?e.name.toLowerCase().includes(workoutExSearch.toLowerCase()):true).slice(0,12).map(e=><button key={e.name} onClick={()=>addWorkoutExercise(e)} style={{width:"100%",padding:"10px 10px",border:"none",borderBottom:`1px solid ${t.borderLight}`,background:t.surface,color:t.textDim,fontSize:13,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between"}}><span>{e.name}</span><span style={{color:MC[e.muscle]||t.textSec,fontSize:10}}>{e.muscle} · {fc(e.rest)}</span></button>)}
            </div>
            <button onClick={()=>{setShowAddWorkoutEx(false);setWorkoutExSearch("");}} style={{width:"100%",padding:"8px 0",borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}}>Cancel</button>
          </div>}
          {hasLog&&<button onClick={()=>setShowFinishConfirm(true)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:t.finishGrad,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginTop:4}}>✓ Finish Workout</button>}

          {/* Finish confirmation modal */}
          {showFinishConfirm&&<div style={{position:"fixed",inset:0,background:t.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowFinishConfirm(false)}>
            <div style={{background:t.surface,borderRadius:16,border:`1px solid ${t.border}`,padding:20,maxWidth:340,width:"100%"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:4}}>Finish Workout?</div>
              <div style={{fontSize:12,color:t.textSec,marginBottom:16}}>Save your {isUnplanned?"unplanned":split?.name} session or discard all logged data.</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>{setShowFinishConfirm(false);finishWorkout();}} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:t.finishGrad,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Save Workout</button>
                <button onClick={()=>{setShowFinishConfirm(false);cancelWorkout();}} style={{width:"100%",padding:12,borderRadius:10,border:`1px solid ${t.red}`,background:"transparent",color:t.red,fontWeight:700,fontSize:14,cursor:"pointer"}}>Discard Workout</button>
                <button onClick={()=>setShowFinishConfirm(false)} style={{width:"100%",padding:10,borderRadius:10,border:"none",background:"transparent",color:t.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}}>Keep Logging</button>
              </div>
            </div>
          </div>}
        </div>}

        {/* ==================== HISTORY ==================== */}
        {tab==="history"&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1))} style={{background:"none",border:"none",color:t.textMuted,cursor:"pointer",fontSize:18,padding:"4px 8px"}}>‹</button>
            <div style={{fontSize:14,fontWeight:700,color:t.text}}>{calMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
            <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1))} style={{background:"none",border:"none",color:t.textMuted,cursor:"pointer",fontSize:18,padding:"4px 8px"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:3}}>{DOW.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:600,color:t.textFaint,padding:"2px 0"}}>{d}</div>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:12}}>
            {getCalDays().map((d,i)=>{if(!d)return <div key={`e-${i}`} style={{aspectRatio:"1"}}/>;const hw=d.entries.length>0;const isSel=calSelDay===d.iso;const isT=d.iso===toLocalISO(new Date());const splits=[...new Set(d.entries.map(e=>e.split))];const dc=hw?getSplitColor(splits[0]):"transparent";
              return <button key={d.iso} onClick={()=>setCalSelDay(isSel?null:d.iso)} style={{aspectRatio:"1",borderRadius:8,border:"none",cursor:hw?"pointer":"default",background:isSel?`${dc}25`:(isT?t.surfaceAlt:t.surface),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,outline:isSel?`2px solid ${dc}`:"none",padding:0}}>
                <div style={{fontSize:11,fontWeight:isT?800:500,color:isT?t.text:(hw?t.textDim:t.textFaint)}}>{d.day}</div>
                {hw&&<div style={{display:"flex",gap:2}}>{splits.slice(0,2).map((s,j)=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:getSplitColor(s)}}/>)}</div>}
              </button>;
            })}
          </div>
          {calSelDay&&(()=>{const de=history.filter(h=>h.isoDate===calSelDay);if(!de.length)return null;const bs={};de.forEach(h=>{const k=h.split||"W";if(!bs[k])bs[k]=[];bs[k].push(h);});const dd=new Date(calSelDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});const isEditing=editingHistory&&editingHistory.length>0&&editingHistory[0].isoDate===calSelDay;
            return <div style={{...cardWithTop(getSplitColor(de[0]?.split)),padding:"12px 14px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{dd}</div><div style={{fontSize:10,color:getProgColor(de[0].program),fontWeight:600}}>{de[0].program}</div></div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {!isEditing&&<button onClick={()=>startEditHistory(de.map(h=>({...h,_origExercise:h.exercise})))} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:10,fontWeight:600}}>Edit</button>}
                  <button onClick={()=>{setCalSelDay(null);setEditingHistory(null);}} style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:16}}>×</button>
                </div>
              </div>
              {isEditing?<div>
                {editingHistory.map((h,i)=><div key={i} style={{padding:"6px 0",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:12,color:t.textDim,fontWeight:600}}>{h.exercise}</span>
                    <button onClick={()=>deleteHistoryEntry(i)} style={{background:"none",border:"none",color:t.red,cursor:"pointer",fontSize:12,padding:"0 2px"}}>×</button>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:8,color:t.textMuted,marginBottom:2}}>WEIGHT</div><input value={h.weight} onChange={e=>updateEditEntry(i,"weight",e.target.value.replace(/[^\d.]/g,""))} style={{width:"100%",padding:"6px 4px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.orange,fontSize:16,outline:"none",textAlign:"center",fontWeight:700,boxSizing:"border-box"}}/></div>
                    <div style={{flex:1}}><div style={{fontSize:8,color:t.textMuted,marginBottom:2}}>SETS</div><input value={h.sets} onChange={e=>updateEditEntry(i,"sets",e.target.value.replace(/\D/g,""))} style={{width:"100%",padding:"6px 4px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.textSec,fontSize:16,outline:"none",textAlign:"center",fontWeight:600,boxSizing:"border-box"}}/></div>
                    <div style={{flex:1}}><div style={{fontSize:8,color:t.textMuted,marginBottom:2}}>REPS</div><input value={h.reps} onChange={e=>updateEditEntry(i,"reps",e.target.value.replace(/\D/g,""))} style={{width:"100%",padding:"6px 4px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.textSec,fontSize:16,outline:"none",textAlign:"center",fontWeight:600,boxSizing:"border-box"}}/></div>
                  </div>
                </div>)}
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button onClick={saveEditHistory} style={{flex:1,padding:10,borderRadius:8,border:"none",background:t.green,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>Save Changes</button>
                  <button onClick={()=>setEditingHistory(null)} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}}>Cancel</button>
                </div>
              </div>:
              Object.entries(bs).map(([sn,entries])=><div key={sn} style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:t.green,marginBottom:3,textTransform:"uppercase"}}>{sn}</div>{entries.map((h,i)=><div key={i} style={{padding:"4px 0",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:t.textDim}}>{h.exercise}</span><div style={{display:"flex",gap:10,fontSize:11}}><span style={{color:t.orange,fontWeight:700}}>{h.weight}lbs</span><span style={{color:t.textSec}}>{h.sets}×{h.reps}</span></div></div>{renderSetBadges(h.setDetails)}</div>)}</div>)}
            </div>;
          })()}
          <div style={{display:"flex",gap:8,justifyContent:"center",padding:"4px 0",marginBottom:14,flexWrap:"wrap"}}>{primaryProg?primaryProg.splits.map((s,i)=><div key={s.name} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:t.textMuted}}><div style={{width:6,height:6,borderRadius:"50%",background:SPLIT_COLORS[i%SPLIT_COLORS.length]}}/>{s.name}</div>):<div style={{fontSize:9,color:t.textFaint}}>No primary program set</div>}</div>

          {/* Sets per muscle group — last 7 days */}
          {(()=>{const now=new Date();const sevenAgo=new Date(now);sevenAgo.setDate(now.getDate()-6);sevenAgo.setHours(0,0,0,0);const sevenIso=toLocalISO(sevenAgo);
            const recent=history.filter(h=>(h.isoDate||"0")>=sevenIso);
            const muscleMap={};recent.forEach(h=>{const m=fullExDB[h.exercise]?.muscle||"Other";muscleMap[m]=(muscleMap[m]||0)+(h.sets||0);});
            const entries=MUSCLE_GROUPS.map(m=>({muscle:m,sets:muscleMap[m]||0})).filter(e=>e.sets>0);
            const maxSets=Math.max(...entries.map(e=>e.sets),1);
            if(!entries.length)return <div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Sets per Muscle — Last 7 Days</div><div style={{fontSize:11,color:t.textFaint}}>No workouts logged in the past 7 days.</div></div>;
            return <div style={{...card,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Sets per Muscle — Last 7 Days</div>
              {entries.sort((a,b)=>b.sets-a.sets).map(e=><div key={e.muscle} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:70,fontSize:10,fontWeight:600,color:MC[e.muscle]||t.textSec,textAlign:"right",flexShrink:0}}>{e.muscle}</div>
                <div style={{flex:1,height:18,background:t.bg,borderRadius:4,overflow:"hidden",position:"relative"}}>
                  <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${MC[e.muscle]||t.accent},${MC[e.muscle]||t.accent}88)`,width:`${(e.sets/maxSets)*100}%`,transition:"width 0.3s ease"}}/>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:t.text,width:24,textAlign:"right",flexShrink:0}}>{e.sets}</div>
              </div>)}
              <div style={{fontSize:9,color:t.textFaint,textAlign:"center",marginTop:6}}>{recent.length} exercises logged · {Object.values(muscleMap).reduce((a,b)=>a+b,0)} total sets</div>
            </div>;
          })()}
        </div>}

        {/* ==================== PROGRESS ==================== */}
        {tab==="progress"&&<div>
          {/* Favorites / Muscle group toggle */}
          <div style={{display:"flex",gap:3,marginBottom:8,background:t.surface,borderRadius:8,padding:2}}>
            <button onClick={()=>setProgressView("favorites")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",background:progressView==="favorites"?t.surfaceAlt:"transparent",color:progressView==="favorites"?t.yellow:t.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}}>★ Favorites</button>
            <button onClick={()=>setProgressView("muscle")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",background:progressView==="muscle"?t.surfaceAlt:"transparent",color:progressView==="muscle"?t.accent:t.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}}>By Muscle</button>
          </div>
          {progressView==="muscle"&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
            {MUSCLE_GROUPS.map(m=><button key={m} onClick={()=>setProgressMuscleFilter(m)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:progressMuscleFilter===m?`1px solid ${MC[m]}`:`1px solid ${t.border}`,background:progressMuscleFilter===m?`${MC[m]}20`:"transparent",color:progressMuscleFilter===m?MC[m]:t.textMuted}}>{m}</button>)}
          </div>}
          <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Exercise</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>{(()=>{const list=progressView==="favorites"?[...favoriteExercises].sort():allProgressEx.filter(ex=>{const m=fullExDB[ex]?.muscle;return m===progressMuscleFilter;});return list.map(ex=>{const hasData=allLoggedEx.includes(ex);return <button key={ex} onClick={()=>setChartEx(ex)} style={{...pill(chartEx===ex,t.accent),opacity:hasData?1:0.6}}>{ex}</button>;});})()}</div>
          {(()=>{const data=getCD(history,chartEx),pr=getPR(history,chartEx);if(!data.length) return <div style={{textAlign:"center",padding:30,color:t.textFaint}}>No data for {chartEx} yet. Start logging to see progress.</div>;
            return <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:15,fontWeight:700,color:t.text}}>{chartEx}</div><div style={{fontSize:10,color:t.yellow,fontWeight:700,background:t.yellowBg,padding:"3px 8px",borderRadius:8}}>PR: {pr}lbs</div></div>
              <div style={{...card,padding:"12px 4px 4px 0"}}><ResponsiveContainer width="100%" height={180}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke={t.border}/><XAxis dataKey="date" tick={{fill:t.textMuted,fontSize:9}} axisLine={{stroke:t.border}}/><YAxis tick={{fill:t.textMuted,fontSize:9}} axisLine={{stroke:t.border}} domain={["dataMin-10","dataMax+10"]}/><Tooltip contentStyle={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,fontSize:11,color:t.text}} formatter={v=>[`${v}lbs`,"Weight"]}/><Line type="monotone" dataKey="weight" stroke={t.accent} strokeWidth={2.5} dot={{fill:t.accent,r:3}} activeDot={{r:5,fill:t.text,stroke:t.accent,strokeWidth:2}}/></LineChart></ResponsiveContainer></div>
              <div style={{display:"flex",gap:6,marginTop:12}}>{[{l:"Sessions",v:data.length,c:t.textSec},{l:"Starting",v:data[0].weight,c:t.textMuted},{l:"Current",v:data[data.length-1].weight,c:t.green},{l:"Gained",v:`+${data[data.length-1].weight-data[0].weight}`,c:t.yellow}].map(s=><div key={s.l} style={{flex:1,...card,padding:"7px 8px"}}><div style={{fontSize:15,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:t.textFaint,fontWeight:500}}>{s.l}</div></div>)}</div>
            </React.Fragment>;
          })()}

          {/* Exercise Database */}
          <div style={{marginTop:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Exercise Database</div>
              <button onClick={()=>{setEditingDb(!editingDb);setEditingMuscleEx(null);setEditingRestEx(null);}} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${editingDb?t.green:t.border}`,background:editingDb?t.greenBg:"transparent",color:editingDb?t.green:t.textMuted,fontSize:10,fontWeight:600,cursor:"pointer"}}>{editingDb?"✓ Done":"✎ Edit"}</button>
            </div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
              <button onClick={()=>setDbMuscleFilter("All")} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:dbMuscleFilter==="All"?`1px solid ${t.accent}`:`1px solid ${t.border}`,background:dbMuscleFilter==="All"?t.accentBg:"transparent",color:dbMuscleFilter==="All"?t.accent:t.textMuted}}>All</button>
              {MUSCLE_GROUPS.map(m=><button key={m} onClick={()=>setDbMuscleFilter(m)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:dbMuscleFilter===m?`1px solid ${MC[m]}`:`1px solid ${t.border}`,background:dbMuscleFilter===m?`${MC[m]}20`:"transparent",color:dbMuscleFilter===m?MC[m]:t.textMuted}}>{m}</button>)}
            </div>
            <div style={{...card,overflow:"hidden"}}>
              {EXERCISE_LIST.filter(e=>dbMuscleFilter==="All"||e.muscle===dbMuscleFilter).map((ex,i)=>{const isCustom=!!customExercises[ex.name];const isEditingMuscle=editingMuscleEx===ex.name;return(
                <div key={ex.name} style={{padding:"10px 12px",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  {editingDb&&<button onClick={()=>deleteExercise(ex.name)} style={{background:"none",border:"none",color:t.red,cursor:"pointer",fontSize:18,padding:"4px 6px 4px 0",lineHeight:1,flexShrink:0}} title="Remove exercise">−</button>}
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                    {!editingDb&&<button onClick={()=>toggleFavorite(ex.name)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",fontSize:16,color:favoriteExercises.has(ex.name)?t.yellow:t.textFaint,lineHeight:1,flexShrink:0}} title={favoriteExercises.has(ex.name)?"Remove from favorites":"Add to favorites"}>{favoriteExercises.has(ex.name)?"★":"☆"}</button>}
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:t.text,display:"flex",alignItems:"center",gap:4}}><span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.name}</span>{isCustom&&<span style={{fontSize:7,color:t.accent,fontWeight:700,background:t.accentBg,padding:"1px 4px",borderRadius:4,flexShrink:0}}>CUSTOM</span>}</div>
                      {editingDb?<button onClick={()=>{if(isEditingMuscle)setEditingMuscleEx(null);else{setEditingMuscleEx(ex.name);setEditingRestEx(null);}}} style={{background:"none",border:"none",cursor:"pointer",padding:0,marginTop:1}}>
                        <span style={{fontSize:10,color:MC[ex.muscle],fontWeight:600}}>{ex.muscle}</span>
                        <span style={{fontSize:8,color:t.textFaint,marginLeft:3}}>✎</span>
                      </button>:<span style={{fontSize:10,color:MC[ex.muscle],fontWeight:600}}>{ex.muscle}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    {editingRestEx===ex.name?<div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <input inputMode="numeric" value={editingRestVal} onChange={e=>setEditingRestVal(e.target.value.replace(/\D/g,""))} placeholder="sec" autoFocus style={{width:50,padding:"6px 6px",borderRadius:6,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
                      <span style={{fontSize:9,color:t.textFaint}}>sec</span>
                      <button onClick={()=>saveRestTime(ex.name,parseInt(editingRestVal)||ex.rest)} style={{padding:"5px 10px",borderRadius:6,border:"none",background:t.green,color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer"}}>Save</button>
                      <button onClick={()=>{setEditingRestEx(null);setEditingRestVal("");}} style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:10,cursor:"pointer"}}>×</button>
                    </div>:<button onClick={()=>{setEditingRestEx(ex.name);setEditingRestVal(String(ex.rest));setEditingMuscleEx(null);}} style={{fontSize:11,color:t.textMuted,fontWeight:600,background:t.surfaceAlt,padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer"}}>Rest: {fc(ex.rest)}</button>}
                  </div>
                </div>
                {isEditingMuscle&&editingDb&&<div style={{marginTop:6,padding:8,background:t.bg,borderRadius:8}}>
                  <div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginBottom:6}}>CHANGE MUSCLE GROUP</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{MUSCLE_GROUPS.map(m=><button key={m} onClick={()=>changeExMuscle(ex.name,m)} style={{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:ex.muscle===m?`1px solid ${MC[m]}`:`1px solid ${t.border}`,background:ex.muscle===m?`${MC[m]}20`:"transparent",color:ex.muscle===m?MC[m]:t.textMuted}}>{m}</button>)}</div>
                </div>}
              </div>);})}
            </div>
            {hiddenExercises.size>0&&editingDb&&<div style={{marginTop:8}}>
              <div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginBottom:4}}>REMOVED EXERCISES ({hiddenExercises.size})</div>
              <div style={{...card,padding:8,display:"flex",gap:4,flexWrap:"wrap"}}>
                {[...hiddenExercises].sort().map(name=><button key={name} onClick={()=>restoreExercise(name)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontSize:10,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><span style={{color:t.green,fontWeight:700}}>+</span> {name}</button>)}
              </div>
            </div>}
            <div style={{fontSize:9,color:t.textFaint,marginTop:6,textAlign:"center"}}>{EXERCISE_LIST.filter(e=>dbMuscleFilter==="All"||e.muscle===dbMuscleFilter).length} exercises{editingDb?" · Tap − to remove · Tap muscle to reassign":" · Tap rest time to edit"}</div>
          </div>
        </div>}

        {/* ==================== FRIENDS ==================== */}
        {tab==="friends"&&<div>
          <div style={{display:"flex",gap:5,marginBottom:14}}>{friends.map((f,i)=><button key={f.name} onClick={()=>setSelFriend(i)} style={{flex:1,...(selFriend===i?cardWithTop(f.color):card),padding:"10px",cursor:"pointer",textAlign:"center",background:selFriend===i?`${f.color}10`:t.surface}}><div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${f.color},${f.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",margin:"0 auto 4px"}}>{f.name[0]}</div><div style={{fontSize:11,fontWeight:700,color:selFriend===i?f.color:t.textSec}}>{f.name}</div></button>)}
            <button onClick={()=>setShowAddFriend(true)} style={{flex:1,...card,padding:"10px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><div style={{width:30,height:30,borderRadius:"50%",border:`2px dashed ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:t.textFaint}}>+</div><div style={{fontSize:9,fontWeight:600,color:t.textFaint}}>Add</div></button>
          </div>
          {!friendInfoDismissed&&<div style={{...card,padding:10,marginBottom:12,background:`linear-gradient(135deg,${t.surface},${t.surfaceAlt})`,position:"relative"}}><button onClick={()=>setFriendInfoDismissed(true)} style={{position:"absolute",top:6,right:8,background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button><div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginBottom:2}}>HOW FRIEND CODES WORK</div><div style={{fontSize:10,color:t.textSec,lineHeight:1.5,paddingRight:16}}>Share your unique code → friends enter it → workouts sync automatically.</div></div>}
          {/* Add Friend Modal */}
          {showAddFriend&&<div style={{position:"fixed",inset:0,background:t.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>{setShowAddFriend(false);setAddFriendCode("");setAddFriendError("");setAddFriendSuccess(false);}}>
            <div style={{background:t.surface,borderRadius:16,border:`1px solid ${t.border}`,padding:20,maxWidth:340,width:"100%"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:4}}>Add a Friend</div>
              <div style={{fontSize:11,color:t.textSec,marginBottom:14,lineHeight:1.5}}>Enter your friend's unique code to sync workouts and compare progress.</div>
              <input value={addFriendCode} onChange={e=>{setAddFriendCode(e.target.value.toUpperCase());setAddFriendError("");setAddFriendSuccess(false);}} placeholder="e.g. GT-A1B2C3" autoFocus style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${addFriendError?t.red:addFriendSuccess?t.green:t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",textAlign:"center",fontFamily:"monospace",letterSpacing:2,boxSizing:"border-box",marginBottom:addFriendError||addFriendSuccess?6:12}}/>
              {addFriendError&&<div style={{padding:"6px 10px",background:t.redBg,borderRadius:6,fontSize:10,color:t.red,fontWeight:500,marginBottom:8}}>{addFriendError}</div>}
              {addFriendSuccess&&<div style={{padding:"6px 10px",background:t.greenBg,borderRadius:6,fontSize:10,color:t.green,fontWeight:500,marginBottom:8}}>Friend added successfully!</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setShowAddFriend(false);setAddFriendCode("");setAddFriendError("");setAddFriendSuccess(false);}} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button onClick={async()=>{if(!user||addFriendCode.trim().length<4)return;setAddFriendError("");setAddFriendSuccess(false);try{
                  const code=addFriendCode.trim();if(code===friendCode){setAddFriendError("That's your own code!");return;}
                  const {data:found,error:fErr}=await supabase.from("profiles").select("id,username").eq("friend_code",code).single();
                  if(fErr||!found){setAddFriendError("Friend code not found.");return;}
                  if(friends.some(f=>f.id===found.id)){setAddFriendError("Already friends!");return;}
                  const {error:i1}=await supabase.from("friendships").insert({user_id:user.id,friend_id:found.id});
                  if(i1){setAddFriendError("Failed to add friend.");return;}
                  await supabase.from("friendships").insert({user_id:found.id,friend_id:user.id});
                  setAddFriendSuccess(true);await loadFriends();setTimeout(()=>{setShowAddFriend(false);setAddFriendCode("");setAddFriendSuccess(false);},1200);
                }catch(e){setAddFriendError("Connection error. Try again.");}}} disabled={addFriendCode.trim().length<4} style={{flex:1,padding:12,borderRadius:10,border:"none",background:addFriendCode.trim().length>=4?t.accent:t.surfaceAlt,color:addFriendCode.trim().length>=4?"#fff":t.textFaint,fontWeight:700,fontSize:13,cursor:addFriendCode.trim().length>=4?"pointer":"not-allowed"}}>Add Friend</button>
              </div>
            </div>
          </div>}
          {friendsLoading&&<div style={{textAlign:"center",padding:20,color:t.textMuted,fontSize:11}}>Loading friends...</div>}
          {!friendsLoading&&friends.length===0&&<div style={{...card,padding:20,textAlign:"center"}}><div style={{fontSize:13,color:t.textMuted,marginBottom:4}}>No friends yet</div><div style={{fontSize:10,color:t.textFaint,lineHeight:1.5}}>Tap the + button above to add a friend using their code. Share your code from Settings → Friend Code.</div></div>}
          {(()=>{const f=friends[selFriend];if(!f)return null;
            const friendExSet=new Set(f.history.map(h=>h.exercise));
            const myFavsWithData=[...favoriteExercises].filter(ex=>friendExSet.has(ex)||getPR(history,ex)>0).sort();
            const friendOnlyExs=[...friendExSet].filter(ex=>!favoriteExercises.has(ex)).sort();
            const prExercises=[...myFavsWithData,...friendOnlyExs];
            return <React.Fragment>
            {/* PR Comparison — Favorites first */}
            <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>PR Comparison — You vs {f.name}</div>
            {myFavsWithData.length>0&&<div style={{fontSize:8,color:t.yellow,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>★ Your Favorites</div>}
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:myFavsWithData.length>0&&friendOnlyExs.length>0?4:14}}>{myFavsWithData.map(ex=>{const fPR=getPR(f.history,ex),myPR=getPR(history,ex),ahead=myPR>fPR;return <div key={ex} style={{...card,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:4,flex:1,minWidth:0,overflow:"hidden"}}><span style={{fontSize:12,color:t.yellow}}>★</span><span style={{fontSize:11,fontWeight:500,color:t.textDim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex}</span></div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,flexShrink:0}}><span style={{color:f.color,fontWeight:700}}>{fPR||"—"}</span><span style={{color:t.textFaint,fontSize:8}}>vs</span><span style={{color:t.green,fontWeight:700}}>{myPR||"—"}</span>{myPR>0&&fPR>0&&<div style={{fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:5,background:ahead?t.greenBg:t.redBg,color:ahead?t.green:t.red}}>{ahead?"▲":"▼"}{Math.abs(myPR-fPR)}</div>}</div></div>})}</div>
            {friendOnlyExs.length>0&&<><div style={{fontSize:8,color:f.color,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{f.name}'s Other Exercises</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>{friendOnlyExs.map(ex=>{const fPR=getPR(f.history,ex),myPR=getPR(history,ex),ahead=myPR>fPR;return <div key={ex} style={{...card,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:11,fontWeight:500,color:t.textDim,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex}</div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,flexShrink:0}}><span style={{color:f.color,fontWeight:700}}>{fPR}</span><span style={{color:t.textFaint,fontSize:8}}>vs</span><span style={{color:t.green,fontWeight:700}}>{myPR||"—"}</span>{myPR>0&&<div style={{fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:5,background:ahead?t.greenBg:t.redBg,color:ahead?t.green:t.red}}>{ahead?"▲":"▼"}{Math.abs(myPR-fPR)}</div>}</div></div>})}</div></>}

            {/* Compare Progress — Favorites / By Muscle toggle */}
            <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Compare Progress</div>
            <div style={{display:"flex",gap:3,marginBottom:8,background:t.surface,borderRadius:8,padding:2}}>
              <button onClick={()=>setFriendsCompareView("favorites")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",background:friendsCompareView==="favorites"?t.surfaceAlt:"transparent",color:friendsCompareView==="favorites"?t.yellow:t.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}}>★ Favorites</button>
              <button onClick={()=>setFriendsCompareView("muscle")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",background:friendsCompareView==="muscle"?t.surfaceAlt:"transparent",color:friendsCompareView==="muscle"?t.accent:t.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}}>By Muscle</button>
            </div>
            {friendsCompareView==="muscle"&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
              {MUSCLE_GROUPS.map(m=><button key={m} onClick={()=>setFriendsMuscleFilter(m)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:friendsMuscleFilter===m?`1px solid ${MC[m]}`:`1px solid ${t.border}`,background:friendsMuscleFilter===m?`${MC[m]}20`:"transparent",color:friendsMuscleFilter===m?MC[m]:t.textMuted}}>{m}</button>)}
            </div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>{(()=>{const friendDb={...fullExDB,...(f.customExercises||{})};(f.history||[]).forEach(h=>{if(h.muscle&&h.exercise&&!friendDb[h.exercise])friendDb[h.exercise]={muscle:h.muscle,rest:90};});const combinedNames=[...new Set([...Object.keys(fullExDB),...Object.keys(friendDb)])];const list=friendsCompareView==="favorites"?[...favoriteExercises].sort():combinedNames.filter(ex=>(friendDb[ex]?.muscle||fullExDB[ex]?.muscle)===friendsMuscleFilter).sort();return list.map(ex=><button key={ex} onClick={()=>setChartEx(ex)} style={pill(chartEx===ex,f.color)}>{ex}</button>);})()}</div>
            {(()=>{const fD=getCD(f.history,chartEx),mD=getCD(history,chartEx);const allD=[...new Set([...fD.map(d=>d.date),...mD.map(d=>d.date)])];const merged=allD.map(d=>({date:d,[f.name]:fD.find(x=>x.date===d)?.weight||null,You:mD.find(x=>x.date===d)?.weight||null}));if(!merged.length) return <div style={{textAlign:"center",padding:20,color:t.textFaint}}>No data for {chartEx}.</div>;
              return <div style={{...card,padding:"12px 4px 4px 0"}}><ResponsiveContainer width="100%" height={180}><LineChart data={merged}><CartesianGrid strokeDasharray="3 3" stroke={t.border}/><XAxis dataKey="date" tick={{fill:t.textMuted,fontSize:9}} axisLine={{stroke:t.border}}/><YAxis tick={{fill:t.textMuted,fontSize:9}} axisLine={{stroke:t.border}} domain={["dataMin-10","dataMax+10"]}/><Tooltip contentStyle={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,fontSize:11,color:t.text}}/><Line type="monotone" dataKey={f.name} stroke={f.color} strokeWidth={2} dot={{fill:f.color,r:3}} connectNulls/><Line type="monotone" dataKey="You" stroke={t.green} strokeWidth={2} dot={{fill:t.green,r:3}} connectNulls/></LineChart></ResponsiveContainer><div style={{display:"flex",justifyContent:"center",gap:14,paddingBottom:4}}><div style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}><div style={{width:10,height:3,borderRadius:2,background:f.color}}/><span style={{color:t.textSec}}>{f.name}</span></div><div style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}><div style={{width:10,height:3,borderRadius:2,background:t.green}}/><span style={{color:t.textSec}}>You</span></div></div></div>
            })()}
          </React.Fragment>})()}
        </div>}
      </div>

      {/* Workout Summary Modal */}
      {workoutSummary&&<div style={{position:"fixed",inset:0,background:t.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setWorkoutSummary(null)}>
        <div style={{background:`linear-gradient(135deg,${t.surface},${t.bg})`,borderRadius:16,border:`1px solid ${getProgColor(workoutSummary.program)}40`,padding:"20px 18px",maxWidth:360,width:"100%",maxHeight:"70vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:28,marginBottom:4}}>&#128170;</div>
            <div style={{fontSize:18,fontWeight:800,color:t.text}}>Workout Complete</div>
            <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{workoutSummary.split} — {workoutSummary.date}</div>
            <div style={{fontSize:9,color:getProgColor(workoutSummary.program),fontWeight:600,marginTop:2}}>{workoutSummary.program}</div>
            {workoutSummary.duration>0&&<div style={{fontSize:10,color:t.textSec,marginTop:4}}>Duration: {fc(workoutSummary.duration)}</div>}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {[{l:"Exercises",v:workoutSummary.entries.length,c:t.accent},{l:"Top Lift",v:workoutSummary.topLift?`${workoutSummary.topLift.weight}lbs`:"—",c:t.yellow},{l:"Total Sets",v:workoutSummary.entries.reduce((a,e)=>a+e.sets,0),c:t.green}].map(s=><div key={s.l} style={{flex:1,...card,padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:t.textFaint,fontWeight:500}}>{s.l}</div></div>)}
          </div>
          <div style={{marginBottom:14}}>
            {workoutSummary.entries.map((h,i)=><div key={i} style={{padding:"6px 0",borderTop:i>0?`1px solid ${t.borderLight}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:t.textDim}}>{h.exercise}</span>
                <div style={{display:"flex",gap:8,fontSize:11}}>
                  <span style={{color:t.orange,fontWeight:700}}>{h.weight}lbs</span>
                  <span style={{color:t.textSec}}>{h.sets}x{h.reps}</span>
                </div>
              </div>
              {renderSetBadges(h.setDetails)}
            </div>)}
          </div>
          {workoutSummary.topLift&&<div style={{padding:"8px 10px",background:t.yellowBg,borderRadius:8,display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:14}}>&#127942;</span><span style={{fontSize:11,color:t.yellow,fontWeight:600}}>Top: {workoutSummary.topLift.exercise} — {workoutSummary.topLift.weight}lbs</span></div>}
          <button onClick={()=>setWorkoutSummary(null)} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:`linear-gradient(135deg,${getProgColor(workoutSummary.program)},${getProgColor(workoutSummary.program)}cc)`,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Done</button>
        </div>
      </div>}

      {/* Settings Panel */}
      {showSettings&&<div style={{position:"fixed",inset:0,background:t.overlay,display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}} onClick={()=>setShowSettings(false)}>
        <div style={{background:t.surface,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",padding:"0 0 20px"}} onClick={e=>e.stopPropagation()}>
          {/* Handle bar */}
          <div style={{display:"flex",justifyContent:"center",padding:"10px 0 6px"}}><div style={{width:36,height:4,borderRadius:2,background:t.border}}/></div>

          {/* Settings header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 18px 14px"}}>
            <div style={{fontSize:17,fontWeight:700,color:t.text}}>Settings</div>
            <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:18}}>×</button>
          </div>

          {/* Settings tabs */}
          <div style={{display:"flex",gap:2,margin:"0 18px 16px",background:t.bg,borderRadius:8,padding:2}}>
            {[{id:"profile",l:"Profile"},{id:"friends",l:"Friend Code"},{id:"appearance",l:"Appearance"},{id:"data",l:"Data"}].map(tb=>(
              <button key={tb.id} onClick={()=>setSettingsTab(tb.id)} style={{flex:1,padding:"7px 0",borderRadius:6,border:"none",background:settingsTab===tb.id?t.surfaceAlt:"transparent",color:settingsTab===tb.id?t.text:t.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}}>{tb.l}</button>
            ))}
          </div>

          <div style={{padding:"0 18px"}}>
            {/* Profile */}
            {settingsTab==="profile"&&<div>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your Profile</div>
              <div style={{...card,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${t.accent},${t.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0}}>{profileName?profileName[0].toUpperCase():"?"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:8,color:t.textMuted,fontWeight:600,marginBottom:4}}>NAME / NICKNAME</div>
                    <div style={{display:"flex",gap:6}}>
                      <input value={profileDraft} onChange={e=>{setProfileDraft(e.target.value);setNameConfirmed(false);}} placeholder="Enter your name..." style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${t.border}`,background:t.inputBg,color:t.text,fontSize:16,outline:"none",boxSizing:"border-box"}}/>
                      <button onClick={()=>{if(profileDraft.trim()){const name=profileDraft.trim();setProfileName(name);setNameConfirmed(true);setTimeout(()=>setNameConfirmed(false),2000);if(user)supabase.from("profiles").update({username:name}).eq("id",user.id).then(()=>{});}}} style={{padding:"8px 12px",borderRadius:8,border:nameConfirmed?`1px solid ${t.green}40`:`1px solid ${t.border}`,background:nameConfirmed?t.greenBg:"transparent",color:nameConfirmed?t.green:t.accent,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>{nameConfirmed?"✓ Saved":"Save"}</button>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:10,color:t.textFaint,lineHeight:1.5}}>Your name is shown in the header and will be visible to friends once syncing is enabled.</div>
              </div>
            </div>}

            {/* Friend Code */}
            {settingsTab==="friends"&&<div>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your Friend Code</div>
              <div style={{...card,padding:14,textAlign:"center"}}>
                <div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginBottom:8}}>SHARE THIS CODE WITH FRIENDS</div>
                <div style={{fontSize:28,fontWeight:800,color:t.accent,letterSpacing:3,marginBottom:10,fontFamily:"monospace"}}>{friendCode}</div>
                <button onClick={()=>{navigator.clipboard.writeText(friendCode).then(()=>{setCodeCopied(true);setTimeout(()=>setCodeCopied(false),2000);});}} style={{padding:"8px 20px",borderRadius:8,border:codeCopied?`1px solid ${t.green}40`:`1px solid ${t.accent}40`,background:codeCopied?t.greenBg:t.accentBg,color:codeCopied?t.green:t.accent,fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.2s"}}>{codeCopied?"✓ Copied!":"Copy Code"}</button>
              </div>
              <div style={{...card,padding:12,marginTop:10}}>
                <div style={{fontSize:10,color:t.textFaint,lineHeight:1.6}}>Friends enter your code to sync workouts and compare progress.</div>
              </div>
              <div style={{marginTop:14}}>
                <button onClick={()=>{setShowSettings(false);setTab("friends");setShowAddFriend(true);}} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${t.accent}40`,background:t.accentBg,color:t.accent,fontWeight:600,fontSize:12,cursor:"pointer"}}>+ Add a Friend</button>
              </div>
            </div>}

            {/* Appearance */}
            {settingsTab==="appearance"&&<div>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Theme</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {id:"dark",l:"Carbon Steel",desc:"Deep blacks and metallic grays",colors:["#0a0a0a","#1c1c1e","#38383a","#818cf8"]},
                  {id:"light",l:"Concrete",desc:"Clean whites and soft grays",colors:["#f2f2f7","#ffffff","#c6c6c8","#5856d6"]},
                  {id:"auto",l:"Auto",desc:"Match your device settings",colors:null},
                ].map(th=>(
                  <button key={th.id} onClick={()=>setAppearance(th.id)} style={{...(appearance===th.id?cardWithLeft(t.accent):card),padding:"12px 14px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,background:appearance===th.id?t.accentBg:t.surface}}>
                    {th.colors?<div style={{display:"flex",gap:2,flexShrink:0}}>{th.colors.map((c,i)=><div key={i} style={{width:14,height:14,borderRadius:4,background:c,border:`1px solid ${t.borderLight}`}}/>)}</div>:<span style={{fontSize:18}}>&#128260;</span>}
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:appearance===th.id?t.text:t.textSec}}>{th.l}</div>
                      <div style={{fontSize:10,color:t.textFaint}}>{th.desc}</div>
                    </div>
                    {appearance===th.id&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ))}
              </div>
            </div>}

            {/* Data */}
            {settingsTab==="data"&&<div>
              <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Import / Export</div>
              <div style={{...card,padding:14}}>
                <div style={{fontSize:12,fontWeight:600,color:t.text,marginBottom:4}}>Export Programs</div>
                <div style={{fontSize:10,color:t.textFaint,marginBottom:10,lineHeight:1.5}}>Download all your programs as a JSON file. Share with friends or use as backup.</div>
                <button onClick={exportPrograms} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${t.accent}40`,background:t.accentBg,color:t.accent,fontWeight:600,fontSize:12,cursor:"pointer"}}>Export Programs (.json)</button>
              </div>
              <div style={{...card,padding:14,marginTop:10}}>
                <div style={{fontSize:12,fontWeight:600,color:t.text,marginBottom:4}}>Import Programs</div>
                <div style={{fontSize:10,color:t.textFaint,marginBottom:10,lineHeight:1.5}}>Load programs from a JSON file. Imported programs will be added alongside existing ones.</div>
                <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{display:"none"}}/>
                <button onClick={()=>importRef.current?.click()} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${t.green}40`,background:t.greenBg,color:t.green,fontWeight:600,fontSize:12,cursor:"pointer"}}>Import Programs (.json)</button>
              </div>
              {user&&<div style={{marginTop:20}}>
                <div style={{fontSize:10,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Account</div>
                <div style={{...card,padding:14}}>
                  <div style={{fontSize:10,color:t.textFaint,marginBottom:8}}>Signed in as {user.email}</div>
                  <button onClick={()=>{setShowSettings(false);if(signOut)signOut();}} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${t.red}40`,background:t.redBg,color:t.red,fontWeight:600,fontSize:12,cursor:"pointer"}}>Sign Out</button>
                </div>
              </div>}
            </div>}
          </div>
        </div>
      </div>}

      {/* Import Preview Modal */}
      {importPreview&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setImportPreview(null);setImportSelected(new Set());setImportError("");}}>
        <div style={{...card,padding:0,width:"100%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${t.border}`}}>
            <div style={{fontSize:15,fontWeight:700,color:t.text}}>Import Programs</div>
            <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{importPreview.length} program{importPreview.length!==1?"s":""} found — select which to import</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:12}}>
            {importPreview.map((prog,i)=><div key={i} onClick={()=>toggleImportItem(i)} style={{...card,padding:12,marginBottom:8,cursor:"pointer",opacity:importSelected.has(i)?1:0.4,transition:"opacity .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${importSelected.has(i)?t.accent:t.border}`,background:importSelected.has(i)?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                  {importSelected.has(i)&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{prog.name||"Unnamed Program"}</div>
                  {prog.splits&&prog.splits.length>0&&<div style={{fontSize:10,color:t.textMuted,marginTop:3,display:"flex",flexWrap:"wrap",gap:4}}>
                    {prog.splits.map((s,si)=><span key={si} style={{background:t.surfaceAlt,padding:"2px 6px",borderRadius:4}}>{s.name||"Split "+(si+1)} · {s.exercises?.length||0} ex</span>)}
                  </div>}
                </div>
              </div>
            </div>)}
            {importError&&<div style={{padding:"8px 10px",background:t.redBg,borderRadius:8,border:`1px solid ${t.red}30`,fontSize:11,color:t.red,fontWeight:500,marginTop:4}}>{importError}</div>}
          </div>
          <div style={{padding:12,borderTop:`1px solid ${t.border}`,display:"flex",gap:8}}>
            <button onClick={()=>{setImportPreview(null);setImportSelected(new Set());setImportError("");}} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.textSec,fontWeight:600,fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={confirmImport} disabled={importSelected.size===0} style={{flex:1,padding:10,borderRadius:8,border:"none",background:importSelected.size>0?`linear-gradient(135deg,${t.accent},${t.accentDark})`:`${t.accent}40`,color:"#fff",fontWeight:600,fontSize:12,cursor:importSelected.size>0?"pointer":"default",opacity:importSelected.size>0?1:0.5}}>Import {importSelected.size>0?`(${importSelected.size})`:""}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
