import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Mock the 3D Scene component - Canvas/WebGL won't work in jsdom
vi.mock("../components/Scene", () => ({
  Scene: (props: {
    buildings: unknown[];
    selectedBuildingId: number | null;
    onSelectBuilding: (id: number) => void;
    highlightDirection: string | null;
  }) => (
    <div data-testid="scene">
      <span data-testid="scene-building-count">{props.buildings.length}</span>
      <span data-testid="scene-selected-id">{props.selectedBuildingId ?? "none"}</span>
      <span data-testid="scene-highlight-dir">{props.highlightDirection ?? "none"}</span>
      {(props.buildings as { id: number }[]).map((b) => (
        <button key={b.id} data-testid={`building-${b.id}`} onClick={() => props.onSelectBuilding(b.id)}>
          Building {b.id}
        </button>
      ))}
      <button data-testid="deselect" onClick={() => props.onSelectBuilding(-1)}>
        Deselect
      </button>
    </div>
  ),
}));

// Mock building fetcher (OSM / Overpass) + geocode
vi.mock("../lib/overpass", () => ({ fetchBuildings: vi.fn() }));
vi.mock("../lib/geocode", () => ({ geocodeAddress: vi.fn() }));

import { fetchBuildings } from "../lib/overpass";
import { geocodeAddress } from "../lib/geocode";

const mockFetchBuildings = vi.mocked(fetchBuildings);
const mockGeocodeAddress = vi.mocked(geocodeAddress);

const sampleBuildings = [
  { id: 1, footprint: [[-73.986, 40.748], [-73.985, 40.748], [-73.985, 40.749], [-73.986, 40.749]] as [number, number][], height: 50 },
  { id: 2, footprint: [[-73.984, 40.748], [-73.983, 40.748], [-73.983, 40.749], [-73.984, 40.749]] as [number, number][], height: 30 },
];

/** Panels are closed by default — open the Buildings & Sun panel via the rail. */
const openBuildings = () => fireEvent.click(screen.getByTestId("rail-buildings"));

