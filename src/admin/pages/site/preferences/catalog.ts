/**
 * Preference catalog — declarative source of truth for every editor preference.
 *
 * Add a preference by appending an entry to `PREFERENCE_CATALOG`. The schema,
 * defaults, settings UI, and `useEditorPreference` hook all derive from this
 * list, so a new toggle is one entry.
 *
 * Why a catalog (vs hand-rolling each pref):
 *   - The Settings → Preferences screen renders directly from this list,
 *     grouped by `category`, so new prefs surface automatically with no
 *     PreferencesSection edits.
 *   - The hook signature stays type-safe: `useEditorPreference('layersShowTag')`
 *     compiles, but `useEditorPreference('typo')` does not, because the ID
 *     union is derived from this array via `as const`.
 *   - Defaults and validation are kept in lockstep — there's no way to ship
 *     a preference that's read by the UI but missing from the schema.
 *
 * The catalog is intentionally small in scope (boolean-only for now). Future
 * preference types (select, number, color) extend the `PreferenceDef` union
 * here; consumers add a matching branch in `editorPreferences.ts` and
 * `PreferencesSection.tsx`.
 */

import { translate } from '@admin/i18n'

// ---------------------------------------------------------------------------
// Categories
//
// One section in the Preferences screen per category. The order here is the
// order the sections render in (see PreferencesSection).
// ---------------------------------------------------------------------------

type PreferenceCategory = 'editor' | 'layers' | 'canvas' | 'properties' | 'spotlight'

const PREFERENCE_CATEGORIES: ReadonlyArray<{
  id: PreferenceCategory
  label: string
  description?: string
}> = [
  {
    id: 'editor',
    get label() { return translate('metadata.preferences.editor') },
  },
  {
    id: 'canvas',
    get label() { return translate('metadata.preferences.canvas') },
    get description() { return translate('metadata.preferences.howTheCanvasRendersAndReactsAsYouEdit') },
  },
  {
    id: 'layers',
    get label() { return translate('metadata.preferences.layersPanel') },
    get description() { return translate('metadata.preferences.controlWhatIsShownNextToEachRowInTheDOMTree') },
  },
  {
    id: 'properties',
    get label() { return translate('metadata.preferences.propertiesPanel') },
  },
  {
    id: 'spotlight',
    get label() { return translate('metadata.preferences.commandPalette') },
    get description() { return translate('metadata.preferences.settingsForTheKCommandPalette') },
  },
]

// ---------------------------------------------------------------------------
// Preference shapes
//
// One discriminated-union branch per supported preference type. Each branch
// declares its own default-value type so the catalog stays type-checked.
//
// Adding a new preference type:
//   1. Add a discriminated-union branch here.
//   2. Add a runtime branch in `editorPreferences.ts` (read/set/hook).
//   3. Add a row component in `PreferencesSection.tsx` and a `pref.type`
//      branch in the dispatcher.
// ---------------------------------------------------------------------------

interface BooleanPreferenceDef {
  id: string
  type: 'boolean'
  category: PreferenceCategory
  label: string
  description: string
  default: boolean
}

/**
 * A static select preference. Options are known at catalog declaration time.
 * Values are stored as strings; consumers parse them (e.g. to `Number`) where
 * needed. The `default` MUST be a value present in `options`.
 */
interface SelectPreferenceDef {
  id: string
  type: 'select'
  category: PreferenceCategory
  label: string
  description: string
  options: ReadonlyArray<{ value: string; label: string; description?: string }>
  default: string
}

/**
 * A select preference whose options are derived from runtime site state, e.g.
 * the list of breakpoints declared on the active site. The catalog declares
 * the source key; the UI / runtime resolve options at render / read time.
 *
 * `default` is the fallback value used when the source is empty or
 * unavailable (e.g. before a site is loaded).
 */
export type DynamicOptionsSource = 'site.breakpoints'

interface DynamicSelectPreferenceDef {
  id: string
  type: 'select-dynamic'
  category: PreferenceCategory
  label: string
  description: string
  optionsSource: DynamicOptionsSource
  default: string
}

type PreferenceDef =
  | BooleanPreferenceDef
  | SelectPreferenceDef
  | DynamicSelectPreferenceDef

// ---------------------------------------------------------------------------
// PREFERENCE_CATALOG — single source of truth
//
// `as const` is what makes the per-entry literal types survive into derived
// unions like `PreferenceId`. The `satisfies` clause guarantees every entry
// matches `PreferenceDef` without widening the literals.
// ---------------------------------------------------------------------------

