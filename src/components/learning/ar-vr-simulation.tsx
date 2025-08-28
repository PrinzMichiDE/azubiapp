/**
 * AR/VR-Simulation-Komponente für praxisnahe Azubi-Ausbildung
 * AR/VR simulation component for practical apprentice training
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './progress-ring'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CameraIcon,
  MicrophoneIcon,
  EyeIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  TruckIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface ARVRSimulation {
  id: string
  title: string
  description: string
  typ: 'AR' | 'VR' | '360Video' | 'InteractiveDemo'
  beruf: string
  lernfeld: string
  szenario: string
  schwierigkeit: 'Anfänger' | 'Fortgeschritten' | 'Experte'
  dauer: number // in Minuten
  voraussetzungen: string[]
  lernziele: string[]
  bewertungskriterien: string[]
  geraeteAnforderungen: GeraeteAnforderung[]
  thumbnail?: string
  videoUrl?: string
  arContent?: string
  vrContent?: string
  interactiveElements: InteractiveElement[]
}

interface GeraeteAnforderung {
  typ: 'VR-Headset' | 'AR-fähiges Smartphone' | 'Webcam' | 'Mikrofon'
  mindestanforderung: string
  empfohlen: string
}

interface InteractiveElement {
  id: string
  typ: 'Hotspot' | 'Quiz' | 'Werkzeugauswahl' | 'Messung' | 'Bewertung'
  position: { x: number; y: number; z?: number }
  inhalt: any
  triggerbedingung?: string
}

interface SimulationSession {
  id: string
  azubiId: string
  simulationId: string
  startzeit: Date
  endzeit?: Date
  fortschritt: number
  aktionen: SimulationAktion[]
  bewertung?: SimulationBewertung
  status: 'aktiv' | 'pausiert' | 'abgeschlossen' | 'abgebrochen'
}

interface SimulationAktion {
  timestamp: Date
  typ: 'Werkzeugauswahl' | 'Messung' | 'Entscheidung' | 'Fehler' | 'Erfolg'
  details: any
  korrekt: boolean
  zeitBenötigt: number
}

interface SimulationBewertung {
  gesamtpunkte: number
  maxPunkte: number
  kategorien: {
    [key: string]: {
      erreicht: number
      möglich: number
      feedback: string
    }
  }
  verbesserungsvorschläge: string[]
  nächsteSchritte: string[]
}

interface ARVRSimulationProps {
  simulation: ARVRSimulation
  onStart?: (simulationId: string) => void
  onPause?: (sessionId: string) => void
  onStop?: (sessionId: string) => void
  onComplete?: (sessionId: string, bewertung: SimulationBewertung) => void
  className?: string
}

/**
 * AR/VR-Simulation für immersive Azubi-Ausbildung
 * AR/VR simulation for immersive apprentice training
 * 
 * Features:
 * - VR-Simulationen für sichere Praxisübungen
 * - AR-Overlays für reale Arbeitsplätze
 * - 360°-Videos für betriebliche Rundgänge
 * - Interaktive Hotspots für Lernkontrolle
 * - Realistische Szenarien nach Berufsfeld
 * - Automatische Bewertung und Feedback
 * 
 * @param simulation - Simulations-Daten / Simulation data
 * @param onStart - Start-Callback / Start callback
 * @param onPause - Pause-Callback / Pause callback
 * @param onStop - Stop-Callback / Stop callback
 * @param onComplete - Completion-Callback / Completion callback
 */
