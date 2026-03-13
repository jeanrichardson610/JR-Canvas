import React, { useState, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Type,
  Frame,
  Minus,
  ChevronRight,
  ChevronDown,
  Group,
  Image,
  PenTool,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { CanvasObject } from '../../types';

function getObjectIcon(type: string) {
  switch (type) {
    case 'frame': return <Frame size={12} />;
    case 'rectangle': return <Square size={12} />;
    case 'circle': return <Circle size={12} />;
    case 'text': return <Type size={12} />;
    case 'line':
    case 'arrow': return <Minus size={12} />;
    case 'path': return <PenTool size={12} />;
    case 'group': return <Group size={12} />;
    case 'image': return <Image size={12} />;
    default: return <Square size={12} />;
  }
}

interface LayerItemProps {
  obj: CanvasObject;
  depth: number;
  allObjects: Record<string, CanvasObject>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function LayerItem({ obj, depth, allObjects, fileInputRef }: LayerItemProps) {
  const selectedIds = useStore((s) => s.selectedIds);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const addToSelection = useStore((s) => s.addToSelection);
  const updateObject = useStore((s) => s.updateObject);
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(obj.name);

  const isSelected = selectedIds.includes(obj.id);
  const hasChildren = (obj.type === 'frame' || obj.type === 'group') &&
    ((obj as { children?: string[] }).children?.length ?? 0) > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) addToSelection(obj.id);
    else setSelectedIds([obj.id]);
  };
  const handleDoubleClick = () => setRenaming(true);
  const commitRename = () => { updateObject(obj.id, { name: nameVal }); setRenaming(false); };
  const handleImageClick = (e: React.MouseEvent) => { e.stopPropagation(); obj.type === 'image' && fileInputRef.current?.click(); };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-0.5 text-xs rounded cursor-pointer group select-none',
          isSelected
            ? 'bg-(--primary)/10 text-(--text)'
            : 'text-(--text-dim) hover:text-(--text) hover:bg-(--hover)'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <span className="w-4 shrink-0" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {hasChildren ? (expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />) : null}
        </span>

        <span
          className={cn('shrink-0', isSelected ? 'text-(--primary)' : 'text-(--text-dim)')}
          onClick={handleImageClick}
        >
          {getObjectIcon(obj.type)}
        </span>

        {renaming ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }}
            className="flex-1 bg-(--panel-2) border border-(--primary) rounded px-1 text-xs text-(--text) outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{obj.name}</span>
        )}

        <div className="hidden group-hover:flex items-center gap-1 ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
            className="p-0.5 hover:text-(--text) text-(--text-dim)"
          >
            {obj.visible ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { locked: !obj.locked }); }}
            className="p-0.5 hover:text-(--text) text-(--text-dim)"
          >
            {obj.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
      </div>

      {hasChildren && expanded &&
        ((obj as { children?: string[] }).children ?? []).map((childId) => {
          const child = allObjects[childId];
          return child ? <LayerItem key={childId} obj={child} depth={depth + 1} allObjects={allObjects} fileInputRef={fileInputRef} /> : null;
        })}
    </>
  );
}

export function LayersPanel() {
  const page = useStore((s) => s.getCurrentPage());
  const objectOrder = page.objectOrder;
  const objects = page.objects;
  const addObject = useStore((s) => s.addObject);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const topLevel = [...objectOrder].reverse().filter(id => objects[id] && !objects[id].parentId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      addObject({
        id: crypto.randomUUID(),
        type: 'image',
        name: file.name,
        x: 50, y: 50, width: 200, height: 200,
        rotation: 0, opacity: 1, visible: true, locked: false,
        fills: [], stroke: 'transparent', strokeWidth: 0, strokeOpacity: 1,
        shadows: [], blurs: [], blendMode: 'normal', src
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageClick = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Add Image */}
      <div className="p-2">
        <label
          onClick={handleAddImageClick}
          className="flex items-center gap-1 p-2 bg-(--panel-2) text-(--text-dim) hover:bg-(--primary)/10 hover:text-(--text) rounded w-full justify-center cursor-pointer"
        >
          <Image size={16} />
          Add Image
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto py-1">
        {topLevel.length === 0 ? (
          <div className="text-(--text-dim) text-xs text-center py-8">
            No layers yet.<br />Start drawing on the canvas.
          </div>
        ) : (
          topLevel.map((id) => (
            <LayerItem key={id} obj={objects[id]} depth={0} allObjects={objects} fileInputRef={fileInputRef} />
          ))
        )}
      </div>
    </div>
  );
}