import { useCallback, useEffect, useRef, useState } from 'react'
import {
  analyzeImage,
  ApiError,
  uploadImage,
  type AnalysisResponse,
} from './api'
import {
  Camera,
  CheckCircle2,
  Citrus,
  Leaf,
  Loader2,
  RotateCcw,
  Upload,
} from 'lucide-react'

const ALLOWED_SUFFIXES = ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const CLASS_COLORS: Record<string, { ink: string; bar: string }> = {
  green: { ink: 'var(--green)', bar: 'var(--green)' },
  'semi-ripe': { ink: 'var(--lime)', bar: 'var(--lime)' },
  ripe: { ink: 'var(--amber)', bar: 'var(--amber)' },
  overripe: { ink: 'var(--overripe)', bar: 'var(--overripe)' },
}

const STAGES = [
  { key: 'green', label: 'Green', sub: '7 days', ink: 'var(--green)' },
  { key: 'semi-ripe', label: 'Semi-ripe', sub: '4 days', ink: 'var(--lime)' },
  { key: 'ripe', label: 'Ripe', sub: '2 days', ink: 'var(--amber)' },
  { key: 'overripe', label: 'Overripe', sub: '0 days', ink: 'var(--overripe)' },
] as const

type StageKey = (typeof STAGES)[number]['key']

type Phase = 'idle' | 'ready' | 'uploading' | 'analyzing' | 'result' | 'error'

