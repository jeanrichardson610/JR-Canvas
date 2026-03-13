import React, { useState, useRef } from "react";
import { Search, Component, Image as ImageIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../utils/cn";

const PRESET_COMPONENTS = [
  { id: "btn-primary", name: "Button Primary", category: "Buttons" },
  { id: "btn-secondary", name: "Button Secondary", category: "Buttons" },
  { id: "navbar", name: "Navbar", category: "Navigation" },
  { id: "card", name: "Card", category: "Cards" },
  { id: "modal", name: "Modal Dialog", category: "Overlays" },
  { id: "input", name: "Text Input", category: "Forms" },
  { id: "checkbox", name: "Checkbox", category: "Forms" },
  { id: "toggle", name: "Toggle", category: "Forms" },
  { id: "badge", name: "Badge", category: "Display" },
  { id: "avatar", name: "Avatar", category: "Display" },
  { id: "alert", name: "Alert", category: "Feedback" },
  { id: "progress", name: "Progress Bar", category: "Feedback" },
];

export function AssetsPanel({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null>; }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"components" | "local">("components");
  const components = useStore((s) => s.components);
  const addObject = useStore((s) => s.addObject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = PRESET_COMPONENTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, c) => { (acc[c.category] ??= []).push(c); return acc; }, {});

  const placeInCenter = () => {
    if (!canvasRef?.current) return { x: 0, y: 0 };
    const { zoom, panX, panY } = useStore.getState().viewState;
    const { clientWidth: w, clientHeight: h } = canvasRef.current;
    return { x: (-panX + w / 2) / zoom - 50, y: (-panY + h / 2) / zoom - 50 };
  };

  const handleAddImageFile = (file: File) => {
    if (!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { x, y } = placeInCenter();
      const id = `img_${Date.now()}`;
      addObject({
        id, type: "image", name: "Image", src: reader.result as string,
        x, y, width: 400, height: 400, rotation: 0, opacity: 1,
        fills: [], stroke: "transparent", strokeWidth: 0, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: "normal",
        visible: true, locked: false,
      });
      useStore.getState().setSelectedIds([id]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleAddImageFile(file); e.target.value = ""; };
  const handleAddImageClick = () => fileInputRef.current?.click();
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleAddImageFile(file); };
  const handleDragStartComponent = (component: typeof PRESET_COMPONENTS[0], e: React.DragEvent) => {
    const { x, y } = placeInCenter();
    const id = `comp_${Date.now()}`;
    addObject({
      id, type: "component", name: component.name, componentId: component.id,
      x, y, width: 100, height: 100, rotation: 0, opacity: 1,
      fills: [], stroke: "", strokeWidth: 0, strokeOpacity: 1,
      shadows: [], blurs: [], blendMode: "normal",
      visible: true, locked: false,
    });
    useStore.getState().setSelectedIds([id]);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {/* Tabs */}
      <div className="flex border-b border-(--border)">
        <button
          onClick={() => setActiveTab("components")}
          className={cn("flex-1 py-2 text-xs font-medium",
            activeTab === "components"
              ? "text-(--text) border-b-2 border-(--primary)"
              : "text-(--text-dim) hover:text-(--text)"
          )}
        >Components</button>
        <button
          onClick={() => setActiveTab("local")}
          className={cn("flex-1 py-2 text-xs font-medium",
            activeTab === "local"
              ? "text-(--text) border-b-2 border-(--primary)"
              : "text-(--text-dim) hover:text-(--text)"
          )}
        >Local ({components.length})</button>
      </div>

      {/* Add Image */}
      <div className="p-2">
        <label
          onClick={handleAddImageClick}
          className="flex items-center gap-1 p-2 bg-(--panel-2) text-(--text-dim) hover:bg-(--primary)/10 hover:text-(--text) rounded w-full justify-center cursor-pointer"
        >
          <ImageIcon size={16} />
          Add Image
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileChange} />
        </label>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="flex items-center gap-2 bg-(--panel-2) border border-(--border) rounded px-2 py-1">
          <Search size={12} className="text-(--text-dim)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="flex-1 bg-transparent text-xs text-(--text) outline-none placeholder:text-(--text-dim)"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {activeTab === "components" ? (
          Object.entries(groups).map(([category, items]) => (
            <div key={category} className="mb-3">
              <div className="text-[10px] font-semibold text-(--text-dim) uppercase tracking-wide mb-1 px-1">{category}</div>
              <div className="grid grid-cols-2 gap-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStartComponent(item, e)}
                    className="flex flex-col items-center gap-1 p-2 rounded bg-(--panel-2) border border-(--border) cursor-grab hover:border-(--primary) hover:bg-(--primary)/10 transition-all group"
                  >
                    <div className="w-full h-8 bg-(--panel) rounded flex items-center justify-center">
                      <Component size={16} className="text-(--text-dim) group-hover:text-(--primary)" />
                    </div>
                    <span className="text-[10px] text-(--text-dim) text-center leading-tight truncate w-full">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div>
            {components.length === 0 ? (
              <div className="text-center py-8">
                <Component size={32} className="text-(--text-dim) mx-auto mb-2" />
                <p className="text-(--text-dim) text-xs">No local components yet.</p>
                <p className="text-(--text-dim) text-xs mt-1">Right-click an object and select "Create Component"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 mt-1">
                {components.map(comp => (
                  <div
                    key={comp.id}
                    className="flex flex-col items-center gap-1 p-2 rounded bg-(--panel-2) border border-(--border) cursor-grab hover:border-(--primary) transition-all"
                  >
                    <div className="w-full h-8 bg-(--panel) rounded flex items-center justify-center">
                      <Component size={16} className="text-(--primary)" />
                    </div>
                    <span className="text-[10px] text-(--text-dim) truncate w-full text-center">{comp.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}