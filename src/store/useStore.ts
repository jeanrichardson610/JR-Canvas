import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ToolType,
  CanvasObject,
  Page,
  Comment,
  Component,
  PrototypeConnection,
  ViewState,
} from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createDefaultPage(name = 'Page 1'): Page {
  return {
    id: generateId(),
    name,
    objects: {},
    objectOrder: [],
    background: '#ffffff',
  };
}

interface AppState {
  // Tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Pages
  pages: Page[];
  currentPageId: string;
  addPage: (name?: string) => void;
  deletePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  setCurrentPage: (id: string) => void;
  getCurrentPage: () => Page;

  // Objects
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  moveObjectInOrder: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  groupObjects: (ids: string[]) => void;
  ungroupObject: (id: string) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;

  // View
  viewState: ViewState;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  fitToScreen: () => void;

  // UI State
  leftSidebarTab: 'layers' | 'assets';
  setLeftSidebarTab: (tab: 'layers' | 'assets') => void;
  rightSidebarTab: 'design' | 'prototype';
  setRightSidebarTab: (tab: 'design' | 'prototype') => void;
  showLeftSidebar: boolean;
  setShowLeftSidebar: (v: boolean) => void;
  showRightSidebar: boolean;
  setShowRightSidebar: (v: boolean) => void;

    // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Editing text
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Comments
  comments: Comment[];
  addComment: (x: number, y: number) => Comment;
  updateComment: (id: string, text: string) => void;
  resolveComment: (id: string) => void;
  deleteComment: (id: string) => void;
  showComments: boolean;
  setShowComments: (v: boolean) => void;

  // Components (Assets)
  components: Component[];
  registerComponent: (objectId: string, name: string, category?: string) => void;
  unregisterComponent: (componentId: string) => void;

  // Prototype
  connections: PrototypeConnection[];
  addConnection: (conn: Omit<PrototypeConnection, 'id'>) => void;
  updateConnection: (id: string, updates: Partial<PrototypeConnection>) => void;
  deleteConnection: (id: string) => void;

  // History (undo/redo)
  history: Array<{ pages: Page[]; selectedIds: string[] }>;
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Helper
  generateId: () => string;
}

