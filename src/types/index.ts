export type ToolType =
  | 'select'
  | 'scale'
  | 'frame'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'pencil'
  | 'text'
  | 'hand'
  | 'comment'
  | 'resources'
  | 'image';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface FillStop {
  color: string;
  position: number;
}

export type FillType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'image';

export interface Fill {
  type: FillType;
  color: string;
  opacity: number;
  gradient?: {
    stops: FillStop[];
    angle: number;
  };
}

export interface Shadow {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inner: boolean;
}

export interface Blur {
  enabled: boolean;
  type: 'layer' | 'background';
  radius: number;
}

export interface BaseObject {
  id: string;
  type: 'frame' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'group' | 'image' | 'component';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  fills: Fill[];
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  shadows: Shadow[];
  blurs: Blur[];
  blendMode: BlendMode;
  parentId?: string;
  constraints?: {
    horizontal: 'left' | 'right' | 'center' | 'scale' | 'stretch';
    vertical: 'top' | 'bottom' | 'center' | 'scale' | 'stretch';
  };
}

export interface RectObject extends BaseObject {
  type: 'rectangle';
  cornerRadius: number;
}

export interface CircleObject extends BaseObject {
  type: 'circle';
}

export interface LineObject extends BaseObject {
  type: 'line';
  points: number[];
  strokeCap: 'none' | 'round' | 'square' | 'arrow';
}

export interface ArrowObject extends BaseObject {
  type: 'arrow';
  points: number[];
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline' | 'line-through';
  textColor: string;
}

export interface PathObject extends BaseObject {
  type: 'path';
  svgPath: string;
  points: Array<{ x: number; y: number; pressure?: number }>;
}

export interface FrameObject extends BaseObject {
  type: 'frame';
  children: string[];
  clipContent: boolean;
  autoLayout?: AutoLayout;
  background: string;
}

export interface GroupObject extends BaseObject {
  type: 'group';
  children: string[];
}

// -------- NEW: ImageObject --------
export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;               // URL or base64
  alt?: string;              // optional alt text
  naturalWidth?: number;     // optional original width
  naturalHeight?: number;    // optional original height
}
// ----------------------------------

// -------- NEW: ComponentObject --------
export interface ComponentObject extends BaseObject {
  type: 'component';
  componentId: string;
}
// ----------------------------------

export type CanvasObject =
  | RectObject
  | CircleObject
  | LineObject
  | ArrowObject
  | TextObject
  | PathObject
  | FrameObject
  | GroupObject
  | ImageObject
  | ComponentObject;

export interface AutoLayout {
  enabled: boolean;
  direction: 'horizontal' | 'vertical';
  spacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  primaryAlignment: 'min' | 'center' | 'max' | 'space-between';
  counterAlignment: 'min' | 'center' | 'max';
}

export interface Page {
  id: string;
  name: string;
  objects: Record<string, CanvasObject>;
  objectOrder: string[];
  background: string;
}

export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  pageId: string;
  resolved: boolean;
  createdAt: Date;
  author: string;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  objectId: string;
  pageId: string;
  thumbnail?: string;
}

export interface PrototypeConnection {
  id: string;
  sourceId: string;
  targetPageId: string;
  trigger: 'click' | 'hover' | 'drag' | 'key-press';
  animation: 'instant' | 'dissolve' | 'slide-in' | 'slide-out' | 'push' | 'smart-animate';
  duration: number;
  easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}
