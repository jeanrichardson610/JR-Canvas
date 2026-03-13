import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboard() {
  const store = useStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Tool shortcuts (only when not editing)
      if (!isEditing) {
        switch (e.key) {
          case 'v':
          case 'V':
            store.setActiveTool('select');
            break;
          case 'f':
          case 'F':
            store.setActiveTool('frame');
            break;
          case 'r':
          case 'R':
            store.setActiveTool('rectangle');
            break;
          case 'o':
          case 'O':
            store.setActiveTool('circle');
            break;
          case 'l':
          case 'L':
            store.setActiveTool('line');
            break;
          case 'p':
          case 'P':
            store.setActiveTool('pen');
            break;
          case 't':
          case 'T':
            store.setActiveTool('text');
            break;
          case 'h':
          case 'H':
            store.setActiveTool('hand');
            break;
          case 'c':
          case 'C':
            if (e.altKey) store.setActiveTool('comment');
            break;
          case 'Escape':
            store.clearSelection();
            store.setActiveTool('select');
            store.setEditingTextId(null);
            break;
          case 'Delete':
          case 'Backspace':
            if (store.selectedIds.length > 0) {
              store.deleteObjects(store.selectedIds);
            }
            break;
          case 'z':
          case 'Z':
            if (e.ctrlKey || e.metaKey) {
              if (e.shiftKey) store.redo();
              else store.undo();
              e.preventDefault();
            }
            break;
          case 'd':
          case 'D':
            if (e.ctrlKey || e.metaKey) {
              store.duplicateObjects(store.selectedIds);
              e.preventDefault();
            }
            break;
          case 'g':
          case 'G':
            if (e.ctrlKey || e.metaKey) {
              if (e.shiftKey) {
                if (store.selectedIds.length === 1) {
                  store.ungroupObject(store.selectedIds[0]);
                }
              } else {
                store.groupObjects(store.selectedIds);
              }
              e.preventDefault();
            }
            break;
          case '[':
            store.moveObjectInOrder(store.selectedIds[0], 'down');
            break;
          case ']':
            store.moveObjectInOrder(store.selectedIds[0], 'up');
            break;
          case 'ArrowUp':
            store.selectedIds.forEach((id) =>
              store.updateObject(id, {
                y: (store.getCurrentPage().objects[id]?.y ?? 0) - (e.shiftKey ? 10 : 1),
              })
            );
            e.preventDefault();
            break;
          case 'ArrowDown':
            store.selectedIds.forEach((id) =>
              store.updateObject(id, {
                y: (store.getCurrentPage().objects[id]?.y ?? 0) + (e.shiftKey ? 10 : 1),
              })
            );
            e.preventDefault();
            break;
          case 'ArrowLeft':
            store.selectedIds.forEach((id) =>
              store.updateObject(id, {
                x: (store.getCurrentPage().objects[id]?.x ?? 0) - (e.shiftKey ? 10 : 1),
              })
            );
            e.preventDefault();
            break;
          case 'ArrowRight':
            store.selectedIds.forEach((id) =>
              store.updateObject(id, {
                x: (store.getCurrentPage().objects[id]?.x ?? 0) + (e.shiftKey ? 10 : 1),
              })
            );
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);
}
