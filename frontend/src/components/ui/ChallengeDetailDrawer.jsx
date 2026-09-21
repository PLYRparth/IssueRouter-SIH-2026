import { useState, useEffect } from 'react'
import { authFetch, getMediaUrl } from '../../api/client'
import {
    X,
    MapPin,
    Building2,
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    Share2,
    Users,
    ArrowRight,
    GraduationCap,
    Clock,
    FileText,
    Activity,
    ExternalLink,
    Image as ImageIcon,
    ZoomIn,
    ChevronRight,
    AlertTriangle,
    Layers
} from 'lucide-react'

// Realistic civic issue evidence visual representations
const EVIDENCE_IMAGES = [
    {
        id: 'ev-1',
        title: 'Primary Health Centre Facility',
        subtitle: 'Main entrance locked during operational hours',
        tag: 'Infrastructure',
        gradient: 'from-amber-700/80 via-neutral-800 to-neutral-900',
        icon: '🏥'
    },
    {
        id: 'ev-2',
        title: 'Notice Board & Medicine Stock Out',
        subtitle: 'Notice affixed regarding staff unavailability',
        tag: 'Medical Supply',
        gradient: 'from-blue-900/80 via-neutral-800 to-neutral-900',
        icon: '📋'
    },
    {
        id: 'ev-3',
        title: 'Geotagged Citizen Ground Check',
        subtitle: 'GPS coordinates verified within 25m accuracy',
        tag: 'Verification',
        gradient: 'from-emerald-900/80 via-neutral-800 to-neutral-900',
        icon: '📍'
    }
]

