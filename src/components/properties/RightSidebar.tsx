import React from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { DesignPanel } from './DesignPanel';
import { PrototypePanel } from './PrototypePanel';

export function RightSidebar() {
  const rightSidebarTab = useStore((s) => s.rightSidebarTab);
  const setRightSidebarTab = useStore((s) => s.setRightSidebarTab);

  return (
    <div className="flex flex-col w-60 bg-(--panel) border-l border-(--border) h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-(--border) shrink-0">
        <button
          onClick={() => setRightSidebarTab('design')}
          className={cn(
            'flex-1 py-2.5 text-xs font-medium transition-all',
            rightSidebarTab === 'design'
              ? 'text-(--text) border-b-2 border-(--primary)'
              : 'text-(--text-dim) hover:text-(--text)'
          )}
        >
          Design
        </button>
        <button
          onClick={() => setRightSidebarTab('prototype')}
          className={cn(
            'flex-1 py-2.5 text-xs font-medium transition-all',
            rightSidebarTab === 'prototype'
              ? 'text-(--text) border-b-2 border-(--primary)'
              : 'text-(--text-dim) hover:text-(--text)'
          )}
        >
          Prototype
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {rightSidebarTab === 'design' ? <DesignPanel /> : <PrototypePanel />}
      </div>
    </div>
  );
}