import { useState, useEffect, useCallback } from "react";

// ─── 定数 ───────────────────────────────────────────
// 気象庁API 鹿児島県 offices=460000、鹿児島市 class20s=4620100
const JMA_WARNING_URL = "https://www.jma.go.jp/bosai/warning/data/warning/460000.json";
const KAGOSHIMA_CITY_CODE = "4620100";

// ─── 警報コード → 表示名 ────────────────────────────
const WARNING_NAMES = {
  "1":  { name: "大雨特別警報",   level: "special", color: "#b71c1c" },
  "2":  { name: "洪水特別警報",   level: "special", color: "#b71c1c" },
  "3":  { name: "暴風特別警報",   level: "special", color: "#b71c1c" },
  "4":  { name: "暴風雪特別警報", level: "special", color: "#b71c1c" },
  "5":  { name: "大雪特別警報",   level: "special", color: "#b71c1c" },
  "6":  { name: "波浪特別警報",   level: "special", color: "#b71c1c" },
  "7":  { name: "高潮特別警報",   level: "special", color: "#b71c1c" },
  "10": { name: "大雨警報",       level: "warning", color: "#e53935" },
  "11": { name: "洪水警報",       level: "warning", color: "#e53935" },
  "12": { name: "暴風警報",       level: "warning", color: "#e53935" },
  "13": { name: "暴風雪警報",     level: "warning", color: "#e53935" },
  "14": { name: "大雪警報",       level: "warning", color: "#e53935" },
  "15": { name: "波浪警報",       level: "warning", color: "#e53935" },
  "16": { name: "高潮警報",       level: "warning", color: "#e53935" },
  "17": { name: "雷注意報",       level: "advisory", color: "#f57c00" },
  "18": { name: "強風注意報",     level: "advisory", color: "#f57c00" },
  "19": { name: "風雪注意報",     level: "advisory", color: "#f57c00" },
  "20": { name: "大雪注意報",     level: "advisory", color: "#f57c00" },
  "21": { name: "波浪注意報",     level: "advisory", color: "#f57c00" },
  "22": { name: "高潮注意報",     level: "advisory", color: "#f57c00" },
  "23": { name: "濃霧注意報",     level: "advisory", color: "#f57c00" },
  "24": { name: "乾燥注意報",     level: "advisory", color: "#f57c00" },
  "25": { name: "なだれ注意報",   level: "advisory", color: "#f57c00" },
  "26": { name: "低温注意報",     level: "advisory", color: "#f57c00" },
  "27": { name: "霜注意報",       level: "advisory", color: "#f57c00" },
  "28": { name: "着氷注意報",     level: "advisory", color: "#f57c00" },
  "29": { name: "着雪注意報",     level: "advisory", color: "#f57c00" },
  "30": { name: "大雨注意報",     level: "advisory", color: "#f57c00" },
  "33": { name: "洪水注意報",     level: "advisory", color: "#f57c00" },
};

// ─── 固定背景 ────────────────────────────────────────
const BG = "linear-gradient(170deg,#0a1628 0%,#0e2140 50%,#0a1a30 100%)";

// ─── ユーティリティ ──────────────────────────────────
const pad   = n => String(n).padStart(2, "0");
const toMin = (h, m) => h * 60 + m;

function getNextTrains(trains, nowMin, count = 5) {
  const remaining = trains.filter(t => toMin(t.h, t.m) >= nowMin);
  return remaining.slice(0, count);
}

const isHoliday = d => d.getDay() === 0 || d.getDay() === 6;

const DEST_C = {
  "鹿児島中央":"#c62828","鹿児島":"#b71c1c","山川":"#1565c0",
  "指宿":"#0d47a1","枕崎":"#003a7a","喜入":"#0277bd",
  "慈眼寺":"#0288d1","五位野":"#039be5",
};
const destBg = d => DEST_C[d] || "#546e7a";

