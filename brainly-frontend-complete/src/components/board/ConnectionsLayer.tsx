import type { Block, Connection } from "@/types";

interface Point {
  x: number;
  y: number;
}

interface ConnectionsLayerProps {
  connections: Connection[];
  blocks: Block[];
  drawingFrom: string | null;
  drawPos: Point;
  onDeleteConnection: (id: string) => void;
}

function anchorsFor(from: Block, to: Block) {
  const fc = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const tc = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  if (tc.x >= fc.x) {
    return { start: { x: from.x + from.w, y: from.y + from.h / 2 }, end: { x: to.x, y: to.y + to.h / 2 } };
  }
  return { start: { x: from.x, y: from.y + from.h / 2 }, end: { x: to.x + to.w, y: to.y + to.h / 2 } };
}

function pathFor(start: Point, end: Point) {
  const dx = Math.max(40, Math.abs(end.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
}

export function ConnectionsLayer({ connections, blocks, drawingFrom, drawPos, onDeleteConnection }: ConnectionsLayerProps) {
  function getBlock(id: string) {
    return blocks.find((b) => b.id === id);
  }

  return (
    <svg width={2200} height={1500} className="absolute left-0 top-0" style={{ pointerEvents: "none" }}>
      {connections.map((conn) => {
        const from = getBlock(conn.from);
        const to = getBlock(conn.to);
        if (!from || !to) return null;
        const { start, end } = anchorsFor(from, to);
        return (
          <path
            key={conn.id}
            d={pathFor(start, end)}
            fill="none"
            stroke="#C7C2DB"
            strokeWidth={2.5}
            style={{ pointerEvents: "stroke", cursor: "pointer" }}
            onClick={() => onDeleteConnection(conn.id)}
          >
            <title>Click to remove this connection</title>
          </path>
        );
      })}
      {drawingFrom &&
        (() => {
          const from = getBlock(drawingFrom);
          if (!from) return null;
          const fromCenterX = from.x + from.w / 2;
          const start = { x: drawPos.x >= fromCenterX ? from.x + from.w : from.x, y: from.y + from.h / 2 };
          return <path d={pathFor(start, drawPos)} fill="none" stroke="#6D5CE6" strokeWidth={2} strokeDasharray="4 4" />;
        })()}
    </svg>
  );
}
