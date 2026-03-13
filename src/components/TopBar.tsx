import React, { useState } from "react";
import {
  ChevronDown,
  Undo2,
  Redo2,
  Share2,
  Play,
  Users,
  Grid3x3,
  Eye,
  MessageSquare,
  ZoomIn,
  Moon,
  Sun,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { cn } from "../utils/cn";

export function TopBar() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const zoom = useStore((s) => s.viewState.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const showComments = useStore((s) => s.showComments);
  const setShowComments = useStore((s) => s.setShowComments);
  const [fileName, setFileName] = useState("Untitled");
  const [editingName, setEditingName] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const zoomLevels = [25, 50, 75, 100, 150, 200, 400, 800];

  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  interface VideoPanelState {
    visible: boolean;
    currentIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const [videoPanel, setVideoPanel] = useState<VideoPanelState>({
    visible: false,
    currentIndex: 0,
    x: 0,
    y: 0,
    width: 500,
    height: 300,
  });

  const videos = ["/assets/CC.mp4", "/assets/DD.mp4"];

  React.useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
  }, [theme]);

  return (
    <div className="flex items-center h-11 bg-(--panel) border-b border-(--border) px-3 gap-3 shrink-0 text-(--text)">
      {/* File name */}
      <div className="flex items-center gap-1">
        {editingName ? (
          <input
            autoFocus
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape")
                setEditingName(false);
            }}
            className="bg-(--panel-2) border border-[#0d99ff] rounded px-2 py-0.5 text-sm text-(--text) outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm text-(--text) font-medium hover:text-(--text-dim) transition-all"
          >
            {fileName}
          </button>
        )}
        <ChevronDown size={14} className="text-(--text-dim)" />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#3a3a3a]" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          title="Undo (Ctrl+Z)"
          className="w-8 h-8 flex items-center justify-center rounded text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          title="Redo (Ctrl+Shift+Z)"
          className="w-8 h-8 flex items-center justify-center rounded text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#3a3a3a]" />

      {/* Zoom selector */}
      <div className="relative">
        <button
          onClick={() => setShowZoomMenu(!showZoomMenu)}
          className="hidden md:flex items-center gap-1 text-xs text-(--text-dim) hover:text-(--text) bg-(--panel-2) border border-(--border) rounded px-2 py-1 transition-all"
        >
          <ZoomIn size={12} />
          {Math.round(zoom * 100)}%
          <ChevronDown size={10} />
        </button>
        {showZoomMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowZoomMenu(false)}
            />
            <div className="absolute top-full mt-1 left-0 z-50 bg-(--panel) border border-(--border) rounded-lg shadow-2xl py-1 w-32">
              {zoomLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setZoom(level / 100);
                    setShowZoomMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-(--hover) transition-all",
                    Math.round(zoom * 100) === level
                      ? "text-[#0d99ff]"
                      : "text-(--text-dim)",
                  )}
                >
                  {level}%
                </button>
              ))}
              <div className="border-t border-(--border) mt-1 pt-1">
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan(0, 0);
                    setShowZoomMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#aaa] hover:bg-[#3a3a3a]"
                >
                  Fit to Screen
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grid toggle */}
      <button
        title="Toggle Grid"
        className="hidden md:flex w-8 h-8 items-center justify-center rounded text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
      >
        <Grid3x3 size={15} />
      </button>

      {/* Comments toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        title="Toggle Comments"
        className={cn(
          " w-8 h-8 hidden md:flex items-center justify-center rounded transition-all",
          showComments
            ? "text-(--text-dim) hover:text-(--text) hover:bg-(--hover)"
            : "text-[#0d99ff] bg-[#0d99ff20]",
        )}
      >
        <MessageSquare size={15} />
      </button>

      {/* Spacer */}
      <div className="flex-1 hidden md:block" />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded text-(--text-dim) hover:text-(--text) hover:bg-(--hover)"
      >
        {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      {/* Collaborators (placeholder) */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex -space-x-2">
          {["#ef4444", "#3b82f6", "#10b981"].map((color, i) => (
            <div
              key={i}
              style={{ backgroundColor: color }}
              className="w-7 h-7 rounded-full border-2 border-(--panel) flex items-center justify-center text-white text-[10px] font-bold"
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <Users size={14} className="text-(--text-dim)" />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#3a3a3a]" />

      {/* Share button */}
      <button
        onClick={() => {
          window.open(
            "https://www.jr-studio.space/",
            "_blank",
            "noopener,noreferrer",
          );
        }}
        className="flex items-center gap-1.5 bg-[#0d99ff] hover:bg-[#0a7acc] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
      >
        <Share2 size={13} />
        To JR Studio
      </button>

      {/* Present button */}
      <button
        className="hidden md:flex items-center gap-1.5 bg-[#1e1e1e] hover:bg-[#3a3a3a] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
        onClick={() => {
          const idx = Math.floor(Math.random() * videos.length);

          // Determine panel size based on viewport
          const panelWidth =
            window.innerWidth < 640
              ? 300
              : window.innerWidth < 1024
                ? 400
                : 500;
          const panelHeight = window.innerWidth < 640 ? 200 : 300;

          // Center panel
          const x = (window.innerWidth - panelWidth) / 2;
          const y = (window.innerHeight - panelHeight) / 2;

          setVideoPanel({
            visible: true,
            currentIndex: idx,
            x,
            y,
            width: panelWidth,
            height: panelHeight,
          });
        }}
      >
        <Play size={13} />
        Present
      </button>

      {/* Video Panel */}
      {videoPanel.visible && (
        <div
          className="absolute bg-black rounded shadow-lg"
          style={{
            left: videoPanel.x,
            top: videoPanel.y,
            width: videoPanel.width,
            height: videoPanel.height,
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
            touchAction: "none", // important for pointer events
            cursor: "move",
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const origX = videoPanel.x;
            const origY = videoPanel.y;

            const onPointerMove = (ev: PointerEvent) => {
              const newX = origX + (ev.clientX - startX);
              const newY = origY + (ev.clientY - startY);

              // Keep panel inside viewport
              const clampedX = Math.max(
                0,
                Math.min(newX, window.innerWidth - videoPanel.width),
              );
              const clampedY = Math.max(
                0,
                Math.min(newY, window.innerHeight - videoPanel.height),
              );

              setVideoPanel((prev) => ({
                ...prev,
                x: clampedX,
                y: clampedY,
              }));
            };

            const onPointerUp = () => {
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
            };

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
          }}
        >
          <video
            src={videos[videoPanel.currentIndex]}
            controls
            autoPlay
            muted
            style={{ flex: 1, width: "100%", borderRadius: "6px 6px 0 0" }}
          />
          <div className="flex justify-center gap-4 p-2 bg-gray-900 rounded-b-lg">
            <button
              className="text-white px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
              onClick={() =>
                setVideoPanel((prev) => ({
                  ...prev,
                  currentIndex:
                    (prev.currentIndex - 1 + videos.length) % videos.length,
                }))
              }
            >
              ◀
            </button>
            <button
              className="text-white px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
              onClick={() =>
                setVideoPanel((prev) => ({
                  ...prev,
                  currentIndex: (prev.currentIndex + 1) % videos.length,
                }))
              }
            >
              ▶
            </button>
            <button
              className="text-white px-3 py-1 bg-red-600 rounded hover:bg-red-500"
              onClick={() =>
                setVideoPanel((prev) => ({ ...prev, visible: false }))
              }
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
