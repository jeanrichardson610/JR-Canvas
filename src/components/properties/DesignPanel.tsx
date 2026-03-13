import React, { useState } from 'react';
import {
  Plus,
  Minus,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { ColorPickerPopover } from './ColorPicker';
import type { CanvasObject, TextObject, RectObject, Fill, Shadow } from '../../types';

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold text-(--text-dim) uppercase tracking-wide">{title}</span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="w-5 h-5 flex items-center justify-center text-(--text-dim) hover:text-(--text) hover:bg-(--panel-2) rounded transition-all"
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, unit }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] text-(--text-dim) uppercase">{label}</label>
      <div className="flex items-center bg-(--panel) border border-(--border) rounded overflow-hidden focus-within:border-(--primary)">
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-transparent text-xs text-left px-2 py-1 outline-none text-(--text)"
        />
        {unit && <span className="text-[9px] text-(--text-dim) px-1 shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

function FillRow({ fill, onChange, onRemove }: { fill: Fill; onChange: (f: Fill) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <ColorPickerPopover color={fill.color} onChange={(c) => onChange({ ...fill, color: c })} />
      <span className="text-xs text-(--text-dim) flex-1 font-mono">{fill.color.toUpperCase()}</span>
      <div className="flex items-center bg-(--panel) border border-(--border) rounded overflow-hidden w-20">
        <input
          type="number"
          value={Math.round(fill.opacity * 100)}
          onChange={(e) => onChange({ ...fill, opacity: Number(e.target.value) / 100 })}
          min={0} max={100}
          className="w-full bg-transparent text-xs text-(--text) px-0.5 py-0.5 outline-none text-left"
        />
        <span className="text-[9px] text-(--text-dim) px-1">%</span>
      </div>
      <button onClick={onRemove} className="text-(--text-dim) hover:text-(--danger)">
        <Minus size={11} />
      </button>
    </div>
  );
}

function ShadowRow({ shadow, onChange, onRemove }: { shadow: Shadow; onChange: (s: Shadow) => void; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={shadow.enabled}
          onChange={(e) => onChange({ ...shadow, enabled: e.target.checked })}
          className="w-3 h-3"
        />
        <ColorPickerPopover color={shadow.color} onChange={(c) => onChange({ ...shadow, color: c })} />
        <span className="text-xs text-(--text-dim) flex-1">{shadow.inner ? 'Inner Shadow' : 'Drop Shadow'}</span>
        <button onClick={() => setExpanded(!expanded)} className="text-(--text-dim)">
          <ChevronDown size={11} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
        <button onClick={onRemove} className="text-(--text-dim) hover:text-(--danger)">
          <Minus size={11} />
        </button>
      </div>
      {expanded && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          <NumberInput label="X" value={shadow.x} onChange={(v) => onChange({ ...shadow, x: v })} />
          <NumberInput label="Y" value={shadow.y} onChange={(v) => onChange({ ...shadow, y: v })} />
          <NumberInput label="Blur" value={shadow.blur} onChange={(v) => onChange({ ...shadow, blur: v })} min={0} />
          <NumberInput label="Spread" value={shadow.spread} onChange={(v) => onChange({ ...shadow, spread: v })} />
        </div>
      )}
    </div>
  );
}

// …rest of the component code remains same, just replace all color strings as shown above

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display', 'Merriweather',
  'Georgia', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
  'monospace', 'sans-serif', 'serif',
];

const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Extra Light', value: '200' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
];

