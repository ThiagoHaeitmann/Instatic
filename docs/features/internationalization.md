# Internationalization

Admin-interface locale selection, translation lookup, persistence, and locale-aware formatting.

Instatic internationalizes its administration interface independently from site content. English is the source and fallback language; Brazilian Portuguese is the second supported locale. Published pages, user-authored content, plugin-authored labels, identifiers, routes, logs, and protocol values do not pass through the admin translator.

---

## TL;DR

- Supported locales are `en` and `pt-BR`; `en` is the default and fallback.
- `src/admin/i18n/` is the source of truth for locale detection, catalogs, formatting, persistence, and React integration.
- Resolution order is explicit persisted selection, browser locale, then English.
- Manual selection is available before login and in Settings → Preferences.
- The selection is validated and stored under `instatic-locale`; storage events synchronize open tabs.
- Messages support named `{{value}}` interpolation and `Intl.PluralRules` plural categories.
- Dates, numbers, currency, relative time, lists, and byte sizes use helpers from `@admin/i18n`.
- Admin shell, shared admin controls, authentication, Dashboard, and primitive-owned defaults are localized; other workspace copy is not yet migrated.
- Shared primitives consume `src/ui/localization/`, with English defaults outside the admin provider; they never initialize admin locale state.

## Architecture

```text
navigator.languages + localStorage
              │
              ▼
src/admin/i18n/locale.ts
              │ resolve supported locale
              ▼
src/admin/i18n/runtime.ts
      ├─ English fallback catalog
      ├─ active-locale catalog
      ├─ interpolation + plural selection
      └─ storage-event subscriptions
              │
              ▼
src/admin/i18n/I18nProvider.tsx
              │
              ├─ src/admin/main.tsx
              ├─ pre-auth language selector
              └─ Settings → Preferences selector
```

The runtime is intentionally in-repo. With two locales, the required behavior fits on top of React, TypeBox, and the platform `Intl` APIs without adding a general-purpose i18n dependency to the eager admin bundle.

## Locale resolution and persistence

`src/admin/i18n/locale.ts` resolves the locale in this order:

1. A valid explicit value stored in `instatic-locale`.
2. The first supported entry in `navigator.languages`.
3. English.

`pt` and `pt-BR` normalize to `pt-BR`; English regional tags normalize to `en`. Unsupported or corrupted stored values are ignored. Browser detection is not persisted automatically, so a browser-language change remains observable until the user makes an explicit choice.

The stored shape is validated with TypeBox:

```ts
{ locale: 'en' | 'pt-BR' }
```

`src/admin/i18n/runtime.ts` listens for the native `storage` event. A manual choice in one tab updates other open admin tabs and sets `document.documentElement.lang`.

## Messages

`src/admin/i18n/messages.ts` aggregates English and Brazilian Portuguese catalogs with exact key parity. Shell messages live in `shellMessages.ts`, Dashboard messages in `dashboardMessages.ts`, and primitive translations in `uiMessages.ts`; the primitive English source is `src/ui/localization/englishMessages.ts`. Catalogs are data-only and do not import workspace implementations. The runtime retains English fallback behavior for missing translations; parity and interpolation tests prevent missing keys in shipped resources.

Translate host-owned metadata at render/read time, not once at module initialization. First-party Dashboard definitions expose translated name/description getters, and `useDashboardWidgets` subscribes to locale changes without replacing the registry snapshot. Plugin names and descriptions remain author-owned.

Use named interpolation:

```ts
t('auth.validation.passwordMinimum', { count: MIN_PASSWORD_LENGTH })
```

Plural messages use locale plural categories:

```ts
'items.one': '{{count}} item'
'items.other': '{{count}} items'
```

Call the base key with a numeric `count`; `Intl.PluralRules` selects the suffix.

## Shared primitive isolation

`src/admin/i18n/I18nProvider.tsx` subscribes to the existing admin runtime and supplies its active catalog and locale through `UiI18nContext` from `src/ui/localization/`. Functional primitives use `useUiI18n`; the class-based `ErrorBoundary` consumes the same context so an already-visible recovery screen updates without retrying the failed child.

Outside this provider, primitives use English defaults and do not read admin storage, attach admin listeners, or change document language. Caller-supplied labels, notification bodies, options, and user/plugin values are preserved. `DateTimePicker` formats its calendar using the context locale while retaining local wall-clock values and Monday-first ordering.

## Formatting

`src/admin/i18n/format.ts` owns locale-aware helpers:

- `formatNumber`
- `formatCurrency`
- `formatDate`
- `formatRelativeTime`
- `formatList`
- `formatBytes`

Use these for admin presentation instead of implicit `toLocaleString()` calls or handcrafted English relative-time/count strings. Do not use locale-aware formatting for stable identifiers, generated source, persisted values, or deterministic build output.

## Scope boundaries

Translate admin-owned visible text, accessible names, placeholders, tooltips, validation, and operation feedback.

Do not translate:

- Published HTML or site metadata.
- Page-tree and content-row values.
- User-authored names, labels, selectors, slugs, paths, and filenames.
- Plugin-authored metadata.
- Module IDs, capability IDs, routes, database fields, CSS properties, or protocol values.
- Developer logs, comments, or invariant messages.

## Adding a locale

1. Add its canonical tag to `SUPPORTED_LOCALES` in `src/admin/i18n/locale.ts`.
2. Extend locale normalization deliberately; do not accept arbitrary tags.
3. Add a catalog to `src/admin/i18n/messages.ts`.
4. Add the native locale label to `LanguageSelector.tsx`.
5. Add detection, persistence, pluralization, fallback, formatting, and document-language tests.
6. Update this document and `docs/reference/persistence-keys.md` if storage behavior changes.

## Forbidden patterns

- Translating a persisted identifier or user-authored value.
- Concatenating translated sentence fragments.
- Handwriting singular/plural suffixes.
- Reading unvalidated locale JSON from storage.
- Setting the published site language from the admin locale.
- Importing the admin i18n module from `src/core/` or `src/modules/`.

## Related

- [docs/editor.md](../editor.md) — admin bootstrap and Settings integration.
- [docs/reference/persistence-keys.md](../reference/persistence-keys.md) — client persistence catalog.
- [docs/reference/typebox-patterns.md](../reference/typebox-patterns.md) — validated JSON boundaries.
- Source-of-truth files:
  - `src/admin/i18n/locale.ts`
  - `src/admin/i18n/runtime.ts`
  - `src/admin/i18n/messages.ts`
  - `src/admin/i18n/format.ts`
  - `src/admin/i18n/I18nProvider.tsx`
  - `src/admin/i18n/LanguageSelector.tsx`
  - `src/admin/main.tsx`
- Tests:
  - `src/__tests__/admin/i18n.test.tsx` — runtime and aggregate catalog parity.
  - `src/__tests__/admin/shellI18n.test.tsx` — shared shell/authentication controls and metadata.
  - `src/__tests__/admin/dashboardI18n.test.tsx` — Dashboard widgets, metadata, pluralization, and plugin isolation.
  - `src/__tests__/ui/primitiveI18n.test.tsx` — primitive defaults, live switching, and standalone isolation.
