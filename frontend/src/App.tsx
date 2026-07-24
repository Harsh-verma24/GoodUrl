import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'

type DeployResponse = {
  id: string
}

type StatusResponse = {
  status?: string | null
}

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL 
const DEFAULT_SITE_BASE_DOMAIN = import.meta.env.VITE_SITE_BASE_DOMAIN 
const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL.replace(/\/$/, ''),
})

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [deploymentId, setDeploymentId] = useState('')
  const [status, setStatus] = useState('idle')
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [message, setMessage] = useState(
    'Paste a public GitHub repository URL to start a deployment.',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const deploymentInProgress = Boolean(deploymentId) && status !== 'deployed'

  const deployedSiteUrl = useMemo(() => {
    if (!deploymentId) {
      return ''
    }

    const normalizedDomain = DEFAULT_SITE_BASE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `http://${deploymentId}.${normalizedDomain}`
  }, [deploymentId])

  const statusLabel = useMemo(() => {
    if (status === 'deployed') {
      return 'Live'
    }

    if (status === 'uploaded') {
      return 'Uploaded'
    }

    if (status === 'idle') {
      return 'Ready'
    }

    return 'Checking'
  }, [status])

  useEffect(() => {
    if (!deploymentId) {
      return
    }

    let cancelled = false
    let intervalId: number | undefined

    const stopPolling = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }

    const pollStatus = async () => {
      try {
        const { data } = await api.get<StatusResponse>('/status', {
          params: { id: deploymentId },
        })

        if (cancelled) {
          return
        }

        const nextStatus = data.status ?? 'pending'
        setStatus(nextStatus)
        setLastChecked(new Date().toLocaleTimeString())

        if (nextStatus === 'deployed') {
          setMessage('Deployment finished. Your site is now live.')
          stopPolling()
        } else if (nextStatus === 'uploaded') {
          setMessage('Repository cloned and uploaded. Build is still running.')
        } else {
          setMessage('Polling deployment status every 2 seconds.')
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          if (axios.isAxiosError(error)) {
            setMessage(error.response?.data?.message ?? error.message)
          } else {
            setMessage('Unable to read deployment status.')
          }
        }
      }
    }

    void pollStatus()
    intervalId = window.setInterval(pollStatus, 2000)

    return () => {
      cancelled = true
      stopPolling()
    }
  }, [deploymentId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (deploymentInProgress) {
      setMessage('Wait until the current deployment is deployed before starting another one.')
      return
    }

    const trimmedUrl = repoUrl.trim()

    if (!trimmedUrl) {
      setStatus('error')
      setMessage('Enter a GitHub repository URL first.')
      return
    }

    setIsSubmitting(true)
    setStatus('starting')
    setMessage('Submitting deployment request...')
    setLastChecked(null)

    try {
      const { data } = await api.post<DeployResponse>('/deploy', {
        repoUrl: trimmedUrl,
      })

      setDeploymentId(data.id)
      setStatus('queued')
      setMessage('Deployment created. Polling status every 2 seconds.')
    } catch (error) {
      setStatus('error')
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message ?? error.message)
      } else {
        setMessage('Deployment failed to start.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-22px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              GoodUrl
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Deploy with GoodUrl.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Paste a repository URL, deploy it, and watch the status refresh every 2 seconds.
            </p>
          </div>

          <form className="mt-8" onSubmit={handleSubmit}>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="repoUrl">
              GitHub repository URL
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="repoUrl"
                type="url"
                inputMode="url"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isSubmitting || deploymentInProgress}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting
                  ? 'Deploying...'
                  : deploymentInProgress
                    ? 'Waiting...'
                    : 'Deploy'}
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                  status === 'deployed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'error'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-700'
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-sm text-slate-500">
                {deploymentId ? `id: ${deploymentId}` : 'No deployment yet'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">{message}</p>

            {status === 'deployed' && deployedSiteUrl ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Live URL
                    </span>
                    <p className="mt-1 break-all font-medium text-slate-950">{`${deployedSiteUrl}/index.html`}</p>
                  </div>
                  <a
                    href={`${deployedSiteUrl}/index.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
                  >
                    Open site
                  </a>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </span>
                <strong className="mt-2 block text-sm font-semibold text-slate-950">{status}</strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Last checked
                </span>
                <strong className="mt-2 block text-sm font-semibold text-slate-950">
                  {lastChecked ?? 'Waiting for first poll'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
