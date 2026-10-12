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
- Admin shell, shared admin controls, authentication, Dashboard, Preferences, Account, Users, Content-owned UI, primitive-owned defaults, and host-owned structured metadata are localized; other workspace copy is not yet migrated.
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

`src/admin/i18n/messages.ts` aggregates English and Brazilian Portuguese catalogs with exact key parity. Shell messages live in `shellMessages.ts`, Dashboard messages in `dashboardMessages.ts`, Account/Users messages in `accountUsersMessages.ts`, structured metadata in `metadataMessages.ts`, Content presentation in `contentMessages.ts`, and primitive translations in `uiMessages.ts`; the primitive English source is `src/ui/localization/englishMessages.ts`. Catalogs are data-only and do not import workspace implementations. The runtime retains English fallback behavior for missing translations; parity and interpolation tests prevent missing keys in shipped resources.

Translate host-owned metadata at render/read time, not once at module initialization. First-party Dashboard definitions expose translated name/description getters, and `useDashboardWidgets` subscribes to locale changes without replacing the registry snapshot. Plugin names and descriptions remain author-owned.

### Structured metadata catalogs

`metadataMessages.ts` aggregates the data-only `preferenceMetadataMessages.ts`, `spotlightMetadataMessages.ts`, `aiMetadataMessages.ts`, and `presentationMetadataMessages.ts` catalogs, with 386 keys per locale. The leaf catalogs import nothing; the aggregate never imports metadata owners, React, or the runtime, so eager catalog loading cannot pull workspace implementations into the shell.

Host-owned definitions resolve presentation fields through getters at read time:

- `src/admin/pages/site/preferences/catalog.ts`: category labels/descriptions, preference labels/descriptions, and static option labels. Dynamic breakpoint labels remain site-authored. Preferences also translates its device/history controls and missing-option presentation without changing persisted values.
- `src/admin/spotlight/commands/`, `scopes/`, and `providers/`: built-in command titles/subtitles, argument labels/placeholders, scope titles/placeholders, and host provider/group labels. Derived preference commands keep getters for their titles, descriptions, arguments, and options; `makeServerProvider` forwards the live config label instead of copying it. Cached command objects and their execution/gating metadata retain their identity. Search uses localized titles while existing command aliases remain intact.
- `src/admin/pages/ai/providerCatalog.ts` and `src/admin/ai/scopeCatalog.ts`: host-owned descriptions and generic presentation labels. Provider brands, model names, endpoint addresses, auth modes, and scope IDs remain unchanged. Scope icons stay with their admin renderer.
- `src/admin/shared/presentationCatalog.ts`: the single field-type label map, content/user status labels, media type/sort options, and storage-role labels. Field dialogs and the inspector share the same type labels. Branch review filter/action/status metadata remains with `reviewFormat.ts`; storage role descriptions remain with their owner. Filtering, permission checks, status values, and sort values do not change.

Admin metadata renderers subscribe with `useI18n()` so an open palette, dialog, or metadata panel updates without reopening. Rendered option copies preserve their stable `value` while reading their current label. Plugin commands, providers, adapter labels, and option metadata pass through verbatim, even when their text matches a host English message. Capability and Dashboard metadata were already migrated in Phase 2 and are not duplicated in the metadata catalog.

This is a metadata migration, not a workspace UI migration: workspace headings, forms, validation, operation feedback, body-editor menus, site-editor controls, first-party module/core presentation, and server envelopes remain for their numbered phases below. No admin localization imports are added to core, UI, modules, or the server.

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

## Account / Users presentation

`accountUsersMessages.ts` contains 286 keys per locale for Account and Users workspace chrome: profile/avatar/password forms; step-up settings; MFA setup, QR fallback and recovery-code dialogs; active sessions and sign-in history; user/role management, capability groups, action menus, and audit events. Loading/empty states, accessible names, placeholders, field validation, operation feedback, and counts use the same runtime as the shell.

- Names, emails, role names/descriptions/slugs, capability IDs, session/device labels, IPs, user agents, MFA secrets, recovery/authentication codes, and URLs remain verbatim. Audit presentation translates known host action sentences around their original values; unknown action IDs retain the existing diagnostic humanization rather than being translated. Unknown status and capability values remain raw.
- `src/admin/shared/accountUsersFeedback.ts` stores host field validation, success feedback, and load fallbacks as message descriptors, resolved at render time. Raw server/diagnostic messages remain strings. Session refresh failures retain the last successfully loaded devices rather than replacing them with an empty list; the load error remains translatable and stale/unmounted failures are discarded. User-triggered operation failures use the global toast bus with a translated host title and the original server message; step-up cancellation remains silent. Toasts, like other caller-owned notifications, capture the locale at emission.
- Capability rows reuse the Phase 2 message keys in `CapabilityPicker/capabilityMeta.ts`. Their snapshots take an explicit locale. Role groups have stable IDs independent of translated headings, preserving checkbox identity/focus during locale changes.
- Dates, relative session activity, numbers, byte-size hints, and plural counts use the shared `Intl` helpers. Date, number, relative-time, and byte-size formatting accept an explicit locale for compiled consumers, while non-render callers can use the current runtime locale.