export const PREFERENCE_CATALOG = [
  // ── Editor ──────────────────────────────────────────────────────────────
  {
    id: 'hoverPreview',
    type: 'boolean',
    category: 'editor',
    get label() { return translate('metadata.preferences.previewSuggestionsOnHover') },
    get description() { return translate('metadata.preferences.temporarilyApplyClassSuggestionsDesignTokensSpacingColourAndVariableAutocompleteEntriesToTheSelectedCanvasElementWhileHoveringThemInThePropertiesPanel') },
    default: true,
  },
  {
    id: 'confirmBeforeDelete',
    type: 'boolean',
    category: 'editor',
    get label() { return translate('metadata.preferences.confirmBeforeDeletingLayers') },
    get description() { return translate('metadata.preferences.askBeforeRemovingALayerViaTheDeleteKeyOrContextMenuOffByDefaultToMatchPowerUserFlow') },
    default: false,
  },
  {
    id: 'theme',
    type: 'select',
    category: 'editor',
    get label() { return translate('metadata.preferences.theme') },
    get description() { return translate('metadata.preferences.chooseWhetherTheAdminInterfaceUsesTheDefaultDarkChromeOrALightTheme') },
    options: [
      { value: 'dark',  get label() { return translate('metadata.preferences.dark') } },
      { value: 'light', get label() { return translate('metadata.preferences.light') } },
    ],
    default: 'dark',
  },
  {
    id: 'density',
    type: 'select',
    category: 'editor',
    get label() { return translate('metadata.preferences.uiDensity') },
    get description() { return translate('metadata.preferences.compactPacksMoreOnScreenComfortableGivesLargerTouchTargetsAndMoreBreathingRoom') },
    options: [
      { value: 'compact',     get label() { return translate('metadata.preferences.compact') } },
      { value: 'comfortable', get label() { return translate('metadata.preferences.comfortable') } },
    ],
    default: 'compact',
  },
  {
    id: 'textScale',
    type: 'select',
    category: 'editor',
    get label() { return translate('metadata.preferences.uiTextSize') },
    get description() { return translate('metadata.preferences.scaleAdminInterfaceTextIndependentlyFromSpacingDensity') },
    options: [
      { value: 'small',       get label() { return translate('metadata.preferences.small') } },
      { value: 'default',     get label() { return translate('metadata.preferences.default') } },
      { value: 'large',       get label() { return translate('metadata.preferences.large') } },
      { value: 'extra-large', get label() { return translate('metadata.preferences.extraLarge') } },
    ],
    default: 'default',
  },

  // ── Canvas ──────────────────────────────────────────────────────────────
  {
    id: 'defaultBreakpoint',
    type: 'select-dynamic',
    category: 'canvas',
    get label() { return translate('metadata.preferences.defaultViewport') },
    get description() { return translate('metadata.preferences.whichViewportContextTheCanvasFocusesOnWhenASiteIsOpenedMobileFirstDesignersUsuallyPickMobile') },
    optionsSource: 'site.breakpoints',
    default: 'desktop',
  },
  {
    id: 'dimInactiveBreakpoints',
    type: 'boolean',
    category: 'canvas',
    get label() { return translate('metadata.preferences.dimInactiveViewportsWhenEditing') },
    get description() { return translate('metadata.preferences.whenALayerIsSelectedAndThePropertiesPanelIsOpenFadeNonActiveViewportFramesToFocusAttentionOnTheOneBeingEdited') },
    default: true,
  },

  // ── Layers panel ────────────────────────────────────────────────────────
  {
    id: 'layersShowIcon',
    type: 'boolean',
    category: 'layers',
    get label() { return translate('metadata.preferences.showModuleIcon') },
    get description() { return translate('metadata.preferences.displayTheModuleTypeIconContainerTextImageAtTheStartOfEachLayerRow') },
    default: true,
  },
  {
    id: 'layersShowTag',
    type: 'boolean',
    category: 'layers',
    get label() { return translate('metadata.preferences.showHTMLTag') },
    get description() { return translate('metadata.preferences.displayATintedPillWithTheUnderlyingHTMLTagDivHeaderImgBeforeEachLayerName') },
    default: true,
  },
  {
    id: 'layersShowClasses',
    type: 'boolean',
    category: 'layers',
    get label() { return translate('metadata.preferences.showClassNames') },
    get description() { return translate('metadata.preferences.displayAssignedCSSClassNamesAfterEachLayerNameInCSSSelectorFormEGHeaderPaddingM') },
    default: true,
  },
  {
    id: 'layersAutoExpandSelected',
    type: 'boolean',
    category: 'layers',
    get label() { return translate('metadata.preferences.autoExpandOnSelection') },
    get description() { return translate('metadata.preferences.expandTheAncestorsOfTheSelectedLayerSoItStaysVisibleInTheTree') },
    default: true,
  },
  {
    id: 'layersSmoothScroll',
    type: 'boolean',
    category: 'layers',
    get label() { return translate('metadata.preferences.smoothScrollToSelected') },
    get description() { return translate('metadata.preferences.animateScrollingWhenTheTreeJumpsToANewlySelectedLayerTurnOffForInstantSnapping') },
    default: true,
  },

  // ── Properties panel ────────────────────────────────────────────────────
  {
    id: 'propertiesSmoothScroll',
    type: 'boolean',
    category: 'properties',
    get label() { return translate('metadata.preferences.smoothScrollOnTabChange') },
    get description() { return translate('metadata.preferences.animateThePropertiesPanelWhenSwitchingBetweenStyleModuleComponentTabs') },
    default: true,
  },
  {
    id: 'propertiesSectionsExpanded',
    type: 'boolean',
    category: 'properties',
    get label() { return translate('metadata.preferences.expandStyleSectionsByDefault') },
    get description() { return translate('metadata.preferences.openEveryPropertySectionModuleLayoutTypographyWhenAnElementIsSelectedTurnOffToStartWithAllSectionsCollapsed') },
    default: true,
  },

  // ── Command palette (spotlight) ──────────────────────────────────────────
  {
    id: 'spotlightTelemetryEnabled',
    type: 'boolean',
    category: 'spotlight',
    get label() { return translate('metadata.preferences.trackCommandUsageLocalOnly') },
    get description() { return translate('metadata.preferences.anonymouslyCountWhichCommandsYouRunMostOftenSoThePaletteCanSurfaceThemHigherDataNeverLeavesThisDevice') },
    default: false,
  },
] as const satisfies ReadonlyArray<PreferenceDef>

