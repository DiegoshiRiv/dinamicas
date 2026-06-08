/**
 * Clases y tokens compartidos para layout móvil (max-w-md + barra inferior fija).
 * Los valores numéricos viven en `src/styles/index.css` como variables CSS.
 */

/** Contenedor de overlay a pantalla completa (por encima de la bottom nav, z-100). */
export const modalOverlayClass =
  'fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4'

/** Overlay de modal anidado (perks, confirmaciones sobre otro modal). */
export const modalOverlayNestedClass =
  'fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50'

/** Panel deslizable desde abajo; altura máxima vía `.modal-sheet`. */
export const modalSheetClass =
  'modal-sheet w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl'

export const modalSheetLightClass =
  'modal-sheet w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl bg-[#f0f7fc]'

/** Panel claro con cabecera fija y cuerpo scrolleable (eventos, infografías). */
export const modalSheetLightFlexClass =
  'modal-sheet w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl bg-[#f0f7fc] flex flex-col overflow-hidden min-h-0'

export const modalSheetWhiteClass =
  'modal-sheet w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl bg-white'

/** Panel compacto (perks, alertas pequeñas). */
export const modalSheetSmClass =
  'modal-sheet modal-sheet-sm w-full max-w-sm overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl bg-white'

/** Panel anidado sobre otro modal: casi pantalla completa con scroll interno. */
export const modalSheetNestedClass =
  'modal-sheet-nested w-full max-w-sm flex flex-col overflow-hidden min-h-0 rounded-t-2xl sm:rounded-2xl shadow-xl bg-white'

export const modalSheetNestedMdClass =
  'modal-sheet-nested w-full max-w-md flex flex-col overflow-hidden min-h-0 rounded-t-2xl sm:rounded-2xl shadow-xl bg-white'

/** Zona scrolleable interior con padding inferior seguro. */
export const modalSheetBodyClass = 'modal-sheet-body p-3 sm:p-4 space-y-3'

export const modalSheetBodyCompactClass = 'modal-sheet-body p-3 sm:p-4 space-y-2.5'

/** Diálogos centrados (login, formularios cortos). */
export const modalOverlayCenterClass =
  'fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4'

export const modalDialogSmClass =
  'modal-sheet-sm w-full max-w-sm rounded-t-2xl sm:rounded-3xl shadow-2xl bg-white overflow-y-auto'