### React Compiler locale dependencies

A locale subscription alone does not invalidate cached calls to an ambient getter or formatter. `useI18n().t` captures the subscribed locale and passes it to `translate`, so the production compiler invalidates the translator closure and downstream render caches when that actual input changes. Metadata snapshots and date/number/relative-time helpers also receive locale explicitly. Do not add dummy dependencies or disable compilation to work around stale translations.

`src/__tests__/admin/accountUsersI18n.test.tsx` uses `metadataCompilerHarness.ts` with the production React Compiler preset for both consumers **and the locale hook**. Mounted `en → pt-BR → en` regressions cover page shells, typed forms, open menus/dialogs, persisted validation/success/load feedback, MFA secrets/recovery codes, capability metadata/checkbox identity, unchanged user/role/audit data, session formatting, counts, ARIA, and loading/empty states. Each compiler invocation has distinct consumer, hook, and bridge paths, including repeated or differing extra-export/locale-hook configurations, so imported fixtures cannot collide in the module cache. Regressions verify both exported values and actual hook identity. Compiling only the consumer would miss a locale-independent cached translator in the hook. Password/MFA asynchronous operation handling stays outside component compiler scopes so `finally` cleanup remains intact without a compiler bailout; the capability picker's empty default set is module-owned for the same reason.

## Content presentation

`contentMessages.ts` contains 202 keys per locale for Content-owned collection/entry lists and action menus, document/empty/loading chrome, settings, write/live mode, publish/save status and actions, rich-text bubble/floating/slash menus, link and alt-text forms, inline media uploads, rename/collection-settings dialogs, and shared scheduling presentation. Shared binding and version-history surfaces reuse the shell catalog.

- Collection names and singular/plural labels, entry titles/body/SEO values, authors and role names, filenames, alt text, URLs, routes, slugs, schema field IDs/labels, command IDs, and stored statuses remain verbatim. Host fallback titles are translated only for empty presentation; stored `Untitled` and inserted heading text are not rewritten by changing locale.
- `src/admin/shared/contentFeedback.ts` distinguishes live host message descriptors from raw server/diagnostic strings. Persistent load fallbacks resolve at render time; operation failures use translated toast titles and raw details. Schedule-time validation is field-local and remains live while the dialog is open. Caller-owned toasts capture their emission locale.
- Rich-text catalogs store message keys, not translated snapshots. Slash search resolves current host labels/descriptions while retaining command IDs and existing keyword aliases. The installed Suggestion plugin owns a locale subscription that refilters an active query and updates its renderer even when query/range are unchanged; no document or selection transaction is needed. Its command catalog is created once per installed plugin. Awaited item callbacks resolve the latest locale only while the plugin view is alive and the current suggestion is active with the same query/range; callbacks settling after exit or destruction cannot restore the menu. Destruction invalidates the view before removing the subscription and closing the renderer.
- `ContentInsertNotch` is Content-owned: it renders document actions without importing the Site module-insertion registry or page-tree history. Its action IDs and anchors remain stable. The Content rail's color identity uses stable panel IDs, not translated labels.
- Long-lived Write and Live Tiptap instances refresh accessible names and placeholder decorations on locale changes through `utils/editorI18n.ts`; the editor, document, selection, and markdown remain intact. Write-mode `useEditor` attributes also use the subscribed translator so subsequent same-locale edits/rerenders cannot reapply a compiler-cached English label. Locale is an explicit input to compiled binding-preview snapshots, counts, publication dates, relative time, and list formatting.
- The shared `SchedulePublishDialog`, `DataBindingPicker`, and `VersionHistoryDialog` are localized without migrating their callers' workspaces. Data-owned collection creation/schema composition, custom cell editors/relation pickers, and the embedded Media library/picker/viewer remain owned by Phases 6/7; AI and Site surfaces remain owned by their phases. Content has no independent list search/sort/filter or bulk toolbar to migrate; those embedded surfaces belong to the owning workspace.

`src/__tests__/admin/contentI18n.test.tsx` uses `metadataCompilerHarness.ts` to compile actual consumers **and `useI18n`** with the production preset. Mounted `en → pt-BR → en` regressions cover document/notch and preview chrome, modes, explorer counts/status/loading/empty states, open context/publish/slash menus, settings options, rename/collection forms and unchanged mutation payloads, link/alt forms, the real Tiptap editor, scheduling, binding source snapshots, and version dates/confirmation. Catalog parity/interpolation, plural counts, feedback isolation/toasts, and document/selection preservation have focused checks. Lifecycle regressions exercise same-locale edits/parent rerenders after switching the compiled editor, an installed Suggestion with an unchanged `/tít` query, locale changes before awaited items settle, menu exit, and subscription cleanup on destruction. Real installed-plugin regressions cover both start and update callbacks with exit or destruction occurring before items settle; rejected callbacks leave the document/selection unchanged and later valid sessions still open.

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

