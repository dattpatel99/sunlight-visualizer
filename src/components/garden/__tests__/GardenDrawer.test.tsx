import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GardenDrawer } from "../GardenDrawer";
import type { FacadeExposure } from "../../../lib/facadeUtils";
import type { WeatherData } from "../../../lib/gardener/weatherService";

vi.mock("../../../lib/gardener/weatherService", () => {
  const weatherFixture: WeatherData = {
    location: { lat: 40, lng: -73 },
    fetchedAt: new Date("2026-06-21T12:00:00Z").toISOString(),
    current: { temp: 22, windspeed: 5, isDay: true, condition: { code: 0, label: "Clear", emoji: "☀️" } },
    today: { date: "2026-06-21", high: 26, low: 15, precipitationMm: 0, condition: { code: 0, label: "Clear", emoji: "☀️" } },
    forecast: [],
    frostToday: false,
    rainyToday: false,
    uvIndex: 6,
  };
  return { fetchWeather: vi.fn().mockResolvedValue(weatherFixture) };
});

const eFacade: FacadeExposure = {
  start: [0, 0],
  end: [10, 0],
  midpoint: [5, 0],
  normal: [1, 0],
  direction: "E",
  length: 10,
  sunlightHours: 4,
};

beforeEach(() => {
  localStorage.clear();
});

describe("GardenDrawer", () => {
  it("shows plant cards tailored to the selected facade", async () => {
    render(<GardenDrawer location={{ lat: 40, lng: -73 }} facades={[eFacade]} selectedFacade="E" onClose={() => {}} />);
    expect(await screen.findByTestId("weather-strip")).toBeInTheDocument();
    // at least one plant card renders for the E / 4h wall
    expect((await screen.findAllByTestId(/^plant-card-/)).length).toBeGreaterThan(0);
  });

  it("surfaces indoor air-purifiers when the apartment filter is on", async () => {
    render(<GardenDrawer location={{ lat: 40, lng: -73 }} facades={[eFacade]} selectedFacade="E" onClose={() => {}} />);
    await screen.findByTestId("weather-strip");
    await userEvent.click(screen.getByRole("button", { name: /Apartment/i }));
    expect(await screen.findByTestId("plant-card-snake-plant-01")).toBeInTheDocument();
  });

  it("prompts to select a wall when no facades are loaded", async () => {
    render(<GardenDrawer location={{ lat: 40, lng: -73 }} facades={[]} selectedFacade={null} onClose={() => {}} />);
    expect(await screen.findByTestId("garden-empty")).toBeInTheDocument();
  });
});
