import type { FormMode } from "../types";

export const FORM_MODES: Record<FormMode, FormMode> = {
  view: 'view',
  edit: 'edit',
  create: 'create',
  preview: 'preview',
};