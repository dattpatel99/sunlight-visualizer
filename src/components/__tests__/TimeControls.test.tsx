import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeControls } from "../TimeControls";

describe("TimeControls", () => {
  const defaultOnDateChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders date input with correct value", () => {
    const date = new Date(2025, 5, 15, 10, 30);
    render(<TimeControls date={date} onDateChange={defaultOnDateChange} />);

    const dateInput = screen.getByDisplayValue("2025-06-15");
    expect(dateInput).toBeInTheDocument();
  });

  it("renders time slider and displays formatted time", () => {
    const date = new Date(2025, 5, 15, 14, 30);
    render(<TimeControls date={date} onDateChange={defaultOnDateChange} />);

    expect(screen.getByText("Time: 14:30")).toBeInTheDocument();

    const slider = screen.getByRole("slider");
    // 14*60 + 30 = 870
    expect(slider).toHaveValue("870");
  });

  it("changing date input calls onDateChange", () => {
    const date = new Date(2025, 5, 15, 10, 30);
    const onDateChange = vi.fn();
    render(<TimeControls date={date} onDateChange={onDateChange} />);

    const dateInput = screen.getByDisplayValue("2025-06-15");
    fireEvent.change(dateInput, { target: { value: "2025-12-25" } });

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const newDate = onDateChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2025);
    expect(newDate.getMonth()).toBe(11); // December is 11
    expect(newDate.getDate()).toBe(25);
  });

  it("changing time slider calls onDateChange with correct hours/minutes", () => {
    const date = new Date(2025, 5, 15, 10, 0);
    const onDateChange = vi.fn();
    render(<TimeControls date={date} onDateChange={onDateChange} />);

    const slider = screen.getByRole("slider");
    // Set to 16:45 = 1005 minutes
    fireEvent.change(slider, { target: { value: "1005" } });

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const newDate = onDateChange.mock.calls[0][0] as Date;
    expect(newDate.getHours()).toBe(16);
    expect(newDate.getMinutes()).toBe(45);
  });

  it('Play button shows "Play" initially, toggles to "Pause"', async () => {
    const date = new Date(2025, 5, 15, 12, 0);
    render(<TimeControls date={date} onDateChange={defaultOnDateChange} />);

    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeInTheDocument();

    await userEvent.click(playButton);

    expect(
      screen.getByRole("button", { name: "Pause" }),
    ).toBeInTheDocument();
  });

  it("speed selector has options: Slow, Normal, Fast, 1hr/tick", () => {
    const date = new Date(2025, 5, 15, 12, 0);
    render(<TimeControls date={date} onDateChange={defaultOnDateChange} />);

    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (opt) => opt.textContent,
    );

    expect(options).toEqual(["Slow", "Normal", "Fast", "1hr/tick"]);
  });
});
