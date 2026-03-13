import React, { useEffect, useRef } from "react";
import { TopBar } from "./components/TopBar";
import { Toolbar } from "./components/toolbar/Toolbar";
import { LeftSidebar } from "./components/sidebar/LeftSidebar";
import { Canvas } from "./components/canvas/Canvas";
import { RightSidebar } from "./components/properties/RightSidebar";
import { useKeyboard } from "./hooks/useKeyboard";
import { useStore } from "./store/useStore";

function ContextMenu() {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const selectedIds = useStore((s) => s.selectedIds);
  const deleteObjects = useStore((s) => s.deleteObjects);
  const duplicateObjects = useStore((s) => s.duplicateObjects);
  const groupObjects = useStore((s) => s.groupObjects);
  const ungroupObject = useStore((s) => s.ungroupObject);
  const moveObjectInOrder = useStore((s) => s.moveObjectInOrder);
  const registerComponent = useStore((s) => s.registerComponent);
  const getCurrentPage = useStore((s) => s.getCurrentPage);

  React.useEffect(() => {
    const onContext = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".figma-canvas")) {
        e.preventDefault();
        if (selectedIds.length > 0) setPos({ x: e.clientX, y: e.clientY });
      }
    };
    const onClose = () => setPos(null);
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("click", onClose);
    window.addEventListener("keydown", onClose);
    return () => {
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("click", onClose);
      window.removeEventListener("keydown", onClose);
    };
  }, [selectedIds]);

  if (!pos || selectedIds.length === 0) return null;

  const page = getCurrentPage();
  const selected = selectedIds.map((id) => page.objects[id]).filter(Boolean);
  const isGroup = selected.length === 1 && selected[0]?.type === "group";

  const items = [
    { label: "Copy (Ctrl+C)", action: () => {}, divider: false },
    { label: "Paste (Ctrl+V)", action: () => {}, divider: false },
    {
      label: "Duplicate (Ctrl+D)",
      action: () => duplicateObjects(selectedIds),
      divider: true,
    },
    {
      label: "Bring to Front (])",
      action: () => moveObjectInOrder(selectedIds[0], "top"),
      divider: false,
    },
    {
      label: "Send to Back ([)",
      action: () => moveObjectInOrder(selectedIds[0], "bottom"),
      divider: true,
    },
    ...(selectedIds.length >= 2
      ? [
          {
            label: "Group (Ctrl+G)",
            action: () => groupObjects(selectedIds),
            divider: false,
          },
        ]
      : []),
    ...(isGroup
      ? [
          {
            label: "Ungroup (Ctrl+Shift+G)",
            action: () => ungroupObject(selectedIds[0]),
            divider: false,
          },
        ]
      : []),
    {
      label: "Create Component",
      action: () => {
        const obj = page.objects[selectedIds[0]];
        if (obj) registerComponent(obj.id, obj.name);
      },
      divider: true,
    },
    {
      label: "Delete (Del)",
      action: () => deleteObjects(selectedIds),
      divider: false,
      danger: true,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        backgroundColor: "#2c2c2c",
        border: "1px solid #3a3a3a",
        borderRadius: 8,
        padding: "4px 0",
        minWidth: 200,
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && (
            <div
              style={{ height: 1, backgroundColor: "#3a3a3a", margin: "4px 0" }}
            />
          )}
          <button
            onClick={() => {
              item.action();
              setPos(null);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 14px",
              fontSize: 12,
              color: (item as { danger?: boolean }).danger
                ? "#f87171"
                : "#e0e0e0",
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3a3a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function App() {
  useKeyboard();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#1e1e1e] overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        {/* Left Sidebar: hidden on small screens */}
      <div className="hidden lg:flex">
        <LeftSidebar canvasRef={canvasRef} />
      </div>
        <div className="figma-canvas flex-1 overflow-hidden relative">
          <Canvas canvasRef={canvasRef} />
        </div>
        {/* Right Sidebar: hidden on small screens */}
      <div className="hidden lg:flex">
        <RightSidebar />
      </div>
      </div>
      <ContextMenu />
    </div>
  );
}
