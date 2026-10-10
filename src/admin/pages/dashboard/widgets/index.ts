import { translate } from '@admin/i18n'
/**
 * First-party dashboard widget bootstrap.
 *
 * Importing this file registers every built-in dashboard widget against
 * `dashboardWidgetRegistry`. The DashboardPage imports it once on mount
 * — subsequent navigations are cheap because the registrations stick.
 *
 * Plugin-registered widgets land separately via
 * `api.dashboard.widgets.register(...)` and don't need to be re-listed
 * here.
 */
import { ActivityWidget } from './ActivityWidget'
import { AiUsageWidget } from './AiUsageWidget'
import { DomainWidget } from './DomainWidget'
import { MediaWidget } from './MediaWidget'
import { PagesWidget } from './PagesWidget'
import { PluginsWidget } from './PluginsWidget'
import { PostsWidget } from './PostsWidget'
import { PublishQueueWidget } from './PublishQueueWidget'
import { StatusWidget } from './StatusWidget'
import { StorageWidget } from './StorageWidget'

import { dashboardWidgetRegistry } from '@core/dashboard'

import { DashboardSolidIcon } from 'pixel-art-icons/icons/dashboard-solid'
import { CloudUploadSolidIcon } from 'pixel-art-icons/icons/cloud-upload-solid'
import { DatabaseSolidIcon } from 'pixel-art-icons/icons/database-solid'
import { FileTextSolidIcon } from 'pixel-art-icons/icons/file-text-solid'
import { GlobeSolidIcon } from 'pixel-art-icons/icons/globe-solid'
import { ImageSolidIcon } from 'pixel-art-icons/icons/image-solid'
import { PenSquareSolidIcon } from 'pixel-art-icons/icons/pen-square-solid'
import { PlugSolidIcon } from 'pixel-art-icons/icons/plug-solid'
import { ZapSolidIcon } from 'pixel-art-icons/icons/zap-solid'

/**
 * One-shot guard so re-importing this module (HMR, tests, lazy mounts)
 * doesn't double-register. The registry's `register` would replace the
 * existing definition by id anyway, but skipping the work shortens the
 * dev-reload tick noticeably.
 */
let registered = false

export function registerFirstPartyDashboardWidgets(): void {
  if (registered) return
  registered = true

  // NOTE: the Visitors widget is no longer registered first-party. A plugin
  // can register its own dashboard tile via `api.dashboard.widgets.register(...)`.
  // The host stays widget-agnostic — installing a plugin is what puts an extra
  // tile on the dashboard.

  dashboardWidgetRegistry.register({
    id: 'pages',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.pages.name') },
    get description() { return translate('dashboard.widgets.pages.description') },
    icon: FileTextSolidIcon,
    defaultSize: 3,
    tint: 'lilac',
    render: PagesWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'posts',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.posts.name') },
    get description() { return translate('dashboard.widgets.posts.description') },
    icon: PenSquareSolidIcon,
    defaultSize: 3,
    tint: 'peach',
    render: PostsWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'storage',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.storage.name') },
    get description() { return translate('dashboard.widgets.storage.description') },
    icon: DatabaseSolidIcon,
    defaultSize: 6,
    tint: 'sky',
    render: StorageWidget,
  })

  // The Top Pages widget also ships from the Analytics plugin (see the
  // Visitors note above). Same rationale — installing the Analytics
  // plugin is what surfaces the most-viewed-URLs tile.

  dashboardWidgetRegistry.register({
    id: 'activity',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.activity.name') },
    get description() { return translate('dashboard.widgets.activity.description') },
    icon: DashboardSolidIcon,
    defaultSize: 4,
    tint: 'peach',
    render: ActivityWidget,
  })

  dashboardWidgetRegistry.register({
    // `id: 'publish'` is preserved as a stable identifier so existing
    // saved dashboard layouts keep finding this widget. The display
    // label is "Publish lineup" — the block-library + widget chrome
    // both read this `name`, so users see the new label everywhere.
    id: 'publish',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.publish.name') },
    get description() { return translate('dashboard.widgets.publish.description') },
    icon: CloudUploadSolidIcon,
    defaultSize: 4,
    tint: 'sky',
    render: PublishQueueWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'plugins',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.plugins.name') },
    get description() { return translate('dashboard.widgets.plugins.description') },
    icon: PlugSolidIcon,
    defaultSize: 4,
    tint: 'mint',
    render: PluginsWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'media',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.media.name') },
    get description() { return translate('dashboard.widgets.media.description') },
    icon: ImageSolidIcon,
    defaultSize: 3,
    tint: 'peach',
    render: MediaWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'status',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.status.name') },
    get description() { return translate('dashboard.widgets.status.description') },
    icon: ZapSolidIcon,
    defaultSize: 3,
    tint: 'mint',
    render: StatusWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'domain',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.domain.name') },
    get description() { return translate('dashboard.widgets.domain.description') },
    icon: GlobeSolidIcon,
    defaultSize: 3,
    tint: 'sky',
    render: DomainWidget,
  })

  dashboardWidgetRegistry.register({
    id: 'ai-usage',
    ownerId: 'core',
    get name() { return translate('dashboard.widgets.ai-usage.name') },
    get description() { return translate('dashboard.widgets.ai-usage.description') },
    icon: ZapSolidIcon,
    defaultSize: 3,
    tint: 'lilac',
    render: AiUsageWidget,
  })
}
