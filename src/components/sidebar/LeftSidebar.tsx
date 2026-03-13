import React, { useState } from 'react';
import { Layers, Component, Plus, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { LayersPanel } from './LayersPanel';
import { AssetsPanel } from './AssetsPanel';

function PagesPanel() {
  const pages = useStore((s) => s.pages);
  const currentPageId = useStore((s) => s.currentPageId);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const addPage = useStore((s) => s.addPage);
  const deletePage = useStore((s) => s.deletePage);
  const renamePage = useStore((s) => s.renamePage);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  return (
    <div className="border-b border-(--border)">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold text-(--text-dim) uppercase tracking-wide">
          Pages
        </span>
        <button
          onClick={() => addPage()}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-(--hover) text-(--text-dim) hover:text-(--text) transition-all"
        >
          <Plus size={12} />
        </button>
      </div>
      <div className="pb-1">
        {pages.map((page) => (
          <div
            key={page.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 cursor-pointer group select-none',
              page.id === currentPageId
                ? 'bg-(--primary)/10 text-(--text)'
                : 'text-(--text-dim) hover:text-(--text) hover:bg-(--hover)'
            )}
            onClick={() => setCurrentPage(page.id)}
            onDoubleClick={() => { setRenamingId(page.id); setRenameVal(page.name); }}
          >
            <FileText
              size={12}
              className={page.id === currentPageId ? 'text-(--primary)' : 'text-(--text-dim)'}
            />
            {renamingId === page.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={() => { renamePage(page.id, renameVal); setRenamingId(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { renamePage(page.id, renameVal); setRenamingId(null); }
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="flex-1 bg-(--panel-2) border border-(--primary) rounded px-1 text-xs text-(--text) outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-xs truncate">{page.name}</span>
            )}
            {pages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded hover:bg-(--hover) text-(--text-dim) hover:text-(--text)"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeftSidebar({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const leftSidebarTab = useStore((s) => s.leftSidebarTab);
  const setLeftSidebarTab = useStore((s) => s.setLeftSidebarTab);

  return (
    <div className="flex flex-col w-60 bg-(--panel) border-r border-(--border) h-full">
      {/* Pages section */}
      <PagesPanel />

      {/* Tab switcher */}
      <div className="flex border-b border-(--border)">
        <button
          onClick={() => setLeftSidebarTab('layers')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all',
            leftSidebarTab === 'layers'
              ? 'text-(--text) border-b-2 border-(--primary)'
              : 'text-(--text-dim) hover:text-(--text)'
          )}
        >
          <Layers size={12} />
          Layers
        </button>

        <button
          onClick={() => setLeftSidebarTab('assets')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all',
            leftSidebarTab === 'assets'
              ? 'text-(--text) border-b-2 border-(--primary)'
              : 'text-(--text-dim) hover:text-(--text)'
          )}
        >
          <Component size={12} />
          Assets
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {leftSidebarTab === 'layers' ? (
          <LayersPanel />
        ) : (
          <AssetsPanel canvasRef={canvasRef} />
        )}
      </div>
    </div>
  );
}