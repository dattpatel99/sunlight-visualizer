import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeControls } from "../TimeControls";

describe("TimeControls", () => {
  const defaultOnDateChange = vi.fn();
  const defaultOnPlayingChange = vi.fn();
  const defaultOnSpeedChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    date: new Date(2025, 5, 15, 10, 30),
    onDateChange: defaultOnDateChange,
    playing: false,
    onPlayingChange: defaultOnPlayingChange,
    speed: 10,
    onSpeedChange: defaultOnSpeedChange,
  };

  it("renders date input with correct value", () => {
    render(<TimeControls {...defaultProps} />);
    expect(screen.getByDisplayValue("2025-06-15")).toBeInTheDocument();
  });

  it("renders time slider and displays formatted time", () => {
    render(<TimeControls {...defaultProps} date={new Date(2025, 5, 15, 14, 30)} />);
    expect(screen.getByText("Time: 14:30")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("870"); // 14*60 + 30
  });

  it("changing date input calls onDateChange", () => {
    const onDateChange = vi.fn();
    render(<TimeControls {...defaultProps} onDateChange={onDateChange} />);
    const dateInput = screen.getByDisplayValue("2025-06-15");
    fireEvent.change(dateInput, { target: { value: "2025-12-25" } });
    expect(onDateChange).toHaveBeenCalledTimes(1);
    const newDate = onDateChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2025);
    expect(newDate.getMonth()).toBe(11);
    expect(newDate.getDate()).toBe(25);
  });

  it("changing time slider calls onDateChange with correct hours/minutes", () => {
    const onDateChange = vi.fn();
    render(<TimeControls {...defaultProps} date={new Date(2025, 5, 15, 10, 0)} onDateChange={onDateChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "1005" } }); // 16:45
    expect(onDateChange).toHaveBeenCalledTimes(1);
    const newDate = onDateChange.mock.calls[0][0] as Date;
    expect(newDate.getHours()).toBe(16);
    expect(newDate.getMinutes()).toBe(45);
  });

  it('Play button shows "Play" when not playing, calls onPlayingChange on click', async () => {
    render(<TimeControls {...defaultProps} />);
    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeInTheDocument();
    await userEvent.click(playButton);
    expect(defaultOnPlayingChange).toHaveBeenCalledWith(true);
  });

  it('shows "Pause" when playing, calls onPlayingChange(false) on click', async () => {
    render(<TimeControls {...defaultProps} playing={true} />);
    const pauseButton = screen.getByRole("button", { name: "Pause" });
    expect(pauseButton).toBeInTheDocument();
    await userEvent.click(pauseButton);
    expect(defaultOnPlayingChange).toHaveBeenCalledWith(false);
  });

  it("shows 'Viewer' label and is disabled when disabled=true", () => {
    render(<TimeControls {...defaultProps} disabled={true} playing={false} />);
    expect(screen.getByRole("button", { name: "Viewer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Viewer" })).toBeDisabled();
  });

  it("speed selector has correct options and calls onSpeedChange", async () => {
    const onSpeedChange = vi.fn();
    render(<TimeControls {...defaultProps} onSpeedChange={onSpeedChange} />);
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Slow", "Normal", "Fast", "1hr/tick"]);
    await userEvent.selectOptions(select, "30");
    expect(onSpeedChange).toHaveBeenCalledWith(30);
  });
});
