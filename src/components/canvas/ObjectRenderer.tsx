import React, { useRef, useState } from "react";
import type {
  CanvasObject,
  RectObject,
  CircleObject,
  TextObject,
  PathObject,
  FrameObject,
  LineObject,
} from "../../types";
import { cn } from "../../utils/cn";

interface ObjectRendererProps {
  obj: CanvasObject;
  zoom: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDragMove: (dx: number, dy: number) => void;
  editing: boolean;
  onDoubleClick: () => void;
}

function getFill(obj: CanvasObject): string {
  if (!obj.fills || obj.fills.length === 0) return "transparent";
  const fill = obj.fills[0];
  if (!fill) return "transparent";
  if (fill.type === "solid") return fill.color;
  return "transparent";
}

export function ObjectRenderer({
  obj,
  zoom,
  selected,
  onSelect,
  onDragMove,
  editing,
  onDoubleClick,
}: ObjectRendererProps) {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
  e.stopPropagation();
  if (obj.locked) return;

  onSelect(e as unknown as React.MouseEvent);
  dragStart.current = { x: e.clientX, y: e.clientY };

  // Capture the pointer so we get move/up even if outside
  (e.target as HTMLElement).setPointerCapture(e.pointerId);

  const onMove = (me: PointerEvent) => {
    if (!dragStart.current) return;
    const dx = me.clientX - dragStart.current.x;
    const dy = me.clientY - dragStart.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      setIsDragging(true);
      onDragMove(dx, dy);
      dragStart.current = { x: me.clientX, y: me.clientY };
    }
  };

  const onUp = (me?: PointerEvent) => {
    setIsDragging(false);
    dragStart.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
};

   

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: obj.x,
    top: obj.y,
    width: obj.width,
    height: obj.height,
    transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
    opacity: obj.opacity,
    cursor: obj.locked ? "not-allowed" : isDragging ? "grabbing" : "move",
    outline: selected ? "2px solid #0d99ff" : undefined,
    outlineOffset: "1px",
    boxSizing: "border-box",
  };

  if (obj.type === "rectangle") {
    const rect = obj as RectObject;
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: getFill(obj),
          border:
            obj.strokeWidth > 0
              ? `${obj.strokeWidth}px solid ${obj.stroke}`
              : undefined,
          borderRadius: rect.cornerRadius,
          boxShadow:
            obj.shadows
              .filter((s) => s.enabled && !s.inner)
              .map(
                (s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`,
              )
              .join(", ") || undefined,
        }}
       onPointerDown={handlePointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
      />
    );
  }

  if (obj.type === "circle") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: getFill(obj),
          border:
            obj.strokeWidth > 0
              ? `${obj.strokeWidth}px solid ${obj.stroke}`
              : undefined,
          borderRadius: "50%",
          boxShadow:
            obj.shadows
              .filter((s) => s.enabled && !s.inner)
              .map(
                (s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`,
              )
              .join(", ") || undefined,
        }}
        onPointerDown={handlePointerDown}
      />
    );
  }

  if (obj.type === "frame") {
    const frame = obj as FrameObject;
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: frame.background || "#ffffff",
          border:
            obj.strokeWidth > 0
              ? `${obj.strokeWidth}px solid ${obj.stroke}`
              : "1px solid #cccccc",
          overflow: frame.clipContent ? "hidden" : "visible",
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
      >
        {/* Frame label */}
        {selected && (
          <div
            style={{
              position: "absolute",
              top: -20,
              left: 0,
              fontSize: 11,
              color: "#0d99ff",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {obj.name}
          </div>
        )}
      </div>
    );
  }

  if (obj.type === "text") {
    const text = obj as TextObject;
    if (editing) return null; // Handled by TextEditor overlay
    return (
      <div
        style={{
          ...baseStyle,
          color: text.textColor || "#000000",
          fontSize: text.fontSize,
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          fontStyle: text.fontStyle,
          textAlign: text.textAlign,
          lineHeight: text.lineHeight,
          letterSpacing: `${text.letterSpacing}px`,
          textDecoration: text.textDecoration,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          userSelect: "text",
          backgroundColor: "transparent",
          outline: selected ? "1px solid #0d99ff" : undefined,
          outlineOffset: "2px",
          padding: 2,
          minWidth: 20,
          minHeight: 20,
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
      >
        
        {text.text ?? "Text"}
      </div>
    );
  }

  if (obj.type === "path") {
    const path = obj as PathObject;
    return (
      <svg
        style={{
          ...baseStyle,
          overflow: "visible",
          outline: "none",
        }}
        onPointerDown={handlePointerDown}
      >
        <path
          d={path.svgPath}
          fill={getFill(obj) === "transparent" ? "none" : getFill(obj)}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {selected && (
          <rect
            x={0}
            y={0}
            width={obj.width}
            height={obj.height}
            fill="none"
            stroke="#0d99ff"
            strokeWidth={1}
            strokeDasharray="4"
          />
        )}
      </svg>
    );
  }

  if (obj.type === "line" || obj.type === "arrow") {
    const line = obj as LineObject;
    const pts = line.points || [obj.x, obj.y, obj.x + obj.width, obj.y];
    const x1 = pts[0] - obj.x;
    const y1 = pts[1] - obj.y;
    const x2 = pts[2] - obj.x;
    const y2 = pts[3] - obj.y;
    const svgW = Math.max(Math.abs(x2 - x1), 1) + 20;
    const svgH = Math.max(Math.abs(y2 - y1), 1) + 20;
    return (
      <svg
        style={{
          position: "absolute",
          left: Math.min(pts[0], pts[2]) - 10,
          top: Math.min(pts[1], pts[3]) - 10,
          width: svgW,
          height: svgH,
          overflow: "visible",
          opacity: obj.opacity,
          cursor: obj.locked ? "not-allowed" : "move",
        }}
        onPointerDown={handlePointerDown}
      >
        <defs>
          {obj.type === "arrow" && (
            <marker
              id={`arrow-${obj.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={obj.stroke} />
            </marker>
          )}
        </defs>
        <line
          x1={x1 - Math.min(pts[0], pts[2]) + 10}
          y1={y1 - Math.min(pts[1], pts[3]) + 10}
          x2={x2 - Math.min(pts[0], pts[2]) + 10}
          y2={y2 - Math.min(pts[1], pts[3]) + 10}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
          markerEnd={obj.type === "arrow" ? `url(#arrow-${obj.id})` : undefined}
          strokeLinecap="round"
        />
        {selected && (
          <>
            <circle
              cx={x1 - Math.min(pts[0], pts[2]) + 10}
              cy={y1 - Math.min(pts[1], pts[3]) + 10}
              r={4}
              fill="white"
              stroke="#0d99ff"
              strokeWidth={1.5}
            />
            <circle
              cx={x2 - Math.min(pts[0], pts[2]) + 10}
              cy={y2 - Math.min(pts[1], pts[3]) + 10}
              r={4}
              fill="white"
              stroke="#0d99ff"
              strokeWidth={1.5}
            />
          </>
        )}
      </svg>
    );
  }

 if (obj.type === "image") {
  const image = obj as import("../../types").ImageObject;

  const imgWidth = obj.width;
  const imgHeight = obj.height;

  return (
    <div
      style={{
        position: "absolute",
        left: obj.x,
        top: obj.y,
        width: imgWidth + "px",
        height: imgHeight + "px",
        transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
        opacity: obj.opacity,
        cursor: obj.locked ? "not-allowed" : isDragging ? "grabbing" : "move",
        outline: selected ? "2px solid #0d99ff" : undefined,
        outlineOffset: 1,
        boxSizing: "border-box",
        overflow: "hidden",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
    >
      <img
        src={
          image.src ||
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ccc'/></svg>"
        }
        alt={image.alt || "image"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          userSelect: "none",
          pointerEvents: "none", // avoids interfering with drag
        }}
        draggable={true}
      />
    </div>
  );
}

  return null;
}
