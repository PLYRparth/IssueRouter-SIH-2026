import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMediaUrl, authFetch } from '../api/client'
import {
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  ExternalLink,
  X,
  ZoomIn,
  Image as ImageIcon,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Search,
  Filter
} from 'lucide-react'

// Lifecycle Stages Definition for Citizens
const LIFECYCLE_STAGES = [
  { key: 'submitted', label: '1. Submitted', desc: 'Received and registered on SIC Portal.' },
  { key: 'ai_analysis', label: '2. AI Analyzed', desc: 'Classified for domain urgency and deduplicated.' },
  { key: 'verified', label: '3. Gov Verified', desc: 'Nodal desk officer approved for innovation solution.' },
  { key: 'routed', label: '4. Univ Routed', desc: 'Dispatched to state universities for R&D adoption.' },
  { key: 'research', label: '5. Research & Design', desc: 'Academic engineers building prototype solution.' },
  { key: 'proposal', label: '6. Solution Proposal', desc: 'Formal engineering architecture and budget drafted.' },
  { key: 'industry', label: '7. Industry Partner', desc: 'CSR funding and corporate collaboration secured.' },
  { key: 'impact', label: '8. Field Impact', desc: 'Solution deployed on ground and problem resolved.' },
]

// Determine which step (1-8) a challenge is currently at
function getStageIndex(status) {
  switch (status) {
    case 'pending_verification':
      return 1 // Stage 2: AI Analyzed, awaiting verification
    case 'verified':
    case 'matches_suggested':
    case 'ready_for_routing':
      return 2 // Stage 3: Gov Verified
    case 'routed':
      return 3 // Stage 4: Univ Routed
    case 'in_project':
      return 4 // Stage 5: Research & Design
    case 'proposal_submitted':
      return 5 // Stage 6: Solution Proposal
    case 'partnered':
      return 6 // Stage 7: Industry Partner
    case 'resolved':
      return 7 // Stage 8: Field Impact
    default:
      return 1
  }
}

// Translate internal status code to citizen-friendly copy
function getCitizenStatusInfo(status) {
  switch (status) {
    case 'pending_verification':
      return {
        stageName: 'Under Review & AI Analysis',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        explanation: 'Your challenge has been submitted and is currently undergoing automated deduplication and government desk verification.'
      }
    case 'verified':
    case 'matches_suggested':
    case 'ready_for_routing':
      return {
        stageName: 'Government Verified',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        explanation: 'Government nodal officers have authenticated your report and matched it with relevant university research departments in Jharkhand.'
      }
    case 'routed':
      return {
        stageName: 'Routed to Universities',
        badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        explanation: 'Active invitation dispatched to engineering institutions (such as RIMS, IIT ISM, or NIT) to adopt the problem for solution design.'
      }
    case 'in_project':
      return {
        stageName: 'University Research Active',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        explanation: 'A research institution has accepted your challenge! Faculty and student engineers are actively working on a hardware/software solution.'
      }
    case 'resolved':
      return {
        stageName: 'Solution Deployed & Resolved',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        explanation: 'The solution has been field-tested, deployed in your community, and verified by ground inspectors.'
      }
    default:
      return {
        stageName: 'In Progress',
        badgeColor: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300 border-slate-200 dark:border-neutral-700',
        explanation: 'Your challenge is proceeding through the innovation routing pipeline.'
      }
  }
}

