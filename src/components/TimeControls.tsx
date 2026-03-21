import { useEffect, useRef, useState } from "react";

interface TimeControlsProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function TimeControls({ date, onDateChange }: TimeControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // minutes per tick
  const intervalRef = useRef<number | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const dateStr = date.toISOString().slice(0, 10);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const handleDateStr = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    const next = new Date(dateRef.current);
    next.setFullYear(y, m - 1, d);
    onDateChange(next);
  };

  const handleMinutes = (mins: number) => {
    const next = new Date(dateRef.current);
    next.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    onDateChange(next);
  };

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const prev = dateRef.current;
      const next = new Date(prev);
      let newMins = next.getHours() * 60 + next.getMinutes() + speed;
      if (newMins >= 1440) newMins = 0;
      next.setHours(Math.floor(newMins / 60), newMins % 60, 0, 0);
      onDateChange(next);
    }, 100);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, speed, onDateChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ margin: 0 }}>Date & Time</h3>
      <label>
        <span style={{ fontSize: 12, color: "#888" }}>Date</span>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => handleDateStr(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        <span style={{ fontSize: 12, color: "#888" }}>
          Time: {timeLabel}
        </span>
        <input
          type="range"
          min={0}
          max={1439}
          value={totalMinutes}
          onChange={(e) => {
            setPlaying(false);
            handleMinutes(Number(e.target.value));
          }}
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            ...playBtnStyle,
            background: playing ? "#dc2626" : "#16a34a",
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <label style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
          Speed
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ fontSize: 11, padding: "2px 4px" }}
          >
            <option value={5}>Slow</option>
            <option value={10}>Normal</option>
            <option value={30}>Fast</option>
            <option value={60}>1hr/tick</option>
          </select>
        </label>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  display: "block",
  marginTop: 2,
};

const playBtnStyle: React.CSSProperties = {
  padding: "4px 14px",
  color: "white",
  border: "none",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 600,
};