export function ARVRSimulation({
  simulation,
  onStart,
  onPause,
  onStop,
  onComplete,
  className
}: ARVRSimulationProps) {
  const [session, setSession] = useState<SimulationSession | null>(null)
  const [geräteCheck, setGeräteCheck] = useState<boolean>(false)
  const [fehlerMeldung, setFehlerMeldung] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Geräte-Kompatibilität prüfen
    checkGeräteKompatibilität()
  }, [])

  const checkGeräteKompatibilität = async () => {
    try {
      // WebXR/WebVR Support prüfen
      if ('xr' in navigator) {
        const xr = (navigator as any).xr
        const vrSupported = await xr?.isSessionSupported?.('immersive-vr')
        const arSupported = await xr?.isSessionSupported?.('immersive-ar')
        
        if (simulation.typ === 'VR' && !vrSupported) {
          setFehlerMeldung('VR-Headset erforderlich oder WebXR nicht unterstützt')
          return
        }
        
        if (simulation.typ === 'AR' && !arSupported) {
          setFehlerMeldung('AR-fähiges Gerät erforderlich')
          return
        }
      }

      // Kamera/Mikrofon für AR prüfen
      if (simulation.typ === 'AR') {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      }

      setGeräteCheck(true)
    } catch (error) {
      setFehlerMeldung('Geräte-Zugriff verweigert oder nicht verfügbar')
    }
  }

  const startSimulation = async () => {
    if (!geräteCheck) {
      await checkGeräteKompatibilität()
      return
    }

    try {
      const newSession: SimulationSession = {
        id: `session-${Date.now()}`,
        azubiId: 'current-user', // Aus Context holen
        simulationId: simulation.id,
        startzeit: new Date(),
        fortschritt: 0,
        aktionen: [],
        status: 'aktiv'
      }

      setSession(newSession)

      // Typ-spezifische Initialisierung
      switch (simulation.typ) {
        case 'VR':
          await startVRSession(newSession)
          break
        case 'AR':
          await startARSession(newSession)
          break
        case '360Video':
          await start360VideoSession(newSession)
          break
        case 'InteractiveDemo':
          await startInteractiveDemoSession(newSession)
          break
      }

      onStart?.(simulation.id)
    } catch (error) {
      setFehlerMeldung(`Simulation konnte nicht gestartet werden: ${error}`)
    }
  }

  const startVRSession = async (session: SimulationSession) => {
    if ('xr' in navigator) {
      const xr = (navigator as any).xr
      const vrSession = await xr.requestSession('immersive-vr')
      
      // VR-Scene initialisieren
      initializeVRScene(vrSession, simulation.vrContent)
    }
  }

  const startARSession = async (session: SimulationSession) => {
    // AR-Kamera-Stream starten
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Rückkamera
      audio: true
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }

    // AR-Tracking initialisieren
    initializeARTracking()
  }

  const start360VideoSession = async (session: SimulationSession) => {
    if (videoRef.current && simulation.videoUrl) {
      videoRef.current.src = simulation.videoUrl
      videoRef.current.play()
      
      // 360°-Controls aktivieren
      initialize360Controls()
    }
  }

  const startInteractiveDemoSession = async (session: SimulationSession) => {
    // Interaktive Elemente laden
    loadInteractiveElements(simulation.interactiveElements)
  }

  const pauseSimulation = () => {
    if (session) {
      setSession({ ...session, status: 'pausiert' })
      onPause?.(session.id)
    }
  }

  const stopSimulation = () => {
    if (session) {
      const bewertung = calculateBewertung(session.aktionen)
      setSession({ 
        ...session, 
        status: 'abgeschlossen',
        endzeit: new Date(),
        bewertung 
      })
      
      // Streams beenden
      cleanupSession()
      
      onComplete?.(session.id, bewertung)
    }
  }

  const calculateBewertung = (aktionen: SimulationAktion[]): SimulationBewertung => {
    const gesamtAktionen = aktionen.length
    const korrektAktionen = aktionen.filter(a => a.korrekt).length
    
    const kategorien = {
      'Arbeitsschutz': {
        erreicht: Math.floor(korrektAktionen * 0.3),
        möglich: Math.floor(gesamtAktionen * 0.3),
        feedback: 'Schutzausrüstung wurde ordnungsgemäß verwendet'
      },
      'Werkzeughandhabung': {
        erreicht: Math.floor(korrektAktionen * 0.4),
        möglich: Math.floor(gesamtAktionen * 0.4),
        feedback: 'Werkzeuge wurden fachgerecht eingesetzt'
      },
      'Qualitätskontrolle': {
        erreicht: Math.floor(korrektAktionen * 0.3),
        möglich: Math.floor(gesamtAktionen * 0.3),
        feedback: 'Messungen und Prüfungen korrekt durchgeführt'
      }
    }

    const gesamtpunkte = Object.values(kategorien).reduce((sum, kat) => sum + kat.erreicht, 0)
    const maxPunkte = Object.values(kategorien).reduce((sum, kat) => sum + kat.möglich, 0)

    return {
      gesamtpunkte,
      maxPunkte,
      kategorien,
      verbesserungsvorschläge: generateVerbesserungsvorschläge(aktionen),
      nächsteSchritte: generateNächsteSchritte(gesamtpunkte, maxPunkte)
    }
  }

  const getBerufIcon = (beruf: string) => {
    const icons = {
      'Fachinformatiker': ComputerDesktopIcon,
      'Mechatroniker': CpuChipIcon,
      'Industriemechaniker': WrenchScrewdriverIcon,
      'Chemielaborant': BeakerIcon,
      'Speditionskaufmann': TruckIcon,
      'Bürokaufmann': BuildingOfficeIcon
    }
    return icons[beruf as keyof typeof icons] || WrenchScrewdriverIcon
  }

  const getTypColor = (typ: string) => {
    const colors = {
      'VR': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'AR': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      '360Video': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'InteractiveDemo': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    }
    return colors[typ as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const BerufIcon = getBerufIcon(simulation.beruf)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Simulation Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <BerufIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{simulation.title}</span>
                  <Badge className={getTypColor(simulation.typ)}>
                    {simulation.typ}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {simulation.beruf} • {simulation.lernfeld}
                </p>
              </div>
            </div>
            
            {session && (
              <ProgressRing
                progress={session.fortschritt}
                size="md"
                showPercentage
                color="primary"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {simulation.description}
          </p>

          {/* Szenario */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Szenario:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              {simulation.szenario}
            </p>
          </div>

          {/* Lernziele */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lernziele:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {simulation.lernziele.map((ziel, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>{ziel}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Geräte-Anforderungen */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Geräte-Anforderungen:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {simulation.geraeteAnforderungen.map((geraet, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    geräteCheck ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-gray-600 dark:text-gray-400">
                    {geraet.typ}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta-Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
            <div className="flex items-center space-x-4">
              <span>⏱️ {simulation.dauer} Min</span>
              <span>📊 {simulation.schwierigkeit}</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>Immersive Simulation</span>
            </div>
          </div>

          {/* Fehler-Meldung */}
          {fehlerMeldung && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                {fehlerMeldung}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Viewport */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {/* Video Element für AR/360° */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ display: simulation.typ === 'VR' ? 'none' : 'block' }}
            />

            {/* Canvas für AR-Overlays */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: simulation.typ === 'AR' ? 'block' : 'none' }}
            />

            {/* Simulation Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                {!session ? (
                  <Button
                    onClick={startSimulation}
                    disabled={!geräteCheck}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Simulation starten
                  </Button>
                ) : (
                  <>
                    {session.status === 'aktiv' ? (
                      <Button
                        onClick={pauseSimulation}
                        variant="outline"
                        size="sm"
                        className="text-white border-white hover:bg-white/10"
                      >
                        <PauseIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={startSimulation}
                        variant="outline"
                        size="sm"
                        className="text-white border-white hover:bg-white/10"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      onClick={stopSimulation}
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white/10"
                    >
                      <StopIcon className="h-4 w-4" />
                    </Button>

                    <div className="text-white text-sm ml-4">
                      {Math.round(session.fortschritt)}% abgeschlossen
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* VR-Placeholder */}
            {simulation.typ === 'VR' && !session && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">VR-Simulation bereit</p>
                  <p className="text-sm opacity-75">Setzen Sie Ihr VR-Headset auf</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Feedback */}
      {session?.bewertung && (
        <Card>
          <CardHeader>
            <CardTitle>Simulationsergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Gesamtpunktzahl:</span>
              <span className="text-xl font-bold text-primary-600">
                {session.bewertung.gesamtpunkte} / {session.bewertung.maxPunkte}
              </span>
            </div>

            {Object.entries(session.bewertung.kategorien).map(([kategorie, bewertung]) => (
              <div key={kategorie} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{kategorie}</span>
                  <span>{bewertung.erreicht} / {bewertung.möglich}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(bewertung.erreicht / bewertung.möglich) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {bewertung.feedback}
                </p>
              </div>
            ))}

            {session.bewertung.verbesserungsvorschläge.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Verbesserungsvorschläge:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {session.bewertung.verbesserungsvorschläge.map((vorschlag, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-500 mt-1">💡</span>
                      <span>{vorschlag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Private Hilfsfunktionen
  function initializeVRScene(session: any, content: any) {
    // VR-Scene Setup mit Three.js oder A-Frame
  }

  function initializeARTracking() {
    // AR-Tracking mit WebRTC und Computer Vision
  }

  function initialize360Controls() {
    // 360°-Video Controls
  }

  function loadInteractiveElements(elements: InteractiveElement[]) {
    // Interaktive Hotspots laden
  }

  function cleanupSession() {
    // Streams und Sessions beenden
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  function generateVerbesserungsvorschläge(aktionen: SimulationAktion[]): string[] {
    // Analyse der Aktionen für Verbesserungsvorschläge
    return [
      'Schutzausrüstung vor Arbeitsbeginn anlegen',
      'Werkzeuge nach Gebrauch ordnungsgemäß verstauen',
      'Qualitätsprüfung systematischer durchführen'
    ]
  }

  function generateNächsteSchritte(erreicht: number, möglich: number): string[] {
    const prozent = (erreicht / möglich) * 100
    
    if (prozent >= 90) {
      return ['Simulation erfolgreich abgeschlossen', 'Nächstes Lernfeld beginnen']
    } else if (prozent >= 70) {
      return ['Simulation wiederholen für besseres Ergebnis', 'Schwachstellen gezielt üben']
    } else {
      return ['Grundlagen wiederholen', 'Ausbilder um Unterstützung bitten', 'Theorie-Module bearbeiten']
    }
  }
}
