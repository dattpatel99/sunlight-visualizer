import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircleRail, type RailItem } from "../CircleRail";

const ITEMS: RailItem[] = [
  { id: "buildings", emoji: "🧊", label: "Buildings & Sun" },
  { id: "garden", emoji: "🌿", label: "Garden" },
  { id: "weather", emoji: "🌤️", label: "Weather" },
];

describe("CircleRail", () => {
  it("marks a circle active (aria-pressed) iff its id is in activeIds", () => {
    render(<CircleRail items={ITEMS} activeIds={["garden"]} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /Garden/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Buildings/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Weather/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onToggle with the item id when a circle is clicked", async () => {
    const onToggle = vi.fn();
    render(<CircleRail items={ITEMS} activeIds={[]} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: /Garden/ }));
    expect(onToggle).toHaveBeenCalledWith("garden");
  });
});
