export const toLocalISO = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

export const fc = (s) => {
  const a = Math.abs(s);
  return `${Math.floor(a/60)}:${(a%60).toString().padStart(2,"0")}`;
};

export const fcSigned = (s) => s >= 0 ? fc(s) : `+${fc(s)}`;

export const getSunday = (d) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  dt.setHours(0,0,0,0);
  return dt;
};

export const getPR = (hist, ex) => {
  const e = hist.filter(h => h.exercise === ex);
  return e.length ? Math.max(...e.map(x => x.weight)) : 0;
};

export const getCD = (hist, ex) => hist.filter(h => h.exercise === ex).map(h => ({date: h.date, weight: h.weight}));

export const genFriendCode = () =>
  "GT-" + Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(36).toUpperCase()).join("").slice(0,6).padEnd(6,"X");