export function DesignPanel() {
  const selectedIds = useStore((s) => s.selectedIds);
  const getCurrentPage = useStore((s) => s.getCurrentPage);
  const updateObject = useStore((s) => s.updateObject);

  const page = getCurrentPage();
  const selected = selectedIds.map((id) => page.objects[id]).filter(Boolean);
  const obj = selected[0] as CanvasObject | undefined;

  if (!obj) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-(--text-dim) text-xs">
        Select an object to edit properties
      </div>
    );
  }

  const update = (updates: Partial<CanvasObject>) => updateObject(obj.id, updates);

  const addFill = () => {
    update({ fills: [...obj.fills, { type: 'solid', color: 'var(--fill-default)', opacity: 1 }] });
  };

  const removeFill = (i: number) => {
    update({ fills: obj.fills.filter((_, idx) => idx !== i) });
  };

  const updateFill = (i: number, fill: Fill) => {
    const fills = [...obj.fills];
    fills[i] = fill;
    update({ fills });
  };

  const addShadow = () => {
    update({
      shadows: [...obj.shadows, {
        enabled: true, x: 4, y: 4, blur: 10, spread: 0,
        color: 'var(--shadow-default)', opacity: 1, inner: false,
      }],
    });
  };

  const removeShadow = (i: number) => {
    update({ shadows: obj.shadows.filter((_, idx) => idx !== i) });
  };

  const updateShadow = (i: number, shadow: Shadow) => {
    const shadows = [...obj.shadows];
    shadows[i] = shadow;
    update({ shadows });
  };

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Alignment */}
      <div className="p-3 border-b border-(--border)">
        <SectionHeader title="Align" />
        <div className="flex gap-1 flex-wrap">
          {[
            { label: 'Left', icon: <AlignLeft size={13} />, action: () => {} },
            { label: 'Center H', icon: <AlignCenter size={13} />, action: () => {} },
            { label: 'Right', icon: <AlignRight size={13} />, action: () => {} },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              title={a.label}
              className="w-7 h-7 flex items-center justify-center rounded text-(--text-dim) hover:text-(--text) hover:bg-(--panel-2) transition-all"
            >
              {a.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Position & Size */}
      <div className="p-3 border-b border-(--border)">
        <SectionHeader title="Layout" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <NumberInput label="X" value={obj.x} onChange={(v) => update({ x: v })} />
          <NumberInput label="Y" value={obj.y} onChange={(v) => update({ y: v })} />
          <NumberInput label="W" value={obj.width} onChange={(v) => update({ width: Math.max(1, v) })} min={1} />
          <NumberInput label="H" value={obj.height} onChange={(v) => update({ height: Math.max(1, v) })} min={1} />
          <NumberInput
            label="Rotation"
            value={obj.rotation}
            onChange={(v) => update({ rotation: v })}
            unit="°"
          />
          <NumberInput
            label="Opacity"
            value={Math.round(obj.opacity * 100)}
            onChange={(v) => update({ opacity: v / 100 })}
            min={0} max={100}
            unit="%"
          />
        </div>
        {obj.type === 'rectangle' && (
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Radius"
              value={(obj as RectObject).cornerRadius}
              onChange={(v) => update({ cornerRadius: Math.max(0, v) } as Partial<RectObject>)}
              min={0}
            />
          </div>
        )}
      </div>

      {/* Fill */}
      <div className="p-3 border-b border-(--border)">
        <SectionHeader title="Fill" onAdd={addFill} />
        {obj.fills.length === 0 && (
          <p className="text-[11px] text-(--text-dim)">No fills</p>
        )}
        {obj.fills.map((fill, i) => (
          <FillRow
            key={i}
            fill={fill}
            onChange={(f) => updateFill(i, f)}
            onRemove={() => removeFill(i)}
          />
        ))}
      </div>

      {/* Stroke */}
      <div className="p-3 border-b border-(--border)">
        <SectionHeader title="Stroke" />
        <div className="flex items-center gap-2 mb-2">
          <ColorPickerPopover
            color={obj.stroke || 'transparent'}
            onChange={(c) => update({ stroke: c })}
          />
          <span className="text-xs text-(--text-dim) flex-1 font-mono">{(obj.stroke || 'transparent').toUpperCase()}</span>
          <div className="flex items-center bg-(--panel) border border-(--border) rounded overflow-hidden w-20">
            <input
              type="number"
              value={obj.strokeWidth}
              onChange={(e) => update({ strokeWidth: Math.max(0, Number(e.target.value)) })}
              min={0}
              className="w-full bg-transparent text-xs text-(--text) px-0.5 py-0.5 outline-none text-left"
            />
            <span className="text-[9px] text-(--text-dim) px-1">px</span>
          </div>
        </div>
      </div>

      {/* Text properties */}
      {obj.type === 'text' && (
        <div className="p-3 border-b border-(--border)">
          <SectionHeader title="Typography" />
          <div className="flex flex-col gap-2">
            {/* Font family */}
            <select
              value={(obj as TextObject).fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value } as Partial<TextObject>)}
              className="w-full bg-(--panel) border border-(--border) rounded px-2 py-1 text-xs text-white outline-none focus:border-[#0d99ff]"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>

            {/* Font weight + size */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={(obj as TextObject).fontWeight}
                onChange={(e) => update({ fontWeight: e.target.value } as Partial<TextObject>)}
                className="bg-(--panel) border border-(--border) rounded px-2 py-1 text-xs text-white outline-none focus:border-[#0d99ff]"
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
              <NumberInput
                label="Size"
                value={(obj as TextObject).fontSize}
                onChange={(v) => update({ fontSize: Math.max(1, v) } as Partial<TextObject>)}
                min={1}
              />
            </div>

            {/* Line height + letter spacing */}
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Line H"
                value={(obj as TextObject).lineHeight}
                onChange={(v) => update({ lineHeight: v } as Partial<TextObject>)}
                step={0.1}
              />
              <NumberInput
                label="Letter"
                value={(obj as TextObject).letterSpacing}
                onChange={(v) => update({ letterSpacing: v } as Partial<TextObject>)}
              />
            </div>

            {/* Text color */}
            <div className="flex items-center gap-2">
              <ColorPickerPopover
                color={(obj as TextObject).textColor}
                onChange={(c) => update({ textColor: c } as Partial<TextObject>)}
              />
              <span className="text-xs text-(--text-dim) flex-1">Text Color</span>
            </div>

            {/* Alignment */}
            <div className="flex gap-1">
              {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;
                return (
                  <button
                    key={align}
                    onClick={() => update({ textAlign: align } as Partial<TextObject>)}
                    className={cn(
                      'flex-1 h-7 flex items-center justify-center rounded transition-all',
                      (obj as TextObject).textAlign === align
                        ? 'bg-[#0d99ff20] text-[#0d99ff]'
                        : 'text-(--text-dim) hover:text-white hover:bg-[#3a3a3a]'
                    )}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>

            {/* Style buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => update({ fontStyle: (obj as TextObject).fontStyle === 'italic' ? 'normal' : 'italic' } as Partial<TextObject>)}
                className={cn(
                  'flex-1 h-7 flex items-center justify-center rounded transition-all',
                  (obj as TextObject).fontStyle === 'italic' ? 'bg-[#0d99ff20] text-[#0d99ff]' : 'text-(--text-dim) hover:text-white hover:bg-(--border)'
                )}
              >
                <Italic size={13} />
              </button>
              <button
                onClick={() => update({ textDecoration: (obj as TextObject).textDecoration === 'underline' ? 'none' : 'underline' } as Partial<TextObject>)}
                className={cn(
                  'flex-1 h-7 flex items-center justify-center rounded transition-all',
                  (obj as TextObject).textDecoration === 'underline' ? 'bg-[#0d99ff20] text-[#0d99ff]' : 'text-(--text-dim) hover:text-white hover:bg-(--border)'
                )}
              >
                <Underline size={13} />
              </button>
              <button
                onClick={() => update({ textDecoration: (obj as TextObject).textDecoration === 'line-through' ? 'none' : 'line-through' } as Partial<TextObject>)}
                className={cn(
                  'flex-1 h-7 flex items-center justify-center rounded transition-all',
                  (obj as TextObject).textDecoration === 'line-through' ? 'bg-[#0d99ff20] text-[#0d99ff]' : 'text-(--text-dim) hover:text-white hover:bg-(--border)'
                )}
              >
                <Strikethrough size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Effects / Shadows */}
      <div className="p-3 border-b border-(--border)">
        <SectionHeader title="Effects" onAdd={addShadow} />
        {obj.shadows.length === 0 && (
          <p className="text-[11px] text-(--text-dim)">No effects</p>
        )}
        {obj.shadows.map((shadow, i) => (
          <ShadowRow
            key={i}
            shadow={shadow}
            onChange={(s) => updateShadow(i, s)}
            onRemove={() => removeShadow(i)}
          />
        ))}
      </div>

      {/* Blend Mode */}
      <div className="p-3">
        <SectionHeader title="Blend Mode" />
        <select
          value={obj.blendMode}
          onChange={(e) => update({ blendMode: e.target.value as CanvasObject['blendMode'] })}
          className="w-full bg-(--panel) border border-(--border) rounded px-2 py-1 text-xs text-(--text-dim) outline-none focus:border-[#0d99ff]"
        >
          {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge',
            'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'].map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