const initialPage = createDefaultPage('Page 1');

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),

    pages: [initialPage],
    currentPageId: initialPage.id,
    

    addPage: (name) => {
      const page = createDefaultPage(name || `Page ${get().pages.length + 1}`);
      set((s) => ({ pages: [...s.pages, page], currentPageId: page.id }));
    },

    deletePage: (id) => {
      const pages = get().pages.filter((p) => p.id !== id);
      if (pages.length === 0) return;
      const currentPageId =
        get().currentPageId === id ? pages[pages.length - 1].id : get().currentPageId;
      set({ pages, currentPageId });
    },

    renamePage: (id, name) => {
      set((s) => ({
        pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)),
      }));
    },

    setCurrentPage: (id) => set({ currentPageId: id, selectedIds: [] }),

    getCurrentPage: () => {
      const s = get();
      return s.pages.find((p) => p.id === s.currentPageId) || s.pages[0];
    },

    addObject: (obj) => {
      get().pushHistory();
      set((s) => {
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          return {
            ...p,
            objects: { ...p.objects, [obj.id]: obj },
            objectOrder: [...p.objectOrder, obj.id],
          };
        });
        return { pages };
      });
    },

    updateObject: (id, updates) => {
      set((s) => {
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          if (!p.objects[id]) return p;
          return {
            ...p,
            objects: {
              ...p.objects,
              [id]: { ...p.objects[id], ...updates } as CanvasObject,
            },
          };
        });
        return { pages };
      });
    },

    deleteObjects: (ids) => {
      if (ids.length === 0) return;
      get().pushHistory();
      set((s) => {
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          const objects = { ...p.objects };
          ids.forEach((id) => delete objects[id]);
          return {
            ...p,
            objects,
            objectOrder: p.objectOrder.filter((oid) => !ids.includes(oid)),
          };
        });
        return { pages, selectedIds: [] };
      });
    },

    duplicateObjects: (ids) => {
      if (ids.length === 0) return;
      get().pushHistory();
      set((s) => {
        const page = s.pages.find((p) => p.id === s.currentPageId);
        if (!page) return {};
        const newObjects: Record<string, CanvasObject> = {};
        const newIds: string[] = [];
        ids.forEach((id) => {
          const obj = page.objects[id];
          if (!obj) return;
          const newId = generateId();
          newObjects[newId] = {
            ...obj,
            id: newId,
            name: obj.name + ' copy',
            x: obj.x + 20,
            y: obj.y + 20,
          };
          newIds.push(newId);
        });
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          return {
            ...p,
            objects: { ...p.objects, ...newObjects },
            objectOrder: [...p.objectOrder, ...newIds],
          };
        });
        return { pages, selectedIds: newIds };
      });
    },

    moveObjectInOrder: (id, direction) => {
      set((s) => {
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          const order = [...p.objectOrder];
          const idx = order.indexOf(id);
          if (idx === -1) return p;
          let newOrder = [...order];
          if (direction === 'up' && idx < order.length - 1) {
            [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
          } else if (direction === 'down' && idx > 0) {
            [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
          } else if (direction === 'top') {
            newOrder = [...order.filter((o) => o !== id), id];
          } else if (direction === 'bottom') {
            newOrder = [id, ...order.filter((o) => o !== id)];
          }
          return { ...p, objectOrder: newOrder };
        });
        return { pages };
      });
    },

    groupObjects: (ids) => {
      if (ids.length < 2) return;
      get().pushHistory();
      const page = get().getCurrentPage();
      const objs = ids.map((id) => page.objects[id]).filter(Boolean);
      if (objs.length === 0) return;
      const minX = Math.min(...objs.map((o) => o.x));
      const minY = Math.min(...objs.map((o) => o.y));
      const maxX = Math.max(...objs.map((o) => o.x + o.width));
      const maxY = Math.max(...objs.map((o) => o.y + o.height));
      const groupId = generateId();
      set((s) => {
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          const updatedObjs = { ...p.objects };
          ids.forEach((id) => {
            if (updatedObjs[id]) {
              updatedObjs[id] = {
                ...updatedObjs[id],
                parentId: groupId,
              };
            }
          });
          updatedObjs[groupId] = {
            id: groupId,
            type: 'group',
            name: 'Group',
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            fills: [],
            stroke: 'transparent',
            strokeWidth: 0,
            strokeOpacity: 1,
            shadows: [],
            blurs: [],
            blendMode: 'normal',
            children: ids,
          } as CanvasObject;
          const newOrder = [...p.objectOrder, groupId];
          return { ...p, objects: updatedObjs, objectOrder: newOrder };
        });
        return { pages, selectedIds: [groupId] };
      });
    },

    ungroupObject: (id) => {
      get().pushHistory();
      set((s) => {
        const page = s.pages.find((p) => p.id === s.currentPageId);
        if (!page) return {};
        const group = page.objects[id];
        if (!group || group.type !== 'group') return {};
        const childIds = (group as { children: string[] }).children;
        const pages = s.pages.map((p) => {
          if (p.id !== s.currentPageId) return p;
          const updatedObjs = { ...p.objects };
          childIds.forEach((cid) => {
            if (updatedObjs[cid]) {
              const { parentId: _p, ...rest } = updatedObjs[cid] as CanvasObject & { parentId?: string };
              updatedObjs[cid] = rest as CanvasObject;
            }
          });
          delete updatedObjs[id];
          const newOrder = p.objectOrder.filter((oid) => oid !== id);
          return { ...p, objects: updatedObjs, objectOrder: [...newOrder, ...childIds] };
        });
        return { pages, selectedIds: childIds };
      });
    },

    selectedIds: [],
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    addToSelection: (id) =>
      set((s) => ({ selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id] })),
    removeFromSelection: (id) =>
      set((s) => ({ selectedIds: s.selectedIds.filter((i) => i !== id) })),
    clearSelection: () => set({ selectedIds: [] }),

    viewState: { zoom: 1, panX: 0, panY: 0 },
    setZoom: (zoom) =>
      set((s) => ({ viewState: { ...s.viewState, zoom: Math.min(Math.max(zoom, 0.02), 256) } })),
    setPan: (panX, panY) => set((s) => ({ viewState: { ...s.viewState, panX, panY } })),
    resetView: () => set({ viewState: { zoom: 1, panX: 0, panY: 0 } }),
    fitToScreen: () => set({ viewState: { zoom: 1, panX: 0, panY: 0 } }),

    leftSidebarTab: 'layers',
    setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
    rightSidebarTab: 'design',
    setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
    showLeftSidebar: true,
    setShowLeftSidebar: (v) => set({ showLeftSidebar: v }),
    showRightSidebar: true,
    setShowRightSidebar: (v) => set({ showRightSidebar: v }),

    theme: 'dark',

    setTheme: (theme) => set({ theme }),

    toggleTheme: () =>
    set((s) => ({
    theme: s.theme === 'dark' ? 'light' : 'dark',
    })),

    editingTextId: null,
    setEditingTextId: (id) => set({ editingTextId: id }),

    comments: [],
    addComment: (x, y) => {
      const comment: Comment = {
        id: generateId(),
        x,
        y,
        text: '',
        pageId: get().currentPageId,
        resolved: false,
        createdAt: new Date(),
        author: 'You',
      };
      set((s) => ({ comments: [...s.comments, comment] }));
      return comment;
    },
    updateComment: (id, text) =>
      set((s) => ({
        comments: s.comments.map((c) => (c.id === id ? { ...c, text } : c)),
      })),
    resolveComment: (id) =>
      set((s) => ({
        comments: s.comments.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
      })),
    deleteComment: (id) =>
      set((s) => ({ comments: s.comments.filter((c) => c.id !== id) })),
    showComments: true,
    setShowComments: (v) => set({ showComments: v }),

    components: [],
    registerComponent: (objectId, name, category = 'Custom') => {
      const comp: Component = {
        id: generateId(),
        name,
        category,
        objectId,
        pageId: get().currentPageId,
      };
      set((s) => ({ components: [...s.components, comp] }));
    },
    unregisterComponent: (componentId) =>
      set((s) => ({ components: s.components.filter((c) => c.id !== componentId) })),

    connections: [],
    addConnection: (conn) => {
      const c: PrototypeConnection = { ...conn, id: generateId() };
      set((s) => ({ connections: [...s.connections, c] }));
    },
    updateConnection: (id, updates) =>
      set((s) => ({
        connections: s.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
    deleteConnection: (id) =>
      set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),

    history: [],
    historyIndex: -1,
    pushHistory: () => {
      const s = get();
      const snapshot = { pages: JSON.parse(JSON.stringify(s.pages)), selectedIds: [...s.selectedIds] };
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > 50) newHistory.shift();
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },
    undo: () => {
      const s = get();
      if (s.historyIndex <= 0) return;
      const idx = s.historyIndex - 1;
      const snap = s.history[idx];
      set({ pages: snap.pages, selectedIds: snap.selectedIds, historyIndex: idx });
    },
    redo: () => {
      const s = get();
      if (s.historyIndex >= s.history.length - 1) return;
      const idx = s.historyIndex + 1;
      const snap = s.history[idx];
      set({ pages: snap.pages, selectedIds: snap.selectedIds, historyIndex: idx });
    },

    generateId,
  }))
);
