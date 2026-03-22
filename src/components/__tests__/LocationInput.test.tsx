import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationInput } from "../LocationInput";

describe("LocationInput", () => {
  const defaultOnLoad = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default lat/lng values", () => {
    render(<LocationInput onLoad={defaultOnLoad} loading={false} />);

    const latInput = screen.getByDisplayValue("40.748");
    const lngInput = screen.getByDisplayValue("-73.986");

    expect(latInput).toBeInTheDocument();
    expect(lngInput).toBeInTheDocument();
  });

  it("Load Buildings button calls onLoad with parsed lat/lng, radius, and source", async () => {
    const onLoad = vi.fn();
    render(<LocationInput onLoad={onLoad} loading={false} />);

    const button = screen.getByRole("button", { name: "Load Buildings" });
    await userEvent.click(button);

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      150,
      "overture",
    );
  });

  it("does not call onLoad with invalid (NaN) lat/lng", async () => {
    const onLoad = vi.fn();
    render(<LocationInput onLoad={onLoad} loading={false} />);

    const latInput = screen.getByDisplayValue("40.748");
    await userEvent.clear(latInput);
    await userEvent.type(latInput, "abc");

    const button = screen.getByRole("button", { name: "Load Buildings" });
    await userEvent.click(button);

    expect(onLoad).not.toHaveBeenCalled();
  });

  it("radius slider changes value", () => {
    render(<LocationInput onLoad={defaultOnLoad} loading={false} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("150");

    fireEvent.change(slider, { target: { value: "300" } });
    expect(slider).toHaveValue("300");

    expect(screen.getByText("Radius: 300m")).toBeInTheDocument();
  });

  it("data source toggle switches between 'overture' and 'osm'", async () => {
    const onLoad = vi.fn();
    render(<LocationInput onLoad={onLoad} loading={false} />);

    const osmButton = screen.getByRole("button", { name: "OpenStreetMap" });
    await userEvent.click(osmButton);

    const loadButton = screen.getByRole("button", { name: "Load Buildings" });
    await userEvent.click(loadButton);

    expect(onLoad).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      150,
      "osm",
    );

    onLoad.mockClear();

    await userEvent.click(screen.getByText("Overture Maps"));
    await userEvent.click(loadButton);

    expect(onLoad).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      150,
      "overture",
    );
  });

  it("preset buttons call onLoad with correct locations", async () => {
    const onLoad = vi.fn();
    render(<LocationInput onLoad={onLoad} loading={false} />);

    await userEvent.click(screen.getByRole("button", { name: "NYC" }));
    expect(onLoad).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      150,
      "overture",
    );

    onLoad.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "London" }));
    expect(onLoad).toHaveBeenCalledWith(
      { lat: 51.5074, lng: -0.1278 },
      150,
      "overture",
    );

    onLoad.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Tokyo" }));
    expect(onLoad).toHaveBeenCalledWith(
      { lat: 35.6762, lng: 139.6503 },
      150,
      "overture",
    );
  });

  it("loading state: button shows 'Loading...' and is disabled", () => {
    render(<LocationInput onLoad={defaultOnLoad} loading={true} />);

    const button = screen.getByRole("button", { name: "Loading..." });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