// ─── 時刻表データ ────────────────────────────────────
const TT = {
  weekday: {
    up: [
      {h:5,m:42,dest:"鹿児島中央",type:"普通"},{h:6,m:6,dest:"鹿児島中央",type:"普通"},
      {h:6,m:40,dest:"鹿児島中央",type:"普通"},{h:7,m:1,dest:"鹿児島中央",type:"普通"},
      {h:7,m:22,dest:"鹿児島中央",type:"普通"},{h:7,m:39,dest:"鹿児島中央",type:"普通"},
      {h:7,m:59,dest:"鹿児島中央",type:"普通"},{h:8,m:14,dest:"鹿児島中央",type:"普通"},
      {h:8,m:30,dest:"鹿児島中央",type:"普通"},{h:8,m:44,dest:"鹿児島中央",type:"普通"},
      {h:9,m:1,dest:"鹿児島中央",type:"快速"},{h:9,m:23,dest:"鹿児島中央",type:"普通"},
      {h:9,m:40,dest:"鹿児島中央",type:"普通"},{h:10,m:11,dest:"鹿児島中央",type:"普通"},
      {h:10,m:28,dest:"鹿児島中央",type:"快速"},{h:10,m:54,dest:"鹿児島中央",type:"普通"},
      {h:11,m:22,dest:"鹿児島中央",type:"普通"},{h:12,m:11,dest:"鹿児島中央",type:"普通"},
      {h:12,m:46,dest:"鹿児島中央",type:"普通"},{h:13,m:9,dest:"鹿児島中央",type:"普通"},
      {h:13,m:23,dest:"鹿児島中央",type:"普通"},{h:14,m:12,dest:"鹿児島中央",type:"普通"},
      {h:14,m:54,dest:"鹿児島中央",type:"普通"},{h:15,m:14,dest:"鹿児島中央",type:"普通"},
      {h:15,m:23,dest:"鹿児島中央",type:"普通"},{h:15,m:43,dest:"鹿児島中央",type:"普通"},
      {h:16,m:3,dest:"鹿児島中央",type:"普通"},{h:16,m:24,dest:"鹿児島中央",type:"普通"},
      {h:16,m:45,dest:"鹿児島",type:"普通"},{h:17,m:3,dest:"鹿児島中央",type:"普通"},
      {h:17,m:18,dest:"鹿児島中央",type:"普通"},{h:17,m:37,dest:"鹿児島中央",type:"快速"},
      {h:17,m:56,dest:"鹿児島中央",type:"普通"},{h:18,m:15,dest:"鹿児島中央",type:"普通"},
      {h:18,m:35,dest:"鹿児島中央",type:"普通"},{h:18,m:54,dest:"鹿児島中央",type:"普通"},
      {h:19,m:12,dest:"鹿児島中央",type:"普通"},{h:19,m:32,dest:"鹿児島",type:"普通"},
      {h:20,m:7,dest:"鹿児島中央",type:"普通"},{h:20,m:46,dest:"鹿児島中央",type:"普通"},
      {h:21,m:4,dest:"鹿児島中央",type:"普通"},{h:21,m:53,dest:"鹿児島中央",type:"普通"},
      {h:22,m:11,dest:"鹿児島中央",type:"普通"},{h:22,m:35,dest:"鹿児島中央",type:"普通"},
      {h:22,m:54,dest:"鹿児島中央",type:"普通"},{h:23,m:42,dest:"鹿児島中央",type:"普通"},
    ],
    down: [
      {h:4,m:52,dest:"山川",type:"普通"},{h:5,m:29,dest:"喜入",type:"普通"},
      {h:5,m:55,dest:"喜入",type:"普通"},{h:6,m:4,dest:"喜入",type:"普通"},
      {h:6,m:25,dest:"山川",type:"普通"},{h:6,m:40,dest:"喜入",type:"普通"},
      {h:7,m:1,dest:"山川",type:"普通"},{h:7,m:22,dest:"喜入",type:"普通"},
      {h:7,m:39,dest:"喜入",type:"普通"},{h:7,m:59,dest:"指宿",type:"快速"},
      {h:8,m:14,dest:"喜入",type:"普通"},{h:8,m:30,dest:"喜入",type:"普通"},
      {h:8,m:44,dest:"山川",type:"普通"},{h:9,m:1,dest:"喜入",type:"普通"},
      {h:9,m:23,dest:"山川",type:"普通"},{h:10,m:11,dest:"枕崎",type:"普通"},
      {h:10,m:41,dest:"喜入",type:"普通"},{h:11,m:8,dest:"山川",type:"普通"},
      {h:11,m:44,dest:"喜入",type:"普通"},{h:12,m:11,dest:"枕崎",type:"普通"},
      {h:12,m:46,dest:"喜入",type:"普通"},{h:13,m:9,dest:"指宿",type:"普通"},
      {h:13,m:44,dest:"喜入",type:"普通"},{h:14,m:12,dest:"山川",type:"普通"},
      {h:14,m:41,dest:"喜入",type:"普通"},{h:15,m:8,dest:"山川",type:"普通"},
      {h:15,m:14,dest:"喜入",type:"普通"},{h:15,m:23,dest:"喜入",type:"普通"},
      {h:15,m:43,dest:"山川",type:"快速"},{h:16,m:3,dest:"喜入",type:"普通"},
      {h:16,m:8,dest:"枕崎",type:"普通"},{h:16,m:24,dest:"喜入",type:"普通"},
      {h:16,m:45,dest:"慈眼寺",type:"普通"},{h:17,m:3,dest:"喜入",type:"普通"},
      {h:17,m:18,dest:"指宿",type:"普通"},{h:17,m:37,dest:"喜入",type:"普通"},
      {h:17,m:57,dest:"山川",type:"快速"},{h:18,m:15,dest:"指宿",type:"普通"},
      {h:18,m:35,dest:"喜入",type:"普通"},{h:18,m:54,dest:"指宿",type:"快速"},
      {h:19,m:12,dest:"山川",type:"普通"},{h:19,m:32,dest:"喜入",type:"普通"},
      {h:20,m:7,dest:"山川",type:"普通"},{h:20,m:27,dest:"喜入",type:"普通"},
      {h:21,m:17,dest:"指宿",type:"普通"},{h:21,m:53,dest:"五位野",type:"普通"},
      {h:22,m:35,dest:"山川",type:"普通"},{h:23,m:7,dest:"喜入",type:"普通"},
      {h:23,m:42,dest:"五位野",type:"普通"},
    ],
  },
  holiday: {
    up: [
      {h:5,m:42,dest:"鹿児島中央",type:"普通"},{h:6,m:40,dest:"鹿児島中央",type:"普通"},
      {h:7,m:1,dest:"鹿児島中央",type:"普通"},{h:7,m:22,dest:"鹿児島中央",type:"普通"},
      {h:7,m:39,dest:"鹿児島中央",type:"普通"},{h:7,m:59,dest:"鹿児島中央",type:"普通"},
      {h:8,m:19,dest:"鹿児島中央",type:"普通"},{h:8,m:44,dest:"鹿児島中央",type:"普通"},
      {h:9,m:1,dest:"鹿児島中央",type:"快速"},{h:9,m:23,dest:"鹿児島中央",type:"普通"},
      {h:9,m:40,dest:"鹿児島中央",type:"普通"},{h:10,m:11,dest:"鹿児島中央",type:"普通"},
      {h:10,m:28,dest:"鹿児島中央",type:"快速"},{h:10,m:54,dest:"鹿児島中央",type:"普通"},
      {h:11,m:22,dest:"鹿児島中央",type:"普通"},{h:12,m:11,dest:"鹿児島中央",type:"普通"},
      {h:12,m:46,dest:"鹿児島中央",type:"普通"},{h:13,m:9,dest:"鹿児島中央",type:"普通"},
      {h:13,m:23,dest:"鹿児島中央",type:"普通"},{h:14,m:12,dest:"鹿児島中央",type:"普通"},
      {h:14,m:54,dest:"鹿児島中央",type:"普通"},{h:15,m:23,dest:"鹿児島中央",type:"普通"},
      {h:15,m:43,dest:"鹿児島中央",type:"普通"},{h:16,m:24,dest:"鹿児島中央",type:"普通"},
      {h:16,m:45,dest:"鹿児島",type:"普通"},{h:17,m:3,dest:"鹿児島中央",type:"普通"},
      {h:17,m:18,dest:"鹿児島中央",type:"普通"},{h:17,m:37,dest:"鹿児島中央",type:"快速"},
      {h:17,m:56,dest:"鹿児島中央",type:"普通"},{h:18,m:15,dest:"鹿児島中央",type:"普通"},
      {h:18,m:35,dest:"鹿児島中央",type:"普通"},{h:18,m:54,dest:"鹿児島中央",type:"普通"},
      {h:19,m:12,dest:"鹿児島中央",type:"普通"},{h:19,m:32,dest:"鹿児島",type:"普通"},
      {h:20,m:7,dest:"鹿児島中央",type:"普通"},{h:20,m:46,dest:"鹿児島中央",type:"普通"},
      {h:21,m:4,dest:"鹿児島中央",type:"普通"},{h:21,m:53,dest:"鹿児島中央",type:"普通"},
      {h:22,m:11,dest:"鹿児島中央",type:"普通"},{h:22,m:35,dest:"鹿児島中央",type:"普通"},
      {h:22,m:54,dest:"鹿児島中央",type:"普通"},{h:23,m:42,dest:"鹿児島中央",type:"普通"},
    ],
    down: [
      {h:4,m:52,dest:"山川",type:"普通"},{h:5,m:29,dest:"喜入",type:"普通"},
      {h:6,m:4,dest:"喜入",type:"普通"},{h:6,m:25,dest:"山川",type:"普通"},
      {h:6,m:40,dest:"喜入",type:"普通"},{h:7,m:1,dest:"山川",type:"普通"},
      {h:7,m:39,dest:"喜入",type:"普通"},{h:7,m:59,dest:"指宿",type:"快速"},
      {h:8,m:19,dest:"喜入",type:"普通"},{h:8,m:44,dest:"山川",type:"普通"},
      {h:9,m:1,dest:"喜入",type:"普通"},{h:9,m:23,dest:"山川",type:"普通"},
      {h:10,m:11,dest:"枕崎",type:"普通"},{h:10,m:41,dest:"喜入",type:"普通"},
      {h:11,m:8,dest:"山川",type:"普通"},{h:11,m:44,dest:"喜入",type:"普通"},
      {h:12,m:11,dest:"枕崎",type:"普通"},{h:12,m:46,dest:"喜入",type:"普通"},
      {h:13,m:9,dest:"指宿",type:"普通"},{h:13,m:44,dest:"喜入",type:"普通"},
      {h:14,m:12,dest:"山川",type:"普通"},{h:14,m:41,dest:"喜入",type:"普通"},
      {h:15,m:8,dest:"山川",type:"普通"},{h:15,m:23,dest:"喜入",type:"普通"},
      {h:15,m:43,dest:"山川",type:"快速"},{h:16,m:8,dest:"枕崎",type:"普通"},
      {h:16,m:24,dest:"喜入",type:"普通"},{h:16,m:45,dest:"慈眼寺",type:"普通"},
      {h:17,m:3,dest:"喜入",type:"普通"},{h:17,m:18,dest:"指宿",type:"普通"},
      {h:17,m:37,dest:"喜入",type:"普通"},{h:17,m:57,dest:"山川",type:"快速"},
      {h:18,m:15,dest:"指宿",type:"普通"},{h:18,m:35,dest:"喜入",type:"普通"},
      {h:18,m:54,dest:"指宿",type:"快速"},{h:19,m:12,dest:"山川",type:"普通"},
      {h:19,m:32,dest:"喜入",type:"普通"},{h:20,m:7,dest:"山川",type:"普通"},
      {h:20,m:27,dest:"喜入",type:"普通"},{h:21,m:17,dest:"指宿",type:"普通"},
      {h:21,m:53,dest:"五位野",type:"普通"},{h:22,m:35,dest:"山川",type:"普通"},
      {h:23,m:7,dest:"喜入",type:"普通"},{h:23,m:42,dest:"五位野",type:"普通"},
    ],
  },
};

