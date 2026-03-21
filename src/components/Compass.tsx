import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

/**
 * A compass that floats at a fixed screen-relative position.
 * North arrow always points toward -Z (north in our coordinate system).
 */
export function Compass() {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    // Position the compass at a fixed world position relative to where the camera is looking
    // We'll use Html overlay instead for a cleaner approach
  });

  return (
    <group ref={groupRef}>
      <Html
        position={[0, 0, 0]}
        style={{ pointerEvents: "none" }}
        calculatePosition={() => [window.innerWidth - 340, 60]}
        zIndexRange={[100, 100]}
      >
        <CompassRose camera={camera} />
      </Html>
    </group>
  );
}

function CompassRose({ camera }: { camera: THREE.Camera }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCompassDraw(canvasRef, camera);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={80}
      style={{ opacity: 0.9 }}
    />
  );
}

function useCompassDraw(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  camera: THREE.Camera
) {
  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get camera's forward direction projected onto XZ plane
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    // Angle from north (-Z direction)
    const angle = Math.atan2(forward.x, -forward.z);

    const cx = 40;
    const cy = 40;
    const r = 32;

    ctx.clearRect(0, 0, 80, 80);

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-angle);

    // North arrow (red)
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-7, 6);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(7, 6);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    // South arrow (gray)
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(-7, -6);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "#999";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(7, -6);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "#bbb";
    ctx.fill();

    // Labels
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#dc2626";
    ctx.fillText("N", 0, -r + 10);
    ctx.fillStyle = "#666";
    ctx.fillText("S", 0, r - 10);
    ctx.fillText("E", r - 10, 0);
    ctx.fillText("W", -r + 10, 0);

    ctx.restore();
  });
}
