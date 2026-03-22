import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUrlState } from "../useUrlState";

describe("useUrlState", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("calls onRestore with center and date parsed from hash", () => {
    window.location.hash = "#lat=51.5074&lng=-0.1278&date=2024-06-21&time=14:30";
    const onRestore = vi.fn();

    renderHook(() =>
      useUrlState({ lat: 40, lng: -74 }, new Date(), onRestore)
    );

    expect(onRestore).toHaveBeenCalledTimes(1);
    const arg = onRestore.mock.calls[0][0];
    expect(arg.center).toEqual({ lat: 51.5074, lng: -0.1278 });
    expect(arg.date.getFullYear()).toBe(2024);
    expect(arg.date.getMonth()).toBe(5); // June = 5
    expect(arg.date.getDate()).toBe(21);
    expect(arg.date.getHours()).toBe(14);
    expect(arg.date.getMinutes()).toBe(30);
  });

  it("does not call onRestore when hash is empty", () => {
    window.location.hash = "";
    const onRestore = vi.fn();

    renderHook(() =>
      useUrlState({ lat: 40, lng: -74 }, new Date(), onRestore)
    );

    expect(onRestore).not.toHaveBeenCalled();
  });

  it("parses hash with only lat/lng (no date)", () => {
    window.location.hash = "#lat=35.6762&lng=139.6503";
    const onRestore = vi.fn();

    renderHook(() =>
      useUrlState({ lat: 40, lng: -74 }, new Date(), onRestore)
    );

    expect(onRestore).toHaveBeenCalledTimes(1);
    const arg = onRestore.mock.calls[0][0];
    expect(arg.center).toEqual({ lat: 35.6762, lng: 139.6503 });
    expect(arg.date).toBeUndefined();
  });

  it("parses hash with date but no time (defaults to 12:00)", () => {
    window.location.hash = "#lat=40&lng=-74&date=2024-12-25";
    const onRestore = vi.fn();

    renderHook(() =>
      useUrlState({ lat: 40, lng: -74 }, new Date(), onRestore)
    );

    const arg = onRestore.mock.calls[0][0];
    expect(arg.date.getHours()).toBe(12);
    expect(arg.date.getMinutes()).toBe(0);
  });

  it("updates URL hash when center or date changes", () => {
    const onRestore = vi.fn();
    const date = new Date(2024, 5, 21, 14, 30, 0, 0); // June 21 2024 14:30

    renderHook(() =>
      useUrlState({ lat: 40.748, lng: -73.986 }, date, onRestore)
    );

    expect(window.location.hash).toContain("lat=40.748");
    expect(window.location.hash).toContain("lng=-73.986");
    expect(window.location.hash).toContain("date=2024-06-21");
    expect(window.location.hash).toContain("time=14:30");
  });

  it("only calls onRestore once on mount (not on re-renders)", () => {
    window.location.hash = "#lat=40&lng=-74";
    const onRestore = vi.fn();

    const { rerender } = renderHook(
      ({ center, date }) => useUrlState(center, date, onRestore),
      {
        initialProps: {
          center: { lat: 40, lng: -74 },
          date: new Date(),
        },
      }
    );

    rerender({ center: { lat: 41, lng: -75 }, date: new Date() });

    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
