import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SunlightStatsPanel } from "../SunlightStats";
import type { SunlightStats } from "../../lib/sunlightStats";

describe("SunlightStatsPanel", () => {
  const fullStats: SunlightStats = {
    sunrise: "06:15",
    sunset: "19:42",
    daylightHours: 13.5,
    bestFacade: { direction: "S", hours: 8.3 },
    worstFacade: { direction: "N", hours: 1.2 },
    avgExposure: 4.7,
    totalFacades: 4,
  };

  it("renders sunrise, sunset, daylight", () => {
    render(<SunlightStatsPanel stats={fullStats} />);

    expect(screen.getByText("06:15")).toBeInTheDocument();
    expect(screen.getByText("19:42")).toBeInTheDocument();
    expect(screen.getByText("13.5h")).toBeInTheDocument();
  });

  it("renders best and worst wall when present", () => {
    render(<SunlightStatsPanel stats={fullStats} />);

    expect(screen.getByText("Best wall")).toBeInTheDocument();
    expect(screen.getByText("S (8.3h)")).toBeInTheDocument();

    expect(screen.getByText("Worst wall")).toBeInTheDocument();
    expect(screen.getByText("N (1.2h)")).toBeInTheDocument();
  });

  it("does not render best/worst when null", () => {
    const stats: SunlightStats = {
      sunrise: "05:30",
      sunset: "20:00",
      daylightHours: 14.5,
      bestFacade: null,
      worstFacade: null,
      avgExposure: 0,
      totalFacades: 0,
    };

    render(<SunlightStatsPanel stats={stats} />);

    expect(screen.queryByText("Best wall")).not.toBeInTheDocument();
    expect(screen.queryByText("Worst wall")).not.toBeInTheDocument();
  });

  it("renders avg exposure when totalFacades > 0", () => {
    render(<SunlightStatsPanel stats={fullStats} />);

    expect(screen.getByText("Avg exposure")).toBeInTheDocument();
    expect(screen.getByText("4.7h")).toBeInTheDocument();
  });

  it("does not render avg exposure when totalFacades is 0", () => {
    const stats: SunlightStats = {
      sunrise: "06:00",
      sunset: "18:00",
      daylightHours: 12,
      bestFacade: null,
      worstFacade: null,
      avgExposure: 0,
      totalFacades: 0,
    };

    render(<SunlightStatsPanel stats={stats} />);

    expect(screen.queryByText("Avg exposure")).not.toBeInTheDocument();
  });
});
