import { describe, it, expect } from "vitest";
import { sunPositionToVector3 } from "../sunDirection";
import { SUN_DISTANCE } from "../../constants";

describe("sunPositionToVector3", () => {
  it("azimuth=0, altitude=PI/4: sun from south, Y positive, Z positive, X near 0", () => {
    const v = sunPositionToVector3({ azimuth: 0, altitude: Math.PI / 4, isNight: false });
    // X should be ~0 (no east-west displacement when azimuth is 0/south)
    expect(v.x).toBeCloseTo(0, 5);
    // Y should be positive (above horizon)
    expect(v.y).toBeGreaterThan(0);
    expect(v.y).toBeCloseTo(Math.sin(Math.PI / 4) * SUN_DISTANCE, 5);
    // Z should be positive (south direction in our coordinate system)
    expect(v.z).toBeGreaterThan(0);
    expect(v.z).toBeCloseTo(Math.cos(Math.PI / 4) * SUN_DISTANCE, 5);
  });

  it("azimuth=PI/2 (west): X should be negative", () => {
    const v = sunPositionToVector3({ azimuth: Math.PI / 2, altitude: Math.PI / 4, isNight: false });
    // -sin(PI/2) = -1, so X is negative (westward in SunCalc maps to -X in our system)
    expect(v.x).toBeLessThan(0);
    expect(v.x).toBeCloseTo(-Math.cos(Math.PI / 4) * SUN_DISTANCE, 5);
    // cos(PI/2) = 0, so Z should be ~0
    expect(v.z).toBeCloseTo(0, 5);
  });

  it("altitude=PI/2 (zenith): Y = SUN_DISTANCE, X and Z near 0", () => {
    const v = sunPositionToVector3({ azimuth: 0, altitude: Math.PI / 2, isNight: false });
    expect(v.y).toBeCloseTo(SUN_DISTANCE, 5);
    // cos(PI/2) = 0, so X and Z should be ~0
    expect(Math.abs(v.x)).toBeLessThan(0.001);
    expect(Math.abs(v.z)).toBeLessThan(0.001);
  });

  it("altitude=0 (horizon): Y should be near 0", () => {
    const v = sunPositionToVector3({ azimuth: 0, altitude: 0, isNight: false });
    expect(Math.abs(v.y)).toBeLessThan(0.001);
    // Z should be at SUN_DISTANCE (cos(0)*cos(0)*SUN_DISTANCE = SUN_DISTANCE)
    expect(v.z).toBeCloseTo(SUN_DISTANCE, 5);
  });

  it("vector distance from origin equals SUN_DISTANCE", () => {
    const testCases = [
      { azimuth: 0, altitude: Math.PI / 4 },
      { azimuth: Math.PI / 2, altitude: Math.PI / 6 },
      { azimuth: Math.PI, altitude: Math.PI / 3 },
      { azimuth: -Math.PI / 4, altitude: 0.1 },
      { azimuth: 1.2, altitude: 0.8 },
    ];

    for (const sun of testCases) {
      const v = sunPositionToVector3({ ...sun, isNight: false });
      const distance = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      expect(distance).toBeCloseTo(SUN_DISTANCE, 5);
    }
  });

  it("azimuth=-PI/2 (east): X should be positive", () => {
    const v = sunPositionToVector3({ azimuth: -Math.PI / 2, altitude: Math.PI / 4, isNight: false });
    // -sin(-PI/2) = 1, so X is positive (east)
    expect(v.x).toBeGreaterThan(0);
  });

  it("azimuth=PI (north): Z should be negative", () => {
    const v = sunPositionToVector3({ azimuth: Math.PI, altitude: Math.PI / 4, isNight: false });
    // cos(PI) = -1, so Z is negative (north in our system)
    expect(v.z).toBeLessThan(0);
    expect(v.x).toBeCloseTo(0, 4);
  });
});