## Numbered migration roadmap

1. **Foundation / pre-auth / Preferences — complete.** Locale runtime, persistence, formatting, React integration, pre-auth selection and authentication; Preferences language selection. Preference-catalog presentation is completed with Phase 3 metadata.
2. **Shell / shared / Dashboard — complete.** Admin shell, shared controls, primitive defaults, capability presentation, Dashboard UI and first-party widget metadata; plugin isolation.
3. **Structured metadata — complete.** Remaining Preferences catalogs; Spotlight core commands/groups/arguments/scopes/provider labels; AI provider/scope host metadata; admin field/status/filter/sort/storage-role/review presentation catalogs. Read-time lookup, live rendering, stable protocol values, and focused regression tests.
4. **Account / Users — complete.** Profile/avatar/password/step-up/MFA/recovery forms and dialogs; sessions and sign-in history; user/role management and audit UI; validation, operation feedback, counts, locale-aware formatting, accessible/loading/empty states, capability metadata reuse, and mounted production-compiler locale-switch regressions.
5. **Content — complete.** Content-owned collection/entry presentation and actions; document and preview chrome; body-editor menus, media toolbar and inline uploads; settings; rename/collection-settings/scheduling dialogs; validation and operation feedback; counts, dates and ARIA; mounted production-compiler locale-switch regressions. Embedded Data/Media/AI-owned surfaces remain in their respective phases.
6. **Data / import / export — pending.** Table and field management UI, import/export flows, validation and operation feedback beyond shared metadata.
7. **Media — pending.** Library, picker, uploads, bulk editing, storage UI and operation feedback beyond shared metadata.
8. **Plugins — pending.** Host-owned plugin workspace/install/settings UI and feedback; plugin-authored content remains outside admin translation.
9. **AI / MCP — pending.** AI settings/chat, defaults, provider credentials, MCP connectors and audit UI beyond host-owned provider/scope metadata; preserve model/provider names and protocol values.
10. **Branches — pending.** Branch dialogs, review UI, comments, merge feedback and history beyond filter/action/status metadata.
11. **Site Editor — pending.** Canvas, panels, property controls, toolbar, explorer, settings outside Preferences, dialogs and feedback.
12. **Modules / core presentation — pending.** First-party module and engine-owned presentation translated at admin rendering boundaries, with no admin imports into core/modules/UI and no changes to published output.
13. **Server envelopes — pending.** Deliberate handling of user-visible server failures without translating identifiers, logs, or protocol values.
14. **Audit / gates / E2E / docs — pending.** Remaining-copy audit, architectural enforcement, locale-switch/fresh-install user E2E, catalog quality and final documentation coverage.

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
  - `src/admin/i18n/metadataMessages.ts`
  - `src/admin/i18n/accountUsersMessages.ts`
  - `src/admin/shared/accountUsersFeedback.ts`
  - `src/admin/i18n/contentMessages.ts`
  - `src/admin/shared/contentFeedback.ts`
  - `src/admin/pages/content/components/ContentInsertNotch.tsx`
  - `src/admin/pages/content/utils/editorI18n.ts`
  - `src/admin/shared/CapabilityPicker/capabilityMeta.ts`
  - `src/admin/pages/users/utils/audit.ts`
  - `src/admin/i18n/useI18n.ts`
  - `src/admin/ai/scopeCatalog.ts`
  - `src/admin/shared/presentationCatalog.ts`
  - `src/admin/i18n/format.ts`
  - `src/admin/i18n/I18nProvider.tsx`
  - `src/admin/i18n/LanguageSelector.tsx`
  - `src/admin/main.tsx`
- Tests:
  - `src/__tests__/admin/i18n.test.tsx` — runtime and aggregate catalog parity.
  - `src/__tests__/admin/accountUsersI18n.test.tsx` — Account/Users catalog parity, formatting/plurals, raw-value isolation, and mounted compiler-backed locale changes (including the compiled locale hook).
  - `src/__tests__/admin/contentI18n.test.tsx` — Content catalog parity, interpolation/plurals, feedback/raw-data boundaries, and mounted compiler-backed locale changes (including the compiled locale hook).
  - `src/__tests__/admin/metadataCompilerHarness.ts` — production-preset compiler fixtures with an optional compiled locale-hook bridge and process-lifetime cleanup across test files.
  - `src/__tests__/admin/metadataI18n.test.tsx` — structured catalog parity/isolation, cached identity, translated search, live Preferences/Spotlight rendering, stable values, and plugin metadata preservation.
  - `src/__tests__/admin/shellI18n.test.tsx` — shared shell/authentication controls and metadata.
  - `src/__tests__/admin/dashboardI18n.test.tsx` — Dashboard widgets, metadata, pluralization, and plugin isolation.
  - `src/__tests__/ui/primitiveI18n.test.tsx` — primitive defaults, live switching, and standalone isolation.