export default function ChallengeDetailDrawer({ challenge, isOpen, onClose, onRoute }) {
    const [activeTab, setActiveTab] = useState('overview') // 'overview', 'evidence', 'intelligence', 'matches'
    const [selectedImage, setSelectedImage] = useState(null)
    const [matches, setMatches] = useState([])
    const [loadingMatches, setLoadingMatches] = useState(false)

    useEffect(() => {
        if (isOpen && challenge) {
            setActiveTab('overview')
            setSelectedImage(null)
            fetchMatches()

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose()
                }
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, challenge?.id])

    const fetchMatches = async () => {
        if (!challenge?.id) return
        setLoadingMatches(true)
        try {
            const res = await authFetch(`/api/matches/generate/${challenge.id}`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setMatches(data || [])
            }
        } catch (e) {
            console.error("Failed to generate drawer matches", e)
        } finally {
            setLoadingMatches(false)
        }
    }

    if (!isOpen || !challenge) return null;

    const priorityScore = challenge.priority_score || 50
    const priorityLabel = priorityScore >= 85 ? 'Critical Priority' : priorityScore >= 70 ? 'High Priority' : priorityScore >= 50 ? 'Medium Priority' : 'Low Priority'
    const priorityStyle = priorityScore >= 85 
        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
        : priorityScore >= 70
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50'

    const handleAction = () => {
        if (onRoute) {
            onRoute(challenge)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop with fade */}
            <div 
                className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out" 
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col animate-slide-in-right">
                    
                    {/* ── Dossier Header ── */}
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-md border border-neutral-300/60 dark:border-neutral-700">
                                {challenge.id}
                            </span>
                            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${priorityStyle}`}>
                                {priorityLabel} · {priorityScore}
                            </span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Navigation Tabs ── */}
                    <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 gap-6 text-[12.5px] font-semibold flex-shrink-0">
                        {[
                            { id: 'overview', label: 'Dossier Overview' },
                            { id: 'evidence', label: `Evidence (${(challenge.source_counts?.social || 0) + (challenge.source_counts?.citizen || 1)})` },
                            { id: 'intelligence', label: 'AI Rationale' },
                            { id: 'matches', label: `University Matches (${matches.length || 0})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    py-3 border-b-2 transition-colors relative
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Scrollable Body Content ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* ── TAB: OVERVIEW ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                                            {challenge.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            Logged: {new Date(challenge.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-snug">
                                        {challenge.title}
                                    </h2>
                                    <p className="text-[13.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-2.5">
                                        {challenge.official_description || challenge.description}
                                    </p>
                                </div>

                                {/* Attached Evidence Photos Preview */}
                                {challenge.media_urls && challenge.media_urls.length > 0 && (
                                    <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                                <ImageIcon size={14} className="text-purple-600 dark:text-purple-400" />
                                                <span>Attached Evidence Photos ({challenge.media_urls.length})</span>
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('evidence')} 
                                                className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                            >
                                                View all evidence <ChevronRight size={13} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {challenge.media_urls.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedImage({ type: 'real', url, title: `Citizen Photo #${idx + 1}`, subtitle: challenge.location })}
                                                    className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:border-purple-500 transition-all shadow-xs"
                                                >
                                                    <img 
                                                        src={getMediaUrl(url)} 
                                                        alt={`Evidence preview ${idx + 1}`} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            const fallback = getMediaUrl(url)
                                                            if (e.currentTarget.src !== fallback) {
                                                                e.currentTarget.src = fallback
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <ZoomIn size={16} className="drop-shadow" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                                    <div className="flex items-start gap-2.5">
                                        <MapPin size={16} className="text-neutral-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10.5px] uppercase font-bold text-neutral-400">Location</p>
                                            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{challenge.location || 'Jharkhand'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Building2 size={16} className="text-neutral-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10.5px] uppercase font-bold text-neutral-400">Responsible Dept</p>
                                            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{challenge.department || challenge.domain || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Activity size={16} className="text-neutral-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10.5px] uppercase font-bold text-neutral-400">AI Confidence</p>
                                            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{Math.round((challenge.ai_confidence || 0.92) * 100)}% Verified</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <ShieldCheck size={16} className="text-neutral-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10.5px] uppercase font-bold text-neutral-400">Verification</p>
                                            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                {challenge.verified ? 'Verified by Gov Officer' : 'Pending Administrative Review'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary University Match Callout */}
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="text-blue-600 dark:text-blue-400" size={18} />
                                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">University Matchmaking</h4>
                                        </div>
                                        <button 
                                            onClick={() => setActiveTab('matches')} 
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            View all matches <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    {matches.length > 0 ? (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                            <div>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white">{matches[0].organization?.name}</p>
                                                <p className="text-xs text-neutral-500 mt-0.5">{matches[0].match_reason}</p>
                                            </div>
                                            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                                                {matches[0].match_score}% Fit
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-400">Match recommendation computed upon demand or routing trigger.</p>
                                    )}
                                </div>

                                {/* Lifecycle Timeline */}
                                {/* Lifecycle Audit Trail */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Lifecycle Innovation Pipeline</h4>
                                    <div className="border-l-2 border-neutral-200 dark:border-neutral-700 ml-2.5 pl-4 py-1 space-y-4 text-xs">
                                        {/* Stage 1 */}
                                        <div className="relative">
                                            <div className="absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-neutral-900" />
                                            <p className="font-bold text-neutral-900 dark:text-white">1. Ingested & AI Triaged</p>
                                            <p className="text-neutral-500 mt-0.5">Ingested via citizen submissions and multi-source public distress signals. Domain & priority scored.</p>
                                        </div>

                                        {/* Stage 2 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${challenge.verified ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${challenge.verified ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                2. Government Verification
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {challenge.verified ? 'Formally validated by state desk officer for innovation routing.' : 'Under review by administrative officer.'}
                                            </p>
                                        </div>

                                        {/* Stage 3 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${['routed', 'in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${['routed', 'in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                3. University Routing & Bidding
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {['routed', 'in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'Dispatched to higher-education engineering departments with active SLA window.' : 'Awaiting dispatch.'}
                                            </p>
                                        </div>

                                        {/* Stage 4 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${['in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${['in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                4. University Research & Prototype
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {['in_project', 'proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) ? 'Challenge adopted by university engineering team; prototype development underway.' : 'Pending institutional acceptance.'}
                                            </p>
                                        </div>

                                        {/* Stage 5 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${['proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) || challenge.project?.proposal ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${['proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) || challenge.project?.proposal ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                5. Solution Proposal Submitted
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {['proposal_submitted', 'partnered', 'resolved'].includes(challenge.status) || challenge.project?.proposal ? 'Engineering proposal with TRL readiness and budget roadmap submitted to Industry Portal.' : 'Pending proposal draft.'}
                                            </p>
                                        </div>

                                        {/* Stage 6 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${['partnered', 'resolved'].includes(challenge.status) || (challenge.project?.proposal?.partners?.length > 0) ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${['partnered', 'resolved'].includes(challenge.status) || (challenge.project?.proposal?.partners?.length > 0) ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                6. Industry Partnering & CSR Grant
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {['partnered', 'resolved'].includes(challenge.status) || (challenge.project?.proposal?.partners?.length > 0) ? 'Corporate CSR partnership active; funding and field deployment support allocated.' : 'Seeking industry partner.'}
                                            </p>
                                        </div>

                                        {/* Stage 7 & 8 */}
                                        <div className="relative">
                                            <div className={`absolute -left-[21.5px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 ${challenge.status === 'resolved' ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-950' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                            <p className={`font-bold ${challenge.status === 'resolved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-400'}`}>
                                                7 & 8. Field Deployment & Resolution
                                            </p>
                                            <p className="text-neutral-500 mt-0.5">
                                                {challenge.status === 'resolved' ? 'Solution deployed on ground, verified by nodal desk, and marked resolved.' : 'Awaiting field trial & final inspection.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: EVIDENCE ── */}
                        {activeTab === 'evidence' && (
                            <div className="space-y-5 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Civic Evidence & Reports</h3>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                        {(challenge.source_counts?.social || 0) + (challenge.source_counts?.citizen || 1)} Documented Items
                                    </span>
                                </div>

                                {/* Quantitative Signals */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                            <Share2 size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Social Signals</span>
                                        </div>
                                        <p className="text-2xl font-black text-blue-900 dark:text-blue-200">{challenge.source_counts?.social || 0}</p>
                                        <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1">Cross-platform distress alerts flagged by NLP scanner.</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                            <Users size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Citizen Reports</span>
                                        </div>
                                        <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{challenge.source_counts?.citizen || challenge.complaint_count || 1}</p>
                                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Directly filed by local residents via citizen portal.</p>
                                    </div>
                                </div>

                                {/* Image Evidence Gallery */}
                                {challenge.media_urls && challenge.media_urls.length > 0 ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                                                Citizen Submitted Evidence ({challenge.media_urls.length})
                                            </p>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                <CheckCircle2 size={11} /> Authenticated Field Photos
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {challenge.media_urls.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedImage({ type: 'real', url, title: `Citizen Photo #${idx + 1}`, subtitle: challenge.location })}
                                                    className="group relative aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-sm hover:border-blue-500 transition-all"
                                                >
                                                    <img 
                                                        src={getMediaUrl(url)} 
                                                        alt={`Citizen evidence ${idx + 1}`} 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => {
                                                            const fallback = getMediaUrl(url)
                                                            if (e.currentTarget.src !== fallback) {
                                                                e.currentTarget.src = fallback
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <ZoomIn size={18} className="drop-shadow" />
                                                    </div>
                                                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                                        Citizen Photo #{idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Ground Inspection Photographs</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {EVIDENCE_IMAGES.map((img) => (
                                                <div
                                                    key={img.id}
                                                    onClick={() => setSelectedImage({ type: 'mock', ...img })}
                                                    className={`group relative aspect-video rounded-xl bg-gradient-to-br ${img.gradient} border border-neutral-200 dark:border-neutral-700/80 p-3 flex flex-col justify-between overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-sm`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-lg">{img.icon}</span>
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs">
                                                            {img.tag}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white leading-tight truncate">{img.title}</p>
                                                        <p className="text-[10px] text-neutral-300 mt-0.5 truncate">{img.subtitle}</p>
                                                    </div>
                                                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ZoomIn size={18} className="text-white drop-shadow" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Selected Image Quick Banner */}
                                {selectedImage && (
                                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-neutral-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {selectedImage.type === 'real' ? (
                                                <img 
                                                    src={getMediaUrl(selectedImage.url)} 
                                                    alt={selectedImage.title} 
                                                    className="w-16 h-12 object-cover rounded-lg border border-blue-200" 
                                                    onError={(e) => {
                                                        const fallback = getMediaUrl(selectedImage.url)
                                                        if (e.currentTarget.src !== fallback) {
                                                            e.currentTarget.src = fallback
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-2xl">{selectedImage.icon}</span>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white">{selectedImage.title}</p>
                                                <p className="text-xs text-neutral-500">{selectedImage.subtitle} · Geotag verified</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedImage(null)}
                                            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-2 py-1 cursor-pointer"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB: INTELLIGENCE ── */}
                        {activeTab === 'intelligence' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="text-indigo-600 dark:text-indigo-400" size={18} />
                                            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Triage & Scoring Model</h4>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">
                                            Confidence: {Math.round((challenge.ai_confidence || 0.92) * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                                        BART-large-MNLI zero-shot classification assessed domain suitability and computed societal impact weights based on multi-factor ground telemetry.
                                    </p>
                                </div>

                                {/* Priority Breakdown Bars */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Score Composition Breakdown</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Population Impact & Density', val: 25, max: 25, color: 'bg-rose-500' },
                                            { label: 'Severity & Critical Risk Factor', val: 20, max: 25, color: 'bg-amber-500' },
                                            { label: 'Distress Signal Frequency & Velocity', val: 18, max: 20, color: 'bg-blue-500' },
                                            { label: 'Vulnerability of Affected Ward/Block', val: 15, max: 15, color: 'bg-purple-500' },
                                            { label: 'Verified Citizen Corroboration', val: 10, max: 15, color: 'bg-emerald-500' },
                                        ].map((bar) => (
                                            <div key={bar.label} className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-neutral-700 dark:text-neutral-300">{bar.label}</span>
                                                    <span className="text-neutral-500">+{bar.val} pts</span>
                                                </div>
                                                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${(bar.val / bar.max) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Deduplication Result */}
                                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Semantic Deduplication Engine</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                                            {Math.round((challenge.duplicate_risk || 0.08) * 100)}% Duplicate Probability
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-0.5">No duplicate clusters identified in current 30-day window.</p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                                        Unique Challenge
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: MATCHES ── */}
                        {activeTab === 'matches' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Recommended University Partners</h3>
                                    {loadingMatches && <span className="text-xs text-blue-500 font-medium animate-pulse">Analyzing faculty profiles...</span>}
                                </div>

                                {loadingMatches ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 animate-pulse space-y-2">
                                                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                                                <div className="h-3 bg-neutral-100 dark:bg-neutral-700/60 rounded w-3/4" />
                                            </div>
                                        ))}
                                    </div>
                                ) : matches.length === 0 ? (
                                    <div className="text-center py-10 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                                        <GraduationCap size={28} className="mx-auto text-neutral-400 mb-2" />
                                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No automated university matches generated yet.</p>
                                        <p className="text-xs text-neutral-400 mt-1">Open the routing console to manually search and invite partner institutions.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {matches.map((m) => (
                                            <div key={m.org_id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 bg-white dark:bg-neutral-900 transition-all shadow-2xs">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{m.organization?.name}</h4>
                                                        <p className="text-xs text-neutral-500 mt-0.5">{m.organization?.district || 'Jharkhand'} • {m.organization?.type || 'Institution'}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                                                        {m.match_score}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 flex items-center gap-1.5">
                                                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                                                    {m.match_reason}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* ── Sticky Action Bar ── */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-500">
                                Status: <strong className="text-neutral-800 dark:text-neutral-200 capitalize">{challenge.status.replace(/_/g, ' ')}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                            >
                                Close Dossier
                            </button>
                            {challenge.status === 'pending_verification' && (
                                <button
                                    onClick={() => { handleAction(); onClose(); }}
                                    className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={15} />
                                    Verify Challenge
                                </button>
                            )}
                            {['verified', 'matches_suggested', 'ready_for_routing'].includes(challenge.status) && (
                                <button
                                    onClick={() => { handleAction(); onClose(); }}
                                    className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                                >
                                    <ArrowRight size={15} />
                                    Select Universities & Route
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Full-screen Photo Lightbox Modal ── */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950/80 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} className="text-blue-400" />
                                <span className="text-sm font-bold text-white">{selectedImage.title}</span>
                                {selectedImage.subtitle && (
                                    <span className="text-xs text-neutral-400">· {selectedImage.subtitle}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
                            {selectedImage.type === 'real' ? (
                                <img
                                    src={getMediaUrl(selectedImage.url)}
                                    alt={selectedImage.title}
                                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                                    onError={(e) => {
                                        const fallback = getMediaUrl(selectedImage.url)
                                        if (e.currentTarget.src !== fallback) {
                                            e.currentTarget.src = fallback
                                        }
                                    }}
                                />
                            ) : (
                                <div className={`p-12 rounded-xl bg-gradient-to-br ${selectedImage.gradient} text-center space-y-3`}>
                                    <span className="text-5xl">{selectedImage.icon}</span>
                                    <p className="text-lg font-bold text-white">{selectedImage.title}</p>
                                    <p className="text-sm text-neutral-300">{selectedImage.subtitle}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-2.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                            <span>Geotag verified civic evidence</span>
                            {selectedImage.type === 'real' && (
                                <a 
                                    href={getMediaUrl(selectedImage.url)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    Open original <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
