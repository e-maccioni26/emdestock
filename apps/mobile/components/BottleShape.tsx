import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { PLACEHOLDER_SVG, type PlaceholderShape } from '@emd/shared';

/** Flacon au trait (tracés des maquettes), à la hauteur demandée. Partagé par ProductImage et les encarts. */
export function BottleShape({
  shape,
  height,
  stroke,
  strokeWidth = 1.5,
}: {
  shape: PlaceholderShape;
  height: number;
  stroke: string;
  strokeWidth?: number;
}) {
  const s = PLACEHOLDER_SVG[shape];
  return (
    <Svg
      width={(s.width / s.height) * height}
      height={height}
      viewBox={s.viewBox}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      {s.shapes.map((p, i) => {
        if (p.tag === 'rect')
          return (
            <Rect
              key={i}
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              rx={'rx' in p ? p.rx : undefined}
            />
          );
        if (p.tag === 'circle') return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} />;
        if (p.tag === 'line') return <Line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />;
        return <Path key={i} d={p.d} />;
      })}
    </Svg>
  );
}