describe("App integration tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
    mockFetchBuildings.mockResolvedValue([]);
  });

  it("renders the shell with rail, canvas, address bar and scrubber", () => {
    render(<App />);
    expect(screen.getByTestId("rail-garden")).toBeInTheDocument();
    expect(screen.getByTestId("rail-buildings")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search address...")).toBeInTheDocument();
    expect(screen.getByText("Date & Time")).toBeInTheDocument();
    expect(screen.getByTestId("scene")).toBeInTheDocument();
  });

  it("panels are closed by default; the rail opens Buildings & Sun", () => {
    render(<App />);
    expect(screen.queryByText("Location")).not.toBeInTheDocument();
    openBuildings();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Load Buildings")).toBeInTheDocument();
  });

  describe("Loading buildings flow", () => {
    it("loads buildings when Load Buildings is clicked", async () => {
      mockFetchBuildings.mockResolvedValue(sampleBuildings);
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Load Buildings"));
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await vi.waitFor(() => {
        expect(screen.getByText(/2 buildings loaded/)).toBeInTheDocument();
      });
      expect(screen.getByTestId("scene-building-count").textContent).toBe("2");
      expect(mockFetchBuildings).toHaveBeenCalled();
    });

    it("displays error on fetch failure", async () => {
      mockFetchBuildings.mockRejectedValue(new Error("API unavailable"));
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Load Buildings"));
      await vi.waitFor(() => {
        expect(screen.getByText("API unavailable")).toBeInTheDocument();
      });
    });

    it("loads buildings via preset buttons", async () => {
      mockFetchBuildings.mockResolvedValue(sampleBuildings);
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Tokyo"));
      await vi.waitFor(() => {
        expect(mockFetchBuildings).toHaveBeenCalledWith({ lat: 35.6762, lng: 139.6503 }, expect.any(Number));
      });
    });
  });

  describe("Building selection flow", () => {
    it("selects a building and shows building info", async () => {
      mockFetchBuildings.mockResolvedValue(sampleBuildings);
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Load Buildings"));
      await vi.waitFor(() => expect(screen.getByText(/2 buildings loaded/)).toBeInTheDocument());

      fireEvent.click(screen.getByTestId("building-1"));
      expect(screen.getByText("Building Info")).toBeInTheDocument();
      expect(screen.getByTestId("scene-selected-id").textContent).toBe("1");
    });

    it("deselects building when clicking empty space", async () => {
      mockFetchBuildings.mockResolvedValue(sampleBuildings);
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Load Buildings"));
      await vi.waitFor(() => expect(screen.getByText(/2 buildings loaded/)).toBeInTheDocument());

      fireEvent.click(screen.getByTestId("building-1"));
      expect(screen.getByTestId("scene-selected-id").textContent).toBe("1");

      fireEvent.click(screen.getByTestId("deselect"));
      expect(screen.getByTestId("scene-selected-id").textContent).toBe("none");
      expect(screen.getByText("Click a building to see details")).toBeInTheDocument();
    });

    it("clears selection when loading new buildings", async () => {
      mockFetchBuildings.mockResolvedValue(sampleBuildings);
      render(<App />);
      openBuildings();

      fireEvent.click(screen.getByText("Load Buildings"));
      await vi.waitFor(() => expect(screen.getByText(/2 buildings loaded/)).toBeInTheDocument());

      fireEvent.click(screen.getByTestId("building-1"));
      expect(screen.getByTestId("scene-selected-id").textContent).toBe("1");

      fireEvent.click(screen.getByText("Load Buildings"));
      expect(screen.getByTestId("scene-selected-id").textContent).toBe("none");
    });
  });

  describe("Time controls flow", () => {
    it("changes time via the time slider", () => {
      render(<App />);
      const timeSlider = screen.getByRole("slider", { name: /time/i });
      fireEvent.change(timeSlider, { target: { value: "900" } }); // 15:00
      expect(screen.getByText(/Time: 15:00/)).toBeInTheDocument();
    });

    it("changes date via date input", () => {
      render(<App />);
      const dateInput = document.querySelector('input[type="date"]')!;
      expect(dateInput).toBeTruthy();
      fireEvent.change(dateInput, { target: { value: "2024-12-25" } });
      expect(screen.getByDisplayValue("2024-12-25")).toBeInTheDocument();
    });

    it("play button toggles to pause", () => {
      render(<App />);
      fireEvent.click(screen.getByText("Play"));
      expect(screen.getByText("Pause")).toBeInTheDocument();
    });
  });

  describe("Address search flow", () => {
    it("selecting an address loads buildings and opens the Buildings panel", async () => {
      mockGeocodeAddress.mockResolvedValue([
        { location: { lat: 48.8584, lng: 2.2945 }, displayName: "Eiffel Tower, Paris" },
      ]);
      mockFetchBuildings.mockResolvedValue(sampleBuildings);

      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText("Search address..."), "Eiffel Tower");
      await user.click(screen.getByText("Go"));
      await vi.waitFor(() => expect(screen.getByText("Eiffel Tower, Paris")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Eiffel Tower, Paris"));

      await vi.waitFor(() => {
        expect(mockFetchBuildings).toHaveBeenCalledWith({ lat: 48.8584, lng: 2.2945 }, expect.any(Number));
      });
      // Selecting an address self-guides the user into the Buildings & Sun panel.
      expect(screen.getByText("Location")).toBeInTheDocument();
    });
  });

  describe("Data attribution", () => {
    it("shows OpenStreetMap attribution", () => {
      render(<App />);
      openBuildings();
      expect(screen.getByText(/OpenStreetMap contributors/)).toBeInTheDocument();
    });
  });

  describe("URL state persistence", () => {
    it("restores state from URL hash on load", async () => {
      window.location.hash = "#lat=51.5074&lng=-0.1278&date=2024-06-21&time=14:30";
      mockFetchBuildings.mockResolvedValue([]);
      render(<App />);
      await vi.waitFor(() => {
        expect(mockFetchBuildings).toHaveBeenCalledWith({ lat: 51.5074, lng: -0.1278 }, expect.any(Number));
      });
    });
  });
});
