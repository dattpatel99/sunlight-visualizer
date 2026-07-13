import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GardenFilters } from "../GardenFilters";
import type { GardenFilter } from "../../../lib/gardener/plantDatabase";

const base: GardenFilter = { location: "home", benefits: [], maintenancePriority: 50 };

describe("GardenFilters", () => {
  it("is titled 'What are you growing for?' and shows the primary controls", () => {
    render(<GardenFilters filter={base} onChange={() => {}} />);
    expect(screen.getByText(/What are you growing for\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apartment/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Air-purifying/ })).toBeInTheDocument();
  });

  it("emits a GardenFilter with the location switched to apartment", async () => {
    const onChange = vi.fn();
    render(<GardenFilters filter={base} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Apartment/ }));
    expect(onChange).toHaveBeenCalledWith({ location: "apartment", benefits: [], maintenancePriority: 50 });
  });

  it("toggles a benefit on and off", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<GardenFilters filter={base} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Air-purifying/ }));
    expect(onChange).toHaveBeenLastCalledWith({ location: "home", benefits: ["air-purifying"], maintenancePriority: 50 });

    rerender(<GardenFilters filter={{ ...base, benefits: ["air-purifying"] }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Air-purifying/ }));
    expect(onChange).toHaveBeenLastCalledWith({ location: "home", benefits: [], maintenancePriority: 50 });
  });

  it("raises maintenancePriority when Low-effort is toggled on", async () => {
    const onChange = vi.fn();
    render(<GardenFilters filter={base} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Low.effort/i }));
    expect((onChange.mock.calls[0][0] as GardenFilter).maintenancePriority).toBeGreaterThanOrEqual(70);
  });

  it("hides secondary benefits until expanded", async () => {
    const onChange = vi.fn();
    render(<GardenFilters filter={base} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: /Cut-flower/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /More filters/i }));
    const cutFlower = screen.getByRole("button", { name: /Cut-flower/ });
    expect(cutFlower).toBeInTheDocument();

    await userEvent.click(cutFlower);
    expect(onChange).toHaveBeenLastCalledWith({ location: "home", benefits: ["cut-flower"], maintenancePriority: 50 });
  });
});
