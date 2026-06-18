import { FormFunctions } from "../services";

export type ComponentType =
  | "DynamicTextField"
  | "DynamicPasswordWithToggle"
  | "DynamicTextArea"
  | "DynamicNumberField"
  | "DynamicCheckbox"
  | "DynamicRadioGroup"
  | "DynamicSelect"
  | "DynamicMultiSelect"
  | "DynamicDateField"
  | "DynamicFileUpload";

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
  cardCustomWidth?: number;   // px — overrides cardSize when set (resize handle in editor)
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
  pageImageSnap?: "none" | "top" | "bottom";  // full-bleed image sticks to the screen edge
  pageImagePosX?: number;          // 0–100 (% horizontal crop position, default 50)
  pageImagePosY?: number;          // 0–100 (% vertical crop position, default 50)
  pageImageFadeTop?: number;       // 0–100 (% of height that fades in from transparent)
  pageImageFadeBottom?: number;    // 0–100 (% of height that fades out to transparent)
  pageImageOpacity?: number;       // 0–100
  pageImageRadius?: number;        // px corner radius

  // Free grid positioning of page elements (overrides the flex layout when enabled)
  pageLayout?: PageLayout;

  // Field grid: fields flow in a fluid 12-column grid instead of a vertical list
  fieldGridEnabled?: boolean;
  fieldGridGap?: number;   // px gap between fields (default 16)

  // Logo (positionable in grid mode). Empty url = Arbo logo.
  logoEnabled?: boolean;
  logoUrl?: string;

  // Page background glow / light orbs
  pageGlowEnabled?: boolean;
  pageGlowOrbs?: GlowOrb[];

  // Embed background glow / light orbs (independent from page)
  embedGlowEnabled?: boolean;
  embedGlowOrbs?: GlowOrb[];

  // Access — require Google sign-in to submit (strict identity for relational forms)
  requiresGoogleAuth?: boolean;

  // Allow the same user to submit multiple times (multi-record creation).
  // Off (default) = one response per authenticated user. On = unlimited records,
  // e.g. an admin registering many clients/pets from one account.
  allowMultiple?: boolean;

  // For relational (child) forms: when true (default), direct access without a
  // parent ?ref= link is blocked for unauthenticated users and shows the
  // "Formulario vinculado" gate. Set to false to allow anyone to fill the form
  // directly (e.g. internal databases that don't expose a public parent chain).
  requiresParentChain?: boolean;

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
  // One or more submit actions, comma-separated (e.g. "SaveToDB,SendToEmail")
  onSubmit?: string;
  isPublished?: boolean;
  styles?: FormStyles;
  fields: FormField[];
  projectId?: number | null;
  /** True when this form is the child side of a relation — always requires auth to respond. */
  isRelational?: boolean;
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
  // Field grid layout: width in columns (1–12) per breakpoint.
  // desktop base = span; tablet falls back to span; mobile defaults to full width (12).
  span?: number;
  spanTablet?: number;
  spanMobile?: number;
  // Textarea height in rows (resizable in the editor)
  rows?: number;
  // File upload: accepted extensions/MIME types (e.g. [".pdf", ".docx", "image/*"])
  accept?: string[];
  // Custom regex validation (applied after the preset validations)
  pattern?: string;
  patternMessage?: string;
  // Conditional visibility: the field is shown only when ALL conditions match.
  // Without conditions the field is always visible.
  visibleWhen?: FieldCondition[];
  // Inverse rule: the field is HIDDEN when ALL of these conditions match.
  hiddenWhen?: FieldCondition[];
  // How multiple conditions combine: "all" = Y (todas), "any" = O (cualquiera). Default "all".
  logicMode?: "all" | "any";
  // Composite component membership: fields inserted from a library block share
  // a groupId and are deleted together (removing one would break the logic).
  groupId?: string;
  groupLabel?: string;
  // Remote options: fetches choices from an API instead of using the static options array.
  optionsSource?: FieldOptionsSource;
}

export interface FieldOptionsSource {
  // ── External API source ──
  url?: string;       // JSON endpoint (omit when using an internal form reference)
  valueKey?: string;  // JSON key to use as the submitted value (e.g. "id")
  labelKey?: string;  // JSON key to display to the user (e.g. "name")
  dataPath?: string;  // dot-path to the array inside the response (e.g. "data" or "results.items")
  // ── Internal foreign-key source: pull options from another project form's records ──
  formId?: number;    // referenced form; its responses become the selectable options (value = response id)
  formTitle?: string; // cached title for display in the editor
  labelField?: string; // which answer field of the referenced form to show as the label
}

// --- Conditional logic (show/hide fields based on other answers) ---
export type ConditionOperator = "equals" | "notEquals" | "contains" | "notEmpty" | "empty";
export interface FieldCondition {
  field: string;              // source field name
  operator: ConditionOperator;
  value?: string;             // compared value (not needed for empty/notEmpty)
}

export type FormState = Record<string, { value: string | number; error: string | null }>;

export type AllValues = Record<string, string | number>;

export type FormPayload = Record<string, FormDataEntryValue>;

export type FormSubmitHandler = (data: AllValues) => void;

export type FormActionFn = (data: FormPayload) => void | Promise<void>;

export type FormFunctionsType = (typeof FormFunctions)[keyof typeof FormFunctions];
