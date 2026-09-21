import { useEffect, useRef, useState, useMemo } from 'react'
import { MapPin, Layers, List, TrendingUp, Building2, AlertCircle, AlertTriangle } from 'lucide-react'
import { authFetch } from '../api/client'

const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#6366f1', 4: '#9ca3af' }

const STATUS_STYLES = {
  pending_verification: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  verified:             'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  matches_suggested:    'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  ready_for_routing:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  routed:               'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  in_project:           'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  resolved:             'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  pending:              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  inprogress:           'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
}

const STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  verified:             'Verified',
  matches_suggested:    'Matches Suggested',
  ready_for_routing:    'Ready for Routing',
  routed:               'Routed',
  in_project:           'In Project',
  resolved:             'Resolved',
  pending:              'Pending',
  inprogress:           'In progress',
}

function makeIcon(L, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

function transformChallenge(c) {
  const priorityNum =
    (c.priority_score ?? 50) >= 85 ? 1 :
    (c.priority_score ?? 50) >= 70 ? 2 :
    (c.priority_score ?? 50) >= 50 ? 3 : 4

  return {
    ...c,
    cluster_id: c.id,
    problem: c.title || 'Untitled Civic Challenge',
    summary:
      c.description ||
      c.official_description ||
      c.ai_generated_summary ||
      'Civic challenge under government review.',
    recommended_action:
      c.domain
        ? `${c.domain} Intervention & Departmental Routing`
        : 'Field inspection and partner routing recommended.',
    priority: priorityNum,
    priority_score: c.priority_score || 50,
    complaint_count: c.complaint_count || 1,
    rt_reach: c.rt_reach || 0,
    department: c.department || c.domain || 'Public Administration',
    location: c.location || 'Jharkhand',
    status: c.status || 'pending_verification',
    lat: Number(c.lat),
    lng: Number(c.lng),
  }
}

function popupHTML(c) {
  const color = PRIORITY_COLORS[c.priority] ?? '#9ca3af'
  return `
    <div style="font-family:system-ui,sans-serif;min-width:220px;max-width:260px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <span style="font-size:12px;font-weight:600;color:#1f2937;line-height:1.3;">${c.problem}</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:10px;line-height:1.5;">${(c.summary ?? '').slice(0, 90)}…</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Complaints</div>
          <div style="font-size:15px;font-weight:600;color:#1f2937;">${c.complaint_count}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">RT reach</div>
          <div style="font-size:15px;font-weight:600;color:#1f2937;">${c.rt_reach?.toLocaleString?.() ?? c.rt_reach}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Department</div>
          <div style="font-size:13px;font-weight:500;color:#1f2937;">${c.department}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Priority</div>
          <div style="font-size:13px;font-weight:500;color:${color};">P${c.priority} (${c.priority_score})</div>
        </div>
      </div>
      <div style="font-size:11px;color:#374151;background:#fef9ec;border:1px solid #fde68a;border-radius:6px;padding:6px 8px;line-height:1.5;">
        <span style="font-weight:600;">Action:</span> ${(c.recommended_action ?? '').slice(0, 80)}…
      </div>
    </div>`
}

// ── Leaflet Map component ─────────────────────────────────────
function LeafletMap({ challenges = [], mode = 'both', selectedChallenge = null }) {
  const mapRef        = useRef(null)
  const instanceRef   = useRef(null)
  const heatRef       = useRef(null)
  const markersRef    = useRef([])
  const markersMapRef = useRef(new Map())

  useEffect(() => {
    if (!window.L || instanceRef.current) return
    const L   = window.L
    const map = L.map(mapRef.current, {
      center: [23.6102, 85.2799],
      zoom: 7,
    })
    instanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, [])

  // Re-draw markers + heatmap + auto-fit whenever challenges data changes
  useEffect(() => {
    const map = instanceRef.current
    if (!map || !window.L) return
    const L = window.L

    // Clear old markers & heat layer
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    markersMapRef.current.clear()
    if (heatRef.current) {
      map.removeLayer(heatRef.current)
      heatRef.current = null
    }

    const validChallenges = challenges.filter((c) => isValidCoord(c.lat, c.lng))

    // Markers
    const newMarkers = validChallenges.map((c) => {
      const marker = L.marker([c.lat, c.lng], {
        icon: makeIcon(L, PRIORITY_COLORS[c.priority] ?? '#9ca3af'),
      }).bindPopup(popupHTML(c), { maxWidth: 280 })
      markersMapRef.current.set(c.cluster_id, marker)
      return marker
    })
    markersRef.current = newMarkers

    // Heatmap
    if (window.L.heatLayer && validChallenges.length > 0) {
      const heatData = validChallenges.map((c) => [
        c.lat,
        c.lng,
        Math.min(Math.max((c.complaint_count || 50) / 250, 0.4), 1.0),
      ])
      heatRef.current = window.L.heatLayer(heatData, {
        radius: 45,
        blur: 30,
        maxZoom: 13,
        max: 1.0,
        gradient: { 0.3: '#6366f1', 0.6: '#f97316', 0.85: '#ef4444', 1.0: '#be123c' },
      })
    }

    // Dynamic map centering & bounds fitting
    if (validChallenges.length === 1) {
      map.setView([validChallenges[0].lat, validChallenges[0].lng], 13)
    } else if (validChallenges.length > 1) {
      const bounds = L.latLngBounds(validChallenges.map((c) => [c.lat, c.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    } else {
      map.setView([23.6102, 85.2799], 7)
    }

    map.invalidateSize()

    // Apply mode
    applyMode(map, mode)
  }, [challenges]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyMode(map, mode) {
    if (!map) return
    if (mode === 'heatmap') {
      markersRef.current.forEach((m) => map.removeLayer(m))
      if (heatRef.current) heatRef.current.addTo(map)
    } else if (mode === 'pins') {
      if (heatRef.current) map.removeLayer(heatRef.current)
      markersRef.current.forEach((m) => m.addTo(map))
    } else {
      markersRef.current.forEach((m) => m.addTo(map))
      if (heatRef.current) heatRef.current.addTo(map)
    }
  }

  // Mode toggle without re-building markers
  useEffect(() => {
    applyMode(instanceRef.current, mode)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pan to selected challenge if selected in right sidebar
  useEffect(() => {
    const map = instanceRef.current
    if (!map || !selectedChallenge) return
    if (isValidCoord(selectedChallenge.lat, selectedChallenge.lng)) {
      map.setView([selectedChallenge.lat, selectedChallenge.lng], 13, { animate: true })
      const marker = markersMapRef.current.get(selectedChallenge.cluster_id)
      if (marker && mode !== 'heatmap') {
        marker.openPopup()
      }
    }
  }, [selectedChallenge, mode])

  const validCount = challenges.filter((c) => isValidCoord(c.lat, c.lng)).length

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {validCount === 0 && (
        <div className="absolute inset-0 z-[1000] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="text-center space-y-1.5 p-4 rounded-xl glass-panel shadow-sm">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
              No challenge locations available.
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Challenges currently in the database lack geographical coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Maps() {
  const [mode, setMode]           = useState('both')
  const [scriptsReady, setReady]  = useState(false)
  const [selectedId, setSelected] = useState(null)

  const [challenges, setChallenges] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  // Load Leaflet + leaflet.heat from CDN
  useEffect(() => {
    if (window.L?.heatLayer) { setReady(true); return }
    const leafletCSS = document.createElement('link')
    leafletCSS.rel  = 'stylesheet'
    leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(leafletCSS)
    const loadScript = (src) => new Promise((res) => {
      const s = document.createElement('script')
      s.src = src; s.async = false; s.onload = res
      document.head.appendChild(s)
    })
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js')
      .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js'))
      .then(() => setReady(true))
  }, [])

  // Fetch government challenges directly using GovDashboard resilient pattern
  useEffect(() => {
    let isMounted = true
    const fetchChallenges = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch('/api/challenges/')
        if (res && res.ok) {
          const data = await res.json()
          if (isMounted) {
            const list = Array.isArray(data) ? data : []
            setChallenges(list.map(transformChallenge))
          }
        } else {
          if (isMounted) setError('Failed to load challenge locations.')
        }
      } catch (err) {
        console.error('Error fetching challenges for map:', err)
        if (isMounted) setError('Failed to load challenge locations.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchChallenges()
    return () => {
      isMounted = false
    }
  }, [])

  const sorted = useMemo(() => {
    return [...challenges].sort(
      (a, b) => (b.priority_score || 0) - (a.priority_score || 0) || b.complaint_count - a.complaint_count
    )
  }, [challenges])

  const selectedChallenge = useMemo(() => {
    return challenges.find((c) => c.cluster_id === selectedId) || null
  }, [challenges, selectedId])

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Complaint Hotspot &amp; Density Map
          </h2>
          <p className="text-[13.5px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Interactive heatmap of {loading ? '…' : challenges.length} civic challenges across the region.{' '}
            <strong className="text-indigo-500 dark:text-indigo-400 font-semibold">Red areas</strong> indicate highest complaint density.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 glass-panel rounded-lg p-1 self-start flex-shrink-0">
          {[
            { key: 'pins',    label: 'Pins',    icon: MapPin },
            { key: 'heatmap', label: 'Heatmap', icon: Layers },
            { key: 'both',    label: 'Both',    icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer
                ${mode === key
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Map */}
        <div className="flex-1 min-h-[320px] h-[45vw] lg:h-[520px] glass-panel rounded-xl overflow-hidden shadow-2xl relative z-0">
          {error ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400">{error}</p>
              <p className="text-xs text-gray-400">Please check backend connectivity and reload.</p>
            </div>
          ) : scriptsReady && !loading ? (
            <LeafletMap challenges={challenges} mode={mode} selectedChallenge={selectedChallenge} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-[13px] text-gray-400 animate-pulse">
                {loading ? 'Loading challenge locations…' : 'Loading map…'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar list */}
        <div className="w-full lg:w-72 flex flex-col gap-3 glass-panel p-3 animate-fade-in-up">
          <div className="flex items-center gap-2 px-1 border-b border-gray-200/50 dark:border-gray-700/50 pb-2 mb-1">
            <List size={15} className="text-indigo-500" />
            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">
              Area-wise Critical Clusters
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] lg:max-h-[488px] pr-0.5">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
                </div>
              ))
            ) : sorted.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400 font-medium">No challenges found.</p>
              </div>
            ) : (
              sorted.map((c, i) => {
                const color      = PRIORITY_COLORS[c.priority] ?? '#9ca3af'
                const isSelected = selectedId === c.cluster_id
                return (
                  <button
                    key={c.cluster_id}
                    onClick={() => setSelected(isSelected ? null : c.cluster_id)}
                    className={`w-full text-left rounded-xl p-3 transition-all cursor-pointer
                      ${isSelected
                        ? 'border border-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40 shadow-md'
                        : 'border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: color + '20', color }}>
                        {i + 1}
                      </span>
                      <p className="text-[12px] font-medium text-gray-800 dark:text-gray-100 leading-snug flex-1">
                        {c.problem}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pl-7">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400"><MapPin size={10} />{c.location.split(',')[0]}</span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400"><Building2 size={10} />{c.department}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pl-7">
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
                        <AlertCircle size={10} />{c.complaint_count} complaints
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[c.status] ?? ''}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800 pl-7 space-y-1.5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{c.summary}</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                          <span className="font-medium">Action: </span>{c.recommended_action}
                        </p>
                        <div className="flex gap-3 pt-1">
                          <span className="text-[11px] text-gray-400">
                            RT reach: <span className="font-medium text-gray-700 dark:text-gray-200">{c.rt_reach?.toLocaleString()}</span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Trend: <span className={`font-medium ${c.trend === 'up' ? 'text-red-500' : c.trend === 'down' ? 'text-green-600' : 'text-gray-500'}`}>
                              {c.trend === 'up' ? '↑ Rising' : c.trend === 'down' ? '↓ Falling' : '→ Stable'}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
