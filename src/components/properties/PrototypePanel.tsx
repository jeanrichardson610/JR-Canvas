import React from 'react';
import { Plus, ArrowRight, Trash2, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { PrototypeConnection } from '../../types';

export function PrototypePanel() {
  const selectedIds = useStore((s) => s.selectedIds);
  const connections = useStore((s) => s.connections);
  const addConnection = useStore((s) => s.addConnection);
  const updateConnection = useStore((s) => s.updateConnection);
  const deleteConnection = useStore((s) => s.deleteConnection);
  const pages = useStore((s) => s.pages);
  const currentPageId = useStore((s) => s.currentPageId);

  const selectedId = selectedIds[0];
  const myConnections = connections.filter((c) => c.sourceId === selectedId);

  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-(--text-dim) text-xs p-4 text-center">
        <Zap size={24} className="text-(--text) mb-2" />
        Select an object to add interactions
      </div>
    );
  }

  const handleAdd = () => {
    const targetPage = pages.find((p) => p.id !== currentPageId);
    addConnection({
      sourceId: selectedId,
      targetPageId: targetPage?.id || currentPageId,
      trigger: 'click',
      animation: 'instant',
      duration: 300,
      easing: 'ease-in-out',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Interactions */}
      <div className="p-3 border-b border-(--border)">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-(--text-dim) uppercase tracking-wide">Interactions</span>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs text-(--primary) hover:text-(--text) transition-all"
          >
            <Plus size={11} /> Add
          </button>
        </div>

        {myConnections.length === 0 ? (
          <div className="text-center py-6">
            <ArrowRight size={20} className="text-(--text) mx-auto mb-2" />
            <p className="text-[11px] text-(--text-dim)">No interactions yet.</p>
            <p className="text-[10px] text-(--text) mt-1">Click "+ Add" to create a navigation flow.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myConnections.map((conn) => (
              <ConnectionRow
                key={conn.id}
                conn={conn}
                pages={pages}
                onChange={(updates) => updateConnection(conn.id, updates)}
                onDelete={() => deleteConnection(conn.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll behavior */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-(--text-dim) uppercase tracking-wide">Scroll</span>
        </div>
        <select className="w-full bg-(--panel) border border-(--border) rounded px-2 py-1 text-xs text-(--text) outline-none">
          <option value="none">No scrolling</option>
          <option value="vertical">Vertical scroll</option>
          <option value="horizontal">Horizontal scroll</option>
          <option value="both">Both directions</option>
        </select>
      </div>
    </div>
  );
}

function ConnectionRow({
  conn,
  pages,
  onChange,
  onDelete,
}: {
  conn: PrototypeConnection;
  pages: Array<{ id: string; name: string }>;
  onChange: (u: Partial<PrototypeConnection>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-(--panel) border border-(--border) rounded-lg p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-(--text-dim) font-medium">On Click → Navigate</span>
        <button onClick={onDelete} className="text-(--text-dim) hover:text-(--danger)">
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-(--text-dim) uppercase">Trigger</label>
        <select
          value={conn.trigger}
          onChange={(e) => onChange({ trigger: e.target.value as PrototypeConnection['trigger'] })}
          className="bg-(--panel-2) border border-(--border) rounded px-2 py-1 text-xs text-(--text) outline-none"
        >
          <option value="click">On Click</option>
          <option value="hover">On Hover</option>
          <option value="drag">On Drag</option>
          <option value="key-press">Key Press</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-(--text-dim) uppercase">Navigate To</label>
        <select
          value={conn.targetPageId}
          onChange={(e) => onChange({ targetPageId: e.target.value })}
          className="bg-(--panel-2) border border-(--border) rounded px-2 py-1 text-xs text-(--text) outline-none"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-(--text-dim) uppercase">Animation</label>
        <select
          value={conn.animation}
          onChange={(e) => onChange({ animation: e.target.value as PrototypeConnection['animation'] })}
          className="bg-(--panel-2) border border-(--border) rounded px-2 py-1 text-xs text-(--text) outline-none"
        >
          <option value="instant">Instant</option>
          <option value="dissolve">Dissolve</option>
          <option value="slide-in">Slide In</option>
          <option value="slide-out">Slide Out</option>
          <option value="push">Push</option>
          <option value="smart-animate">Smart Animate</option>
        </select>
      </div>

      {conn.animation !== 'instant' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-(--text-dim) uppercase">Duration</label>
            <div className="flex items-center bg-(--panel-2) border border-(--border) rounded overflow-hidden">
              <input
                type="number"
                value={conn.duration}
                onChange={(e) => onChange({ duration: Number(e.target.value) })}
                min={0} max={5000} step={100}
                className="w-full bg-transparent text-xs text-(--text) px-2 py-1 outline-none text-right"
              />
              <span className="text-[9px] text-(--text-dim) px-1">ms</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-(--text-dim) uppercase">Easing</label>
            <select
              value={conn.easing}
              onChange={(e) => onChange({ easing: e.target.value as PrototypeConnection['easing'] })}
              className="bg-(--panel-2) border border-(--border) rounded px-1 py-1 text-xs text-(--text) outline-none"
            >
              <option value="ease-in-out">Ease In Out</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="linear">Linear</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}