import React, { useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { CanvasObject } from '../../types';

interface SelectionBoxProps {
  selectedIds: string[];
  objects: Record<string, CanvasObject>;
  zoom: number;
}

export function SelectionBox({ selectedIds, objects, zoom }: SelectionBoxProps) {
  const updateObject = useStore((s) => s.updateObject);
  const selected = selectedIds.map((id) => objects[id]).filter(Boolean);
  if (selected.length === 0) return null;

  const minX = Math.min(...selected.map((o) => o.x));
  const minY = Math.min(...selected.map((o) => o.y));
  const maxX = Math.max(...selected.map((o) => o.x + o.width));
  const maxY = Math.max(...selected.map((o) => o.y + o.height));
  const bw = maxX - minX;
  const bh = maxY - minY;

  const handles = [
    { cursor: 'nw-resize', x: minX - 4, y: minY - 4, anchor: 'nw' },
    { cursor: 'n-resize', x: minX + bw / 2 - 4, y: minY - 4, anchor: 'n' },
    { cursor: 'ne-resize', x: maxX - 4, y: minY - 4, anchor: 'ne' },
    { cursor: 'w-resize', x: minX - 4, y: minY + bh / 2 - 4, anchor: 'w' },
    { cursor: 'e-resize', x: maxX - 4, y: minY + bh / 2 - 4, anchor: 'e' },
    { cursor: 'sw-resize', x: minX - 4, y: maxY - 4, anchor: 'sw' },
    { cursor: 's-resize', x: minX + bw / 2 - 4, y: maxY - 4, anchor: 's' },
    { cursor: 'se-resize', x: maxX - 4, y: maxY - 4, anchor: 'se' },
  ];

  const handleResizeStart = (e: React.MouseEvent, anchor: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const snapshots = selected.map((o) => ({ ...o }));

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;

      snapshots.forEach((snap) => {
        let newX = snap.x;
        let newY = snap.y;
        let newW = snap.width;
        let newH = snap.height;

        if (anchor.includes('e')) newW = Math.max(10, snap.width + dx);
        if (anchor.includes('s')) newH = Math.max(10, snap.height + dy);
        if (anchor.includes('w')) { newX = snap.x + dx; newW = Math.max(10, snap.width - dx); }
        if (anchor.includes('n')) { newY = snap.y + dy; newH = Math.max(10, snap.height - dy); }

        updateObject(snap.id, { x: newX, y: newY, width: newW, height: newH });
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {/* Bounding box outline */}
      <div
        style={{
          position: 'absolute',
          left: minX - 1,
          top: minY - 1,
          width: bw + 2,
          height: bh + 2,
          border: '1.5px solid #0d99ff',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.anchor}
          style={{
            position: 'absolute',
            left: h.x,
            top: h.y,
            width: 8,
            height: 8,
            backgroundColor: 'white',
            border: '1.5px solid #0d99ff',
            borderRadius: 2,
            cursor: h.cursor,
            zIndex: 100,
          }}
          onMouseDown={(e) => handleResizeStart(e, h.anchor)}
        />
      ))}

      {/* Size label */}
      <div
        style={{
          position: 'absolute',
          left: minX,
          top: maxY + 6,
          fontSize: 11,
          color: '#0d99ff',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '1px 4px',
          borderRadius: 2,
        }}
      >
        {Math.round(bw)} × {Math.round(bh)}
      </div>
    </>
  );
}
