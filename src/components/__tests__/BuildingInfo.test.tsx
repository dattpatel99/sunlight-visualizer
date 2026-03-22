import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuildingInfo } from "../BuildingInfo";
import type { ProjectedBuilding } from "../../types";

describe("BuildingInfo", () => {
  it("renders empty state message when building is null", () => {
    render(<BuildingInfo building={null} />);

    expect(
      screen.getByText("Click a building to see details"),
    ).toBeInTheDocument();
  });

  it("renders building ID, height, and vertex count", () => {
    const building: ProjectedBuilding = {
      id: 42,
      footprint: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
      height: 25.3,
    };

    render(<BuildingInfo building={building} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("25.3m")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("height displayed with 1 decimal place", () => {
    const building: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [5, 0],
        [5, 5],
      ],
      height: 100,
    };

    render(<BuildingInfo building={building} />);

    // 100.toFixed(1) = "100.0"
    expect(screen.getByText("100.0m")).toBeInTheDocument();
  });
});
