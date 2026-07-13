import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FacadeAnalysis } from "../FacadeAnalysis";
import type { FacadeExposure } from "../../lib/facadeUtils";

function makeFacade(direction: string, sunlightHours: number, intensity = 0, dailyEnergy = 0, cosTheta = 0): FacadeExposure {
  return {
    start: [0, 0],
    end: [10, 0],
    midpoint: [5, 0],
    normal: [0, 1],
    direction,
    length: 10,
    sunlightHours,
    intensity,
    dailyEnergy,
    cosTheta,
  };
}

describe("FacadeAnalysis", () => {
  it("returns null with empty facades", () => {
    const { container } = render(
      <FacadeAnalysis
        facades={[]}
        selectedDirection={null}
        onSelectDirection={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders direction labels and hours for each facade", () => {
    const facades = [makeFacade("N", 5.2), makeFacade("S", 8.7)];

    render(
      <FacadeAnalysis
        facades={facades}
        selectedDirection={null}
        onSelectDirection={vi.fn()}
      />,
    );

    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("5.2h")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("8.7h")).toBeInTheDocument();
  });

  it("clicking a facade calls onSelectDirection with its direction", async () => {
    const onSelectDirection = vi.fn();
    const facades = [makeFacade("E", 3.0), makeFacade("W", 6.5)];

    render(
      <FacadeAnalysis
        facades={facades}
        selectedDirection={null}
        onSelectDirection={onSelectDirection}
      />,
    );

    await userEvent.click(screen.getByText("E"));

    expect(onSelectDirection).toHaveBeenCalledWith("E");
  });

  it("clicking selected facade calls onSelectDirection(null) to deselect", async () => {
    const onSelectDirection = vi.fn();
    const facades = [makeFacade("N", 5.0), makeFacade("S", 3.0)];

    render(
      <FacadeAnalysis
        facades={facades}
        selectedDirection="N"
        onSelectDirection={onSelectDirection}
      />,
    );

    await userEvent.click(screen.getByText("N"));

    expect(onSelectDirection).toHaveBeenCalledWith(null);
  });

  it("selected facade has highlighted styling", () => {
    const facades = [makeFacade("N", 5.0), makeFacade("S", 3.0)];

    const { container } = render(
      <FacadeAnalysis
        facades={facades}
        selectedDirection="N"
        onSelectDirection={vi.fn()}
      />,
    );

    // Verify selected N row has highlighted background
    const nRow = container.querySelector<HTMLElement>('[data-testid="facade-row-N"]');
    expect(nRow).toHaveStyle({ background: "#e0e7ff" });

    // Verify non-selected S row has the default (white) button background
    const sRow = container.querySelector<HTMLElement>('[data-testid="facade-row-S"]');
    expect(sRow).toHaveStyle({ background: "#ffffff" });
  });
});
