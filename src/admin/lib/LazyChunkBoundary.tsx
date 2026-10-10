import { useI18n } from '@admin/i18n'
import {
  Fragment,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ErrorBoundary } from '@ui/components/ErrorBoundary'
import { Button } from '@ui/components/Button'
import { ReloadIcon } from 'pixel-art-icons/icons/reload'
import styles from './LazyChunkBoundary.module.css'

const DEFAULT_TIMEOUT_MS = 8000
const EMPTY_RESET_KEYS: ReadonlyArray<unknown> = []

interface LazyChunkBoundaryProps {
  location: string
  fallback: ReactNode
  resetKeys?: ReadonlyArray<unknown>
  timeoutMs?: number
  onReset?: () => void
  children: ReactNode
}

export function LazyChunkBoundary({
  location,
  fallback,
  resetKeys = EMPTY_RESET_KEYS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onReset,
  children,
}: LazyChunkBoundaryProps) {
  const { t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  const boundaryResetKeys = [...resetKeys, attempt]

  function retry(resetErrorBoundary?: () => void) {
    onReset?.()
    setAttempt((current) => current + 1)
    resetErrorBoundary?.()
  }

  return (
    <ErrorBoundary
      location={location}
      resetKeys={boundaryResetKeys}
      fallback={({ chain, reset }) => (
        <LazyChunkFailure
          titleId={`lazy-chunk-boundary-${location}-title`}
          title={t('shell.copy.editorChunkFailedToLoad')}
          message={chain[0]?.message ?? t('shell.copy.theEditorChunkCouldNotBeLoaded')}
          onRetry={() => retry(reset)}
        />
      )}
    >
      <Suspense
        fallback={(
          <LazyChunkPendingFallback
            key={`${attempt}:${timeoutMs}`}
            fallback={fallback}
            timeoutMs={timeoutMs}
            onRetry={() => retry()}
          />
        )}
      >
        <LazyChunkAttempt key={attempt}>{children}</LazyChunkAttempt>
      </Suspense>
    </ErrorBoundary>
  )
}

function LazyChunkAttempt({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>
}

function LazyChunkPendingFallback({
  fallback,
  timeoutMs,
  onRetry,
}: {
  fallback: ReactNode
  timeoutMs: number
  onRetry: () => void
}) {
  const { t } = useI18n()
  const [timedOut, setTimedOut] = useState(timeoutMs <= 0)

  useEffect(() => {
    if (timeoutMs <= 0) return
    const timeoutId = window.setTimeout(() => setTimedOut(true), timeoutMs)
    return () => window.clearTimeout(timeoutId)
  }, [timeoutMs])

  if (!timedOut) return <Fragment>{fallback}</Fragment>

  return (
    <LazyChunkFailure
      titleId="lazy-chunk-boundary-pending-title"
      title={t('shell.copy.editorIsStillLoading')}
      message={t('shell.copy.theDevServerHasNotDeliveredTheEditorChunkYet')}
      onRetry={onRetry}
    />
  )
}

function LazyChunkFailure({
  titleId,
  title,
  message,
  onRetry,
}: {
  titleId: string
  title: string
  message: string
  onRetry: () => void
}) {
  const { t } = useI18n()
  return (
    <section
      className={styles.chunkFailure}
      role="alert"
      aria-labelledby={titleId}
    >
      <div className={styles.panel}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <ReloadIcon size={13} aria-hidden="true" />
            <span>{t('shell.copy.retry')}</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
