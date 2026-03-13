import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorSwatch({ color, onClick }: { color: string; onClick?: () => void }) {
  const isTransparent = !color || color === 'transparent';
  return (
    <button
      onClick={onClick}
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: isTransparent ? undefined : color,
        border: '1.5px solid rgba(255,255,255,0.2)',
        cursor: 'pointer',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: isTransparent
          ? 'linear-gradient(45deg, var(--text-dim) 25%, transparent 25%, transparent 75%, var(--text-dim) 75%), linear-gradient(45deg, var(--text-dim) 25%, var(--text) 25%, var(--text) 75%, var(--text-dim) 75%)'
          : undefined,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 4px 4px',
      }}
    />
  );
}

export function ColorPickerPopover({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const swatchRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const safeColor = (!color || color === 'transparent') ? '#cccccc' : color;

  const updatePos = useCallback(() => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();
    const popW = 224;
    const popH = 240;

    let left = rect.right + 8;
    let top = rect.top;

    if (left + popW > window.innerWidth - 8) {
      left = rect.left - popW - 8;
    }
    if (top + popH > window.innerHeight - 8) {
      top = window.innerHeight - popH - 8;
    }
    if (top < 8) top = 8;

    setPopoverPos({ top, left });
  }, []);

  useEffect(() => {
    if (open) {
      updatePos();
      window.addEventListener('scroll', updatePos, true);
      window.addEventListener('resize', updatePos);
    }
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  const popover = open ? ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />
      {/* Picker panel */}
      <div
        style={{
          position: 'fixed',
          top: popoverPos.top,
          left: popoverPos.left,
          zIndex: 9999,
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          width: 224,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <HexColorPicker
          color={safeColor}
          onChange={onChange}
          style={{ width: '100%', height: 160 }}
        />

        {/* Hex input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              flexShrink: 0,
              backgroundColor: safeColor,
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          />
          <HexColorInput
            color={safeColor}
            onChange={onChange}
            prefixed
            style={{
              flex: 1,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text)',
              fontSize: 12,
              padding: '4px 8px',
              outline: 'none',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          />
        </div>

        {/* Preset swatches */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {[
            '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
            '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
            '#1e1e1e', '#2c2c2c', '#d4d4d4', '#0d99ff', '#ff7262',
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 3,
                backgroundColor: preset,
                border: safeColor.toLowerCase() === preset
                  ? '2px solid var(--primary)'
                  : '1.5px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={preset}
            />
          ))}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div ref={swatchRef} style={{ display: 'inline-block', position: 'relative' }}>
      <ColorSwatch color={safeColor} onClick={() => setOpen(!open)} />
      {popover}
    </div>
  );
}