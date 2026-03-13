import React, { useRef } from "react";
import {
  MousePointer2,
  Frame,
  Square,
  Circle,
  Minus,
  Type,
  Hand,
  MessageSquare,
  PenTool,
  Pencil,
  ArrowUpRight,
  Image,
  Component,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../utils/cn";
import type { ToolType } from "../../types";
import JRLogo from "../../assets/JR_color.svg"; // adjust path as needed

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
}

function ToolButton({
  icon,
  label,
  shortcut,
  active,
  onClick,
}: ToolButtonProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-lg transition-all",
          active
            ? "bg-(--primary) text-(--text)"
            : "text-(--text-dim) hover:text-(--text) hover:bg-(--hover)"
        )}
        title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      >
        {icon}
      </button>

      {/* Tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center gap-1 pointer-events-none">
        <div className="bg-(--panel-2) border border-(--border) rounded px-2 py-1 text-xs text-(--text) whitespace-nowrap">
          {label}
          {shortcut && (
            <span className="ml-1 text-(--text-dim) font-mono">{shortcut}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="w-6 h-px bg-(--border) my-1" />;
}

export function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const addObject = useStore((s) => s.addObject);
  const zoom = useStore((s) => s.viewState.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      addObject({
        id: crypto.randomUUID(),
        type: "image",
        name: file.name,
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fills: [],
        stroke: "#000000",
        strokeWidth: 0,
        strokeOpacity: 1,
        shadows: [],
        blurs: [],
        blendMode: "normal",
        src,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const tools: Array<{
    tool: ToolType;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
  }> = [
    { tool: "select", icon: <MousePointer2 size={16} />, label: "Move", shortcut: "V" },
    { tool: "hand", icon: <Hand size={16} />, label: "Hand Tool", shortcut: "H" },
    { tool: "frame", icon: <Frame size={16} />, label: "Frame", shortcut: "F" },
    { tool: "rectangle", icon: <Square size={16} />, label: "Rectangle", shortcut: "R" },
    { tool: "circle", icon: <Circle size={16} />, label: "Ellipse", shortcut: "O" },
    { tool: "line", icon: <Minus size={16} />, label: "Line", shortcut: "L" },
    { tool: "arrow", icon: <ArrowUpRight size={16} />, label: "Arrow" },
    { tool: "pen", icon: <PenTool size={16} />, label: "Pen", shortcut: "P" },
    { tool: "pencil", icon: <Pencil size={16} />, label: "Pencil" },
    { tool: "text", icon: <Type size={16} />, label: "Text", shortcut: "T" },
    { tool: "image", icon: <Image size={16} />, label: "Image" },
    { tool: "resources", icon: <Component size={16} />, label: "Resources" },
    { tool: "comment", icon: <MessageSquare size={16} />, label: "Comment", shortcut: "Alt+C" },
  ];

  return (
    <div className="flex flex-col items-center gap-1 w-12 bg-(--panel) border-r border-(--border) py-3 px-1.5 overflow-y-auto">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      {/* JR Logo */}
      <div className="w-8 h-8 flex items-center justify-center mb-1">
        <img src={JRLogo} alt="JR Logo" className="w-full h-full object-contain" />
      </div>

      <Separator />

      {/* Tools */}
      {tools.map((t) => (
        <ToolButton
          key={t.tool}
          icon={t.icon}
          label={t.label}
          shortcut={t.shortcut}
          active={activeTool === t.tool}
          onClick={() => {
            if (t.tool === "image") {
              setActiveTool("image");
              fileInputRef.current?.click();
            } else {
              setActiveTool(t.tool);
            }
          }}
          tool={t.tool}
        />
      ))}

      <div className="flex-1" />
      <Separator />

      {/* Zoom controls */}
      <div className="relative group">
        <button
          onClick={() => setZoom(Math.min(zoom * 1.25, 256))}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="relative group">
        <button
          onClick={() => setZoom(Math.max(zoom / 1.25, 0.02))}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
        >
          <ZoomOut size={16} />
        </button>
      </div>

      <div className="relative group">
        <button
          onClick={() => {
            setZoom(1);
            setPan(0, 0);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-dim) hover:text-(--text) hover:bg-(--hover) transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="text-[9px] text-(--text-dim) tabular-nums">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}