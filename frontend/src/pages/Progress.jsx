import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authFetch, getMediaUrl } from '../api/client'
import CitizenProgress from './CitizenProgress'
import IndustryProgress from './IndustryProgress'
import {
    ChevronDown,
    ChevronUp,
    Building2,
    User,
    Activity,
    CheckCircle2,
    Clock,
    Wrench,
    CircleDot,
    Search,
    Filter,
    Image as ImageIcon,
    BadgeCheck,
    MapPin,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Check,
    X,
    Layers,
    AlertCircle,
    GraduationCap,
    DollarSign,
    Award,
    Circle
} from 'lucide-react'

// 8-Stage State Innovation Corridor Lifecycle Pipeline
const LIFECYCLE_STAGES = [
    { id: 1, key: 'submitted', label: '1. Ingestion & AI Triaged', desc: 'Distress signals aggregated, deduplicated, and domain scored.' },
    { id: 2, key: 'verified', label: '2. Government Verified', desc: 'Validated by desk officer for university innovation routing.' },
    { id: 3, key: 'routed', label: '3. University Routed', desc: 'Dispatched to higher education institutions with SLA deadline.' },
    { id: 4, key: 'in_project', label: '4. University R&D Active', desc: 'Adopted by academic research team; engineering prototype underway.' },
    { id: 5, key: 'proposal_submitted', label: '5. Solution Proposal Submitted', desc: 'TRL readiness, technical architecture, and budget blueprint drafted.' },
    { id: 6, key: 'partnered', label: '6. Industry CSR Partnered', desc: 'Corporate grant allocated and field co-pilot commitment secured.' },
    { id: 7, key: 'field_pilot', label: '7. Field Testing & Pilot', desc: 'On-ground implementation and community prototype trial in progress.' },
    { id: 8, key: 'resolved', label: '8. Field Impact Resolved', desc: 'Validated by ground inspectors and closed with documented impact.' },
]

function getStageIndex(status, hasProposal = false, isPartnered = false) {
    if (status === 'resolved' || status === 'deployed') return 7 // Stage 8
    if (isPartnered || status === 'partnered') return 5 // Stage 6
    if (hasProposal || status === 'proposal_submitted') return 4 // Stage 5
    if (status === 'in_project') return 3 // Stage 4
    if (status === 'routed') return 2 // Stage 3
    if (['verified', 'matches_suggested', 'ready_for_routing'].includes(status)) return 1 // Stage 2
    return 0 // Stage 1
}

function formatDuration(ms) {
    if (ms == null) return 'Closed'
    if (ms <= 0) return 'Expired'
    const totalMinutes = Math.floor(ms / 60000)
    const days = Math.floor(totalMinutes / (60 * 24))
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
    const minutes = totalMinutes % 60

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
}

function StatusBadge({ status }) {
    if (status === 'resolved' || status === 'deployed') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={11} className="text-emerald-600" />
                Resolved
            </span>
        )
    }
    if (status === 'in_project' || status === 'proposal_submitted' || status === 'partnered') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <GraduationCap size={11} className="text-purple-600" />
                University R&D Active
            </span>
        )
    }
    if (status === 'routed') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Clock size={11} className="text-blue-600" />
                Routed (Bidding)
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Activity size={11} className="text-amber-600" />
            Under Evaluation
        </span>
    )
}

