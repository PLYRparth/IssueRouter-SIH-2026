import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../api/client'
import {
  MapPin,
  Send,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Image as ImageIcon,
  ZoomIn,
  ArrowRight,
  Building,
  HelpCircle,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react'

// All 24 districts of Jharkhand
const JHARKHAND_DISTRICTS = [
  'Ranchi',
  'Dhanbad',
  'East Singhbhum (Jamshedpur)',
  'Bokaro',
  'Hazaribagh',
  'Deoghar',
  'Dumka',
  'Giridih',
  'Ramgarh',
  'Palamu',
  'West Singhbhum',
  'Saraikela Kharsawan',
  'Chatra',
  'Garhwa',
  'Godda',
  'Gumla',
  'Jamtara',
  'Khunti',
  'Koderma',
  'Latehar',
  'Lohardaga',
  'Pakur',
  'Sahebganj',
  'Simdega',
]

export default function CitizenDashboard() {
  const { user, getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [district, setDistrict] = useState('Ranchi')
  const [block, setBlock] = useState('')
  const [location, setLocation] = useState('')
  const [lat, setLat] = useState(23.3441)
  const [lng, setLng] = useState(85.3096)
  const [locating, setLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  // Evidence photos state
  const [photos, setPhotos] = useState([]) // Array of { file, previewUrl, name, size }
  const [previewLightbox, setPreviewLightbox] = useState(null)

  // Validation & submission states
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successChallenge, setSuccessChallenge] = useState(null)

  // Community feed & My Submissions
  const [recentChallenges, setRecentChallenges] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [myChallenges, setMyChallenges] = useState([])
  const [loadingMy, setLoadingMy] = useState(true)

  useEffect(() => {
    fetchCommunityChallenges()
    fetchMyChallenges()
  }, [])

  const fetchMyChallenges = async () => {
    setLoadingMy(true)
    try {
      const res = await authFetch('/api/challenges/my')
      if (res && res.ok) {
        const data = await res.json()
        setMyChallenges(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to load user challenges', e)
    } finally {
      setLoadingMy(false)
    }
  }

  const fetchCommunityChallenges = async () => {
    setLoadingRecent(true)
    try {
      const res = await authFetch('/api/challenges/?priority=high')
      if (res && res.ok) {
        const data = await res.json()
        setRecentChallenges(Array.isArray(data) ? data.slice(0, 6) : [])
      }
    } catch (e) {
      console.error('Failed to load recent challenges', e)
    } finally {
      setLoadingRecent(false)
    }
  }

  // GPS Geolocation Handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your device.')
      return
    }
    setLocating(true)
    setLocationStatus('Detecting GPS coordinates...')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6))
        const detectedLng = Number(pos.coords.longitude.toFixed(6))
        setLat(detectedLat)
        setLng(detectedLng)
        setLocationStatus(`Coordinates detected (${detectedLat}, ${detectedLng})`)
        if (!location) {
          setLocation(`Near detected coordinates in ${district}`)
        }
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        setLocationStatus('Location access was denied or unavailable. You can type your location manually below.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Photo Selection & Validation
  const handlePhotoSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    const maxBytes = 5 * 1024 * 1024 // 5MB
    const newErrors = { ...errors }
    delete newErrors.photos

    if (photos.length + selectedFiles.length > 3) {
      setErrors({ ...errors, photos: 'You can upload a maximum of 3 evidence photos.' })
      return
    }

    const validNewPhotos = []

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, photos: `File "${file.name}" is not a supported format. Please upload JPG, PNG, or WebP.` })
        return
      }
      if (file.size > maxBytes) {
        setErrors({ ...errors, photos: `File "${file.name}" exceeds the 5MB size limit.` })
        return
      }
      const previewUrl = URL.createObjectURL(file)
      validNewPhotos.push({
        file,
        previewUrl,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2)
      })
    }

    setPhotos((prev) => [...prev, ...validNewPhotos])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      const target = prev[index]
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // Validate form client-side
  const validateForm = () => {
    const errs = {}
    if (!title.trim()) {
      errs.title = 'Please enter a title for the challenge.'
    } else if (title.trim().length < 5) {
      errs.title = 'Title should be at least 5 characters long.'
    }

    if (!description.trim()) {
      errs.description = 'Please describe the problem you observed.'
    } else if (description.trim().length < 15) {
      errs.description = 'Please provide more details (at least 15 characters) so our AI can accurately categorize it.'
    }

    if (!location.trim()) {
      errs.location = 'Please specify the street, landmark, or village.'
    }

    if (!district) {
      errs.district = 'Please select a district.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)

    try {
      let uploadedUrls = []

      // 1. Upload photos first if attached
      if (photos.length > 0) {
        const formData = new FormData()
        photos.forEach((p) => {
          formData.append('files', p.file)
        })

        const uploadRes = await authFetch('/api/challenges/upload-photos', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}))
          throw new Error(errData.detail || 'Photo upload failed. Please verify file types and sizes.')
        }

        uploadedUrls = await uploadRes.json()
      }

      // 2. Submit canonical challenge
      const fullLocation = `${location.trim()}, ${block ? block.trim() + ', ' : ''}${district}, Jharkhand`
      const challengePayload = {
        title: title.trim(),
        description: description.trim(),
        location: fullLocation,
        district: district,
        block: block.trim() || null,
        lat: lat,
        lng: lng,
        media_urls: uploadedUrls
      }

      const res = await authFetch('/api/challenges/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(challengePayload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to submit challenge.')
      }

      const createdChallenge = await res.json()

      // Reset form
      setTitle('')
      setDescription('')
      setLocation('')
      setBlock('')
      setPhotos([])
      setErrors({})
      setLocationStatus('')

      // Show success modal
      setSuccessChallenge(createdChallenge)
      fetchCommunityChallenges()
    } catch (err) {
      console.error(err)
      setErrors((prev) => ({
        ...prev,
        submit: err.message || 'An unexpected error occurred. Please try again.'
      }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Citizen Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit local societal challenges directly to state universities and industry partners for research and implementation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/progress')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Clock size={13} className="text-blue-600 dark:text-blue-400" />
          <span>Track My Challenges</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Prominent Report Challenge Form (2 columns on large) ── */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Report a Community Challenge
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fill out the details below. We verify every report before academic routing.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
              4 Easy Steps
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── STEP 1: What is the problem? ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  What is the problem?
                </label>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Problem Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (errors.title) setErrors({ ...errors, title: null })
                  }}
                  placeholder="e.g. Broken Drinking Water Pipeline on Kanke Road"
                  maxLength={120}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-neutral-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all ${
                    errors.title
                      ? 'border-rose-400 ring-2 ring-rose-100 dark:ring-rose-950/40'
                      : 'border-slate-200 dark:border-neutral-700 focus:border-blue-500'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.title ? (
                    <p className="text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-slate-400">{title.length}/120</span>
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (errors.description) setErrors({ ...errors, description: null })
                  }}
                  placeholder="Explain what is broken, who is affected, and how long the issue has persisted. Detailed information helps our AI classify urgency accurately..."
                  maxLength={1000}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-neutral-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all leading-relaxed ${
                    errors.description
                      ? 'border-rose-400 ring-2 ring-rose-100 dark:ring-rose-950/40'
                      : 'border-slate-200 dark:border-neutral-700 focus:border-blue-500'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      No technical category selection required; our natural language pipeline automatically identifies the sector.
                    </p>
                  )}
                  <span className="text-[10px] text-slate-400">{description.length}/1000</span>
                </div>
              </div>
            </div>

            {/* ── STEP 2: Where is it happening? ── */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Where is it happening?
                  </label>
                </div>

                {/* GPS Assistant */}
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <Navigation size={13} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Detecting...' : 'Use My Current Location'}
                </button>
              </div>

              {locationStatus && (
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <MapPin size={13} className="text-blue-500 flex-shrink-0" />
                  <span>{locationStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* District Select */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    District in Jharkhand <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-800/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-neutral-900 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {JHARKHAND_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Block / Locality */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Block / Sub-District (Optional)
                  </label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Kanke Block, Chas, Doranda"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-neutral-900 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Exact Location / Landmark */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Specific Street / Landmark / Village <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    if (errors.location) setErrors({ ...errors, location: null })
                  }}
                  placeholder="e.g. Near Govt High School, Main Road"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-neutral-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all ${
                    errors.location
                      ? 'border-rose-400 ring-2 ring-rose-100 dark:ring-rose-950/40'
                      : 'border-slate-200 dark:border-neutral-700 focus:border-blue-500'
                  }`}
                />
                {errors.location && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* ── STEP 3: Add Evidence Photos ── */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Add Evidence Photos
                  </label>
                </div>
                <span className="text-[11px] text-slate-400">
                  {photos.length}/3 Photos
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Photographs help verification teams quickly authenticate your challenge and route it to engineers. Supported: JPG, PNG, WebP (up to 5MB each).
              </p>

              {/* Upload Drop Area / Button */}
              {photos.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-neutral-800/30 p-5 text-center cursor-pointer transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to choose photos or drag & drop here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Attach 1 to 3 clear photographs of the situation
                  </p>
                </div>
              )}

              {errors.photos && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.photos}
                </p>
              )}

              {/* Thumbnail Gallery */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 group shadow-xs"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Click overlay for zoom */}
                      <button
                        type="button"
                        onClick={() => setPreviewLightbox(photo.previewUrl)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        title="Click to preview full size"
                      >
                        <ZoomIn size={18} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePhoto(idx)
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-[9px] text-slate-200 truncate">
                        {photo.name} ({photo.size}MB)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── STEP 4: Review & Submit ── */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 space-y-3">
              {errors.submit && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting and uploading evidence...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Challenge for AI Analysis</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                By submitting, your challenge will undergo automated AI clustering and government verification. You will be able to monitor every phase in the Progress Tracker.
              </p>
            </div>
          </form>
        </div>

        {/* ── 3. Right Column: Community Pulse & Guidance ── */}
        <div className="space-y-6">
          {/* How It Works Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              What happens after submitting?
            </h3>
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  1
                </span>
                <p>
                  <strong>AI Analysis:</strong> Deduplicates with other community reports and assigns priority.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  2
                </span>
                <p>
                  <strong>Government Verification:</strong> Desk officers validate evidence and approve institutional routing.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  3
                </span>
                <p>
                  <strong>University R&D:</strong> Academic teams (RIMS, IIT ISM, NIT) adopt the challenge to engineer prototypes.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  4
                </span>
                <p>
                  <strong>Industry Implementation:</strong> CSR partners fund pilot deployment in your community.
                </p>
              </div>
            </div>
          </div>

          {/* My Submitted Challenges (Active Progress Tracker) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-neutral-900 dark:via-blue-950/20 dark:to-neutral-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    My Submissions Progress
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Live tracking across 8 lifecycle stages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/progress')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Track all <ArrowRight size={12} />
              </button>
            </div>

            {loadingMy ? (
              <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                Loading your tracked issues...
              </div>
            ) : myChallenges.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-white/60 dark:bg-neutral-800/40 border border-slate-100 dark:border-neutral-800 text-xs text-slate-500">
                You haven't reported any challenges yet. Submit an issue using the form to track its resolution journey.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myChallenges.slice(0, 3).map((c) => {
                  const stageNum = (() => {
                    switch (c.status) {
                      case 'pending_verification': return 2;
                      case 'verified': case 'matches_suggested': case 'ready_for_routing': return 3;
                      case 'routed': return 4;
                      case 'in_project': return 5;
                      case 'proposal_submitted': return 6;
                      case 'partnered': return 7;
                      case 'resolved': return 8;
                      default: return 1;
                    }
                  })();
                  const percent = Math.round((stageNum / 8) * 100);

                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate('/progress')}
                      className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-slate-200/70 dark:border-neutral-700/60 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {c.title}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex-shrink-0">
                          Stage {stageNum}/8
                        </span>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{c.domain || 'Civic Problem'}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Community Challenges (Privacy Preserving) */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-500" />
                Recent Community Activity
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">Jharkhand</span>
            </div>

            {loadingRecent ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 animate-pulse space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-neutral-700 rounded w-4/5" />
                    <div className="h-2.5 bg-slate-100 dark:bg-neutral-700/60 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentChallenges.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No active community issues found at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {recentChallenges.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-800/40 hover:border-slate-200 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {c.title}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex-shrink-0">
                        {c.domain || 'Civic'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {c.location.split(',')[0]}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{c.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox Modal for Photo Zoom ── */}
      {previewLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewLightbox(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLightbox(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={previewLightbox}
              alt="Full evidence preview"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* ── Success Confirmation Modal ── */}
      {successChallenge && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Challenge Submitted Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your societal challenge has been officially registered and entered into the automated AI processing queue.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-700/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Tracking ID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {successChallenge.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Classified Domain</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {successChallenge.domain}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Current Status</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Under Government Review
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Evidence Attached</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {successChallenge.media_urls?.length || 0} Photographs
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessChallenge(null)
                  navigate('/progress')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Track Journey in Progress</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setSuccessChallenge(null)}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Report Another Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
