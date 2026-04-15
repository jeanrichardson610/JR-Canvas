import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { screenToCanvas } from '../../utils/geometry';
import type { CanvasObject, FrameObject, TextObject, PathObject } from '../../types';
import { cn } from '../../utils/cn';
import { TextEditor } from './TextEditor';
import { CommentPin } from './CommentPin';
import { ObjectRenderer } from './ObjectRenderer';
import { SelectionBox } from './SelectionBox';

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function createDefaultFill(color = '#d4d4d4') {
  return [{ type: 'solid' as const, color, opacity: 1 }];
}

export function Canvas({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  

  const activeTool = useStore((s) => s.activeTool);
  const viewState = useStore((s) => s.viewState);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const addObject = useStore((s) => s.addObject);
  const updateObject = useStore((s) => s.updateObject);
  const selectedIds = useStore((s) => s.selectedIds);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const clearSelection = useStore((s) => s.clearSelection);
  const editingTextId = useStore((s) => s.editingTextId);
  const setEditingTextId = useStore((s) => s.setEditingTextId);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const addComment = useStore((s) => s.addComment);
  const showComments = useStore((s) => s.showComments);
  const comments = useStore((s) => s.comments);
  const currentPage = useStore((s) => s.getCurrentPage());

  const { zoom, panX, panY } = viewState;

  // Use refs for drawing to avoid stale closures
  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  useEffect(() => { zoomRef.current = zoom; panXRef.current = panX; panYRef.current = panY; }, [zoom, panX, panY]);

  // Drawing state (refs for use in window events)
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const drawCurrentRef = useRef({ x: 0, y: 0 });
  const penPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  // React state for rendering previews
  const [drawPreviewState, setDrawPreviewState] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [penPointsState, setPenPointsState] = useState<Array<{ x: number; y: number }>>([]);

  // Panning refs
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panStartPosRef = useRef({ x: 0, y: 0 });

  // Space key panning
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const isSpacePanningRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement).isContentEditable) {
          setIsSpacePanning(true);
          isSpacePanningRef.current = true;
          e.preventDefault();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePanning(false);
        isSpacePanningRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Marquee
  const [marqueeDraw, setMarqueeDraw] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStartRef = useRef({ x: 0, y: 0 });
  const isMarqueeRef = useRef(false);
  const shiftHeldRef = useRef(false);

  const [isPanning, setIsPanning] = useState(false);

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return screenToCanvas(
      clientX - rect.left,
      clientY - rect.top,
      panXRef.current,
      panYRef.current,
      zoomRef.current
    );
  }, []);

  // Wheel zoom/pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const curZoom = zoomRef.current;
        const newZoom = Math.min(Math.max(curZoom * factor, 0.02), 256);
        const newPanX = mouseX - (mouseX - panXRef.current) * (newZoom / curZoom);
        const newPanY = mouseY - (mouseY - panYRef.current) * (newZoom / curZoom);
        setZoom(newZoom);
        setPan(newPanX, newPanY);
      } else {
        setPan(panXRef.current - e.deltaX, panYRef.current - e.deltaY);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom, setPan]);

  // Global mouse move/up for drawing (prevents losing events when mouse leaves canvas)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      shiftHeldRef.current = e.shiftKey;
      const pos = getCanvasPos(e.clientX, e.clientY);

      // Panning
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan(panStartPosRef.current.x + dx, panStartPosRef.current.y + dy);
        return;
      }

      // Pencil
      if (activeToolRef.current === 'pencil' && isDrawingRef.current) {
        penPointsRef.current = [...penPointsRef.current, pos];
        setPenPointsState([...penPointsRef.current]);
        return;
      }

      // Shape drawing preview (with Shift constrain)
      if (isDrawingRef.current) {
        drawCurrentRef.current = pos;
        let x2 = pos.x;
        let y2 = pos.y;
        if (e.shiftKey && ['rectangle', 'circle', 'frame'].includes(activeToolRef.current)) {
          const dx = pos.x - drawStartRef.current.x;
          const dy = pos.y - drawStartRef.current.y;
          const size = Math.max(Math.abs(dx), Math.abs(dy));
          x2 = drawStartRef.current.x + Math.sign(dx) * size;
          y2 = drawStartRef.current.y + Math.sign(dy) * size;
          drawCurrentRef.current = { x: x2, y: y2 };
        }
        setDrawPreviewState({ x1: drawStartRef.current.x, y1: drawStartRef.current.y, x2, y2 });
      }

      // Marquee
      if (isMarqueeRef.current) {
        const mx = marqueeStartRef.current.x;
        const my = marqueeStartRef.current.y;
        setMarqueeDraw({
          x: Math.min(pos.x, mx),
          y: Math.min(pos.y, my),
          w: Math.abs(pos.x - mx),
          h: Math.abs(pos.y - my),
        });
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY);

      // Stop panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
        return;
      }

      // Pencil finish
      if (activeToolRef.current === 'pencil' && isDrawingRef.current) {
        isDrawingRef.current = false;
        setDrawPreviewState(null);
        if (penPointsRef.current.length > 1) {
          finishPath(penPointsRef.current);
        }
        penPointsRef.current = [];
        setPenPointsState([]);
        useStore.getState().setActiveTool('select');
        return;
      }

      // Shape finish
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setDrawPreviewState(null);
        const start = drawStartRef.current;
        // Use constrained endpoint (already stored in drawCurrentRef by mousemove)
        const end = drawCurrentRef.current;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        if (w > 2 || h > 2) {
          createShape(x, y, Math.max(w, 1), Math.max(h, 1), start, end);
        }
        useStore.getState().setActiveTool('select');
        return;
      }

      // Marquee finish
      if (isMarqueeRef.current) {
        isMarqueeRef.current = false;
        setMarqueeDraw((md) => {
          if (!md) return null;
          const { x, y, w, h } = md;
          if (w > 5 || h > 5) {
            const page = useStore.getState().getCurrentPage();
            const inRect = Object.values(page.objects).filter((obj) =>
              obj.x < x + w && obj.x + obj.width > x &&
              obj.y < y + h && obj.y + obj.height > y &&
              obj.visible && !obj.locked
            );
            if (inRect.length > 0) setSelectedIds(inRect.map((o) => o.id));
          }
          return null;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    window.addEventListener('pointermove', onMouseMove);
window.addEventListener('pointerup', onMouseUp);
window.addEventListener('pointercancel', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
window.removeEventListener('mouseup', onMouseUp);

window.removeEventListener('pointermove', onMouseMove);
window.removeEventListener('pointerup', onMouseUp);
window.removeEventListener('pointercancel', onMouseUp);
    };
  }, [getCanvasPos, setPan, setSelectedIds]);

  const finishPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    // Use coordinates RELATIVE to bounding box (minX/minY),
    // because the SVG element is already offset by obj.x / obj.y
    const d = points.reduce((acc, pt, i) => {
      const rx = pt.x - minX;
      const ry = pt.y - minY;
      return acc + (i === 0 ? `M ${rx} ${ry}` : ` L ${rx} ${ry}`);
    }, '');
    const id = generateId();
    addObject({
      id, type: 'path', name: 'Path',
      x: minX, y: minY,
      width: maxX - minX || 1, height: maxY - minY || 1,
      rotation: 0, opacity: 1, visible: true, locked: false,
      fills: [],
      stroke: '#000000', strokeWidth: 2, strokeOpacity: 1,
      shadows: [], blurs: [], blendMode: 'normal',
      svgPath: d, points,
    } as PathObject);
    setSelectedIds([id]);
  };

  const createShape = (
    x: number, y: number, width: number, height: number,
    start: { x: number; y: number }, end: { x: number; y: number }
  ) => {
    const tool = activeToolRef.current;
    const id = generateId();

    if (tool === 'frame') {
      addObject({
        id, type: 'frame', name: 'Frame',
        x, y, width, height,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1 }],
        stroke: '#cccccc', strokeWidth: 1, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal',
        children: [], clipContent: true, background: '#ffffff',
      } as FrameObject);
      setSelectedIds([id]);
      return;
    }

    if (tool === 'rectangle') {
      addObject({
        id, type: 'rectangle', name: 'Rectangle',
        x, y, width, height,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: createDefaultFill('#d4d4d4'),
        stroke: 'transparent', strokeWidth: 0, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal', cornerRadius: 0,
      });
      setSelectedIds([id]);
    }

    if (tool === 'circle') {
      addObject({
        id, type: 'circle', name: 'Ellipse',
        x, y, width, height,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: createDefaultFill('#d4d4d4'),
        stroke: 'transparent', strokeWidth: 0, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal',
      });
      setSelectedIds([id]);
    }

    if (tool === 'line' || tool === 'arrow') {
      addObject({
        id, type: tool === 'arrow' ? 'arrow' : 'line',
        name: tool === 'arrow' ? 'Arrow' : 'Line',
        x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x) || 1,
        height: Math.abs(end.y - start.y) || 1,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: [],
        stroke: '#000000', strokeWidth: 2, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal',
        points: [start.x, start.y, end.x, end.y],
        strokeCap: tool === 'arrow' ? 'arrow' : 'none',
      } as CanvasObject);
      setSelectedIds([id]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // Stop text editing on canvas click
    if (editingTextId) {
      setEditingTextId(null);
      return;
    }

    const pos = getCanvasPos(e.clientX, e.clientY);

    // Pan tool or space key
    if (activeToolRef.current === 'hand' || isSpacePanningRef.current) {
      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panStartPosRef.current = { x: panXRef.current, y: panYRef.current };
      return;
    }

    // Comment
    if (activeToolRef.current === 'comment') {
      addComment(pos.x, pos.y);
      return;
    }

    // Pen (click to add point, double-click to finish)
    if (activeToolRef.current === 'pen') {
      if (e.detail === 2 && penPointsRef.current.length >= 2) {
        finishPath(penPointsRef.current);
        penPointsRef.current = [];
        setPenPointsState([]);
        useStore.getState().setActiveTool('select');
      } else {
        penPointsRef.current = [...penPointsRef.current, pos];
        setPenPointsState([...penPointsRef.current]);
      }
      return;
    }

    // Pencil freehand
    if (activeToolRef.current === 'pencil') {
      isDrawingRef.current = true;
      drawStartRef.current = pos;
      penPointsRef.current = [pos];
      setPenPointsState([pos]);
      return;
    }

    // Text tool
    if (activeToolRef.current === 'text') {
      const id = generateId();
      addObject({
        id, type: 'text', name: 'Text',
        x: pos.x, y: pos.y, width: 200, height: 40,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: [],
        stroke: 'transparent', strokeWidth: 0, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal',
        text: 'Text', fontSize: 16, fontFamily: 'Inter',
        fontWeight: '400', fontStyle: 'normal', textAlign: 'left',
        lineHeight: 1.4, letterSpacing: 0, textDecoration: 'none',
        textColor: '#000000',
      } as TextObject);
      setSelectedIds([id]);
      setEditingTextId(id);
      setActiveTool('select');
      return;
    }

    // Shape tools
    if (['rectangle', 'circle', 'line', 'arrow', 'frame'].includes(activeToolRef.current)) {
      isDrawingRef.current = true;
      drawStartRef.current = pos;
      drawCurrentRef.current = pos;
      setDrawPreviewState({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      return;
    }

    // Select tool → marquee
    if (activeToolRef.current === 'select') {
      clearSelection();
      marqueeStartRef.current = pos;
      isMarqueeRef.current = true;
      setMarqueeDraw({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (activeTool === 'hand' || isSpacePanning) return 'cursor-grab';
    if (activeTool === 'text') return 'cursor-text';
    if (['rectangle', 'circle', 'line', 'arrow', 'frame', 'pen', 'pencil', 'comment'].includes(activeTool)) return 'cursor-crosshair';
    return 'cursor-default';
  };

  // Render draw preview
  const renderDrawPreview = () => {
    if (!drawPreviewState) return null;
    const { x1, y1, x2, y2 } = drawPreviewState;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    if (activeTool === 'line' || activeTool === 'arrow') {
      return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line
            x1={x1 * zoom + panX} y1={y1 * zoom + panY}
            x2={x2 * zoom + panX} y2={y2 * zoom + panY}
            stroke="#0d99ff" strokeWidth="2" strokeDasharray="4"
          />
        </svg>
      );
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: x * zoom + panX,
          top: y * zoom + panY,
          width: w * zoom,
          height: h * zoom,
          border: '2px solid #0d99ff',
          backgroundColor: 'rgba(13,153,255,0.08)',
          pointerEvents: 'none',
          borderRadius: activeTool === 'circle' ? '50%' : 0,
        }}
      />
    );
  };

  const renderPenPreview = () => {
    if (penPointsState.length === 0) return null;
    const d = penPointsState.reduce((acc, pt, i) =>
      acc + (i === 0 ? `M ${pt.x * zoom + panX} ${pt.y * zoom + panY}` : ` L ${pt.x * zoom + panX} ${pt.y * zoom + panY}`), '');
    return (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d={d} stroke="#0d99ff" strokeWidth="2" fill="none" />
        {penPointsState.map((pt, i) => (
          <circle key={i}
            cx={pt.x * zoom + panX} cy={pt.y * zoom + panY}
            r={4}
            fill={i === 0 ? '#0d99ff' : 'white'}
            stroke="#0d99ff" strokeWidth="1.5"
          />
        ))}
      </svg>
    );
  };

  const renderMarquee = () => {
    if (!marqueeDraw) return null;
    const { x, y, w, h } = marqueeDraw;
    return (
      <div
        style={{
          position: 'absolute',
          left: x * zoom + panX,
          top: y * zoom + panY,
          width: w * zoom,
          height: h * zoom,
          border: '1px solid #0d99ff',
          backgroundColor: 'rgba(13,153,255,0.06)',
          pointerEvents: 'none',
        }}
      />
    );
  };

  const theme = useStore((s) => s.theme);
  const canvasBg =
  theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';

  return (
    <div
      ref={canvasRef}
      className={cn('absolute inset-0 overflow-hidden', canvasBg, getCursorClass())}
      onPointerDown={(e) => {
  handleMouseDown(e as unknown as React.MouseEvent);
}}
style={{
  touchAction: "none",
}}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3a3a3a 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${panX % (20 * zoom)}px ${panY % (20 * zoom)}px`,
        }}
      />

      {/* Objects layer — transformed for zoom/pan */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        {currentPage.objectOrder.map((id) => {
          const obj = currentPage.objects[id];
          if (!obj || !obj.visible) return null;
          return (
            <ObjectRenderer
              key={id}
              obj={obj}
              zoom={zoom}
              selected={selectedIds.includes(id)}
              editing={editingTextId === id}
              onSelect={(e) => {
                e.stopPropagation();
                if (obj.locked) return;
                if (e.shiftKey) {
                  if (selectedIds.includes(id)) {
                    useStore.getState().removeFromSelection(id);
                  } else {
                    useStore.getState().addToSelection(id);
                  }
                } else if (!selectedIds.includes(id)) {
                  setSelectedIds([id]);
                }
              }}
              onDragMove={(dx, dy) => {
  const store = useStore.getState();
  const page = store.getCurrentPage();

  const obj = page.objects[id];
  if (!obj || obj.locked) return;

  const deltaX = dx / zoomRef.current;
  const deltaY = dy / zoomRef.current;

  // 🧠 if object is part of a group, move ALL siblings
  if (obj.parentId) {
    const groupId = obj.parentId;

    const group = page.objects[groupId];
    if (!group || group.type !== 'group') return;

    (group.children as string[]).forEach((childId) => {
      const child = page.objects[childId];
      if (!child || child.locked) return;

      store.updateObject(childId, {
        x: child.x + deltaX,
        y: child.y + deltaY,
      });
    });

    return;
  }

  // normal single object move
  store.updateObject(id, {
    x: obj.x + deltaX,
    y: obj.y + deltaY,
  });
}}
              onDoubleClick={() => {
                if (obj.type === 'text') {
                  setSelectedIds([id]);
                  setEditingTextId(id);
                }
              }}
            />
          );
        })}

        {/* Selection handles */}
        {selectedIds.length > 0 && activeTool === 'select' && !editingTextId && (
          <SelectionBox
            selectedIds={selectedIds}
            objects={currentPage.objects}
            zoom={zoom}
          />
        )}
      </div>

      {/* Overlays (not affected by canvas transform) */}
      {renderDrawPreview()}
      {renderPenPreview()}
      {renderMarquee()}

      {/* Comments */}
      {showComments && comments
        .filter((c) => c.pageId === currentPage.id)
        .map((comment) => (
          <CommentPin
            key={comment.id}
            comment={comment}
            x={comment.x * zoom + panX}
            y={comment.y * zoom + panY}
          />
        ))}

      {/* Text editor overlay */}
      {editingTextId && currentPage.objects[editingTextId] && (
        <TextEditor
          obj={currentPage.objects[editingTextId] as TextObject}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onClose={() => setEditingTextId(null)}
        />
      )}

      {/* Zoom indicator */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          background: '#2c2c2c',
          border: '1px solid #3a3a3a',
          borderRadius: 20,
          padding: '3px 12px',
          fontSize: 12,
          color: '#888',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}