function InnovationLifecycleTracker({ status, hasProposal, isPartnered }) {
    const currentStageIdx = getStageIndex(status, hasProposal, isPartnered)

    return (
        <div className="relative pl-3 py-3 pr-2">
            <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
            <div className="space-y-4">
                {LIFECYCLE_STAGES.map((stage, idx) => {
                    const isDone = idx < currentStageIdx || status === 'resolved'
                    const isActive = idx === currentStageIdx && status !== 'resolved'

                    return (
                        <div key={stage.id} className="relative flex items-start gap-3.5 pl-2">
                            <div
                                className={`
                                    relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    transition-all duration-300
                                    ${isDone
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : isActive
                                        ? 'bg-white dark:bg-neutral-800 border-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40 text-blue-600'
                                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
                                    }
                                `}
                            >
                                {isDone && <Check size={10} className="stroke-[3]" />}
                                {isActive && <CircleDot size={10} className="animate-pulse text-blue-600" />}
                            </div>
                            <div className="pb-1 min-w-0">
                                <p
                                    className={`text-[12.5px] font-bold leading-tight ${
                                        isDone
                                            ? 'text-neutral-900 dark:text-white'
                                            : isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-neutral-400 dark:text-neutral-600'
                                    }`}
                                >
                                    {stage.label}
                                </p>
                                <p
                                    className={`text-[11px] mt-0.5 leading-relaxed ${
                                        isDone || isActive
                                            ? 'text-neutral-600 dark:text-neutral-400'
                                            : 'text-neutral-400 dark:text-neutral-600'
                                    }`}
                                >
                                    {stage.desc}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function Progress() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Role-specific progress router
    if (user?.role === 'Citizen') {
        return <CitizenProgress />
    }

    if (user?.role === 'Industry') {
        return <IndustryProgress />
    }

    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all', 'in_project', 'routed', 'resolved'
    const [now, setNow] = useState(() => Date.now())

    // Resolution Modal State
    const [resolvingChallenge, setResolvingChallenge] = useState(null)
    const [resolutionNote, setResolutionNote] = useState('')
    const [isSubmittingResolve, setIsSubmittingResolve] = useState(false)
    const [lightboxUrl, setLightboxUrl] = useState(null)

    const isGov = user?.role === 'Gov'
    const isUniv = user?.role === 'University'
    const isInd = user?.role === 'Industry'

    useEffect(() => {
        fetchProgressData()
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(timer)
    }, [])

    const fetchProgressData = async () => {
        setLoading(true)
        try {
            const res = await authFetch('/api/challenges/')
            if (res && res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Include challenges that are in the innovation pipeline
                    const tracking = data.filter(c => c && ['routed', 'in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(c.status))
                    setChallenges(tracking)
                } else {
                    setChallenges([])
                }
            }
        } catch (e) {
            console.error('Error fetching progress pipeline:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleResolveChallenge = async () => {
        if (!resolvingChallenge) return
        setIsSubmittingResolve(true)
        try {
            const res = await authFetch(`/api/challenges/${resolvingChallenge.id}/resolve`, {
                method: 'PATCH',
                body: JSON.stringify({
                    resolution_summary: resolutionNote || 'Solution field-tested and deployed successfully in community.',
                    impact_verified: true
                })
            })
            if (res && res.ok) {
                setResolvingChallenge(null)
                setResolutionNote('')
                await fetchProgressData()
            } else {
                alert('Failed to mark challenge resolved. Please try again.')
            }
        } catch (e) {
            console.error(e)
            alert('Error contacting server.')
        } finally {
            setIsSubmittingResolve(false)
        }
    }

    // Role-filtered and search-filtered challenges
    const filteredChallenges = useMemo(() => {
        let list = Array.isArray(challenges) ? [...challenges] : []

        // If university user, prioritize showing projects matching their institution
        if (isUniv && user?.org_id) {
            const myOrgProjects = list.filter(c => c.project?.org_id === user.org_id)
            if (myOrgProjects.length > 0) {
                list = myOrgProjects
            }
        }

        return list.filter((c) => {
            if (!c) return false
            const term = (search || '').toLowerCase()
            const title = String(c.title || '').toLowerCase()
            const loc = String(c.location || '').toLowerCase()
            const dept = String(c.department || c.domain || '').toLowerCase()
            const id = String(c.id || '').toLowerCase()
            const uniName = String(c.project?.organization?.name || '').toLowerCase()

            const matchSearch =
                !term ||
                title.includes(term) ||
                loc.includes(term) ||
                dept.includes(term) ||
                id.includes(term) ||
                uniName.includes(term)

            let matchStatus = true
            if (statusFilter === 'in_project') {
                matchStatus = ['in_project', 'proposal_submitted', 'partnered'].includes(c.status)
            } else if (statusFilter === 'routed') {
                matchStatus = c.status === 'routed'
            } else if (statusFilter === 'resolved') {
                matchStatus = c.status === 'resolved'
            }

            return matchSearch && matchStatus
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }, [challenges, search, statusFilter, isUniv, user?.org_id])

    const totalTracked = challenges.length
    const activeInRd = challenges.filter(c => ['in_project', 'proposal_submitted', 'partnered'].includes(c.status)).length
    const routedCount = challenges.filter(c => c.status === 'routed').length
    const resolvedCount = challenges.filter(c => c.status === 'resolved').length

    return (
        <div className="space-y-6 pb-12">
            {/* ── Page Header ───────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                            <Layers className="text-blue-600 dark:text-blue-400" />
                            {isUniv ? 'University Research Progress Hub' : isInd ? 'Industry CSR Pilot Tracker' : 'State Innovation Corridor Progress Hub'}
                        </h2>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {user?.role} View
                        </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {isUniv 
                            ? `Tracking academic R&D milestones and industry proposals for ${user?.organization?.name || 'your institution'}.`
                            : isInd
                            ? 'Monitor research deliverables, prototype trials, and community impact for funded solutions.'
                            : 'Statewide end-to-end monitoring: Ingestion, university R&D, CSR partnerships, and ground resolution.'}
                    </p>
                </div>

                <div className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold self-start sm:self-auto">
                    {filteredChallenges.length} Active Tracked {filteredChallenges.length === 1 ? 'Challenge' : 'Challenges'}
                </div>
            </div>

            {/* ── High-Level Pipeline KPI Cards ───────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                    { label: 'Total In Pipeline', value: totalTracked, color: 'text-neutral-900 dark:text-white', icon: <Layers size={18} className="text-neutral-600 dark:text-neutral-300" />, bg: 'bg-neutral-100 dark:bg-neutral-800' },
                    { label: 'Routed (Bidding)', value: routedCount, color: 'text-blue-600 dark:text-blue-400', icon: <Clock size={18} className="text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-50 dark:bg-blue-950/40' },
                    { label: 'Active in Univ R&D', value: activeInRd, color: 'text-purple-600 dark:text-purple-400', icon: <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />, bg: 'bg-purple-50 dark:bg-purple-950/40' },
                    { label: 'Deployed & Resolved', value: resolvedCount, color: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                ].map(({ label, value, color, icon, bg }) => (
                    <div key={label} className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
                        <div>
                            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{label}</p>
                            <p className={`text-2xl font-black ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search & Filter Bar ───────────────────────── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-3 rounded-xl flex flex-wrap gap-3 items-center shadow-2xs">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by challenge, university, domain, district, or ID..."
                        className="w-full h-9 pl-9 pr-3 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={13} className="text-neutral-400 flex-shrink-0" />
                    {[
                        { key: 'all', label: 'All Stages' },
                        { key: 'routed', label: 'Routed' },
                        { key: 'in_project', label: 'In R&D' },
                        { key: 'resolved', label: 'Resolved' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                                statusFilter === key
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Innovation Table ───────────────────────── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1fr_40px] gap-4 px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700 text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                    <span>Civic Challenge</span>
                    <span>Domain / Reports</span>
                    <span>Assigned University</span>
                    <span>Proposal / CSR State</span>
                    <span>Lifecycle State</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-neutral-500 font-semibold">Loading innovation pipeline data...</p>
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto opacity-60" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No challenges found matching your filters.</p>
                        <p className="text-xs text-neutral-400">Try adjusting your search query or stage filter.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {filteredChallenges.map((c) => {
                            const isExpanded = expandedId === c.id
                            const project = c.project
                            const proposal = project?.proposal
                            const hasProposal = Boolean(proposal && proposal.status === 'submitted')
                            const isPartnered = Boolean(proposal && (proposal.partners?.length > 0 || proposal.funds_committed > 0))
                            const universityName = project?.organization?.name || (c.status === 'routed' ? 'Awaiting Institution' : 'RIMS Ranchi')
                            const dueAt = c.active_deadline || null
                            const remainingMs = dueAt ? new Date(dueAt).getTime() - now : null
                            const isResolved = c.status === 'resolved' || project?.status === 'deployed'

                            // Calculate milestone completion
                            let milestones = []
                            try {
                                if (project?.milestones_json) {
                                    milestones = typeof project.milestones_json === 'string' ? JSON.parse(project.milestones_json) : project.milestones_json
                                }
                            } catch (e) {}
                            const totalMilestones = 4
                            const completedMilestones = Array.isArray(milestones) && milestones.length > 0
                                ? milestones.filter(m => m.status === 'completed').length
                                : (hasProposal ? 3 : isResolved ? 4 : 1)
                            const milestonePct = Math.round((completedMilestones / totalMilestones) * 100)

                            return (
                                <div key={c.id} className={`transition-colors ${isExpanded ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}`}>
                                    {/* Main Row */}
                                    <div
                                        className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1fr_40px] gap-4 px-5 py-4 items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                                        onClick={() => setExpandedId(prev => (prev === c.id ? null : c.id))}
                                    >
                                        {/* Challenge Title */}
                                        <div className="min-w-0 pr-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                                    {c.title}
                                                </h4>
                                                {c.priority_score >= 80 && (
                                                    <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                        P-{c.priority_score}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                                                <span className="font-mono">{c.id.split('-')[0]}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 truncate">
                                                    <MapPin size={10} />
                                                    {c.location.split(',')[0]}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Domain / Complaints */}
                                        <div className="text-xs">
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                {c.domain || 'Civic Infrastructure'}
                                            </span>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                                {c.complaint_count || 1} Citizen Reports
                                            </p>
                                        </div>

                                        {/* Assigned University */}
                                        <div className="text-xs">
                                            <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                                                <GraduationCap size={13} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                <span className="truncate">{universityName}</span>
                                            </div>
                                            {project && (
                                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                                    {completedMilestones}/{totalMilestones} Phases ({milestonePct}%)
                                                </p>
                                            )}
                                        </div>

                                        {/* Proposal / CSR State */}
                                        <div className="text-xs">
                                            {hasProposal ? (
                                                <div>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <Sparkles size={11} /> {proposal.trl || 'TRL-6 Ready'}
                                                    </span>
                                                    <p className="text-[10.5px] text-neutral-400 mt-0.5">
                                                        {proposal.funding_status || 'Open for Funding'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-neutral-400">
                                                    {c.status === 'routed' ? 'Bidding in progress' : 'Proposal in prep'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            <StatusBadge status={c.status} />
                                        </div>

                                        {/* Expand Toggle */}
                                        <button className="flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors cursor-pointer">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    {/* ── Expanded Detail Drawer ── */}
                                    {isExpanded && (
                                        <div className="mx-5 mb-5 mt-1 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40 p-5 space-y-6 animate-fade-in-up">
                                            
                                            {/* Top info bar */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded">
                                                        Challenge Details & Delivery
                                                    </span>
                                                    <span className="text-xs text-neutral-400">•</span>
                                                    <span className="text-xs text-neutral-500 font-semibold">{c.id}</span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {project && (
                                                        <Link
                                                            to={`/project/${project.id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                                                        >
                                                            <span>Open Project Workspace</span>
                                                            <ArrowRight size={13} />
                                                        </Link>
                                                    )}

                                                    {/* Gov Action: Mark Resolved */}
                                                    {isGov && !isResolved && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setResolvingChallenge(c)
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                        >
                                                            <CheckCircle2 size={13} />
                                                            <span>Mark Resolved & Closed</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2-Column Layout */}
                                            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                                                
                                                {/* Left Column: 8-Stage Lifecycle Stepper */}
                                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-2xs">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                            <Activity size={14} className="text-blue-600" />
                                                            End-to-End Innovation Pipeline
                                                        </h5>
                                                        <span className="text-[10px] font-bold text-neutral-400">8 Lifecycle Stages</span>
                                                    </div>
                                                    <InnovationLifecycleTracker
                                                        status={c.status}
                                                        hasProposal={hasProposal}
                                                        isPartnered={isPartnered}
                                                    />
                                                </div>

                                                {/* Right Column: Key Details & Accountability */}
                                                <div className="space-y-4">
                                                    
                                                    {/* Problem Description & Location */}
                                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-2 shadow-2xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Problem Statement</span>
                                                            <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                                                                <MapPin size={11} className="text-neutral-400" />
                                                                {c.location}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                            {c.description}
                                                        </p>
                                                    </div>

                                                    {/* Academic Deliverable & Milestones Card */}
                                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 shadow-2xs">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <GraduationCap size={15} className="text-purple-600 dark:text-purple-400" />
                                                                <h5 className="text-xs font-bold text-neutral-900 dark:text-white">
                                                                    {universityName}
                                                                </h5>
                                                            </div>
                                                            <span className="text-[10.5px] font-bold text-neutral-500">
                                                                {completedMilestones}/4 Deliverables Done
                                                            </span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${milestonePct}%` }}
                                                            />
                                                        </div>

                                                        {/* Proposal Details if present */}
                                                        {proposal && (
                                                            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs space-y-1.5">
                                                                <p className="font-bold text-purple-900 dark:text-purple-200">
                                                                    Solution: {proposal.title}
                                                                </p>
                                                                <div className="flex flex-wrap gap-2 text-[10.5px] text-purple-700 dark:text-purple-300">
                                                                    <span>Budget: <strong>{proposal.budget_required}</strong></span>
                                                                    <span>•</span>
                                                                    <span>TRL: <strong>{proposal.trl}</strong></span>
                                                                    <span>•</span>
                                                                    <span>Lead: <strong>{proposal.faculty_lead || 'Faculty PI'}</strong></span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* SLA Window Countdown */}
                                                        <div className="pt-1 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800">
                                                            <span className="text-neutral-400">Response & Delivery SLA:</span>
                                                            <span className={`font-bold ${remainingMs != null && remainingMs <= 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                {isResolved ? 'Impact Verified & Closed' : formatDuration(remainingMs)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Evidence Photos Gallery */}
                                                    {c.media_urls && c.media_urls.length > 0 && (
                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-2.5 shadow-2xs">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                                                <ImageIcon size={13} className="text-blue-600" />
                                                                <span>Citizen Verification Evidence</span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {c.media_urls.map((url, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => setLightboxUrl(getMediaUrl(url))}
                                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                                                                    >
                                                                        <img
                                                                            src={getMediaUrl(url)}
                                                                            alt={`Evidence ${idx + 1}`}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                            onError={(e) => {
                                                                                const fallback = getMediaUrl(url)
                                                                                if (e.currentTarget.src !== fallback) {
                                                                                    e.currentTarget.src = fallback
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal: Formally Mark Resolved & Closed (Gov Only) ── */}
            {resolvingChallenge && (
                <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                        Mark Challenge Resolved & Closed
                                    </h3>
                                    <p className="text-xs text-neutral-500">
                                        Official State Innovation Corridor closure certification.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setResolvingChallenge(null)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Challenge Summary Box */}
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1.5">
                            <p className="font-bold text-neutral-900 dark:text-white truncate">
                                {resolvingChallenge.title}
                            </p>
                            <p className="text-neutral-500">
                                ID: <span className="font-mono">{resolvingChallenge.id}</span> • Location: {resolvingChallenge.location}
                            </p>
                        </div>

                        {/* Closure Notes */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                Resolution & Field Verification Notes
                            </label>
                            <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                rows={3}
                                placeholder="Enter details of the field pilot completion, community verification inspection, and impact achieved..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                            <span>This action completes all deliverables, advances project status to <strong>Deployed</strong>, and notifies the submitting citizen.</span>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setResolvingChallenge(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleResolveChallenge}
                                disabled={isSubmittingResolve}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Check size={14} />
                                {isSubmittingResolve ? 'Confirming...' : 'Confirm Resolution'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox for Evidence Photo */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setLightboxUrl(null)}
                >
                    <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-neutral-900">
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <img src={lightboxUrl} alt="Evidence full" className="max-h-[80vh] w-auto object-contain" />
                    </div>
                </div>
            )}
        </div>
    )
}
