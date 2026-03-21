interface TimeControlsProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function TimeControls({ date, onDateChange }: TimeControlsProps) {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const handleDateStr = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    const next = new Date(date);
    next.setFullYear(y, m - 1, d);
    onDateChange(next);
  };

  const handleMinutes = (mins: number) => {
    const next = new Date(date);
    next.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    onDateChange(next);
  };

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
          onChange={(e) => handleMinutes(Number(e.target.value))}
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>
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
