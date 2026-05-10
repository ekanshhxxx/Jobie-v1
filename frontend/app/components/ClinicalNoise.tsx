'use client';

export default function ClinicalNoise() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] h-full w-full mix-blend-overlay opacity-[0.05]">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#noiseFilter)"
          opacity="1"
        ></rect>
      </svg>
    </div>
  );
}