// ---------------------------------------------------------------------------
// Derived types
//
// `as const` on the catalog preserves per-entry literal types. We export the
// element type as `CatalogPreferenceDef` so consumers iterating the catalog
// keep their narrowing — handy in the auto-rendered PreferencesSection where
// `pref.id` must stay the literal union (so it satisfies `BooleanPreferenceId`
// without a cast).
// ---------------------------------------------------------------------------

export type CatalogPreferenceDef = typeof PREFERENCE_CATALOG[number]

/** Catalog entries narrowed to boolean-typed preferences. */
export type BooleanCatalogDef = Extract<CatalogPreferenceDef, { type: 'boolean' }>

/** Catalog entries narrowed to either kind of select-typed preference. */
export type SelectCatalogDef = Extract<
  CatalogPreferenceDef,
  { type: 'select' | 'select-dynamic' }
>

/** Union of every preference id, narrowed to literal strings via `as const`. */
type PreferenceId = CatalogPreferenceDef['id']

/** Subset of ids whose value is a boolean. */
export type BooleanPreferenceId = BooleanCatalogDef['id']

/** Subset of ids whose value is a string (static or dynamic select). */
export type SelectPreferenceId = SelectCatalogDef['id']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATALOG_BY_ID: ReadonlyMap<PreferenceId, CatalogPreferenceDef> = new Map(
  PREFERENCE_CATALOG.map((p) => [p.id, p]),
)

function getPreferenceDef(id: PreferenceId): CatalogPreferenceDef {
  const def = CATALOG_BY_ID.get(id)
  if (!def) throw new Error(`[preferences] unknown preference id: ${id}`)
  return def
}

/** Returns the default value of a boolean preference. */
export function defaultBooleanFor(id: BooleanPreferenceId): boolean {
  const def = getPreferenceDef(id)
  if (def.type !== 'boolean') {
    throw new Error(`[preferences] expected boolean default for ${id}`)
  }
  return def.default
}

/** Returns the default value of a select / select-dynamic preference. */
export function defaultSelectFor(id: SelectPreferenceId): string {
  const def = getPreferenceDef(id)
  if (def.type !== 'select' && def.type !== 'select-dynamic') {
    throw new Error(`[preferences] expected select default for ${id}`)
  }
  return def.default
}

/**
 * Iterate the catalog grouped by category, in catalog declaration order.
 * Returns `CatalogPreferenceDef` (not `PreferenceDef`) so consumers retain
 * the literal id type — required so `useEditorPreference(pref.id)` typechecks
 * inside the auto-rendered Preferences section.
 */
export function preferencesByCategory(): ReadonlyArray<{
  id: PreferenceCategory
  label: string
  description?: string
  preferences: ReadonlyArray<CatalogPreferenceDef>
}> {
  return PREFERENCE_CATEGORIES.map((cat) => ({
    ...cat,
    preferences: PREFERENCE_CATALOG.filter((p) => p.category === cat.id),
  })).filter((group) => group.preferences.length > 0)
}