// ════════════════════════════════════════════════════
//  メインアプリ
// ════════════════════════════════════════════════════
export default function App() {
  const [now,        setNow]        = useState(new Date());
  const [alerts,     setAlerts]     = useState([]);
  const [infoUpdated,setInfoUpdated]= useState(null);
  const [delays,     setDelays]     = useState({ up: 0, down: 0 });
  const [portrait,   setPortrait]   = useState(
    typeof window !== "undefined" ? window.innerHeight > window.innerWidth : false
  );

  // 時計（10秒毎）
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  // 向き検知
  useEffect(() => {
    const h = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── 警報・注意報取得（気象庁・5分毎）───────────────
  const fetchWarnings = useCallback(async () => {
    try {
      const res  = await fetch(JMA_WARNING_URL);
      const data = await res.json();
      const areaType1 = (data.areaTypes || []).find(a =>
        (a.areas || []).some(ar => String(ar.code) === KAGOSHIMA_CITY_CODE)
      );
      const area = areaType1?.areas?.find(a => String(a.code) === KAGOSHIMA_CITY_CODE);
      const active = [];
      if (area?.warnings) {
        area.warnings.forEach(w => {
          if (w.status === "発表" || w.status === "継続") {
            const info = WARNING_NAMES[String(w.code)];
            if (info) active.push(info);
          }
        });
      }
      const levelOrder = { special: 0, warning: 1, advisory: 2 };
      active.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
      setAlerts(active);
      setInfoUpdated(new Date());
    } catch { /* 失敗時は非表示のまま */ }
  }, []);

  useEffect(() => {
    fetchWarnings();
    const id = setInterval(fetchWarnings, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWarnings]);

  const holiday    = isHoliday(now);
  const dayKey     = holiday ? "holiday" : "weekday";
  const nowMin     = now.getHours() * 60 + now.getMinutes();
  const upTrains   = getNextTrains(TT[dayKey].up,   nowMin);
  const dnTrains   = getNextTrains(TT[dayKey].down, nowMin);
  const hasDelay   = delays.up > 0 || delays.down > 0;
  const hasSpecial = alerts.some(a => a.level === "special");
  const hasWarning = alerts.some(a => a.level === "warning");
  const timeStr    = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dateStr    = now.toLocaleDateString("ja-JP", { month:"long", day:"numeric", weekday:"short" });
  const updStr     = infoUpdated
    ? `${pad(infoUpdated.getHours())}:${pad(infoUpdated.getMinutes())} 更新`
    : "";

  return (
    <div style={{
      minHeight: "100dvh",
      background: BG,
      color: "#f0f6ff",
      fontFamily: "'Noto Sans JP','Hiragino Sans',sans-serif",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Share+Tech+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes alertPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,50,50,.4)}70%{box-shadow:0 0 0 8px rgba(255,50,50,0)}}
        .fadeUp{animation:fadeUp .32s cubic-bezier(.22,1,.36,1) both}
        .trainRow{transition:filter .15s}
        .trainRow:hover{filter:brightness(1.1)}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
      `}</style>

      <div style={{
        position:"relative", zIndex:1,
        flex:1, display:"flex", flexDirection:"column",
        padding: portrait ? "14px 13px 10px" : "12px 18px 8px",
        gap: portrait ? 8 : 7,
        maxWidth: portrait ? "100%" : 1100,
        margin: "0 auto", width: "100%",
      }}>

        {/* ══ 縦持ち：ヘッダー（時刻左・駅名右） ══ */}
        {portrait && (
          <div style={{
            display:"flex", flexDirection:"row",
            alignItems:"center", justifyContent:"space-between",
            gap:12, position:"relative",
          }}>
            {/* 時刻（左） */}
            <div style={{
              display:"flex", alignItems:"center", gap:7, flexShrink:0,
              fontFamily:"'Share Tech Mono',monospace",
              fontSize:46, lineHeight:1, letterSpacing:".05em",
              textShadow:"0 2px 24px rgba(0,0,0,.7)",
            }}>
              <div style={{
                width:7, height:7, borderRadius:"50%",
                background:"#4caf50", boxShadow:"0 0 10px #4caf50",
                animation:"pulse 1.8s ease-in-out infinite", flexShrink:0,
              }}/>
              {timeStr}
            </div>
            {/* 駅名（右） */}
            <div style={{ flexShrink:0, textAlign:"right" }}>
              <div style={{ fontSize:10, letterSpacing:".18em", opacity:.5,
                fontFamily:"'Share Tech Mono',monospace", marginBottom:2, whiteSpace:"nowrap" }}>
                JR 指宿枕崎線
              </div>
              <div style={{ fontSize:22, fontWeight:700, letterSpacing:".04em",
                textShadow:"0 2px 14px rgba(0,0,0,.5)", lineHeight:1.1, whiteSpace:"nowrap" }}>
                南鹿児島駅
              </div>
              <div style={{ marginTop:4, display:"flex", alignItems:"center",
                justifyContent:"flex-end", gap:8, flexWrap:"nowrap" }}>
                <span style={{ fontSize:11, opacity:.5, letterSpacing:".06em", whiteSpace:"nowrap" }}>
                  {dateStr}
                </span>
                <span style={{
                  fontSize:10, fontWeight:700, letterSpacing:".08em",
                  padding:"2px 9px", borderRadius:5, whiteSpace:"nowrap",
                  background: holiday ? "rgba(255,100,80,.28)" : "rgba(80,200,130,.22)",
                  border: `1px solid ${holiday ? "rgba(255,100,80,.38)" : "rgba(80,200,130,.32)"}`,
                }}>{holiday ? "土日祝ダイヤ" : "平日ダイヤ"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ 横持ち：上段（駅名右・時刻中央） ══ */}
        {!portrait && (
          <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
            {/* 時刻：中央上部に大きく */}
            <div style={{
              position:"absolute", left:0, right:0,
              display:"flex", justifyContent:"center", alignItems:"center",
              gap:10, pointerEvents:"none",
              fontFamily:"'Share Tech Mono',monospace",
              fontSize:64, lineHeight:1, letterSpacing:".05em",
              textShadow:"0 2px 24px rgba(0,0,0,.7)",
            }}>
              <div style={{
                width:9, height:9, borderRadius:"50%",
                background:"#4caf50", boxShadow:"0 0 10px #4caf50",
                animation:"pulse 1.8s ease-in-out infinite", flexShrink:0,
              }}/>
              {timeStr}
            </div>
            {/* 駅名：右端 */}
            <div style={{ marginLeft:"auto", flexShrink:0, textAlign:"right" }}>
              <div style={{ fontSize:10, letterSpacing:".18em", opacity:.5,
                fontFamily:"'Share Tech Mono',monospace", marginBottom:2, whiteSpace:"nowrap" }}>
                JR 指宿枕崎線
              </div>
              <div style={{ fontSize:20, fontWeight:700, letterSpacing:".04em",
                textShadow:"0 2px 14px rgba(0,0,0,.5)", lineHeight:1.1, whiteSpace:"nowrap" }}>
                南鹿児島駅
              </div>
              <div style={{ marginTop:4, display:"flex", alignItems:"center",
                justifyContent:"flex-end", gap:8, flexWrap:"nowrap" }}>
                <span style={{ fontSize:11, opacity:.5, letterSpacing:".06em", whiteSpace:"nowrap" }}>
                  {dateStr}
                </span>
                <span style={{
                  fontSize:10, fontWeight:700, letterSpacing:".08em",
                  padding:"2px 9px", borderRadius:5, whiteSpace:"nowrap",
                  background: holiday ? "rgba(255,100,80,.28)" : "rgba(80,200,130,.22)",
                  border: `1px solid ${holiday ? "rgba(255,100,80,.38)" : "rgba(80,200,130,.32)"}`,
                }}>{holiday ? "土日祝ダイヤ" : "平日ダイヤ"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ 警報・注意報バナー ══ */}
        <AlertBanner
          alerts={alerts} updStr={updStr}
          hasSpecial={hasSpecial} hasWarning={hasWarning}
        />

        {/* ══ 遅延表示 ══ */}
        {hasDelay && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:7,
            padding:"5px 12px", borderRadius:8,
            background:"rgba(255,80,40,.25)",
            border:"1px solid rgba(255,80,40,.38)",
            fontSize:12, fontWeight:600, letterSpacing:".05em",
          }}>
            <span>⚠️</span>
            <span>遅延　上り +{delays.up}分 ／ 下り +{delays.down}分</span>
          </div>
        )}

        {/* ══ 時刻表（縦→縦積み / 横→2カラム） ══ */}
        <div style={{
          display:"grid",
          gridTemplateColumns: portrait ? "1fr" : "1fr 1fr",
          gap: portrait ? 8 : 12,
          flex:1, minHeight:0,
        }}>
          <TrainPanel label="上り" sublabel="鹿児島中央方面" icon="▲"
            accent="#ef5350" trains={upTrains} nowMin={nowMin} delay={delays.up} compact={portrait} />
          <TrainPanel label="下り" sublabel="指宿・山川方面" icon="▼"
            accent="#42a5f5" trains={dnTrains} nowMin={nowMin} delay={delays.down} compact={portrait} />
        </div>

        {/* ══ フッター ══ */}
        <div style={{
          fontSize:9, opacity:.28, textAlign:"center", letterSpacing:".07em",
          paddingTop:4, borderTop:"1px solid rgba(255,255,255,.07)",
        }}>
          時刻：JR九州公式 2026年5月現在　警報・注意報：気象庁（鹿児島地方気象台）
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  警報・注意報バナー
// ════════════════════════════════════════════════════
function AlertBanner({ alerts, updStr, hasSpecial, hasWarning }) {
  if (alerts.length === 0) return null;

  const topLevel = hasSpecial ? "special" : hasWarning ? "warning" : "advisory";
  const bannerBg = topLevel === "special"  ? "rgba(120,0,0,.45)"
                 : topLevel === "warning"  ? "rgba(180,20,20,.32)"
                 : "rgba(180,90,0,.28)";
  const bannerBorder = topLevel === "special" ? "rgba(255,50,50,.6)"
                     : topLevel === "warning" ? "rgba(255,80,80,.45)"
                     : "rgba(255,150,0,.4)";

  return (
    <div style={{
      padding:"9px 13px",
      background: bannerBg,
      border: `1px solid ${bannerBorder}`,
      borderRadius:10,
      animation: topLevel === "special" ? "alertPulse 1.6s ease-in-out infinite" : "none",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:5 }}>
        <span style={{ fontSize: topLevel==="special"?14:13, animation:topLevel==="special"?"blink 1s infinite":"none" }}>
          {topLevel==="special" ? "🚨" : topLevel==="warning" ? "⚠️" : "🔶"}
        </span>
        <span style={{ fontSize:12, fontWeight:700, opacity:.9, letterSpacing:".05em" }}>
          {topLevel==="special" ? "特別警報発令中" : topLevel==="warning" ? "警報発令中" : "注意報発令中"}
          　鹿児島市
        </span>
        <span style={{ marginLeft:"auto", fontSize:9, opacity:.4, fontFamily:"'Share Tech Mono',monospace" }}>
          {updStr}
        </span>
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {alerts.map((a, i) => (
          <span key={i} style={{
            fontSize:11, fontWeight:700,
            padding:"3px 10px", borderRadius:5,
            background: a.color + "bb",
            border:`1px solid ${a.color}`,
            color:"#fff", letterSpacing:".04em",
          }}>{a.name}</span>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  列車パネル
// ════════════════════════════════════════════════════
function TrainPanel({ label, sublabel, icon, accent, trains, nowMin, delay, compact }) {

  return (
    <div style={{
      background:"rgba(0,0,0,.28)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      border:"1px solid rgba(255,255,255,.1)",
      borderRadius:16, display:"flex", flexDirection:"column",
      overflow:"hidden", minHeight:0,
    }}>
      {/* ヘッダー */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding: compact?"9px 12px 7px":"11px 14px 9px",
        background:`linear-gradient(90deg,${accent}22,transparent)`,
        borderBottom:"1px solid rgba(255,255,255,.07)", flexShrink:0,
      }}>
        <span style={{ fontSize:14, color:accent, filter:`drop-shadow(0 0 4px ${accent})` }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:compact?13:15, fontWeight:700, letterSpacing:".05em" }}>{label}</div>
          <div style={{ fontSize:9, opacity:.45, letterSpacing:".1em" }}>{sublabel}</div>
        </div>
        {delay>0 && (
          <span style={{
            fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:5,
            background:"rgba(255,80,30,.3)", border:"1px solid rgba(255,80,30,.45)", color:"#ff8a65",
          }}>+{delay}分遅延</span>
        )}
        <span style={{ fontSize:9, opacity:.3 }}>次の{trains.length}本</span>
      </div>

      {/* 列車リスト */}
      <div style={{
        padding: compact?"5px 8px 7px":"7px 10px 9px",
        display:"flex", flexDirection:"column",
        gap: compact?5:6, flex:1, minHeight:0,
      }}>
        {trains.map((t,i)=>{
          const isNext = i===0;
          const dH     = t.h%24;
          return (
            <div key={i} className={`trainRow fadeUp`} style={{
              animationDelay:`${i*.08}s`,
              display:"flex", alignItems:"center", gap: compact?8:12,
              padding: compact?"6px 8px 6px 0":"8px 10px 8px 0",
              borderRadius:11,
              background: isNext
                ? `linear-gradient(135deg,${accent}26,rgba(255,255,255,.05))`
                : "rgba(255,255,255,.04)",
              border:`1px solid ${isNext ? accent+"42":"rgba(255,255,255,.06)"}`,
              position:"relative", overflow:"hidden", flexShrink:0,
            }}>
              {/* 左端アクセントライン */}
              <div style={{
                width: isNext?4:3, alignSelf:"stretch", flexShrink:0,
                background: isNext ? accent : "rgba(255,255,255,.12)",
                boxShadow: isNext ? `0 0 7px ${accent}` : "none",
                borderRadius:"0 2px 2px 0",
              }}/>

              {/* 時刻 */}
              <div style={{
                fontFamily:"'Share Tech Mono',monospace",
                fontSize: compact?(isNext?38:30):(isNext?46:36),
                lineHeight:1,
                color: isNext?"#fff":"rgba(255,255,255,.55)",
                letterSpacing:".02em",
                flexShrink:0,
              }}>{pad(dH)}:{pad(t.m)}</div>

              {/* 行き先バッジ群 */}
              <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                  <span style={{
                    fontSize:compact?10:12, fontWeight:700,
                    padding:"3px 9px", borderRadius:5,
                    background:destBg(t.dest), color:"#fff", whiteSpace:"nowrap",
                  }}>{t.dest}行</span>
                  {t.type==="快速"&&(
                    <span style={{
                      fontSize:compact?9:10, fontWeight:700,
                      padding:"3px 8px", borderRadius:5,
                      background:"#e65100", color:"#fff",
                      boxShadow:"0 1px 5px rgba(230,81,0,.5)",
                    }}>なのはな</span>
                  )}
                </div>
              </div>


            </div>
          );
        })}
      </div>

    </div>
  );
}