export default function CitizenProgress() {
  const { user, getAuthHeaders } = useAuth()
  const navigate = useNavigate()

  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    fetchMyChallenges()
  }, [])

  const fetchMyChallenges = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/challenges/my')

      if (res && res.ok) {
        const data = await res.json()
        setChallenges(Array.isArray(data) ? data : [])
      } else {
        const err = await res?.json().catch(() => ({}))
        setError(err?.detail || 'Failed to retrieve your challenges.')
      }
    } catch (e) {
      console.error(e)
      setError('Connection error while fetching challenge progress.')
    } finally {
      setLoading(false)
    }
  }

  // Filtered challenges
  const filtered = useMemo(() => {
    const list = Array.isArray(challenges) ? challenges : []
    return list.filter((c) => {
      const term = (search || '').toLowerCase()
      const title = String(c.title || '').toLowerCase()
      const location = String(c.location || '').toLowerCase()
      const domain = String(c.domain || '').toLowerCase()
      const id = String(c.id || '').toLowerCase()
      return !term || title.includes(term) || location.includes(term) || domain.includes(term) || id.includes(term)
    })
  }, [challenges, search])

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = challenges.length
    const review = challenges.filter((c) => c.status === 'pending_verification').length
    const academic = challenges.filter((c) => ['routed', 'in_project'].includes(c.status)).length
    const resolved = challenges.filter((c) => c.status === 'resolved').length
    return { total, review, academic, resolved }
  }, [challenges])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Reported Challenges
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track the real-world journey of your submitted civic issues from verification to research, solution development, and community impact.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/citizen')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>Report New Challenge</span>
        </button>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Submitted', value: stats.total, color: 'text-slate-900 dark:text-white', icon: TrendingUp },
          { label: 'Under Review', value: stats.review, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
          { label: 'University R&D', value: stats.academic, color: 'text-purple-600 dark:text-purple-400', icon: GraduationCap },
          { label: 'Solutions Deployed', value: stats.resolved, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {item.label}
              </span>
              <item.icon size={15} className="text-slate-400" />
            </div>
            <p className={`text-2xl font-extrabold mt-1.5 ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search Bar ── */}
      {challenges.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challenge ID, problem title, or district..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {/* ── Main List / Content ── */}
      {loading ? (
        // Loading Skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-1/4" />
                <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded-full w-24" />
              </div>
              <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-full" />
              <div className="h-2 bg-slate-200 dark:bg-neutral-800 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className="p-8 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-3">
          <AlertCircle size={28} className="mx-auto text-rose-500" />
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load your challenges</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchMyChallenges}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : challenges.length === 0 ? (
        // ── Empty State ──
        <div className="p-10 sm:p-14 rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <TrendingUp size={30} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              You haven't reported any challenges yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Spot a problem in your community? Whether it's a damaged bridge, drinking water contamination, or primary healthcare outage, submit it to track its complete journey to resolution.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Report a Challenge Now</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center text-xs text-slate-400">
          No challenges matched your search filter.
        </div>
      ) : (
        // ── Challenge Cards List ──
        <div className="space-y-4">
          {filtered.map((item) => {
            const statusInfo = getCitizenStatusInfo(item.status)
            const currentStageIdx = getStageIndex(item.status)
            const createdDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'Recently'

            const photosCount = item.media_urls?.length || 0

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-2.5 py-0.5 rounded-md">
                      {item.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {createdDate}
                    </span>
                    {photosCount > 0 && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <ImageIcon size={11} /> {photosCount} {photosCount === 1 ? 'photo' : 'photos'}
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-auto ${statusInfo.badgeColor}`}
                  >
                    <CircleDot size={11} className="animate-pulse" />
                    {statusInfo.stageName}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || item.official_description}
                  </p>
                </div>

                {/* Location & Sector tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700/60 px-2.5 py-1 rounded-lg">
                    <MapPin size={12} className="text-blue-500" />
                    {item.location}
                  </span>
                  {item.domain && (
                    <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700/60 px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                      <Building size={12} className="text-purple-500" />
                      {item.domain}
                    </span>
                  )}
                </div>

                {/* ── 8-Segment Visual Stage Indicator ── */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span>Lifecycle Progress</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Stage {currentStageIdx + 1} of 8 · {LIFECYCLE_STAGES[currentStageIdx]?.label.split('. ')[1]}
                    </span>
                  </div>

                  {/* Segments bar */}
                  <div className="grid grid-cols-8 gap-1.5">
                    {LIFECYCLE_STAGES.map((stg, sIdx) => {
                      const isPast = sIdx < currentStageIdx
                      const isCurrent = sIdx === currentStageIdx

                      return (
                        <div
                          key={stg.key}
                          title={`${stg.label}: ${stg.desc}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isPast
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-900/60 animate-pulse'
                              : 'bg-slate-200 dark:bg-neutral-800'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Current Stage Status Box */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-100">Latest update: </strong>
                    {statusInfo.explanation}
                  </p>

                  <button
                    onClick={() => setSelectedChallenge(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap self-end sm:self-auto cursor-pointer"
                  >
                    <span>View Journey Details</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detailed Challenge Progress Modal ── */}
      {selectedChallenge && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded">
                    {selectedChallenge.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">·</span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedChallenge.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedChallenge.title}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-blue-500" />
                  {selectedChallenge.location}
                </p>
              </div>

              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Your Submitted Problem Statement
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedChallenge.description || selectedChallenge.official_description}
              </p>
            </div>

            {/* Evidence Photos Gallery */}
            {selectedChallenge.media_urls?.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-blue-500" />
                    Submitted Evidence Photos ({selectedChallenge.media_urls.length})
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={11} /> Archived for verification
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {selectedChallenge.media_urls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxPhoto(url)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 cursor-pointer group shadow-xs"
                    >
                      <img 
                        src={getMediaUrl(url)} 
                        alt={`Evidence ${i + 1}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const fallback = getMediaUrl(url)
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ZoomIn size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 8-Stage Timeline ── */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                End-to-End Resolution Journey
              </p>

              <div className="border-l-2 border-slate-200 dark:border-neutral-700 ml-3 pl-4 space-y-4 text-xs">
                {LIFECYCLE_STAGES.map((stg, sIdx) => {
                  const currentIdx = getStageIndex(selectedChallenge.status)
                  const isDone = sIdx < currentIdx
                  const isCurrent = sIdx === currentIdx

                  return (
                    <div key={stg.key} className="relative">
                      {/* Step node dot */}
                      <div
                        className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ring-4 ring-white dark:ring-neutral-900 transition-all ${
                          isDone
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-blue-600 ring-blue-200 dark:ring-blue-900/60 animate-pulse'
                            : 'bg-slate-300 dark:bg-neutral-700'
                        }`}
                      />

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-bold ${
                              isDone
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isCurrent
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {stg.label}
                          </p>
                          {isDone && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Complete
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                              ● Current Stage
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11.5px]">
                          {stg.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer Note */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Logged under Jharkhand State Innovation Cluster.
              </p>
              <button
                type="button"
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <img 
              src={getMediaUrl(lightboxPhoto)} 
              alt="Zoomed evidence" 
              className="max-h-[80vh] w-auto object-contain" 
              onError={(e) => {
                const fallback = getMediaUrl(lightboxPhoto)
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
