import { FormFunctions } from "../services";

export type ComponentType =
  | "DynamicTextField"
  | "DynamicPasswordWithToggle"
  | "DynamicTextArea"
  | "DynamicNumberField"
  | "DynamicCheckbox"
  | "DynamicRadioGroup"
  | "DynamicSelect"
  | "DynamicDateField"
  | "DynamicSignature";

export type FieldRender = {
  name: string;
  description: string;
  component: React.ComponentType<any>;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  types?: {
    type: string;
    validations: string[];
  }[];
};

export type FieldRenderMap = Record<ComponentType, FieldRender>;

export type FormMode = "view" | "edit" | "create" | "preview";

// --- Glow orb (page background light) ---
export interface GlowOrb {
  id: string;
  x: number;       // 0–100 (% horizontal position)
  y: number;       // 0–100 (% vertical position)
  size: number;    // 20–150 (ellipse size %)
  opacity: number; // 0–100
  color: string;
}

// --- Per-field styling ---
export interface FieldStyles {
  labelColor?: string;
  inputBgColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  // Hover
  labelColorHover?: string;
  inputBgColorHover?: string;
  inputTextColorHover?: string;
  inputBorderColorHover?: string;
}

// --- Contact form field config ---
export interface ContactField {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  enabled: boolean;
}

// --- Free grid positioning of page elements ---
export type PageElementKey = "heading" | "header" | "contact" | "form" | "footer" | "logo" | "image";
export interface PageLayoutItem {
  key: PageElementKey;
  x: number;   // grid column (0-based)
  y: number;   // grid row (0-based)
  w: number;   // width in columns
  h: number;   // height in rows
}
export type PageBreakpoint = "desktop" | "tablet" | "mobile";

// --- Free decorations on the page grid (rects, lines, icons, text, extra images) ---
export type PageDecorKind = "rect" | "line" | "icon" | "text" | "image";
export interface PageDecor {
  id: string;
  kind: PageDecorKind;
  // Grid position (columns / rows, same units as PageLayoutItem)
  x: number;
  y: number;
  w: number;
  h: number;
  layer?: "back" | "front";   // behind the form elements or on top of them
  // Styling
  bgColor?: string;       // rect fill / line color
  borderColor?: string;   // rect border
  borderWidth?: number;   // rect border / line thickness (px)
  radius?: number;        // rect corner radius (px)
  opacity?: number;       // 0–100
  textColor?: string;     // text / icon color
  text?: string;          // for kind="text"
  fontSize?: number;      // px
  align?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  iconId?: string;        // for kind="icon"
  imageUrl?: string;      // for kind="image"
  imageFit?: "cover" | "contain";
}

export interface PageLayout {
  enabled: boolean;
  cols: number;    // grid columns (e.g. 12)
  rowH: number;    // px per row
  items: PageLayoutItem[];   // desktop (base)
  tablet?: PageLayoutItem[]; // optional per-breakpoint overrides
  mobile?: PageLayoutItem[];
  decors?: PageDecor[];      // free decorations (shared across breakpoints)
}

// --- Form-level styles ---
export interface FormStyles {
  // Form card header (title + description card)
  cardHeaderEnabled?: boolean;  // show/hide the header card (default true)

  // Form card
  accentColor?: string;
  bgColor?: string;
  gradient?: string;
  cardSize?: "sm" | "md" | "lg" | "xl";
  borderRadius?: number;
  borderColor?: string;
  shadowStyle?: "none" | "sm" | "md" | "lg" | "glow";
  preset?: string;

  // Card glass
  cardOpacity?: number;   // 0–100 (bg alpha %)
  cardBlur?: number;      // 0–20 (px)

  // Global field styles (fallback for fields without custom styles)
  globalFieldStyles?: FieldStyles;

  // Page
  pageBgColor?: string;

  // Positionable image element (placed/resized on the grid, not a CSS background)
  pageBgImage?: string;            // image URL
  pageImageFit?: "cover" | "contain";   // how the image fills its grid cell

  // Free grid positioning of page elements (overrides the flex layout when enabled)
  pageLayout?: PageLayout;

  // Logo (positionable in grid mode). Empty url = Arbo logo.
  logoEnabled?: boolean;
  logoUrl?: string;

  // Page background glow / light orbs
  pageGlowEnabled?: boolean;
  pageGlowOrbs?: GlowOrb[];

  // Contact
  contactEnabled?: boolean;
  contactPosition?: "left" | "right";
  contactSize?: "sm" | "md" | "lg";
  contactFields?: ContactField[];
  contactTitle?: string;
  contactSubtitle?: string;

  // Form vertical position on the page
  formVerticalAlign?: "start" | "center" | "end";

  // Page heading (above contact + form panels)
  pageHeadingEnabled?: boolean;
  pageHeadingText?: string;
  pageHeadingColor?: string;
  pageHeadingSize?: "sm" | "md" | "lg" | "xl";
  pageHeadingAlign?: "left" | "center" | "right";

  // Embed / Iframe
  embedContactEnabled?: boolean;
  embedContactPosition?: "left" | "right";
  embedBgTransparent?: boolean;

  // Animations & transitions
  animEntrance?: "none" | "fadeIn" | "slideUp" | "slideDown" | "scaleIn" | "bounceIn" | "flipIn";
  animEntranceDuration?: number;       // ms (200–1500)
  animEntranceEasing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  animEntranceStagger?: boolean;       // stagger fields one by one
  animHover?: "none" | "lift" | "glow" | "scale" | "tilt" | "borderPulse";
  animFieldFocus?: "none" | "glow" | "scale" | "slideRight" | "borderGlow";
  animTransitionSpeed?: "fast" | "normal" | "slow";
}

export type FormSchema = {
  id?: number;
  title: string;
  description?: string;
  slug?: string;
  onSubmit?: FormFunctionsType;
  isPublished?: boolean;
  styles?: FormStyles;
  fields: FormField[];
  projectId?: number | null;
};

export interface FormField {
  id?: string;
  name: string;
  label?: string;
  placeholder?: string;
  type: string;
  componentType: ComponentType;
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  error?: string | null;
  dependencies?: string[];
  validate?: string[];
  options?: string[];
  sortOrder?: number;
  page?: number;
  fieldStyles?: FieldStyles;
}

export type FormState = Record<string, { value: string | number; error: string | null }>;

export type AllValues = Record<string, string | number>;

export type FormPayload = Record<string, FormDataEntryValue>;

export type FormSubmitHandler = (data: AllValues) => void;

export type FormActionFn = (data: FormPayload) => void | Promise<void>;

export type FormFunctionsType = (typeof FormFunctions)[keyof typeof FormFunctions];
