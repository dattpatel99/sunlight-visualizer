import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressSearch } from "../AddressSearch";
import { geocodeAddress } from "../../lib/geocode";

vi.mock("../../lib/geocode");

const mockedGeocode = vi.mocked(geocodeAddress);

describe("AddressSearch", () => {
  const defaultOnSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input and Go button", () => {
    render(<AddressSearch onSelect={defaultOnSelect} />);

    expect(
      screen.getByPlaceholderText("Search address..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("typing in input updates the value", async () => {
    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "Central Park");

    expect(input).toHaveValue("Central Park");
  });

  it("clicking Go calls geocodeAddress and shows results", async () => {
    mockedGeocode.mockResolvedValueOnce([
      {
        location: { lat: 40.785, lng: -73.968 },
        displayName: "Central Park, New York",
      },
    ]);

    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "Central Park");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    await waitFor(() => {
      expect(mockedGeocode).toHaveBeenCalledWith("Central Park");
    });

    expect(
      await screen.findByRole("button", { name: "Central Park, New York" }),
    ).toBeInTheDocument();
  });

  it("clicking a result calls onSelect with the location and clears results", async () => {
    const onSelect = vi.fn();
    mockedGeocode.mockResolvedValueOnce([
      {
        location: { lat: 40.785, lng: -73.968 },
        displayName: "Central Park, New York",
      },
    ]);

    render(<AddressSearch onSelect={onSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "Central Park");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    const resultButton = await screen.findByRole("button", {
      name: "Central Park, New York",
    });
    await userEvent.click(resultButton);

    expect(onSelect).toHaveBeenCalledWith({ lat: 40.785, lng: -73.968 });

    expect(
      screen.queryByRole("button", { name: "Central Park, New York" }),
    ).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("Search address...")).toHaveValue("");
  });

  it("empty query does nothing (no call)", async () => {
    render(<AddressSearch onSelect={defaultOnSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(mockedGeocode).not.toHaveBeenCalled();
  });

  it('shows "No results found" when geocode returns []', async () => {
    mockedGeocode.mockResolvedValueOnce([]);

    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "xyznonexistent");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(await screen.findByText("No results found")).toBeInTheDocument();
  });

  it('shows "Search failed" on geocode error', async () => {
    mockedGeocode.mockRejectedValueOnce(new Error("Network error"));

    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "some query");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(await screen.findByText("Search failed")).toBeInTheDocument();
  });

  it("pressing Enter triggers search", async () => {
    mockedGeocode.mockResolvedValueOnce([
      {
        location: { lat: 51.5074, lng: -0.1278 },
        displayName: "London, UK",
      },
    ]);

    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "London{Enter}");

    await waitFor(() => {
      expect(mockedGeocode).toHaveBeenCalledWith("London");
    });

    expect(
      await screen.findByRole("button", { name: "London, UK" }),
    ).toBeInTheDocument();
  });

  it('shows "..." on Go button while searching', async () => {
    let resolveGeocode!: (value: never[]) => void;
    mockedGeocode.mockImplementationOnce(
      () => new Promise((resolve) => { resolveGeocode = resolve; }),
    );

    render(<AddressSearch onSelect={defaultOnSelect} />);

    const input = screen.getByPlaceholderText("Search address...");
    await userEvent.type(input, "test");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(await screen.findByRole("button", { name: "..." })).toBeInTheDocument();

    resolveGeocode([]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
    });
  });
});
