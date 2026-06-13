import './StorageRing.css';

interface StorageRingProps {
  usedGB: number;
  otherGB: number;
  totalGB: number;
}

export default function StorageRing({
  usedGB,
  otherGB,
  totalGB,
}: StorageRingProps) {
  const freeGB = Math.max(totalGB - usedGB - otherGB, 0);
  const usedPercent = (usedGB / totalGB) * 100;
  const otherPercent = (otherGB / totalGB) * 100;
  const totalUsedPercent = Math.round(usedPercent + otherPercent);

  // SVG circle geometry
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  // Stroke offsets — segments stack from the same start point
  const usedDash = (usedPercent / 100) * circumference;
  const otherDash = (otherPercent / 100) * circumference;
  const usedOffset = circumference - usedDash;
  const otherOffset = circumference - otherDash;

  // Rotate the "other" segment to start where "used" ends
  const otherRotation = (usedPercent / 100) * 360;

  const formatGB = (gb: number) =>
    gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;

  return (
    <div className="storage-ring" aria-label={`Storage: ${totalUsedPercent}% used`}>
      <div className="storage-ring-svg-wrapper">
        <svg className="storage-ring-svg" viewBox="0 0 140 140">
          {/* Background track */}
          <circle
            className="storage-ring-track"
            cx="70"
            cy="70"
            r={radius}
          />

          {/* Other files segment */}
          <circle
            className="storage-ring-fill storage-ring-fill--other"
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={otherOffset}
            style={{
              transform: `rotate(${otherRotation}deg)`,
              transformOrigin: '70px 70px',
            }}
          />

          {/* WU-CINE cache segment */}
          <circle
            className="storage-ring-fill"
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={usedOffset}
          />
        </svg>

        <div className="storage-ring-center">
          <span className="storage-ring-value">{totalUsedPercent}%</span>
          <span className="storage-ring-label">Used</span>
        </div>
      </div>

      <div className="storage-ring-legend">
        <div className="storage-ring-legend-item">
          <div className="storage-ring-legend-dot" style={{ background: 'var(--accent-orange)' }} />
          <span className="storage-ring-legend-name">WU-CINE Cache</span>
          <span className="storage-ring-legend-size">{formatGB(usedGB)}</span>
        </div>

        <div className="storage-ring-legend-item">
          <div className="storage-ring-legend-dot" style={{ background: 'var(--accent-frost-dim)' }} />
          <span className="storage-ring-legend-name">Other Files</span>
          <span className="storage-ring-legend-size">{formatGB(otherGB)}</span>
        </div>

        <div className="storage-ring-legend-item">
          <div className="storage-ring-legend-dot" style={{ background: 'var(--bg-surface-3)' }} />
          <span className="storage-ring-legend-name">Free Space</span>
          <span className="storage-ring-legend-size">{formatGB(freeGB)}</span>
        </div>
      </div>
    </div>
  );
}
