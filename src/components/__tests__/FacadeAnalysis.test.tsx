import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FacadeAnalysis } from "../FacadeAnalysis";
import type { FacadeExposure } from "../../lib/facadeUtils";

function makeFacade(direction: string, sunlightHours: number): FacadeExposure {
  return {
    start: [0, 0],
    end: [10, 0],
    midpoint: [5, 0],
    normal: [0, 1],
    direction,
    length: 10,
    sunlightHours,
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

    render(
      <FacadeAnalysis
        facades={facades}
        selectedDirection="N"
        onSelectDirection={vi.fn()}
      />,
    );

    const nLabel = screen.getByText("N");
    const nRow = nLabel.closest("div[style]")!;

    expect(nRow).toHaveStyle({ background: "#e0e7ff" });

    const sLabel = screen.getByText("S");
    const sRow = sLabel.closest("div[style]")!;

    expect(sRow).toHaveStyle({ background: "transparent" });
  });
});
