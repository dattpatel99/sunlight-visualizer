import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlantCard } from "../PlantCard";
import { PLANTS, type PlantScore } from "../../../lib/gardener/plantDatabase";

const snake = PLANTS.find((p) => p.id === "snake-plant-01")!;
const sunflower = PLANTS.find((p) => p.id === "sunflower-01")!;

const goodScore: PlantScore = {
  plant: snake,
  score: 92,
  reasons: [
    { kind: "benefit-match", label: "air-purifying", delta: 14 },
    { kind: "apartment-fit", label: "thrives indoors in a container", delta: 18 },
  ],
  sunShortfall: false,
};

const fallbackScore: PlantScore = {
  plant: sunflower,
  score: 54,
  reasons: [{ kind: "sun-shortfall", label: "needs 6h+ sun — your facade gets 4h", delta: -24 }],
  sunShortfall: true,
};

describe("PlantCard", () => {
  it("collapsed: shows name and score %, hides the reason breakdown", () => {
    render(<PlantCard score={goodScore} expanded={false} onToggle={() => {}} />);
    expect(screen.getByText("Snake Plant")).toBeInTheDocument();
    expect(screen.getByTestId("plant-score")).toHaveTextContent("92%");
    expect(screen.queryByText(/thrives indoors in a container/)).not.toBeInTheDocument();
  });

  it("expanded: reveals the why-this-scored reasons", () => {
    render(<PlantCard score={goodScore} expanded onToggle={() => {}} />);
    expect(screen.getByText(/why this scored 92%/i)).toBeInTheDocument();
    expect(screen.getByText(/thrives indoors in a container/)).toBeInTheDocument();
    // benefit-match reason surfaces (also appears in summary/chips, hence getAllByText)
    expect(screen.getAllByText(/air-purifying/).length).toBeGreaterThan(1);
  });

  it("calls onToggle when the card header is clicked", async () => {
    const onToggle = vi.fn();
    render(<PlantCard score={goodScore} expanded={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: /Snake Plant/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("best-effort fallback: flags the sun shortfall", () => {
    render(<PlantCard score={fallbackScore} expanded onToggle={() => {}} />);
    expect(screen.getByTestId("plant-card-sunflower-01")).toHaveAttribute("data-fallback", "true");
    expect(screen.getByText(/needs 6h\+ sun/)).toBeInTheDocument();
  });
});