function classInk(predictedClass: string) {
  return (
    CLASS_COLORS[predictedClass.trim().toLowerCase()]?.ink ??
    'var(--ink-secondary)'
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function RipenessTrack({ active }: { active?: StageKey }) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-1">
        {STAGES.map((stage) => {
          const isActive = stage.key === active
          return (
            <div
              key={stage.key}
              className="h-2.5 rounded-[4px] border transition-colors duration-150"
              style={{
                borderColor: isActive ? stage.ink : 'var(--line)',
                background: isActive ? stage.ink : 'var(--raised)',
              }}
            />
          )
        })}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {STAGES.map((stage) => {
          const isActive = stage.key === active
          return (
            <div key={stage.key} className="text-center">
              <div
                className="text-[12px] font-medium"
                style={{
                  color: isActive ? stage.ink : 'var(--ink-secondary)',
                }}
              >
                {stage.label}
              </div>
              <div className="mono text-[11px] text-[var(--ink-muted)]">
                {stage.sub}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<{ kind: string; message: string } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const reset = useCallback(() => {
    setFile(null)
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url)
      return null
    })
    setResult(null)
    setError(null)
    setPhase('idle')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const acceptFile = useCallback((candidate: File) => {
    const dot = candidate.name.lastIndexOf('.')
    const suffix = dot === -1 ? '' : candidate.name.slice(dot).toLowerCase()
    if (!ALLOWED_SUFFIXES.includes(suffix)) {
      setError({
        kind: 'unsupported_type',
        message: 'Use a jpg, png, webp or bmp image',
      })
      setPhase('error')
      setFile(null)
      setResult(null)
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url)
        return null
      })
      return
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setError({ kind: 'too_large', message: 'That image is over the 10 MB limit' })
      setPhase('error')
      setFile(null)
      setResult(null)
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url)
        return null
      })
      return
    }
    setFile(candidate)
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url)
      return URL.createObjectURL(candidate)
    })
    setResult(null)
    setError(null)
    setPhase('ready')
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      const candidate = event.dataTransfer.files?.[0]
      if (candidate) acceptFile(candidate)
    },
    [acceptFile],
  )

  const analyze = useCallback(async () => {
    if (!file) return
    setError(null)
    setPhase('uploading')
    try {
      const upload = await uploadImage(file)
      setPhase('analyzing')
      const analysis = await analyzeImage(upload.image_id)
      setResult(analysis)
      setPhase('result')
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ kind: err.kind, message: err.message })
      } else {
        setError({ kind: 'unreachable', message: 'Something went wrong' })
      }
      setPhase('error')
    }
  }, [file])

  const loading = phase === 'uploading' || phase === 'analyzing'
  const activeKey = result
    ? (STAGES.find(
        (s) =>
          s.key === result.predicted_class.trim().toLowerCase().replace(' ', '-'),
      )?.key as StageKey | undefined)
    : undefined
  const ink = result ? classInk(result.predicted_class) : 'var(--ink-secondary)'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--ink)' }}
              aria-hidden="true"
            >
              <Citrus size={18} strokeWidth={1.5} color="#f5f1e6" />
            </div>
            <div className="serif text-[18px] font-medium leading-none tracking-[-0.01em] text-[var(--ink)]">
              BananaSense
            </div>
          </div>
          <div className="mono text-[11px] text-[var(--ink-muted)]">
            v1.0 · CNN · 94.31% test
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-4">
            <h1 className="serif max-w-[30ch] text-[28px] font-medium leading-[1.15] text-[var(--ink)] lg:text-[32px]">
              Know when a banana is ready to eat
            </h1>
            <p className="mt-3 max-w-[44ch] text-[14px] leading-6 text-[var(--ink-secondary)]">
              Drop in a photo and get the ripeness grade, the model&rsquo;s confidence and how many days it has left. Everything runs through the two API calls on the right.
            </p>

            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <div className="mono text-[11px] tracking-[0.08em] text-[var(--ink-muted)]">
                The scale
              </div>
              <div className="mt-3">
                <RipenessTrack active={activeKey} />
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--line)] pt-6 text-[12px] leading-6 text-[var(--ink-muted)]">
              <div className="flex items-center gap-2">
                <Leaf size={14} strokeWidth={1.5} />
                <span>Green and Semi-ripe are not ready yet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} strokeWidth={1.5} />
                <span>Ripe is the eating window, about two days</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf size={14} strokeWidth={1.5} />
                <span>Overripe means bake it, not eat it plain</span>
              </div>
              <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
                Shelf-life is rule-based, not predicted. The grading model is a custom CNN (128&times;128 input, 4 classes).
              </p>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
              {phase !== 'result' && (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Choose or drop a banana image"
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        inputRef.current?.click()
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`flex h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center transition-colors duration-150 ${
                      isDragging
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--line-strong)] bg-[var(--raised)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selected banana preview"
                        className="max-h-52 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Camera
                          size={28}
                          strokeWidth={1.5}
                          className="text-[var(--ink-muted)]"
                        />
                        <p className="mt-3 text-[14px] font-medium text-[var(--ink)]">
                          Drop a banana image here
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                          or click to browse — jpg, png, webp, bmp up to 10 MB
                        </p>
                      </>
                    )}
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.bmp"
                      className="hidden"
                      onChange={(event) => {
                        const candidate = event.target.files?.[0]
                        if (candidate) acceptFile(candidate)
                      }}
                    />
                  </div>

                  {file && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[var(--ink-muted)]">
                      <span className="truncate mono">
                        {file.name} · {formatSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={reset}
                        className="shrink-0 font-medium text-[var(--ink-secondary)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {loading && (
                    <div
                      className="mt-4 flex items-center gap-2 text-[13px] text-[var(--ink-secondary)]"
                      role="status"
                    >
                      <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                      {phase === 'uploading' ? 'Uploading image' : 'Grading ripeness'}
                    </div>
                  )}

                  {phase === 'error' && error && (
                    <div
                      className="mt-4 rounded-lg border border-[var(--line-strong)] bg-[var(--raised)] px-4 py-3"
                      role="alert"
                    >
                      <p className="text-[13px] font-medium text-[var(--negative)]">
                        {error.message}
                      </p>
                      {file && (
                        <button
                          type="button"
                          onClick={analyze}
                          className="mt-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink)] hover:border-[var(--accent)]"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={analyze}
                    disabled={!file || loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-[14px] font-medium text-[#fffdf7] transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--raised)] disabled:text-[var(--ink-muted)]"
                  >
                    <Upload size={16} strokeWidth={1.5} />
                    {loading ? 'Working' : 'Grade this banana'}
                  </button>
                </>
              )}

              {phase === 'result' && result && (
                <div>
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Analyzed banana"
                        className="h-44 w-44 shrink-0 rounded-xl border border-[var(--line)] object-cover"
                      />
                    )}
                    <div className="w-full">
                      <div
                        className="serif text-[32px] font-medium leading-none"
                        style={{ color: ink }}
                      >
                        {result.predicted_class}
                      </div>
                      <div className="mono mt-1 text-[11px] text-[var(--ink-muted)]">
                        image {result.image_id.slice(0, 8)}
                      </div>

                      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
                        <div>
                          <div className="mono text-[10px] tracking-[0.08em] text-[var(--ink-muted)]">
                            Shelf life
                          </div>
                          <div className="serif text-[28px] font-medium leading-tight text-[var(--ink)]">
                            {result.shelf_life_days === 0
                              ? '0 days'
                              : `${result.shelf_life_days} ${
                                  result.shelf_life_days === 1 ? 'day' : 'days'
                                }`}
                          </div>
                        </div>
                        <div className="text-[13px] leading-6 text-[var(--ink-secondary)]">
                          {result.advice}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mono text-[10px] tracking-[0.08em] text-[var(--ink-muted)]">
                          Confidence
                        </div>
                        <div className="mono mt-0.5 text-[14px] font-medium text-[var(--ink)]">
                          {result.confidence.toFixed(2)}%
                        </div>
                        <div className="mt-1 h-1 w-full max-w-[16rem] overflow-hidden rounded-full bg-[var(--raised)]">
                          <div
                            className="h-full origin-left rounded-full transition-transform duration-500"
                            style={{
                              background: ink,
                              transform: `scaleX(${Math.min(1, Math.max(0, result.confidence / 100))})`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[var(--line)] pt-4">
                    <RipenessTrack active={activeKey} />
                  </div>

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--raised)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  >
                    <RotateCcw size={15} strokeWidth={1.5} />
                    Grade another banana
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-1 px-6 py-4 text-[11px] text-[var(--ink-muted)] sm:flex-row">
          <span>BananaSense — banana ripeness grading</span>
          <span>CNN grades · shelf-life is rule-based</span>
        </div>
      </footer>
    </div>
  )
}

