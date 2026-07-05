import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { scoreBand, bandHex } from '../utils/scoreBand.js';

// Animated 0–100 gauge, color-banded by score. Recharts animates the fill on mount.
export default function ScoreGauge({ score, size = 200 }) {
  const value = score ?? 0;
  const fill = bandHex[scoreBand(score)];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx="50%"
        cy="50%"
        innerRadius="72%"
        outerRadius="100%"
        barSize={14}
        data={[{ value }]}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background dataKey="value" cornerRadius={8} fill={fill} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-4xl font-semibold">{score ?? '—'}</span>
        <span className="text-xs text-secondary">out of 100</span>
      </div>
    </div>
  );
}
