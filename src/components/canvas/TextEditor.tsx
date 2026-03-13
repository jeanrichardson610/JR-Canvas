import React, { useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import type { TextObject } from "../../types";

interface TextEditorProps {
  obj: TextObject;
  zoom: number;
  panX: number;
  panY: number;
  onClose: () => void;
}

export function TextEditor({ obj, zoom, panX, panY, onClose }: TextEditorProps) {
  const updateObject = useStore((s) => s.updateObject);
  const ref = useRef<HTMLDivElement>(null);

  // Select all text on mount
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerText = obj.text || "";

    const range = document.createRange();
    const sel = window.getSelection();
    if (ref.current) {
      range.selectNodeContents(ref.current);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    ref.current.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (ref.current) updateObject(obj.id, { text: ref.current.innerText });
      onClose();
    }
    e.stopPropagation(); // prevent canvas keyboard shortcuts while editing
  };

  const handleBlur = () => {
    if (ref.current) updateObject(obj.id, { text: ref.current.innerText });
    onClose();
  };

  const handleInput = () => {
    if (ref.current) {
      // Live update the store as you type
      updateObject(obj.id, { text: ref.current.innerText });
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onInput={handleInput} // <-- live updates here
      style={{
        position: "absolute",
        left: obj.x * zoom + panX,
        top: obj.y * zoom + panY,
        minWidth: Math.max(obj.width * zoom, 20),
        minHeight: Math.max(obj.height * zoom, 20),
        fontSize: obj.fontSize * zoom,
        fontFamily: obj.fontFamily,
        fontWeight: obj.fontWeight,
        fontStyle: obj.fontStyle,
        textAlign: obj.textAlign,
        lineHeight: obj.lineHeight,
        letterSpacing: `${obj.letterSpacing * zoom}px`,
        textDecoration: obj.textDecoration,
        color: obj.textColor || "#000000",
        outline: "2px solid #0d99ff",
        outlineOffset: 2,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        cursor: "text",
        background: "transparent",
        padding: 2 * zoom,
        boxSizing: "border-box",
        zIndex: 1000,
      }}
    />
  );
}