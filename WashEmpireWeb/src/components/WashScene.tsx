import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, Sky } from '@react-three/drei'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, SMAA, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { BayState, BayUpgradeId, Car, CityDefinition, CityDistrictState, CityTheme, GameState, GraphicsQuality } from '../game/types'
import { activeBayCount, cashBoxValue, cityDefinitions, currentCityDefinition, currentCityDistrict, isConveyorCity, totalCashBox } from '../game/simulation'
import { activeEnvironmentRewards, type EnvironmentRewardVisualId } from '../game/environmentRewards'
import { PrototypeAssetLayer } from './PrototypeAssetLayer'

export interface SceneFocus {
  id: number
  kind: 'bay' | 'lot'
  bayIndex?: number
}

export interface CollectFx {
  id: number
  amount: number
}

interface WashSceneProps {
  state: GameState
  onCollect: () => void
  graphicsQuality: GraphicsQuality
  rideAlong?: boolean
  focus?: SceneFocus | null
  onFocusDone?: () => void
  collectFx?: CollectFx | null
}

type Vec3 = [number, number, number]
type PathPoint = [number, number]
type ServiceVehicleKind = 'cash' | 'maintenance' | 'response'
type SmoothPathSegment =
  | { type: 'line'; from: PathPoint; to: PathPoint; length: number }
  | { type: 'curve'; from: PathPoint; control: PathPoint; to: PathPoint; length: number }

const BAY_X = [-4.2, -1.4, 1.4, 4.2]
const CONVEYOR_X = [-1.25, 1.25]
const CAMERA_POSITION: Vec3 = [10.8, 12.8, 17.6]
const MOBILE_CAMERA_POSITION: Vec3 = [12.4, 16.2, 22.4]
const CAMERA_TARGET: Vec3 = [0, 0.55, -0.6]
const TRAFFIC_PALETTE = ['#f8fafc', '#dbe4ea', '#b8c3cc', '#334155', '#1f2937', '#8f1d1d']
const CORNER_RADIUS = 0.62
const CAR_LOOKAHEAD_DISTANCE = 0.48
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1)
const SHARED_GEOMETRIES = new Map<string, THREE.BufferGeometry>()
const STANDARD_MATERIALS = new Map<string, THREE.MeshStandardMaterial>()

type SceneTextProps = {
  children?: ReactNode
  [key: string]: unknown
}

// Keep scene lettering geometric; live SDF text can stall WebGL on resumed browser saves.
function Text(props: SceneTextProps) {
  void props
  return null
}

interface GraphicsPreset {
  antialias: boolean
  contactShadows: boolean
  dpr: [number, number]
  shadowMapSize: number
  shadows: boolean
  serviceTraffic: boolean
  /** Image-based lighting for glossy reflections. Off on low to stay mobile-lean. */
  environment: boolean
  envResolution: number
  /** Post-processing stack (bloom / grade / vignette). Off on low. */
  postFx: boolean
}

const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsPreset> = {
  low: {
    antialias: false,
    contactShadows: false,
    dpr: [0.75, 1],
    shadowMapSize: 256,
    shadows: false,
    serviceTraffic: false,
    environment: false,
    envResolution: 64,
    postFx: false,
  },
  balanced: {
    antialias: true,
    contactShadows: false,
    dpr: [0.85, 1.15],
    shadowMapSize: 512,
    shadows: false,
    serviceTraffic: true,
    environment: true,
    envResolution: 128,
    postFx: true,
  },
  high: {
    antialias: true,
    contactShadows: true,
    dpr: [1, 1.5],
    shadowMapSize: 1024,
    shadows: true,
    serviceTraffic: true,
    environment: true,
    envResolution: 256,
    postFx: true,
  },
}

interface ServiceVehicleConfig {
  id: string
  kind: ServiceVehicleKind
  color: string
  accent: string
  route: PathPoint[]
  offsetSeconds: number
  periodSeconds: number
}

const SERVICE_VEHICLES: ServiceVehicleConfig[] = [
  {
    id: 'cash-runner',
    kind: 'cash',
    color: '#f8fafc',
    accent: '#0f4f9c',
    offsetSeconds: 0,
    periodSeconds: 46,
    route: [
      [-21.0, 15.2],
      [-21.0, 9.15],
      [-15.1, 9.15],
      [-8.1, 9.15],
      [-8.1, 6.75],
      [0, 6.75],
      [6.25, 6.75],
      [6.25, 4.45],
      [6.25, 4.45],
      [8.1, 6.75],
      [15.1, 6.75],
      [21.2, 9.15],
      [21.2, 15.0],
    ],
  },
  {
    id: 'bay-tech-truck',
    kind: 'maintenance',
    color: '#facc15',
    accent: '#1f2937',
    offsetSeconds: 17,
    periodSeconds: 58,
    route: [
      [21.2, -15.8],
      [21.2, -10.05],
      [15.1, -10.05],
      [8.1, -10.05],
      [8.1, -6.2],
      [5.8, -6.2],
      [5.8, -5.1],
      [5.8, -5.1],
      [8.1, -6.2],
      [15.1, -10.05],
      [21.2, -10.05],
      [21.2, -15.8],
    ],
  },
  {
    id: 'city-response',
    kind: 'response',
    color: '#f8fafc',
    accent: '#dc2626',
    offsetSeconds: 32,
    periodSeconds: 68,
    route: [
      [-26.1, -18.1],
      [-21.0, -18.1],
      [-21.0, -10.05],
      [-15.1, -10.05],
      [-8.1, -10.05],
      [-8.1, -6.2],
      [-3.6, -6.2],
      [-3.6, -6.2],
      [-8.1, -6.2],
      [-15.1, -10.05],
      [-21.0, -10.05],
      [-26.1, -18.1],
    ],
  },
]

interface CityThemeSpec {
  id: CityTheme
  label: string
  ground: string
  underside: string
  road: string
  stripe: string
  lot: string
  pad: string
  wall: string
  trim: string
  accent: string
  water: string
  park: string
  foliage: string
  blockTones: [string, string, string, string, string]
  skylineA: string
  skylineB: string
}

const CITY_THEMES: Record<CityTheme, CityThemeSpec> = {
  smallTown: {
    id: 'smallTown',
    label: 'Small City',
    ground: '#6f8058',
    underside: '#3f4547',
    road: '#202932',
    stripe: '#facc15',
    lot: '#756f6b',
    pad: '#d4d0c7',
    wall: '#e4e0d6',
    trim: '#2f6fba',
    accent: '#0a8496',
    water: '#4ca3c7',
    park: '#547342',
    foliage: '#254d2c',
    blockTones: ['#d7d1c6', '#c4b5a5', '#b8c8bd', '#b9c3cc', '#d8c6a1'],
    skylineA: '#627384',
    skylineB: '#485867',
  },
  harbor: {
    id: 'harbor',
    label: 'Harbor',
    ground: '#657b70',
    underside: '#334348',
    road: '#182632',
    stripe: '#facc15',
    lot: '#6c7477',
    pad: '#d2d6d3',
    wall: '#e3e7e2',
    trim: '#0284c7',
    accent: '#22d3ee',
    water: '#0e7490',
    park: '#4f6f54',
    foliage: '#23563a',
    blockTones: ['#a8b7bd', '#d7d1c6', '#8aa2aa', '#b8c8bd', '#c8b99a'],
    skylineA: '#4f6571',
    skylineB: '#334a56',
  },
  downtown: {
    id: 'downtown',
    label: 'Bustling City',
    ground: '#5f6758',
    underside: '#2f363a',
    road: '#121923',
    stripe: '#facc15',
    lot: '#66605d',
    pad: '#c9c4ba',
    wall: '#dedbd4',
    trim: '#0ea5e9',
    accent: '#f472b6',
    water: '#38bdf8',
    park: '#475f3d',
    foliage: '#193e2a',
    blockTones: ['#cbd5e1', '#94a3b8', '#64748b', '#d6d3d1', '#b8c8bd'],
    skylineA: '#334155',
    skylineB: '#1f2937',
  },
  snow: {
    id: 'snow',
    label: 'Snow City',
    ground: '#d9e6e1',
    underside: '#4c5960',
    road: '#25313c',
    stripe: '#fde68a',
    lot: '#8d9490',
    pad: '#e7ebe7',
    wall: '#f8fafc',
    trim: '#0284c7',
    accent: '#38bdf8',
    water: '#7dd3fc',
    park: '#dbeafe',
    foliage: '#1f5c4a',
    blockTones: ['#f8fafc', '#dbeafe', '#cbd5e1', '#e2e8f0', '#b7c8d2'],
    skylineA: '#94a3b8',
    skylineB: '#64748b',
  },
  beltline: {
    id: 'beltline',
    label: 'Automatic City',
    ground: '#686b62',
    underside: '#30383a',
    road: '#111827',
    stripe: '#facc15',
    lot: '#6f6963',
    pad: '#c9c4ba',
    wall: '#e4e0d6',
    trim: '#0891b2',
    accent: '#f97316',
    water: '#3b82a0',
    park: '#4c603f',
    foliage: '#21422b',
    blockTones: ['#9ca3af', '#64748b', '#475569', '#c8b99a', '#b8c8bd'],
    skylineA: '#475569',
    skylineB: '#26323d',
  },
}

function themeFor(city: CityDefinition): CityThemeSpec {
  return CITY_THEMES[city.theme]
}

function standardMaterialKey(color: string, roughness: number, metalness: number, opacity = 1): string {
  return `${color}|${roughness}|${metalness}|${opacity}`
}

function getStandardMaterial(color: string, roughness: number, metalness: number, opacity = 1): THREE.MeshStandardMaterial {
  const key = standardMaterialKey(color, roughness, metalness, opacity)
  const cached = STANDARD_MATERIALS.get(key)
  if (cached) return cached

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  })
  STANDARD_MATERIALS.set(key, material)
  return material
}

function cachedGeometry<T extends THREE.BufferGeometry>(key: string, create: () => T): T {
  const cached = SHARED_GEOMETRIES.get(key)
  if (cached) return cached as T

  const geometry = create()
  SHARED_GEOMETRIES.set(key, geometry)
  return geometry
}

function getSphereGeometry(radius: number, widthSegments: number, heightSegments: number): THREE.SphereGeometry {
  return cachedGeometry(`sphere|${radius}|${widthSegments}|${heightSegments}`, () => new THREE.SphereGeometry(radius, widthSegments, heightSegments))
}

function getCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radialSegments: number): THREE.CylinderGeometry {
  return cachedGeometry(
    `cylinder|${radiusTop}|${radiusBottom}|${height}|${radialSegments}`,
    () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
  )
}

// Self-contained image-based lighting: a few Lightformers baked once into a
// cubemap give glossy car paint, water, and glass real reflections with no
// external HDR fetch (works offline / on itch / on mobile).
function StudioEnvironment({ resolution }: { resolution: number }) {
  return (
    <Environment resolution={resolution} frames={1} environmentIntensity={0.5}>
      {/* Warm key from the sun side */}
      <Lightformer form="rect" intensity={3.4} color="#fff1d2" position={[9, 9, 6]} rotation={[-Math.PI / 3, 0, 0]} scale={[16, 16, 1]} />
      {/* Cool sky fill, opposite the sun */}
      <Lightformer form="rect" intensity={1.1} color="#bcd6ff" position={[-9, 7, -6]} rotation={[Math.PI / 4, 0, 0]} scale={[16, 16, 1]} />
      {/* Soft overhead sky */}
      <Lightformer form="rect" intensity={0.9} color="#eef4ff" position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
      {/* Subtle greenish ground bounce */}
      <Lightformer form="rect" intensity={0.35} color="#5c6b4d" position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[26, 26, 1]} />
    </Environment>
  )
}

// Post-processing: bloom for lit signage / water sparkle, a gentle warm grade,
// and a vignette to focus the diorama. SMAA handles anti-aliasing in the
// composited pipeline. Balanced + High only.
function SceneEffects({ multisampling }: { multisampling: number }) {
  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.52} luminanceThreshold={0.72} luminanceSmoothing={0.22} radius={0.7} />
      <HueSaturation hue={0} saturation={0.14} />
      <BrightnessContrast brightness={0.012} contrast={0.08} />
      <Vignette offset={0.3} darkness={0.42} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}

export function WashScene({
  state,
  onCollect,
  graphicsQuality,
  rideAlong = false,
  focus = null,
  onFocusDone,
  collectFx = null,
}: WashSceneProps) {
  const preset = GRAPHICS_PRESETS[graphicsQuality]

  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: 54 }}
      shadows={preset.shadows}
      dpr={preset.dpr}
      gl={{ antialias: preset.antialias, powerPreference: graphicsQuality === 'low' ? 'default' : 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
    >
      <color attach="background" args={['#c6dcea']} />
      <fog attach="fog" args={['#c6dcea', 42, 96]} />
      <Sky sunPosition={[12, 18, 8]} turbidity={3.4} rayleigh={0.8} mieCoefficient={0.004} mieDirectionalG={0.72} />
      {preset.environment && <StudioEnvironment resolution={preset.envResolution} />}
      <ambientLight intensity={preset.environment ? 0.4 : 0.62} />
      <hemisphereLight args={['#dcecff', '#55603f', preset.environment ? 0.5 : 0.72]} />
      <directionalLight
        castShadow={preset.shadows}
        color="#fff1da"
        intensity={2.05}
        position={[8, 12, 5]}
        shadow-mapSize={[preset.shadowMapSize, preset.shadowMapSize]}
      />
      <RenderInfoProbe />
      {rideAlong ? <RideAlongCamera state={state} /> : <CameraSetup />}
      <Lot state={state} onCollect={onCollect} graphicsQuality={graphicsQuality} />
      {state.cars.map((car) => (
        <CarWithCustomer car={car} key={car.id} state={state} />
      ))}
      {collectFx && <CollectBurst key={collectFx.id} state={state} />}
      {!rideAlong && focus && (
        <PurchaseVignette key={focus.id} focus={focus} state={state} onDone={onFocusDone} />
      )}
      {!rideAlong && focus?.kind === 'bay' && (
        <UpgradePop key={`pop-${focus.id}`} bayX={bayXForIndex(focus.bayIndex ?? 0, activeBayCount(state))} />
      )}
      {preset.contactShadows && <ContactShadows opacity={0.28} scale={22} blur={2.5} far={5} position={[0, 0.02, 0]} />}
      {!rideAlong && (
        <OrbitControls
          enableDamping
          makeDefault
          maxPolarAngle={Math.PI * 0.48}
          minDistance={8}
          maxDistance={54}
          target={CAMERA_TARGET}
        />
      )}
      {preset.postFx && <SceneEffects multisampling={preset.antialias ? 4 : 0} />}
    </Canvas>
  )
}

function CameraSetup() {
  const camera = useThree((three) => three.camera)
  const size = useThree((three) => three.size)

  useEffect(() => {
    const isPortrait = size.width < 700
    camera.position.set(...(isPortrait ? MOBILE_CAMERA_POSITION : CAMERA_POSITION))
    camera.lookAt(...CAMERA_TARGET)
    camera.updateProjectionMatrix()
  }, [camera, size.width])

  return null
}

const VIGNETTE_IN_SECONDS = 0.7
const VIGNETTE_HOLD_SECONDS = 1.2
const VIGNETTE_OUT_SECONDS = 0.7

/**
 * Brief camera dolly toward a freshly purchased upgrade, then back.
 * OrbitControls are disabled for the duration so the moves don't fight.
 */
type ControlsLike = { enabled: boolean; target: THREE.Vector3; update: () => void }

function sceneControls(root: { controls: unknown }): ControlsLike | null {
  const controls = root.controls as ControlsLike | null
  return controls && typeof controls.update === 'function' ? controls : null
}

function setControlsEnabled(controls: ControlsLike | null, enabled: boolean): void {
  if (controls) controls.enabled = enabled
}

function PurchaseVignette({
  focus,
  state,
  onDone,
}: {
  focus: SceneFocus
  state: GameState
  onDone?: () => void
}) {
  const camera = useThree((three) => three.camera)
  const getRoot = useThree((three) => three.get)
  const elapsed = useRef(0)
  const saved = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const finished = useRef(false)

  const destination = useMemo(() => {
    if (focus.kind === 'bay') {
      // Approach low from the bay mouth so the equipment reads under the roof frame.
      const bayX = bayXForIndex(focus.bayIndex ?? 0, activeBayCount(state))
      const target = new THREE.Vector3(bayX, 1.0, -0.2)
      const position = target.clone().add(new THREE.Vector3(4.2, 3.1, 7.6))
      return { target, position }
    }
    // Lot purchases get a gentler pull toward the property as a whole.
    const dir = new THREE.Vector3(...CAMERA_POSITION).sub(new THREE.Vector3(...CAMERA_TARGET)).normalize()
    const target = new THREE.Vector3(2.2, 1.0, 0.6)
    return { target, position: target.clone().addScaledVector(dir, 11) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.id])

  useEffect(() => {
    const controls = sceneControls(getRoot())
    saved.current = {
      position: camera.position.clone(),
      target: controls ? controls.target.clone() : new THREE.Vector3(...CAMERA_TARGET),
    }
    setControlsEnabled(controls, false)
    return () => {
      const home = saved.current
      if (home) {
        camera.position.copy(home.position)
        camera.lookAt(home.target)
        camera.updateProjectionMatrix()
        if (controls) {
          controls.target.copy(home.target)
          controls.update()
        }
      }
      setControlsEnabled(controls, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    const home = saved.current
    if (!home || finished.current) return

    elapsed.current += delta
    const t = elapsed.current
    const inEnd = VIGNETTE_IN_SECONDS
    const holdEnd = inEnd + VIGNETTE_HOLD_SECONDS
    const outEnd = holdEnd + VIGNETTE_OUT_SECONDS

    let alpha: number
    if (t < inEnd) {
      alpha = smoothstep(t / VIGNETTE_IN_SECONDS)
    } else if (t < holdEnd) {
      alpha = 1
    } else if (t < outEnd) {
      alpha = 1 - smoothstep((t - holdEnd) / VIGNETTE_OUT_SECONDS)
    } else {
      finished.current = true
      onDone?.()
      return
    }

    camera.position.lerpVectors(home.position, destination.position, alpha)
    const look = new THREE.Vector3().lerpVectors(home.target, destination.target, alpha)
    camera.lookAt(look)
    camera.updateProjectionMatrix()
  })

  return null
}

function smoothstep(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

const BURST_COINS_PER_SOURCE = 7
const BURST_LIFE_SECONDS = 1.05

/** Gold coin burst above every pay point when the player collects. */
function CollectBurst({ state }: { state: GameState }) {
  const seeds = useMemo(() => {
    // Launch well above the rooflines so the fountain reads in open air
    // from the default camera instead of against the roof framework.
    const origins: Vec3[] = isConveyorCity(state)
      ? [
          [-4.45, 3.6, -4.24],
          [6.17, 3.6, 2.13],
        ]
      : [
          ...bayXPositions(activeBayCount(state)).map((x): Vec3 => [x - 1.08, 4.0, 0.4]),
          [6.92, 3.6, 2.11],
        ]

    return origins.flatMap((origin) =>
      Array.from({ length: BURST_COINS_PER_SOURCE }, () => ({
        origin,
        velocity: [
          (Math.random() - 0.5) * 2.6,
          1.8 + Math.random() * 2.2,
          (Math.random() - 0.5) * 2.6,
        ] as Vec3,
        spin: 2 + Math.random() * 7,
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const coinRefs = useRef<(THREE.Mesh | null)[]>([])
  const life = useRef(0)

  useFrame((_, delta) => {
    life.current = Math.min(BURST_LIFE_SECONDS, life.current + delta)
    const t = life.current
    // Hold near full size for most of the flight, then shrink out at the end.
    const fade = Math.max(0.001, 1 - Math.pow(t / BURST_LIFE_SECONDS, 3))

    seeds.forEach((seed, index) => {
      const coin = coinRefs.current[index]
      if (!coin) return
      coin.position.set(
        seed.origin[0] + seed.velocity[0] * t,
        seed.origin[1] + seed.velocity[1] * t - 3.0 * t * t,
        seed.origin[2] + seed.velocity[2] * t,
      )
      coin.rotation.set(seed.spin * t * 0.7, seed.spin * t, Math.PI / 2)
      coin.scale.setScalar(0.35 * fade)
    })
  })

  return (
    <group>
      {seeds.map((seed, index) => (
        <mesh
          key={index}
          position={seed.origin}
          scale={[0.001, 0.001, 0.001]}
          ref={(el) => {
            coinRefs.current[index] = el
          }}
        >
          <cylinderGeometry args={[1, 1, 0.32, 10]} />
          <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.4} roughness={0.28} />
        </mesh>
      ))}
    </group>
  )
}

function RideAlongCamera({ state }: { state: GameState }) {
  const camera = useThree((three) => three.camera)

  useFrame(() => {
    const rideCar =
      state.cars.find((car) => car.stage === 'washing') ??
      state.cars.find((car) => car.stage === 'entering') ??
      state.cars.find((car) => car.stage === 'leaving')

    if (!rideCar) {
      camera.position.set(0, 1.55, -5.3)
      camera.lookAt(0, 1.25, 1.6)
      camera.updateProjectionMatrix()
      return
    }

    const pose = carPose(rideCar, state)
    const eye = transformCarLocal(pose.position, pose.rotationY, [0, 0.96, -0.24])
    const lookAt = transformCarLocal(pose.position, pose.rotationY, [0, 0.88, -3.2])
    camera.position.set(...eye)
    camera.lookAt(...lookAt)
    camera.updateProjectionMatrix()
  })

  return null
}

function Lot({ state, onCollect, graphicsQuality }: WashSceneProps) {
  const conveyor = isConveyorCity(state)
  const theme = themeFor(currentCityDefinition(state))
  const preset = GRAPHICS_PRESETS[graphicsQuality]

  return (
    <group>
      <FloatingCity state={state} theme={theme} />
      {preset.serviceTraffic && <ServiceTraffic state={state} theme={theme} />}
      {conveyor ? (
        <ConveyorWashSite state={state} onCollect={onCollect} theme={theme} />
      ) : (
        <SelfServeWashSite state={state} onCollect={onCollect} theme={theme} />
      )}
      {graphicsQuality !== 'low' && <PrototypeAssetLayer />}
    </group>
  )
}

function RenderInfoProbe() {
  const gl = useThree((three) => three.gl)
  const frame = useRef(0)

  useFrame(() => {
    frame.current += 1
    if (frame.current % 60 !== 0) return

    const info = gl.info as THREE.WebGLInfo & { programs?: unknown[] }
    const heap = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    ;(window as typeof window & {
      __washEmpireRenderInfo?: {
        calls: number
        geometries: number
        jsHeapSizeLimit?: number
        programs: number
        textures: number
        triangles: number
        usedJSHeapSize?: number
      }
    }).__washEmpireRenderInfo = {
      calls: info.render.calls,
      geometries: info.memory.geometries,
      jsHeapSizeLimit: heap?.jsHeapSizeLimit,
      programs: info.programs?.length ?? 0,
      textures: info.memory.textures,
      triangles: info.render.triangles,
      usedJSHeapSize: heap?.usedJSHeapSize,
    }
  })

  return null
}

function SelfServeWashSite({
  state,
  onCollect,
  theme,
}: {
  state: GameState
  onCollect: () => void
  theme: CityThemeSpec
}) {
  const bayCount = activeBayCount(state)
  const bayXs = bayXPositions(bayCount)
  const rewardIds = activeEnvironmentRewards(state.upgrades)

  return (
    <group>
      <Box name="lot" color={theme.lot} position={[0, -0.04, -0.3]} scale={[14.5, 0.08, 13.5]} />
      <HeroWashPlaza theme={theme} />
      <Box name="front-road" color={theme.road} position={[0, 0.005, -5.25]} scale={[11.6, 0.05, 1.35]} />
      <Box name="exit-road" color={theme.road} position={[0, 0.005, 4.25]} scale={[11.6, 0.05, 1.35]} />
      <LotRoadSurface theme={theme} />
      <LotPolishDetails theme={theme} />
      <PropertyCurbAppeal state={state} theme={theme} />
      <RestorationDressing state={state} theme={theme} />
      <WashFeatureDressing state={state} theme={theme} />
      <UpgradeRewardLayer rewardIds={rewardIds} theme={theme} />
      {bayXs.map((x, index) => (
        <LanePaint key={`lane-${x}`} x={x} index={index} theme={theme} />
      ))}
      <ClosedBayExpansionPads bayCount={bayCount} theme={theme} />
      <BayRow state={state} onCollect={onCollect} theme={theme} />
      <Office state={state} onCollect={onCollect} theme={theme} />
      <RoadSign lit={state.upgrades.signage} painted={state.upgrades.paint} label={state.locationName} theme={theme} />
      <EmployeeParking state={state} />
      {state.collectRequired && (state.lastReview?.autoCollected ?? 0) > 0 && <StaffCollectionMarker />}
      {hasReward(rewardIds, 'vacuum-island-pad') && <VacuumIsland />}
      {hasReward(rewardIds, 'touch-free-gantry') && <LaserWashExpansion />}
      {theme.id === 'snow' && <SnowLotDetails />}
      {theme.id === 'harbor' && <HarborLotDetails />}
      {theme.id === 'downtown' && <DowntownLotDetails />}
    </group>
  )
}

function ConveyorWashSite({
  state,
  onCollect,
  theme,
}: {
  state: GameState
  onCollect: () => void
  theme: CityThemeSpec
}) {
  const districtName = currentCityDefinition(state).name
  const rewardIds = activeEnvironmentRewards(state.upgrades)

  return (
    <group>
      <Box name="auto-lot" color={theme.lot} position={[0, -0.04, -0.35]} scale={[15.4, 0.08, 13.9]} />
      <HeroWashPlaza automatic theme={theme} />
      <Box name="auto-entry-road" color={theme.road} position={[0, 0.005, -5.85]} scale={[8.8, 0.05, 1.35]} />
      <Box name="auto-exit-road" color={theme.road} position={[0, 0.005, 5.28]} scale={[8.8, 0.05, 1.35]} />
      <Box name="auto-side-road" color={theme.road} position={[-6.3, 0.005, -0.1]} scale={[1.1, 0.05, 11.2]} />
      <LotRoadSurface theme={theme} automatic />
      <AutoCurbAppeal state={state} theme={theme} />
      <AutoFeatureDressing state={state} theme={theme} />
      <UpgradeRewardLayer automatic rewardIds={rewardIds} theme={theme} />
      <Box name="auto-building-pad" color={theme.pad} position={[0, 0.04, 0.2]} scale={[6.7, 0.09, 9.2]} />
      <Box name="auto-left-wall" color={theme.wall} position={[-3.45, 1.08, 0.2]} scale={[0.18, 2.16, 8.9]} />
      <Box name="auto-right-wall" color={theme.wall} position={[3.45, 1.08, 0.2]} scale={[0.18, 2.16, 8.9]} />
      <Box name="auto-back-header" color="#26323d" position={[0, 2.42, 4.58]} scale={[7.1, 0.3, 0.22]} />
      <Box name="auto-front-header" color="#26323d" position={[0, 2.42, -4.18]} scale={[7.1, 0.3, 0.22]} />
      <Box name="auto-roof-left" color="#93a6b3" position={[-2.18, 2.58, 0.2]} scale={[1.8, 0.14, 8.9]} />
      <Box name="auto-roof-right" color="#93a6b3" position={[2.18, 2.58, 0.2]} scale={[1.8, 0.14, 8.9]} />
      <Text color="#f8fafc" fontSize={0.24} position={[-2.6, 2.42, -4.35]}>
        AUTOMATIC EXPRESS
      </Text>
      <Text color="#22d3ee" fontSize={0.13} position={[1.25, 2.18, -4.34]}>
        {districtName.toUpperCase()}
      </Text>
      {CONVEYOR_X.map((x, index) => (
        <ConveyorLane key={x} x={x} index={index} clockSeconds={state.clockSeconds} />
      ))}
      <AutoPayKiosk onCollect={onCollect} active={cashBoxValue(totalCashBox(state.bays)) > 0 || state.collectRequired} />
      <AutoOffice state={state} onCollect={onCollect} />
      <RoadSign lit painted label="Beltline Express" theme={theme} />
      <EmployeeParking state={state} />
      {state.collectRequired && (state.lastReview?.autoCollected ?? 0) > 0 && <StaffCollectionMarker />}
      {hasReward(rewardIds, 'vacuum-island-pad') && <VacuumIsland automatic />}
    </group>
  )
}

function ConveyorLane({ x, index, clockSeconds }: { x: number; index: number; clockSeconds: number }) {
  return (
    <group position={[x, 0, 0.15]}>
      <Box name={`auto-lane-${index}-track`} color="#111827" position={[0, 0.12, 0.18]} scale={[0.44, 0.05, 7.2]} />
      <Box name={`auto-lane-${index}-yellow-guide`} color="#facc15" position={[0, 0.16, -0.15]} scale={[0.06, 0.026, 6.3]} />
      <Box name={`auto-lane-${index}-left-rail`} color="#334155" position={[-0.58, 0.22, 0.2]} scale={[0.08, 0.18, 7.4]} />
      <Box name={`auto-lane-${index}-right-rail`} color="#334155" position={[0.58, 0.22, 0.2]} scale={[0.08, 0.18, 7.4]} />
      {Array.from({ length: 6 }, (_, blockIndex) => (
        <Box
          color="#64748b"
          key={blockIndex}
          name={`auto-lane-${index}-conveyor-paddle-${blockIndex}`}
          position={[0, 0.2, -2.85 + ((clockSeconds * 0.82 + blockIndex * 1.18) % 7.0)]}
          scale={[0.56, 0.08, 0.12]}
        />
      ))}
      <AutoBrushSet x={0} z={-1.1} clockSeconds={clockSeconds} laneIndex={index} />
      <TransparentBox
        name={`auto-lane-${index}-foam-curtain`}
        color="#bae6fd"
        position={[0, 1.28, 0.72]}
        scale={[1.42, 1.7, 0.28]}
        opacity={0.34}
      />
      <Box name={`auto-lane-${index}-dryer-bar`} color="#0f766e" position={[0, 1.72, 2.7]} scale={[1.28, 0.22, 0.2]} />
      <Box name={`auto-lane-${index}-dryer-left`} color="#111827" position={[-0.36, 1.52, 2.62]} scale={[0.22, 0.28, 0.16]} />
      <Box name={`auto-lane-${index}-dryer-right`} color="#111827" position={[0.36, 1.52, 2.62]} scale={[0.22, 0.28, 0.16]} />
      <Text color="#111827" fontSize={0.09} position={[-0.62, 0.42, -3.55]} rotation={[-Math.PI / 2, 0, 0]}>
        TIRE PULL
      </Text>
    </group>
  )
}

function HeroWashPlaza({ automatic = false, theme }: { automatic?: boolean; theme: CityThemeSpec }) {
  const prefix = automatic ? 'auto-hero' : 'self-serve-hero'
  const label = automatic ? 'AUTOMATIC WASH CAMPUS' : 'SELF SERVE CAR WASH'
  const width = automatic ? 16.2 : 15.3
  const depth = automatic ? 14.6 : 14.0
  const entryZ = automatic ? -6.58 : -5.96
  const exitZ = automatic ? 6.2 : 5.06
  const curbColor = theme.id === 'snow' ? '#eef8fb' : '#d7d1c6'

  return (
    <group>
      <Box name={`${prefix}-campus-pad`} color={theme.pad} position={[0, -0.014, -0.34]} scale={[width, 0.045, depth]} />
      <Box name={`${prefix}-campus-inner`} color={theme.lot} position={[0, 0.012, -0.34]} scale={[width - 1.0, 0.036, depth - 1.0]} />
      <Box name={`${prefix}-front-curb`} color={curbColor} position={[0, 0.105, entryZ]} scale={[width, 0.14, 0.18]} />
      <Box name={`${prefix}-back-curb`} color={curbColor} position={[0, 0.105, exitZ]} scale={[width, 0.14, 0.18]} />
      <Box name={`${prefix}-left-curb`} color={curbColor} position={[-width / 2, 0.105, -0.34]} scale={[0.18, 0.14, depth]} />
      <Box name={`${prefix}-right-curb`} color={curbColor} position={[width / 2, 0.105, -0.34]} scale={[0.18, 0.14, depth]} />
      <Box name={`${prefix}-front-accent`} color={theme.accent} position={[0, 0.205, entryZ - 0.16]} scale={[width - 1.3, 0.07, 0.08]} />
      <Box name={`${prefix}-side-accent-left`} color={theme.trim} position={[-width / 2 + 0.22, 0.205, -0.34]} scale={[0.08, 0.07, depth - 1.2]} />
      <Box name={`${prefix}-side-accent-right`} color={theme.trim} position={[width / 2 - 0.22, 0.205, -0.34]} scale={[0.08, 0.07, depth - 1.2]} />
      <Text color="#f8fafc" fontSize={automatic ? 0.25 : 0.3} position={[-5.65, 0.13, entryZ - 0.52]} rotation={[-Math.PI / 2, 0, 0]}>
        {label}
      </Text>
      <LandscapeBed name={`${prefix}-landscape-left`} position={[-width / 2 + 1.0, 0, entryZ + 0.82]} scale={[0.95, 1, 0.72]} theme={theme} />
      <LandscapeBed name={`${prefix}-landscape-right`} position={[width / 2 - 1.0, 0, entryZ + 0.82]} scale={[0.95, 1, 0.72]} theme={theme} />
      <BollardRow name={`${prefix}-entry-bollards`} count={6} start={[-2.0, 0, entryZ + 0.22]} step={[0.8, 0, 0]} />
      {[
        [-width / 2 + 0.62, exitZ - 0.82],
        [width / 2 - 0.62, exitZ - 0.82],
        [-width / 2 + 0.62, entryZ + 1.55],
        [width / 2 - 0.62, entryZ + 1.55],
      ].map(([x, z], index) => (
        <group key={`${prefix}-campus-light-${index}`} position={[x, 0, z]}>
          <Box name={`${prefix}-campus-light-pole-${index}`} color="#26323d" position={[0, 0.78, 0]} scale={[0.06, 1.56, 0.06]} />
          <Box name={`${prefix}-campus-light-head-${index}`} color="#fde68a" position={[0, 1.58, 0]} scale={[0.26, 0.12, 0.26]} />
        </group>
      ))}
      {automatic ? (
        <Box name="auto-hero-queue-gate" color={theme.accent} position={[-4.2, 0.58, entryZ + 1.52]} scale={[1.2, 0.18, 0.12]} />
      ) : (
        <Box name="self-serve-hero-bay-menu-board" color="#0f172a" position={[-6.4, 0.92, -2.05]} scale={[0.12, 1.14, 0.78]} />
      )}
    </group>
  )
}

function LotRoadSurface({ theme, automatic = false }: { theme: CityThemeSpec; automatic?: boolean }) {
  const roadZs = automatic ? [-5.85, 5.28] : [-5.25, 4.25]
  const roadWidth = automatic ? 8.35 : 11.0
  const tireColor = theme.id === 'snow' ? '#3b4752' : '#151f28'

  return (
    <group>
      {roadZs.map((z, row) => (
        <group key={`lot-road-surface-${z}`}>
          <Box name={`lot-road-edge-${row}-north`} color="#f8fafc" position={[0, 0.052, z - 0.55]} scale={[roadWidth, 0.016, 0.035]} />
          <Box name={`lot-road-edge-${row}-south`} color="#f8fafc" position={[0, 0.052, z + 0.55]} scale={[roadWidth, 0.016, 0.035]} />
          <Box name={`lot-road-center-${row}`} color={theme.stripe} position={[0, 0.056, z]} scale={[roadWidth * 0.54, 0.018, 0.035]} />
          {[-2.9, 2.9].map((x, index) => (
            <RotBox
              color={tireColor}
              key={`lot-tire-sheen-${row}-${index}`}
              name={`lot-tire-sheen-${row}-${index}`}
              position={[x, 0.058, z + (index === 0 ? -0.16 : 0.18)]}
              rotationY={index === 0 ? -0.04 : 0.06}
              scale={[1.8, 0.012, 0.07]}
            />
          ))}
          <StormDrain position={[-roadWidth / 2 + 0.62, 0.063, z + 0.48]} />
          <StormDrain position={[roadWidth / 2 - 0.62, 0.063, z - 0.48]} />
        </group>
      ))}
      {automatic && (
        <>
          <Box name="auto-side-road-left-edge" color="#f8fafc" position={[-6.82, 0.052, -0.1]} scale={[0.035, 0.016, 10.55]} />
          <Box name="auto-side-road-right-edge" color="#f8fafc" position={[-5.78, 0.052, -0.1]} scale={[0.035, 0.016, 10.55]} />
          {Array.from({ length: 5 }, (_, index) => (
            <Box
              color={theme.stripe}
              key={`auto-side-road-center-${index}`}
              name={`auto-side-road-center-${index}`}
              position={[-6.3, 0.056, -4.4 + index * 2.15]}
              scale={[0.035, 0.018, 0.72]}
            />
          ))}
        </>
      )}
    </group>
  )
}

function LotPolishDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="front-concrete-apron" color="#b9b4aa" position={[0, 0.035, -4.1]} scale={[12.8, 0.045, 0.52]} />
      <Box name="rear-concrete-apron" color="#b9b4aa" position={[0, 0.035, 3.28]} scale={[12.8, 0.045, 0.52]} />
      <Box name="entry-curb-left" color="#d7d1c6" position={[-6.9, 0.12, -5.25]} scale={[0.18, 0.22, 1.42]} />
      <Box name="entry-curb-right" color="#d7d1c6" position={[6.9, 0.12, -5.25]} scale={[0.18, 0.22, 1.42]} />
      <Box name="exit-curb-left" color="#d7d1c6" position={[-6.9, 0.12, 4.25]} scale={[0.18, 0.22, 1.42]} />
      <Box name="exit-curb-right" color="#d7d1c6" position={[6.9, 0.12, 4.25]} scale={[0.18, 0.22, 1.42]} />
      {[-5.25, 4.25].map((z, row) => (
        <group key={`crosswalk-${z}`}>
          {Array.from({ length: 6 }, (_, index) => (
            <Box
              color="#f8fafc"
              key={index}
              name={`lot-crosswalk-${row}-${index}`}
              position={[-2.5 + index, 0.065, z]}
              scale={[0.46, 0.025, 0.78]}
            />
          ))}
        </group>
      ))}
      {[-6.0, 6.0].map((x, index) => (
        <group key={`lot-lamp-${index}`} position={[x, 0, index === 0 ? -3.95 : 3.35]}>
          <Box name={`lot-lamp-post-${index}`} color="#26323d" position={[0, 1.05, 0]} scale={[0.1, 2.1, 0.1]} />
          <Box name={`lot-lamp-head-${index}`} color="#fde68a" position={[0, 2.15, 0]} scale={[0.52, 0.12, 0.32]} />
          <TransparentBox name={`lot-lamp-glow-${index}`} color="#fde68a" position={[0, 1.65, 0]} scale={[1.2, 1.0, 1.2]} opacity={0.09} />
        </group>
      ))}
      {[[-6.4, -3.2], [6.4, -3.2], [-6.4, 2.9], [6.4, 2.9]].map(([x, z], index) => (
        <group key={`planter-${index}`} position={[x, 0, z]}>
          <Box name={`planter-box-${index}`} color="#6b5d51" position={[0, 0.18, 0]} scale={[0.62, 0.36, 0.42]} />
          <mesh position={[0, 0.52, 0]} castShadow>
            <sphereGeometry args={[0.28, 16, 10]} />
            <meshStandardMaterial color={theme.foliage} roughness={0.75} />
          </mesh>
        </group>
      ))}
      <Text color="#f8fafc" fontSize={0.16} position={[-5.55, 0.13, -4.1]} rotation={[-Math.PI / 2, 0, 0.18]}>
        ENTER
      </Text>
      <Text color="#f8fafc" fontSize={0.16} position={[5.55, 0.13, 3.25]} rotation={[-Math.PI / 2, 0, -0.16]}>
        EXIT
      </Text>
    </group>
  )
}

function PropertyCurbAppeal({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  const signFace = state.upgrades.paint ? theme.trim : '#0756a5'
  const signGlow = state.upgrades.signage || state.upgrades.securityLights

  return (
    <group>
      <Box name="front-sidewalk-band" color="#c9c4ba" position={[0, 0.07, -6.08]} scale={[13.75, 0.06, 0.42]} />
      <Box name="rear-sidewalk-band" color="#c9c4ba" position={[0, 0.07, 5.08]} scale={[13.75, 0.06, 0.38]} />
      <Box name="west-sidewalk-band" color="#c9c4ba" position={[-7.05, 0.07, -0.36]} scale={[0.38, 0.06, 10.7]} />
      <Box name="east-sidewalk-band" color="#c9c4ba" position={[7.05, 0.07, -0.36]} scale={[0.38, 0.06, 10.7]} />
      <Box name="front-landscape-curb" color="#e5e7eb" position={[0, 0.18, -6.38]} scale={[13.45, 0.18, 0.16]} />
      <Box name="rear-landscape-curb" color="#e5e7eb" position={[0, 0.18, 5.32]} scale={[13.45, 0.18, 0.14]} />
      <LandscapeBed name="front-left-bed" position={[-5.05, 0, -5.92]} scale={[2.6, 1, 0.62]} theme={theme} />
      <LandscapeBed name="front-right-bed" position={[4.75, 0, -5.92]} scale={[2.8, 1, 0.62]} theme={theme} />
      <LandscapeBed name="office-side-bed" position={[6.78, 0, 0.2]} scale={[0.62, 1, 2.8]} theme={theme} vertical />
      <LandscapeBed name="exit-flower-bed" position={[-5.15, 0, 4.88]} scale={[2.7, 1, 0.5]} theme={theme} />
      <PropertyMonumentSign label={state.locationName} faceColor={signFace} lit={signGlow} theme={theme} />
      <PriceReaderBoard cardReader={state.upgrades.cardReader} laserWash={state.upgrades.laserWash} />
      <PavementArrows bayCount={activeBayCount(state)} />
      <OfficeServiceYard state={state} theme={theme} />
      <BollardRow name="front-bollards-left" start={[-5.82, 0, -4.48]} count={4} step={[0.42, 0, 0]} />
      <BollardRow name="front-bollards-right" start={[4.72, 0, -4.48]} count={4} step={[0.42, 0, 0]} />
      <BollardRow name="office-bollards" start={[5.04, 0, 0.48]} count={4} step={[0, 0, 0.48]} />
      <ParkingStalls theme={theme} />
      <CustomerWaitingSpot theme={theme} />
    </group>
  )
}

/**
 * Restoration must be *seen*: run-down districts show stains, trash, and weeds;
 * highly restored districts earn planters and flags. (Art bible §10.2.)
 */
function RestorationDressing({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  const restoration = currentCityDistrict(state).restoration
  const bayXs = bayXPositions(activeBayCount(state))

  if (restoration <= 2) {
    const severity = 3 - restoration
    return (
      <group name="restoration-decay">
        {/* Everything sits on light, camera-facing surfaces: bay pad lips and sidewalk bands. */}
        <TransparentBox name="decay-oil-stain-1" color="#1c232a" position={[bayXs[0] ?? -2.8, 0.16, 2.35]} scale={[1.05, 0.02, 0.72]} opacity={0.5} />
        <TransparentBox name="decay-oil-stain-2" color="#232a30" position={[bayXs[bayXs.length - 1] ?? 2.8, 0.16, 2.5]} scale={[0.8, 0.02, 0.58]} opacity={0.45} />
        {severity >= 2 && (
          <>
            <TransparentBox name="decay-oil-stain-3" color="#1c232a" position={[-7.05, 0.115, 0.8]} scale={[0.5, 0.02, 1.0]} opacity={0.42} />
            <Box name="decay-trash-bag" color="#3f4a52" position={[-7.05, 0.24, 2.3]} scale={[0.34, 0.3, 0.32]} />
            <Box name="decay-trash-box" color="#8a6f4d" position={[4.2, 0.2, 5.1]} scale={[0.36, 0.24, 0.28]} />
            <Box name="decay-loose-litter" color="#b3ab9c" position={[1.2, 0.14, 5.08]} scale={[0.2, 0.05, 0.15]} />
          </>
        )}
        {severity >= 3 && (
          <>
            <Box name="decay-weed-1" color="#5a6b4e" position={[-7.05, 0.24, -1.2]} scale={[0.12, 0.34, 0.12]} />
            <Box name="decay-weed-2" color="#4c5c42" position={[-7.05, 0.2, 3.6]} scale={[0.11, 0.28, 0.11]} />
            <Box name="decay-weed-3" color="#5a6b4e" position={[5.8, 0.2, 5.1]} scale={[0.11, 0.3, 0.11]} />
            <Box name="decay-weed-4" color="#4c5c42" position={[0.4, 0.18, 5.08]} scale={[0.1, 0.24, 0.1]} />
            <TransparentBox name="decay-pad-crack" color="#111827" position={[bayXs[1] ?? 0, 0.155, 2.2]} scale={[1.4, 0.015, 0.09]} opacity={0.55} />
          </>
        )}
      </group>
    )
  }

  if (restoration >= 4) {
    return (
      <group name="restoration-premium">
        <PremiumPlanter name="premium-planter-exit-left" position={[-1.5, 0, 5.3]} theme={theme} />
        <PremiumPlanter name="premium-planter-exit-right" position={[1.5, 0, 5.3]} theme={theme} />
        <FlagPole name="premium-flag-west" position={[-6.55, 0, 5.35]} color={theme.accent} />
        <FlagPole name="premium-flag-east" position={[6.55, 0, 5.35]} color={theme.trim} />
        {restoration >= 5 && (
          <>
            <PremiumPlanter name="premium-planter-exit-far-left" position={[-3.6, 0, 5.3]} theme={theme} />
            <PremiumPlanter name="premium-planter-exit-far-right" position={[3.6, 0, 5.3]} theme={theme} />
            <FlagPole name="premium-flag-front-west" position={[-6.5, 0, -5.55]} color={theme.trim} />
            <FlagPole name="premium-flag-front-east" position={[6.5, 0, -5.55]} color={theme.accent} />
            <Box name="premium-exit-banner" color={theme.accent} position={[0, 2.96, 5.32]} scale={[6.0, 0.09, 0.06]} />
          </>
        )}
      </group>
    )
  }

  return null
}

function PremiumPlanter({ name, position, theme }: { name: string; position: Vec3; theme: CityThemeSpec }) {
  return (
    <group name={name} position={position}>
      <Box name={`${name}-box`} color="#8c7e62" position={[0, 0.16, 0]} scale={[0.6, 0.3, 0.6]} />
      <Box name={`${name}-soil`} color="#3d3a36" position={[0, 0.32, 0]} scale={[0.5, 0.05, 0.5]} />
      <Box name={`${name}-bush`} color="#3f6b46" position={[0, 0.52, 0]} scale={[0.4, 0.38, 0.4]} />
      <Box name={`${name}-bush-top`} color={theme.foliage ?? '#4d7a53'} position={[0, 0.74, 0]} scale={[0.26, 0.2, 0.26]} />
    </group>
  )
}

function FlagPole({ name, position, color }: { name: string; position: Vec3; color: string }) {
  return (
    <group name={name} position={position}>
      <Box name={`${name}-pole`} color="#8fa2ae" position={[0, 1.3, 0]} scale={[0.07, 2.6, 0.07]} />
      <Box name={`${name}-flag`} color={color} position={[0.32, 2.38, 0]} scale={[0.56, 0.3, 0.05]} />
    </group>
  )
}

function AutoCurbAppeal({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="auto-front-sidewalk" color="#c9c4ba" position={[0, 0.07, -6.72]} scale={[11.2, 0.06, 0.44]} />
      <Box name="auto-exit-sidewalk" color="#c9c4ba" position={[0, 0.07, 6.04]} scale={[11.2, 0.06, 0.44]} />
      <LandscapeBed name="auto-front-left-bed" position={[-4.7, 0, -6.35]} scale={[2.3, 1, 0.58]} theme={theme} />
      <LandscapeBed name="auto-front-right-bed" position={[4.7, 0, -6.35]} scale={[2.3, 1, 0.58]} theme={theme} />
      <BollardRow name="auto-kiosk-bollards" start={[-4.88, 0, -4.85]} count={4} step={[0.42, 0, 0]} />
      <Box name="auto-drive-thru-arch-pad" color="#111827" position={[0, 0.055, -4.82]} scale={[5.8, 0.04, 0.52]} />
      <Text color="#f8fafc" fontSize={0.16} position={[-1.9, 0.11, -4.83]} rotation={[-Math.PI / 2, 0, 0]}>
        EXPRESS ENTRY
      </Text>
      <PropertyMonumentSign label={state.locationName} faceColor={theme.trim} lit theme={theme} compact />
    </group>
  )
}

function WashFeatureDressing({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  const bayCount = activeBayCount(state)
  const restoration = state.cityMap.districts.find((item) => item.id === state.cityMap.currentCityId)?.restoration ?? 0
  const polish = Math.min(1, 0.22 + restoration * 0.12)
  const accent = state.upgrades.paint ? theme.trim : '#0f4f9c'

  return (
    <group>
      <Box name="wash-front-showcase-asphalt" color="#161d24" position={[0, 0.072, -5.34]} scale={[12.8, 0.035, 1.12]} />
      <Box name="wash-exit-showcase-asphalt" color="#1b232b" position={[0, 0.07, 4.25]} scale={[12.2, 0.035, 1.0]} />
      <Box name="wash-center-concrete-plaza" color="#d0cbc1" position={[0, 0.09, -3.62]} scale={[10.8, 0.04, 0.92]} />
      <Box name="wash-entry-blue-apron" color={accent} position={[0, 0.115, -4.72]} scale={[bayCount * 2.28, 0.035, 0.12]} />
      <Box name="wash-entry-yellow-stop" color="#facc15" position={[0, 0.13, -4.2]} scale={[bayCount * 2.0, 0.026, 0.09]} />
      <group name="wash-hero-front-sign" position={[0, 0, -3.35]}>
        <Box name="wash-hero-sign-backplate" color="#0f172a" position={[0, 2.98, 0]} scale={[5.6, 0.44, 0.12]} />
        <Box name="wash-hero-sign-trim" color={accent} position={[0, 3.25, -0.02]} scale={[5.85, 0.09, 0.16]} />
        <Text color="#f8fafc" fontSize={0.24} position={[-2.22, 3.0, -0.09]}>
          WASH EMPIRE
        </Text>
        <Text color={state.upgrades.signage ? '#fde68a' : '#b8c3cc'} fontSize={0.105} position={[1.52, 2.72, -0.1]}>
          SELF-SERVE BAYS
        </Text>
        {state.upgrades.signage && (
          <TransparentBox name="wash-hero-sign-light-wash" color="#fde68a" position={[0, 2.96, -0.16]} scale={[5.8, 0.72, 0.08]} opacity={0.12} />
        )}
      </group>
      <PremiumLandscapeCorner name="front-left-premium" position={[-5.45, 0, -4.22]} theme={theme} />
      <PremiumLandscapeCorner name="front-right-premium" position={[5.35, 0, -4.22]} theme={theme} mirrored />
      <PremiumLandscapeCorner name="exit-left-premium" position={[-5.35, 0, 3.55]} theme={theme} />
      <PremiumLandscapeCorner name="exit-right-premium" position={[5.35, 0, 3.55]} theme={theme} mirrored />
      <group name="wash-customer-waiting-lane" position={[-6.08, 0, -1.05]}>
        <Box name="waiting-lane-pavers" color="#c9c4ba" position={[0, 0.08, 0]} scale={[0.92, 0.04, 2.9]} />
        <Box name="waiting-lane-bench" color="#8b6f55" position={[0, 0.38, -0.78]} scale={[0.72, 0.12, 0.24]} />
        <Box name="waiting-lane-vending" color="#0f4f9c" position={[0.08, 0.55, 0.78]} scale={[0.36, 0.88, 0.28]} />
        <Box name="waiting-lane-vending-window" color="#22d3ee" position={[0.08, 0.72, 0.62]} scale={[0.24, 0.32, 0.04]} />
      </group>
      <group name="wash-detail-service-rack" position={[6.62, 0, 2.92]}>
        <Box name="detail-rack-base" color="#334155" position={[0, 0.48, 0]} scale={[0.72, 0.96, 0.24]} />
        <Box name="detail-rack-towels" color="#f8fafc" position={[-0.22, 0.88, -0.15]} scale={[0.22, 0.3, 0.04]} />
        <Box name="detail-rack-spray" color="#22c55e" position={[0.2, 0.74, -0.15]} scale={[0.14, 0.42, 0.04]} />
      </group>
      {state.upgrades.loyaltyApp && <Box name="loyalty-pickup-pavers" color="#10b981" position={[3.5, 0.1, -5.55]} scale={[1.1, 0.035, 0.18]} />}
      {state.upgrades.manager && <Box name="managed-office-awning" color="#22c55e" position={[6.3, 2.18, 0.38]} scale={[1.8, 0.12, 0.18]} />}
      {polish > 0.5 && <TransparentBox name="restored-lot-sheen" color="#ffffff" position={[0, 0.14, -0.2]} scale={[13.0, 0.02, 9.0]} opacity={0.035} />}
    </group>
  )
}

function AutoFeatureDressing({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="auto-premium-entry-lane" color="#111827" position={[0, 0.08, -5.92]} scale={[8.4, 0.04, 1.05]} />
      <Box name="auto-premium-exit-lane" color="#111827" position={[0, 0.08, 5.22]} scale={[8.4, 0.04, 1.05]} />
      <Box name="auto-queue-lit-curb" color={theme.accent} position={[0, 0.12, -6.42]} scale={[7.4, 0.035, 0.1]} />
      <Box name="auto-exit-lit-curb" color={theme.trim} position={[0, 0.12, 5.78]} scale={[7.4, 0.035, 0.1]} />
      <group name="auto-express-front-identity" position={[0, 0, -4.48]}>
        <Box name="auto-express-sign-panel" color="#0f172a" position={[0, 2.92, 0]} scale={[4.9, 0.42, 0.12]} />
        <Text color="#f8fafc" fontSize={0.22} position={[-1.86, 2.92, -0.09]}>
          WASH EMPIRE
        </Text>
        <Text color={theme.accent} fontSize={0.1} position={[1.36, 2.68, -0.1]}>
          AUTOMATIC TUNNEL
        </Text>
      </group>
      <PremiumLandscapeCorner name="auto-front-left-premium" position={[-4.95, 0, -5.52]} theme={theme} />
      <PremiumLandscapeCorner name="auto-front-right-premium" position={[4.95, 0, -5.52]} theme={theme} mirrored />
      {state.upgrades.securityLights && <TransparentBox name="auto-tunnel-light-glow" color="#fde68a" position={[0, 1.42, 0.32]} scale={[6.2, 2.0, 7.6]} opacity={0.08} />}
    </group>
  )
}

function PremiumLandscapeCorner({
  name,
  position,
  theme,
  mirrored = false,
}: {
  name: string
  position: Vec3
  theme: CityThemeSpec
  mirrored?: boolean
}) {
  const sign = mirrored ? -1 : 1

  return (
    <group name={name} position={position} rotation={[0, mirrored ? Math.PI : 0, 0]}>
      <Box name={`${name}-stone-bed`} color="#d7d1c6" position={[0, 0.13, 0]} scale={[1.52, 0.18, 0.52]} />
      <Box name={`${name}-mulch`} color="#4a3b2f" position={[0, 0.24, 0]} scale={[1.36, 0.08, 0.38]} />
      {[-0.46, 0.0, 0.42].map((x, index) => (
        <mesh key={`${name}-shrub-${index}`} position={[x, 0.48, 0.02]} castShadow>
          <sphereGeometry args={[0.18 + index * 0.015, 12, 8]} />
          <meshStandardMaterial color={index === 1 ? theme.foliage : '#2f6f3e'} roughness={0.78} />
        </mesh>
      ))}
      <Box name={`${name}-flower-band`} color={theme.accent} position={[0.28 * sign, 0.5, -0.22]} scale={[0.42, 0.07, 0.08]} />
      <Box name={`${name}-bollard-a`} color="#facc15" position={[-0.86 * sign, 0.36, -0.06]} scale={[0.1, 0.72, 0.1]} />
      <Box name={`${name}-bollard-b`} color="#facc15" position={[-1.12 * sign, 0.36, -0.06]} scale={[0.1, 0.72, 0.1]} />
    </group>
  )
}

function PropertyMonumentSign({
  label,
  faceColor,
  lit,
  theme,
  compact = false,
}: {
  label: string
  faceColor: string
  lit: boolean
  theme: CityThemeSpec
  compact?: boolean
}) {
  const signLabel = label.length > 18 ? `${label.slice(0, 17)}...` : label
  return (
    <group position={compact ? [-5.35, 0, -6.25] : [-2.48, 0, -6.08]}>
      <Box name="monument-stone-base" color="#d7d1c6" position={[0, 0.28, 0]} scale={[compact ? 1.55 : 2.35, 0.56, 0.32]} />
      <Box name="monument-sign-face" color={faceColor} position={[0, 0.72, -0.03]} scale={[compact ? 1.32 : 2.05, 0.58, 0.14]} />
      <Box name="monument-trim-top" color={theme.accent} position={[0, 1.05, -0.04]} scale={[compact ? 1.44 : 2.22, 0.08, 0.16]} />
      <Text color="#f8fafc" fontSize={compact ? 0.08 : 0.105} position={[compact ? -0.52 : -0.86, 0.72, -0.13]}>
        {signLabel.toUpperCase()}
      </Text>
      {lit && (
        <>
          <Box name="monument-sign-light" color="#fde68a" position={[0, 1.18, -0.12]} scale={[compact ? 1.1 : 1.8, 0.06, 0.05]} />
          <TransparentBox name="monument-sign-glow" color="#fde68a" position={[0, 0.82, -0.2]} scale={[compact ? 1.45 : 2.25, 0.72, 0.08]} opacity={0.14} />
        </>
      )}
    </group>
  )
}

function PriceReaderBoard({ cardReader, laserWash }: { cardReader: boolean; laserWash: boolean }) {
  return (
    <group position={[2.42, 0, -6.1]}>
      <Box name="price-board-post-left" color="#26323d" position={[-0.54, 0.62, 0]} scale={[0.08, 1.24, 0.08]} />
      <Box name="price-board-post-right" color="#26323d" position={[0.54, 0.62, 0]} scale={[0.08, 1.24, 0.08]} />
      <Box name="price-board-face" color="#0f172a" position={[0, 1.05, -0.03]} scale={[1.45, 0.92, 0.12]} />
      <Text color="#22d3ee" fontSize={0.09} position={[-0.46, 1.28, -0.12]}>
        SELF SERVE
      </Text>
      <Text color="#f8fafc" fontSize={0.12} position={[-0.42, 1.05, -0.12]}>
        $6 START
      </Text>
      <Text color={cardReader ? '#22c55e' : '#facc15'} fontSize={0.065} position={[-0.46, 0.84, -0.12]}>
        {cardReader ? 'CARD READY' : 'COINS + TOKENS'}
      </Text>
      {laserWash && (
        <Text color="#f472b6" fontSize={0.06} position={[-0.45, 0.68, -0.12]}>
          TOUCH-FREE BAY
        </Text>
      )}
    </group>
  )
}

function PavementArrows({ bayCount }: { bayCount: number }) {
  return (
    <group>
      {bayXPositions(bayCount).map((x, index) => (
        <group key={`pavement-arrow-${index}`} position={[x, 0, -4.35]}>
          <Box name={`queue-arrow-shaft-${index}`} color="#f8fafc" position={[0, 0.08, 0]} scale={[0.08, 0.025, 0.72]} />
          <Box name={`queue-arrow-head-${index}`} color="#f8fafc" position={[0, 0.08, 0.44]} rotation={[0, Math.PI / 4, 0]} scale={[0.34, 0.025, 0.34]} />
          <Text color="#f8fafc" fontSize={0.11} position={[-0.38, 0.09, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
            BAY {index + 1}
          </Text>
        </group>
      ))}
      <Text color="#f8fafc" fontSize={0.18} position={[-5.68, 0.09, -5.62]} rotation={[-Math.PI / 2, 0, 0]}>
        ENTRANCE
      </Text>
      <Text color="#f8fafc" fontSize={0.18} position={[5.3, 0.09, 4.28]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        EXIT
      </Text>
    </group>
  )
}

function OfficeServiceYard({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="office-service-pad" color="#5b554f" position={[5.95, 0.065, 4.68]} scale={[2.25, 0.045, 0.78]} />
      <Box name="utility-screen-wall" color={theme.wall} position={[4.92, 0.6, 4.82]} scale={[0.12, 1.1, 0.72]} />
      <Box name="utility-screen-back" color={theme.wall} position={[5.95, 0.6, 5.22]} scale={[2.05, 1.1, 0.12]} />
      <Box name="dumpster-bin" color="#166534" position={[5.62, 0.42, 4.62]} scale={[0.72, 0.66, 0.46]} />
      <Box name="dumpster-lid" color="#052e16" position={[5.62, 0.8, 4.56]} scale={[0.78, 0.08, 0.5]} />
      <Box name="utility-meter" color="#64748b" position={[6.52, 0.72, 4.62]} scale={[0.4, 0.82, 0.2]} />
      <Box name="supply-rack" color="#26323d" position={[6.2, 0.5, 5.04]} scale={[0.72, 0.64, 0.18]} />
      {state.upgrades.securityLights && <TransparentBox name="service-yard-light" color="#fde68a" position={[5.9, 1.14, 4.58]} scale={[1.8, 0.6, 0.5]} opacity={0.12} />}
    </group>
  )
}

function UpgradeRewardLayer({
  rewardIds,
  theme,
  automatic = false,
}: {
  rewardIds: readonly EnvironmentRewardVisualId[]
  theme: CityThemeSpec
  automatic?: boolean
}) {
  return (
    <group>
      {hasReward(rewardIds, 'fresh-paint-curbs') && <PaintRewardProps theme={theme} automatic={automatic} />}
      {hasReward(rewardIds, 'lit-road-sign') && <SignageRewardProps theme={theme} automatic={automatic} />}
      {hasReward(rewardIds, 'camera-warning-decals') && <CameraRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'parking-light-poles') && <SecurityLightRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'security-gate-arm') && <SecurityGateRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'tap-to-pay-window-decal') && <PaymentRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'loyalty-window-decal') && <LoyaltyRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'office-open-sign') && <ManagerRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'staff-training-board') && <ManagerStaffingRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'staff-break-canopy') && <StaffBreakCanopyRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'mobile-campaign-billboard') && <MobileCampaignRewardProps automatic={automatic} />}
      {hasReward(rewardIds, 'laser-menu-board') && <LaserRewardProps automatic={automatic} />}
    </group>
  )
}

function SignageRewardProps({ theme, automatic }: { theme: CityThemeSpec; automatic: boolean }) {
  const signPosition: Vec3 = automatic ? [-5.35, 1.12, -6.25] : [-6.0, 1.26, -4.95]
  const topperZ = automatic ? -6.72 : -6.08

  return (
    <group>
      <group name="lit-road-sign" position={signPosition}>
        <TransparentBox name="lit-road-sign-glow" color="#fde68a" position={[0, 0.18, -0.16]} scale={[2.38, 0.86, 0.1]} opacity={0.2} />
        <Box name="lit-road-sign-footlight" color="#fde68a" position={[0, -0.42, -0.08]} scale={[1.64, 0.06, 0.05]} />
      </group>
      <group name="directional-sign-toppers">
        {[
          { label: 'BAYS', x: -4.7, arrowX: 0.32 },
          { label: 'EXIT', x: 4.55, arrowX: -0.32 },
        ].map((sign, index) => (
          <group key={`directional-topper-${sign.label}`} position={[sign.x, 0, topperZ]}>
            <Box name={`directional-sign-post-${index}`} color="#26323d" position={[0, 0.42, 0]} scale={[0.06, 0.84, 0.06]} />
            <Box name={`directional-sign-face-${index}`} color={theme.trim} position={[0, 0.86, -0.03]} scale={[0.78, 0.26, 0.06]} />
            <Box
              name={`directional-sign-arrow-${index}`}
              color="#f8fafc"
              position={[sign.arrowX, 0.86, -0.07]}
              rotation={[0, 0, Math.PI / 4]}
              scale={[0.18, 0.08, 0.035]}
            />
            <Text color="#f8fafc" fontSize={0.055} position={[-0.3, 0.86, -0.09]}>
              {sign.label}
            </Text>
          </group>
        ))}
      </group>
    </group>
  )
}

function PaintRewardProps({ theme, automatic }: { theme: CityThemeSpec; automatic: boolean }) {
  const frontZ = automatic ? -6.96 : -6.42
  const rearZ = automatic ? 6.32 : 5.36
  const paintX = automatic ? 4.75 : 5.14
  const paintZ = automatic ? 4.62 : 4.18

  return (
    <group>
      <group name="fresh-paint-curbs">
        <Box name="fresh-paint-curb-front" color={theme.trim} position={[0, 0.25, frontZ]} scale={[automatic ? 10.9 : 13.1, 0.08, 0.08]} />
        <Box name="fresh-paint-curb-rear" color={theme.trim} position={[0, 0.24, rearZ]} scale={[automatic ? 10.6 : 13.0, 0.08, 0.08]} />
      </group>
      <group name="paint-supply-cans" position={[paintX, 0, paintZ]}>
        {['#0284c7', theme.trim, '#e5e7eb'].map((color, index) => (
          <mesh key={`paint-can-${index}`} position={[index * 0.18, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.28, 12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        ))}
        <Box name="paint-drop-cloth" color="#e8e0d0" position={[0.18, 0.04, 0.16]} scale={[0.74, 0.035, 0.36]} />
      </group>
    </group>
  )
}

function CameraRewardProps({ automatic }: { automatic: boolean }) {
  const warningPosition: Vec3 = automatic ? [-4.42, 1.55, -4.36] : [-5.42, 1.35, -3.98]
  const monitorPosition: Vec3 = automatic ? [6.0, 1.25, 1.92] : [6.6, 1.25, 1.86]
  const cameraPositions: Vec3[] = automatic
    ? [
        [-3.52, 2.24, -4.2],
        [3.52, 2.24, 4.08],
      ]
    : [
        [-5.72, 2.22, -2.94],
        [5.72, 2.22, 2.7],
      ]

  return (
    <group>
      <group name="bay-security-cameras">
        {cameraPositions.map((position, index) => (
          <group key={`reward-camera-${index}`} position={position} rotation={[0, index === 0 ? 0.28 : -0.28, 0]}>
            <Box name={`reward-camera-arm-${index}`} color="#26323d" position={[0, 0, 0]} scale={[0.42, 0.06, 0.06]} />
            <Box name={`reward-camera-body-${index}`} color="#111827" position={[0.26, -0.04, 0]} scale={[0.2, 0.13, 0.16]} />
            <mesh position={[0.39, -0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.052, 0.052, 0.08, 18]} />
              <meshStandardMaterial color="#020617" roughness={0.42} />
            </mesh>
          </group>
        ))}
      </group>
      <group name="camera-warning-decals" position={warningPosition}>
        <Box name="camera-warning-sign" color="#facc15" position={[0, 0, 0]} scale={[0.68, 0.26, 0.05]} />
        <Text color="#111827" fontSize={0.045} position={[-0.26, -0.01, -0.04]}>
          CAMERAS
        </Text>
      </group>
      <group name="office-security-monitor" position={monitorPosition}>
        <Box name="security-monitor-case" color="#111827" position={[0, 0, 0]} scale={[0.36, 0.22, 0.05]} />
        <Box name="security-monitor-glow" color="#22d3ee" position={[0, 0, -0.04]} scale={[0.28, 0.14, 0.02]} />
      </group>
    </group>
  )
}

function SecurityLightRewardProps({ automatic }: { automatic: boolean }) {
  const positions: Vec3[] = automatic
    ? [
        [-5.85, 0, -5.95],
        [5.85, 0, -5.95],
        [-5.85, 0, 5.5],
        [5.85, 0, 5.5],
      ]
    : [
        [-6.34, 0, -4.86],
        [6.34, 0, -4.86],
        [-6.34, 0, 4.42],
        [6.34, 0, 4.42],
      ]

  return (
    <group>
      <group name="bay-light-bars">
        <Box
          name="bay-light-bar-entry"
          color="#fde68a"
          position={[0, 2.32, automatic ? -4.24 : -2.74]}
          scale={[automatic ? 6.8 : 10.4, 0.06, 0.08]}
        />
        <Box
          name="bay-light-bar-exit"
          color="#fde68a"
          position={[0, 2.24, automatic ? 4.54 : 2.44]}
          scale={[automatic ? 6.8 : 10.4, 0.05, 0.08]}
        />
      </group>
      {positions.map((position, index) => (
        <group name="parking-light-poles" key={`security-light-${index}`} position={position}>
          <Box name={`security-light-pole-${index}`} color="#26323d" position={[0, 1.04, 0]} scale={[0.08, 2.08, 0.08]} />
          <Box name={`security-light-head-${index}`} color="#fde68a" position={[0.18, 2.12, 0]} scale={[0.42, 0.12, 0.18]} />
          <TransparentBox name={`security-light-cones-${index}`} color="#fde68a" position={[0.14, 1.2, 0]} scale={[1.3, 1.8, 0.82]} opacity={0.1} />
        </group>
      ))}
    </group>
  )
}

function PaymentRewardProps({ automatic }: { automatic: boolean }) {
  const officePosition: Vec3 = automatic ? [5.4, 1.54, 0.42] : [6.82, 1.58, 0.72]
  const readerZ = automatic ? -5.22 : -4.62

  return (
    <group>
      <group name="bay-card-readers">
        {[-0.68, 0, 0.68].map((x, index) => (
          <group key={`card-reader-stand-${index}`} position={[x, 0, readerZ]}>
            <Box name={`reader-stand-post-${index}`} color="#334155" position={[0, 0.4, 0]} scale={[0.055, 0.8, 0.055]} />
            <Box name={`reader-stand-face-${index}`} color="#0f172a" position={[0, 0.86, -0.03]} scale={[0.24, 0.34, 0.06]} />
            <Box name={`reader-stand-light-${index}`} color="#22c55e" position={[0, 0.98, -0.075]} scale={[0.13, 0.05, 0.02]} />
          </group>
        ))}
      </group>
      <group name="tap-to-pay-window-decal" position={officePosition}>
        <Box name="tap-decal-card" color="#22c55e" position={[0, 0, 0]} scale={[0.38, 0.22, 0.04]} />
        <Text color="#052e16" fontSize={0.045} position={[-0.13, -0.01, -0.035]}>
          TAP
        </Text>
      </group>
      <group name="price-board-card-ready" position={[automatic ? 1.9 : 2.95, 1.42, automatic ? -6.34 : -6.18]}>
        <Box name="price-board-card-badge" color="#22c55e" position={[0, 0, 0]} scale={[0.52, 0.16, 0.04]} />
        <Text color="#052e16" fontSize={0.04} position={[-0.2, 0, -0.035]}>
          CARD
        </Text>
      </group>
    </group>
  )
}

function SecurityGateRewardProps({ automatic }: { automatic: boolean }) {
  const gatePosition: Vec3 = automatic ? [-4.42, 0, -6.3] : [-5.05, 0, -5.68]
  const kioskOffset: Vec3 = automatic ? [0.92, 0, 0.54] : [1.08, 0, 0.5]

  return (
    <group name="security-gate-arm" position={gatePosition}>
      <Box name="security-gate-pad" color="#4b5563" position={[0, 0.06, 0]} scale={[2.22, 0.08, 0.78]} />
      <Box name="security-gate-kiosk-base" color="#111827" position={[-0.88, 0.44, -0.06]} scale={[0.32, 0.88, 0.32]} />
      <Box name="security-gate-kiosk-light" color="#22c55e" position={[-0.88, 0.88, -0.24]} scale={[0.14, 0.08, 0.04]} />
      <Box name="security-gate-barrier-post" color="#26323d" position={[0.76, 0.58, 0]} scale={[0.1, 1.16, 0.1]} />
      <Box name="security-gate-barrier-arm" color="#f8fafc" position={[-0.14, 1.06, 0]} scale={[1.9, 0.08, 0.1]} />
      <Box name="security-gate-barrier-stripe-a" color="#dc2626" position={[-0.64, 1.12, 0]} scale={[0.3, 0.03, 0.12]} />
      <Box name="security-gate-barrier-stripe-b" color="#dc2626" position={[0.04, 1.12, 0]} scale={[0.3, 0.03, 0.12]} />
      <group position={kioskOffset}>
        <Box name="security-gate-camera-post" color="#26323d" position={[0, 0.62, 0]} scale={[0.06, 1.24, 0.06]} />
        <Box name="security-gate-camera-head" color="#0f172a" position={[0.12, 1.16, -0.08]} scale={[0.22, 0.12, 0.18]} />
      </group>
    </group>
  )
}

function LoyaltyRewardProps({ automatic }: { automatic: boolean }) {
  const decalPosition: Vec3 = automatic ? [5.92, 1.48, 0.48] : [6.84, 1.38, 1.0]
  const signPosition: Vec3 = automatic ? [3.75, 0, -6.28] : [3.92, 0, -5.8]
  const phonePosition: Vec3 = automatic ? [2.94, 0, -6.2] : [3.16, 0, -5.72]

  return (
    <group>
      <group name="loyalty-window-decal" position={decalPosition}>
        <Box name="loyalty-decal-paper" color="#e8e0d0" position={[0, 0, 0]} scale={[0.34, 0.34, 0.04]} />
        <Box name="loyalty-qr-ink" color="#111827" position={[0.02, 0, -0.035]} scale={[0.18, 0.18, 0.02]} />
      </group>
      <group name="perk-pickup-sign" position={signPosition}>
        <Box name="perk-sign-post" color="#26323d" position={[0, 0.45, 0]} scale={[0.06, 0.9, 0.06]} />
        <Box name="perk-sign-face" color="#10b981" position={[0, 0.92, -0.03]} scale={[0.78, 0.28, 0.06]} />
        <Text color="#f8fafc" fontSize={0.06} position={[-0.28, 0.92, -0.08]}>
          PERKS
        </Text>
      </group>
      <group name="phone-coupon-stand" position={phonePosition}>
        <Box name="coupon-stand-pole" color="#334155" position={[0, 0.42, 0]} scale={[0.06, 0.84, 0.06]} />
        <Box name="coupon-phone-screen" color="#0f172a" position={[0, 0.93, -0.04]} scale={[0.28, 0.46, 0.06]} />
        <Box name="coupon-phone-glow" color="#22d3ee" position={[0, 0.94, -0.08]} scale={[0.2, 0.32, 0.02]} />
      </group>
    </group>
  )
}

function ManagerRewardProps({ automatic }: { automatic: boolean }) {
  const signPosition: Vec3 = automatic ? [5.54, 1.86, 0.66] : [6.34, 1.84, 0.42]
  const deskPosition: Vec3 = automatic ? [5.3, 1.2, 2.18] : [5.82, 1.18, 2.22]

  return (
    <group>
      <group name="office-open-sign" position={signPosition}>
        <Box name="open-sign-face" color="#22c55e" position={[0, 0, 0]} scale={[0.44, 0.16, 0.04]} />
        <Text color="#052e16" fontSize={0.045} position={[-0.16, 0, -0.035]}>
          OPEN
        </Text>
      </group>
      <group name="manager-desk-light" position={deskPosition}>
        <Box name="desk-lamp-stand" color="#111827" position={[0, -0.18, 0]} scale={[0.05, 0.36, 0.05]} />
        <Box name="desk-lamp-glow" color="#fde68a" position={[0.12, 0.04, -0.02]} scale={[0.24, 0.1, 0.16]} />
      </group>
      <group name="staff-clipboard" position={[deskPosition[0] + 0.34, deskPosition[1] - 0.36, deskPosition[2] - 0.12]}>
        <Box name="clipboard-paper" color="#e8e0d0" position={[0, 0, 0]} scale={[0.24, 0.04, 0.32]} />
        <Box name="clipboard-clip" color="#64748b" position={[0, 0.04, -0.13]} scale={[0.16, 0.04, 0.04]} />
      </group>
    </group>
  )
}

function ManagerStaffingRewardProps({ automatic }: { automatic: boolean }) {
  const boardPosition: Vec3 = automatic ? [6.18, 0, 3.58] : [6.66, 0, 3.72]
  const signPosition: Vec3 = automatic ? [4.86, 0, 4.9] : [5.34, 0, 4.76]

  return (
    <group>
      <group name="staff-training-board" position={boardPosition}>
        <Box name="staff-training-board-post-left" color="#26323d" position={[-0.3, 0.66, 0]} scale={[0.06, 1.32, 0.06]} />
        <Box name="staff-training-board-post-right" color="#26323d" position={[0.3, 0.66, 0]} scale={[0.06, 1.32, 0.06]} />
        <Box name="staff-training-board-face" color="#0f4f9c" position={[0, 1.12, -0.04]} scale={[1.05, 0.56, 0.08]} />
        <Text color="#f8fafc" fontSize={0.06} position={[-0.35, 1.18, -0.1]}>
          STAFF TRAINING
        </Text>
        <Text color="#fde68a" fontSize={0.05} position={[-0.31, 1.0, -0.1]}>
          NOW HIRING
        </Text>
      </group>
      <group name="manager-parking-sign" position={signPosition}>
        <Box name="manager-parking-sign-post" color="#334155" position={[0, 0.44, 0]} scale={[0.06, 0.88, 0.06]} />
        <Box name="manager-parking-sign-face" color="#22c55e" position={[0, 0.84, -0.03]} scale={[0.72, 0.3, 0.06]} />
        <Text color="#052e16" fontSize={0.055} position={[-0.26, 0.84, -0.08]}>
          STAFF
        </Text>
      </group>
    </group>
  )
}

function StaffBreakCanopyRewardProps({ automatic }: { automatic: boolean }) {
  const canopyPosition: Vec3 = automatic ? [4.88, 0, 3.98] : [5.28, 0, 4.16]

  return (
    <group name="staff-break-canopy" position={canopyPosition}>
      <Box name="staff-break-pad" color="#6b7280" position={[0, 0.06, 0]} scale={[1.12, 0.08, 0.88]} />
      <Box name="staff-break-post-left" color="#26323d" position={[-0.42, 0.58, -0.3]} scale={[0.06, 1.16, 0.06]} />
      <Box name="staff-break-post-right" color="#26323d" position={[0.42, 0.58, -0.3]} scale={[0.06, 1.16, 0.06]} />
      <Box name="staff-break-canopy-roof" color="#0f4f9c" position={[0, 1.2, -0.18]} scale={[1.18, 0.12, 0.72]} />
      <Box name="staff-break-bench-base" color="#7c2d12" position={[0, 0.36, 0.18]} scale={[0.76, 0.08, 0.22]} />
      <Box name="staff-break-bench-seat" color="#ea580c" position={[0, 0.47, 0.18]} scale={[0.82, 0.08, 0.26]} />
      <Text color="#f8fafc" fontSize={0.05} position={[-0.36, 1.22, -0.54]}>
        CREW REST
      </Text>
    </group>
  )
}

function MobileCampaignRewardProps({ automatic }: { automatic: boolean }) {
  const boardPosition: Vec3 = automatic ? [-2.4, 0, -7.14] : [-2.8, 0, -6.58]
  const placardZ = automatic ? -6.88 : -6.32

  return (
    <group>
      <group name="mobile-campaign-billboard" position={boardPosition}>
        <Box name="mobile-billboard-post-left" color="#26323d" position={[-0.52, 0.78, 0]} scale={[0.08, 1.56, 0.08]} />
        <Box name="mobile-billboard-post-right" color="#26323d" position={[0.52, 0.78, 0]} scale={[0.08, 1.56, 0.08]} />
        <Box name="mobile-billboard-face" color="#0f4f9c" position={[0, 1.42, -0.04]} scale={[1.44, 0.58, 0.08]} />
        <Text color="#f8fafc" fontSize={0.08} position={[-0.5, 1.45, -0.1]}>
          WASH DEALS
        </Text>
      </group>
      <group name="phone-ad-placards">
        {[-0.56, 0, 0.56].map((x, index) => (
          <group key={`phone-ad-${index}`} position={[boardPosition[0] + x, 0, placardZ]}>
            <Box name={`phone-ad-stand-${index}`} color="#334155" position={[0, 0.3, 0]} scale={[0.05, 0.6, 0.05]} />
            <Box name={`phone-ad-card-${index}`} color={index === 1 ? '#22d3ee' : '#e8e0d0'} position={[0, 0.68, -0.02]} scale={[0.22, 0.34, 0.04]} />
          </group>
        ))}
      </group>
      <group name="roadside-coupon-banner" position={[boardPosition[0] + 1.42, 0, placardZ]}>
        <Box name="coupon-banner-face" color="#facc15" position={[0, 0.78, 0]} scale={[0.88, 0.22, 0.04]} />
        <Text color="#111827" fontSize={0.052} position={[-0.34, 0.78, -0.035]}>
          COUPON
        </Text>
      </group>
    </group>
  )
}

function LaserRewardProps({ automatic }: { automatic: boolean }) {
  const boardPosition: Vec3 = automatic ? [-3.44, 0, -5.52] : [5.92, 0, -1.75]
  const markingZ = automatic ? -4.92 : -1.22

  return (
    <group>
      <group name="laser-menu-board" position={boardPosition}>
        <Box name="laser-menu-post" color="#26323d" position={[0, 0.58, 0]} scale={[0.08, 1.16, 0.08]} />
        <Box name="laser-menu-face" color="#111827" position={[0, 1.08, -0.03]} scale={[0.82, 0.52, 0.06]} />
        <Text color="#f472b6" fontSize={0.06} position={[-0.3, 1.16, -0.08]}>
          LASER
        </Text>
        <Text color="#22d3ee" fontSize={0.05} position={[-0.26, 0.96, -0.08]}>
          $9+
        </Text>
      </group>
      <group name="laser-queue-markings">
        {[0, 1, 2].map((index) => (
          <Box
            color={index % 2 === 0 ? '#f472b6' : '#22d3ee'}
            key={`laser-mark-${index}`}
            name={`laser-queue-marking-${index}`}
            position={[boardPosition[0] + index * 0.42 - 0.42, 0.1, markingZ]}
            scale={[0.24, 0.025, 0.08]}
          />
        ))}
      </group>
    </group>
  )
}

function hasReward(rewardIds: readonly EnvironmentRewardVisualId[], visualId: EnvironmentRewardVisualId): boolean {
  return rewardIds.includes(visualId)
}

function ParkingStalls({ theme }: { theme: CityThemeSpec }) {
  return (
    <group position={[6.0, 0, -4.0]}>
      <Box name="customer-parking-asphalt" color={theme.road} position={[0, 0.035, 0]} scale={[2.35, 0.04, 1.28]} />
      {[-0.78, 0, 0.78].map((x, index) => (
        <Box
          color="#f8fafc"
          key={`parking-stripe-${index}`}
          name={`parking-stripe-${index}`}
          position={[x, 0.065, 0]}
          scale={[0.05, 0.025, 1.04]}
        />
      ))}
      <Text color="#f8fafc" fontSize={0.09} position={[-0.96, 0.08, 0.46]} rotation={[-Math.PI / 2, 0, 0]}>
        PARK
      </Text>
    </group>
  )
}

function CustomerWaitingSpot({ theme }: { theme: CityThemeSpec }) {
  return (
    <group position={[-6.32, 0, 2.92]}>
      <Box name="waiting-spot-pad" color="#c9c4ba" position={[0, 0.055, 0]} scale={[1.08, 0.05, 1.08]} />
      <Box name="waiting-bench-seat" color="#8b6f55" position={[0, 0.38, 0]} scale={[0.82, 0.12, 0.26]} />
      <Box name="waiting-bench-back" color="#8b6f55" position={[0, 0.62, 0.13]} scale={[0.82, 0.32, 0.08]} />
      <Box name="trash-can" color="#334155" position={[0.56, 0.32, -0.34]} scale={[0.22, 0.5, 0.22]} />
      <mesh position={[-0.42, 0.3, -0.38]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.48, 12]} />
        <meshStandardMaterial color={theme.foliage} roughness={0.75} />
      </mesh>
    </group>
  )
}

function LandscapeBed({
  name,
  position,
  scale,
  theme,
  vertical = false,
}: {
  name: string
  position: Vec3
  scale: Vec3
  theme: CityThemeSpec
  vertical?: boolean
}) {
  const shrubs: Array<[number, number]> = [
    [-0.36, -0.18],
    [0, 0.12],
    [0.38, -0.08],
    [-0.08, -0.24],
  ]

  return (
    <group position={position} scale={scale}>
      <Box name={`${name}-mulch`} color="#514235" position={[0, 0.085, 0]} scale={[1, 0.06, 1]} />
      <Box name={`${name}-curb-front`} color="#d7d1c6" position={[0, 0.16, -0.5]} scale={[1.06, 0.16, 0.08]} />
      <Box name={`${name}-curb-back`} color="#d7d1c6" position={[0, 0.16, 0.5]} scale={[1.06, 0.16, 0.08]} />
      <Box name={`${name}-curb-left`} color="#d7d1c6" position={[-0.53, 0.16, 0]} scale={[0.08, 0.16, 1.0]} />
      <Box name={`${name}-curb-right`} color="#d7d1c6" position={[0.53, 0.16, 0]} scale={[0.08, 0.16, 1.0]} />
      {shrubs.map(([x, z], index) => (
        <group key={`${name}-shrub-${index}`} position={vertical ? [z, 0, x] : [x, 0, z]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.13 + (index % 2) * 0.035, 12, 8]} />
            <meshStandardMaterial color={index % 2 === 0 ? theme.foliage : '#2f6f3e'} roughness={0.82} />
          </mesh>
          <Box name={`${name}-flower-${index}`} color={index % 2 === 0 ? theme.accent : '#facc15'} position={[0.07, 0.43, -0.04]} scale={[0.06, 0.06, 0.06]} />
        </group>
      ))}
    </group>
  )
}

function BollardRow({
  name,
  start,
  count,
  step,
}: {
  name: string
  start: Vec3
  count: number
  step: Vec3
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <group key={`${name}-${index}`} position={[start[0] + step[0] * index, start[1], start[2] + step[2] * index]}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.72, 16]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
          <Box name={`${name}-stripe-${index}`} color="#111827" position={[0, 0.5, 0]} scale={[0.18, 0.06, 0.18]} />
        </group>
      ))}
    </group>
  )
}

function AutoBrushSet({
  x,
  z,
  clockSeconds,
  laneIndex,
}: {
  x: number
  z: number
  clockSeconds: number
  laneIndex: number
}) {
  return (
    <group position={[x, 0, z]}>
      {[-0.54, 0.54].map((brushX, index) => (
        <mesh
          key={brushX}
          position={[brushX, 0.98, 0]}
          rotation={[clockSeconds * 3.2 + index + laneIndex, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.22, 1.5, 18]} />
          <meshStandardMaterial color={index === 0 ? '#0891b2' : '#f97316'} roughness={0.48} />
        </mesh>
      ))}
      <Box name={`auto-brush-crossbar-${laneIndex}`} color="#26323d" position={[0, 1.76, 0]} scale={[1.65, 0.13, 0.16]} />
    </group>
  )
}

function AutoPayKiosk({ active, onCollect }: { active: boolean; onCollect: () => void }) {
  return (
    <group position={[-4.45, 0, -3.95]}>
      <Box name="auto-kiosk-base" color="#334155" position={[0, 0.52, 0]} scale={[0.7, 1.04, 0.52]} />
      <mesh name="auto-kiosk-pay-face" position={[0, 1.04, -0.29]} scale={[0.54, 0.44, 0.06]} onClick={onCollect} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={active ? '#facc15' : '#0756a5'}
          emissive={active ? '#7c2d12' : '#000000'}
          emissiveIntensity={active ? 0.15 : 0}
          roughness={0.45}
        />
      </mesh>
      <Box name="auto-kiosk-screen" color="#22d3ee" position={[0, 1.18, -0.34]} scale={[0.36, 0.12, 0.04]} />
      <Text color="#f8fafc" fontSize={0.08} position={[-0.25, 1.52, -0.32]}>
        TAP / CASH
      </Text>
    </group>
  )
}

function AutoOffice({ state, onCollect }: { state: GameState; onCollect: () => void }) {
  const depositActive = cashBoxValue(totalCashBox(state.bays)) > 0 || state.collectRequired

  return (
    <group position={[5.65, 0, 1.85]}>
      <Box name="auto-office-floor" color="#b9b4aa" position={[0, 0.04, 0]} scale={[2.35, 0.08, 2.8]} />
      <Box name="auto-office-back" color="#d9d3c8" position={[0, 1.0, 1.35]} scale={[2.35, 2.0, 0.16]} />
      <Box name="auto-office-left" color="#d9d3c8" position={[-1.1, 1.0, 0]} scale={[0.16, 2.0, 2.8]} />
      <Box name="auto-office-counter" color="#6b5d51" position={[0, 0.58, 0.72]} scale={[1.55, 0.68, 0.46]} />
      <mesh name="auto-office-safe" position={[0.52, 0.78, 0.28]} scale={[0.42, 0.4, 0.14]} onClick={onCollect} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={depositActive ? '#facc15' : '#334155'}
          emissive={depositActive ? '#7c2d12' : '#000000'}
          emissiveIntensity={depositActive ? 0.16 : 0}
          roughness={0.45}
        />
      </mesh>
      <Text color="#22c55e" fontSize={0.09} position={[-0.42, 1.05, 0.28]}>
        AUTO PAYOUT
      </Text>
    </group>
  )
}

function FloatingCity({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  const activeCity = currentCityDefinition(state)
  const positions: Vec3[] = [
    [-21.2, 0, -12.4],
    [20.9, 0, -12.0],
    [-21.0, 0, 12.95],
    [21.4, 0, 12.6],
    [0, 0, 16.25],
  ]

  return (
    <group>
      <Box name="city-mat" color={theme.ground} position={[0, -0.34, -0.3]} scale={[57.8, 0.22, 40.5]} />
      <Box name="city-mat-shadow" color={theme.underside} position={[0, -0.58, -0.3]} scale={[56.8, 0.18, 39.4]} />
      <DioramaBaseFrame theme={theme} />
      <RegionalGroundPlan theme={theme} />
      <CityRoadNetwork theme={theme} />
      <CityLandmarks theme={theme} />
      <TycoonCityDiorama theme={theme} />
      <Text color="#e0f2fe" fontSize={0.28} position={[-3.0, 0.12, -18.1]} rotation={[-Math.PI / 2, 0, 0]}>
        {activeCity.name.toUpperCase()}
      </Text>
      <Text color={theme.accent} fontSize={0.18} position={[9.4, 0.12, -18.1]} rotation={[-Math.PI / 2, 0, 0]}>
        {theme.label.toUpperCase()}
      </Text>
      {cityDefinitions.map((city, index) => {
        const district = state.cityMap.districts.find((item) => item.id === city.id)
        return (
          <CityDistrictIsland
            active={state.cityMap.currentCityId === city.id}
            city={city}
            district={district}
            key={city.id}
            position={positions[index] ?? [0, 0, 0]}
            theme={themeFor(city)}
          />
        )
      })}
    </group>
  )
}

function DioramaBaseFrame({ theme }: { theme: CityThemeSpec }) {
  const rim = theme.id === 'snow' ? '#dbeafe' : theme.id === 'downtown' ? '#2f3a42' : '#3f4b3f'
  const trim = theme.id === 'smallTown' ? '#d6b35f' : theme.accent

  return (
    <group>
      <Box name="diorama-rim-north" color={rim} position={[0, -0.08, -20.78]} scale={[58.9, 0.32, 0.72]} />
      <Box name="diorama-rim-south" color={rim} position={[0, -0.08, 20.18]} scale={[58.9, 0.32, 0.72]} />
      <Box name="diorama-rim-west" color={rim} position={[-29.2, -0.08, -0.3]} scale={[0.72, 0.32, 41.0]} />
      <Box name="diorama-rim-east" color={rim} position={[29.2, -0.08, -0.3]} scale={[0.72, 0.32, 41.0]} />
      <Box name="diorama-trim-north" color={trim} position={[0, 0.09, -20.28]} scale={[55.2, 0.05, 0.08]} />
      <Box name="diorama-trim-south" color={trim} position={[0, 0.09, 19.68]} scale={[55.2, 0.05, 0.08]} />
      <Box name="diorama-trim-west" color={trim} position={[-28.7, 0.09, -0.3]} scale={[0.08, 0.05, 37.6]} />
      <Box name="diorama-trim-east" color={trim} position={[28.7, 0.09, -0.3]} scale={[0.08, 0.05, 37.6]} />
      {[
        [-29.2, -20.78],
        [29.2, -20.78],
        [-29.2, 20.18],
        [29.2, 20.18],
      ].map(([x, z], index) => (
        <RoadDisc color={rim} key={`diorama-foot-${index}`} name={`diorama-foot-${index}`} position={[x, 0.0, z]} radius={0.86} />
      ))}
      <Box name="diorama-front-title-plate" color="#0f172a" position={[0, 0.16, 19.35]} scale={[9.6, 0.08, 0.42]} />
      <Text color="#f8fafc" fontSize={0.24} position={[-4.2, 0.24, 19.12]} rotation={[-Math.PI / 2, 0, 0]}>
        MOBILE TYCOON DIORAMA
      </Text>
    </group>
  )
}

function TycoonCityDiorama({ theme }: { theme: CityThemeSpec }) {
  const labels = dioramaLabelsForTheme(theme)

  return (
    <group>
      <DioramaStorefrontStrip labels={labels.north} name="north-frontage" position={[0, -0.02, -14.85]} theme={theme} />
      <DioramaStorefrontStrip labels={labels.south} name="south-frontage" position={[0, -0.02, 14.25]} rotationY={Math.PI} theme={theme} />
      <DioramaStorefrontStrip labels={labels.west} name="west-frontage" position={[-23.4, -0.02, -0.25]} rotationY={Math.PI / 2} theme={theme} />
      <DioramaStorefrontStrip labels={labels.east} name="east-frontage" position={[23.4, -0.02, -0.25]} rotationY={-Math.PI / 2} theme={theme} />
      <DioramaThemeAnchor theme={theme} />
      <DioramaMedianParks theme={theme} />
      <DioramaStreetLightGrid theme={theme} />
    </group>
  )
}

function dioramaLabelsForTheme(theme: CityThemeSpec): {
  north: string[]
  south: string[]
  west: string[]
  east: string[]
} {
  if (theme.id === 'downtown') {
    return {
      north: ['METRO', 'RAMEN', 'ARCADE', 'LOFTS'],
      south: ['BOUTIQUE', 'PARKING', 'GYM', 'CAFE'],
      west: ['BANK', 'HOTEL', 'CLINIC'],
      east: ['MARKET', 'BAR', 'STUDIO'],
    }
  }

  if (theme.id === 'snow') {
    return {
      north: ['LODGE', 'GEAR', 'COCOA', 'TUNE'],
      south: ['CHAINS', 'INN', 'SKI SHOP', 'CAFE'],
      west: ['PLOW', 'FUEL', 'RENTAL'],
      east: ['CABINS', 'CLINIC', 'MARKET'],
    }
  }

  if (theme.id === 'harbor') {
    return {
      north: ['FISH', 'PIER MART', 'CAFE', 'MARINA'],
      south: ['BAIT', 'DOCKS', 'TACOS', 'MOTEL'],
      west: ['FERRY', 'ICE', 'SUPPLY'],
      east: ['BOATS', 'MARKET', 'HOTEL'],
    }
  }

  if (theme.id === 'beltline') {
    return {
      north: ['LOGIX', 'FLEET', 'PARTS', 'GRILL'],
      south: ['TIRE', 'MOTEL', 'STORAGE', 'DIESEL'],
      west: ['DEPOT', 'LEASE', 'TOOLS'],
      east: ['AUTO', 'WARE', 'TRUCK'],
    }
  }

  return {
    north: ['DINER', 'PHARMACY', 'PARTS', 'BANK'],
    south: ['MART', 'MOTEL', 'COFFEE', 'SALON'],
    west: ['LIBRARY', 'HARDWARE', 'CLINIC'],
    east: ['PIZZA', 'MARKET', 'GARAGE'],
  }
}

function DioramaStorefrontStrip({
  labels,
  name,
  position,
  rotationY = 0,
  theme,
}: {
  labels: string[]
  name: string
  position: Vec3
  rotationY?: number
  theme: CityThemeSpec
}) {
  const offsetStart = -(labels.length - 1) * 1.15

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`${name}-frontage-sidewalk`} color={theme.id === 'snow' ? '#eef8fb' : '#b8b2a7'} position={[0, 0.015, -0.92]} scale={[labels.length * 2.42, 0.05, 0.38]} />
      <Box name={`${name}-frontage-curb`} color={theme.trim} position={[0, 0.09, -1.16]} scale={[labels.length * 2.34, 0.08, 0.08]} />
      {labels.map((label, index) => (
        <DioramaShop
          key={`${name}-${label}`}
          color={theme.blockTones[index % theme.blockTones.length]}
          label={label}
          name={`${name}-${index}`}
          position={[offsetStart + index * 2.3, 0, 0]}
          theme={theme}
        />
      ))}
    </group>
  )
}

function DioramaShop({
  color,
  label,
  name,
  position,
  theme,
}: {
  color: string
  label: string
  name: string
  position: Vec3
  theme: CityThemeSpec
}) {
  const safeLabel = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <group position={position}>
      <Box name={`${name}-${safeLabel}-shop-lot`} color={theme.lot} position={[0, 0.0, 0.14]} scale={[1.92, 0.05, 1.38]} />
      <Box name={`${name}-${safeLabel}-shop-body`} color={color} position={[0, 0.48, 0.2]} scale={[1.36, 0.96, 0.78]} />
      <Box name={`${name}-${safeLabel}-shop-roof`} color="#26323d" position={[0, 1.04, 0.2]} scale={[1.52, 0.16, 0.92]} />
      <Box name={`${name}-${safeLabel}-shop-awning`} color={theme.accent} position={[0, 0.72, -0.26]} scale={[1.42, 0.14, 0.14]} />
      <Box name={`${name}-${safeLabel}-shop-door`} color="#0f172a" position={[-0.46, 0.34, -0.24]} scale={[0.25, 0.58, 0.06]} />
      <Box name={`${name}-${safeLabel}-shop-window-a`} color="#bae6fd" position={[0.02, 0.44, -0.24]} scale={[0.3, 0.28, 0.05]} />
      <Box name={`${name}-${safeLabel}-shop-window-b`} color="#bae6fd" position={[0.42, 0.44, -0.24]} scale={[0.3, 0.28, 0.05]} />
      <Box name={`${name}-${safeLabel}-shop-sign-chip`} color={theme.trim} position={[-0.48, 0.73, -0.34]} scale={[0.42, 0.08, 0.04]} />
    </group>
  )
}

function DioramaThemeAnchor({ theme }: { theme: CityThemeSpec }) {
  if (theme.id === 'downtown') {
    return (
      <group>
        <DioramaTowerBlock name="downtown-north-towers" position={[-13.2, -0.02, -13.2]} theme={theme} />
        <DioramaTowerBlock name="downtown-east-towers" position={[17.6, -0.02, 11.6]} theme={theme} />
        <Box name="downtown-neon-plaza" color="#2d2431" position={[15.8, -0.02, -13.55]} scale={[5.2, 0.05, 1.5]} />
        <Box name="downtown-neon-plaza-pink" color="#f472b6" position={[15.8, 0.06, -14.14]} scale={[4.6, 0.06, 0.08]} />
        <Box name="downtown-neon-plaza-cyan" color="#22d3ee" position={[15.8, 0.06, -12.96]} scale={[4.6, 0.06, 0.08]} />
      </group>
    )
  }

  if (theme.id === 'snow') {
    return (
      <group>
        <Box name="snow-town-lodge-base" color="#c4a77f" position={[-13.5, 0.52, 12.4]} scale={[3.3, 1.04, 1.5]} />
        <RotBox name="snow-town-lodge-roof" color="#334155" position={[-13.5, 1.2, 12.4]} rotationY={0.78} scale={[2.55, 0.28, 1.45]} />
        <Text color="#f8fafc" fontSize={0.12} position={[-14.72, 0.72, 11.58]}>
          WARM LODGE
        </Text>
        <EvergreenCluster name="snow-town-evergreens-a" position={[18.6, -0.02, 11.8]} theme={theme} />
        <EvergreenCluster name="snow-town-evergreens-b" position={[18.8, -0.02, -12.2]} theme={theme} />
        <Box name="snow-sculpted-bank-front" color="#f8fafc" position={[0, -0.01, -12.15]} scale={[6.8, 0.06, 0.34]} />
        <Box name="snow-sculpted-bank-back" color="#f8fafc" position={[0, -0.01, 12.05]} scale={[6.8, 0.06, 0.34]} />
      </group>
    )
  }

  if (theme.id === 'harbor') {
    return (
      <group>
        <Box name="harbor-diorama-canal" color={theme.water} position={[-24.2, -0.06, -0.4]} scale={[1.2, 0.06, 22.4]} />
        <Box name="harbor-diorama-boardwalk" color="#8b6f55" position={[-22.75, 0.02, -0.4]} scale={[0.42, 0.06, 21.4]} />
        <ContainerStack position={[-18.8, -0.01, 12.2]} theme={theme} />
        <ContainerStack position={[18.8, -0.01, -12.2]} theme={theme} />
        <Box name="harbor-ferry-terminal" color="#d7d1c6" position={[17.4, 0.5, 12.25]} scale={[2.35, 1.0, 1.1]} />
        <Box name="harbor-ferry-roof" color={theme.trim} position={[17.4, 1.08, 12.25]} scale={[2.52, 0.18, 1.24]} />
      </group>
    )
  }

  if (theme.id === 'beltline') {
    return (
      <group>
        <Box name="beltline-showroom-pad" color="#4b5563" position={[-15.9, -0.01, 12.55]} scale={[5.0, 0.05, 1.8]} />
        <Box name="beltline-showroom" color="#c9c4ba" position={[-15.9, 0.48, 12.7]} scale={[2.9, 0.96, 1.0]} />
        <Box name="beltline-showroom-roof" color={theme.trim} position={[-15.9, 1.04, 12.7]} scale={[3.1, 0.16, 1.16]} />
        <Box name="beltline-fleet-yard" color="#4f4a45" position={[15.4, -0.01, -12.5]} scale={[5.2, 0.05, 1.82]} />
        {[0, 1, 2, 3].map((index) => (
          <Box
            color={index % 2 === 0 ? '#f8fafc' : theme.accent}
            key={`beltline-fleet-van-${index}`}
            name={`beltline-fleet-van-${index}`}
            position={[13.8 + index * 0.78, 0.24, -12.5]}
            scale={[0.52, 0.32, 0.7]}
          />
        ))}
        <DioramaTowerBlock compact name="beltline-industrial-stack-row" position={[20.2, -0.02, 2.0]} theme={theme} />
      </group>
    )
  }

  return (
    <group>
      <Box name="smalltown-town-square" color={theme.park} position={[13.2, -0.02, -12.6]} scale={[4.8, 0.05, 1.9]} />
      <Box name="smalltown-gazebo-base" color="#f8fafc" position={[13.2, 0.16, -12.6]} scale={[0.92, 0.16, 0.92]} />
      <mesh name="smalltown-gazebo-roof" position={[13.2, 0.62, -12.6]} castShadow>
        <coneGeometry args={[0.72, 0.5, 6]} />
        <meshStandardMaterial color={theme.trim} roughness={0.58} metalness={0.02} />
      </mesh>
      <Box name="smalltown-water-tower-ring" color="#d6b35f" position={[-18.8, 0.02, 12.4]} scale={[3.8, 0.05, 1.7]} />
      <WaterTower position={[-18.8, -0.02, 12.4]} color={theme.trim} />
      <NeighborhoodHomes position={[18.4, -0.02, 12.2]} theme={theme} />
      <NeighborhoodHomes mirrored position={[-18.4, -0.02, -12.3]} theme={theme} />
    </group>
  )
}

function DioramaTowerBlock({
  compact = false,
  name,
  position,
  theme,
}: {
  compact?: boolean
  name: string
  position: Vec3
  theme: CityThemeSpec
}) {
  const count = compact ? 5 : 8

  return (
    <group position={position}>
      <Box name={`${name}-plaza`} color={theme.lot} position={[0, 0, 0]} scale={[compact ? 3.0 : 4.7, 0.05, compact ? 1.5 : 2.2]} />
      {Array.from({ length: count }, (_, index) => {
        const col = index % 4
        const row = Math.floor(index / 4)
        const height = (compact ? 0.75 : 1.05) + (index % 4) * 0.32
        return (
          <group key={`${name}-tower-${index}`} position={[-1.55 + col * 1.02, 0, -0.46 + row * 0.92]}>
            <Box name={`${name}-tower-body-${index}`} color={index % 2 === 0 ? theme.skylineA : theme.skylineB} position={[0, height / 2, 0]} scale={[0.62, height, 0.54]} />
            <Box name={`${name}-tower-cap-${index}`} color={theme.accent} position={[0, height + 0.06, 0]} scale={[0.68, 0.08, 0.6]} />
            {[0.32, 0.62, 0.92].map((y, windowIndex) => (
              <Box
                color="#bae6fd"
                key={`${name}-window-${index}-${windowIndex}`}
                name={`${name}-tower-window-${index}-${windowIndex}`}
                position={[-0.02, y, -0.29]}
                scale={[0.38, 0.06, 0.035]}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function EvergreenCluster({ name, position, theme }: { name: string; position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      {[
        [-0.75, 0, -0.32],
        [-0.18, 0, 0.28],
        [0.48, 0, -0.12],
        [0.92, 0, 0.42],
      ].map(([x, y, z], index) => (
        <group key={`${name}-${index}`} position={[x, y, z] as Vec3}>
          <Box name={`${name}-trunk-${index}`} color="#704f34" position={[0, 0.2, 0]} scale={[0.12, 0.4, 0.12]} />
          <mesh position={[0, 0.72, 0]} castShadow>
            <coneGeometry args={[0.42, 0.96, 10]} />
            <meshStandardMaterial color={theme.foliage} roughness={0.68} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function DioramaMedianParks({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="diorama-median-park-left" color={theme.park} position={[-6.1, -0.035, -12.4]} scale={[3.1, 0.05, 1.0]} />
      <Box name="diorama-median-park-right" color={theme.park} position={[6.1, -0.035, 12.0]} scale={[3.1, 0.05, 1.0]} />
      <EvergreenCluster name="diorama-park-left-trees" position={[-6.1, -0.02, -12.4]} theme={theme} />
      <EvergreenCluster name="diorama-park-right-trees" position={[6.1, -0.02, 12.0]} theme={theme} />
      <Box name="diorama-park-bench-left" color="#8b6f55" position={[-5.2, 0.18, -12.72]} scale={[0.64, 0.12, 0.18]} />
      <Box name="diorama-park-bench-right" color="#8b6f55" position={[5.2, 0.18, 11.68]} scale={[0.64, 0.12, 0.18]} />
    </group>
  )
}

function DioramaStreetLightGrid({ theme }: { theme: CityThemeSpec }) {
  const lightColor = theme.id === 'downtown' ? '#fef3c7' : theme.id === 'snow' ? '#e0f2fe' : '#fde68a'
  const positions: Array<[number, number]> = [
    [-13.5, -8.9],
    [13.5, -8.9],
    [-13.5, 8.0],
    [13.5, 8.0],
    [-23.9, -13.5],
    [23.9, 13.0],
  ]

  return (
    <group>
      {positions.map(([x, z], index) => (
        <group key={`diorama-light-${index}`} position={[x, 0, z]}>
          <Box name={`diorama-light-pole-${index}`} color="#26323d" position={[0, 0.78, 0]} scale={[0.06, 1.56, 0.06]} />
          <Box name={`diorama-light-arm-${index}`} color="#26323d" position={[0.28, 1.5, 0]} scale={[0.56, 0.06, 0.06]} />
          <Box name={`diorama-light-glow-${index}`} color={lightColor} position={[0.58, 1.48, 0]} scale={[0.22, 0.12, 0.22]} />
        </group>
      ))}
    </group>
  )
}

function ServiceTraffic({ state, theme }: { state: GameState; theme: CityThemeSpec }) {
  const lowCondition = state.bays.some((bay) => bay.condition < 0.72)
  const staffVehicleActive = state.employees.cashRunner || state.employees.nightManager || state.collectRequired
  const maintenanceActive = state.employees.bayTech || lowCondition
  const responseActive = theme.id === 'downtown' || theme.id === 'beltline' || state.weekDriveBys > 8

  return (
    <group>
      {SERVICE_VEHICLES.filter((vehicle) => {
        if (vehicle.kind === 'cash') return staffVehicleActive
        if (vehicle.kind === 'maintenance') return maintenanceActive
        return responseActive
      }).map((vehicle) => (
        <ServiceVehicle key={vehicle.id} clockSeconds={state.clockSeconds} config={vehicle} />
      ))}
    </group>
  )
}

function ServiceVehicle({
  clockSeconds,
  config,
}: {
  clockSeconds: number
  config: ServiceVehicleConfig
}) {
  const cycle = ((clockSeconds + config.offsetSeconds) % config.periodSeconds) / config.periodSeconds
  if (cycle > 0.9) return null

  const pose = poseFromPath(config.route, ease(cycle / 0.9))
  const pulse = Math.sin(clockSeconds * 8.5 + config.offsetSeconds) > 0

  return (
    <group position={pose.position} rotation={[0, pose.rotationY, 0]}>
      <Box name={`${config.id}-shadow`} color="#111827" position={[0, 0.11, 0]} scale={[0.98, 0.04, 1.82]} />
      <Box name={`${config.id}-chassis`} color="#111827" position={[0, 0.25, 0]} scale={[0.92, 0.12, 1.58]} />
      <Box name={`${config.id}-body`} color={config.color} position={[0, 0.44, 0.08]} scale={[0.86, 0.38, 1.28]} />
      <Box name={`${config.id}-cab`} color={config.color} position={[0, 0.58, -0.46]} scale={[0.72, 0.36, 0.46]} />
      <Box name={`${config.id}-windshield`} color="#0f172a" position={[0, 0.74, -0.72]} scale={[0.52, 0.05, 0.12]} />
      <Box name={`${config.id}-stripe`} color={config.accent} position={[0, 0.49, -0.08]} scale={[0.9, 0.06, 1.12]} />
      {config.kind === 'cash' && (
        <Box name={`${config.id}-vault-box`} color="#166534" position={[0, 0.68, 0.36]} scale={[0.46, 0.32, 0.44]} />
      )}
      {config.kind === 'maintenance' && (
        <>
          <Box name={`${config.id}-ladder`} color="#dbe4ea" position={[0, 0.78, 0.18]} scale={[0.66, 0.06, 1.12]} />
          <Box name={`${config.id}-tool-rack`} color="#334155" position={[0.36, 0.62, 0.38]} scale={[0.12, 0.32, 0.54]} />
        </>
      )}
      {config.kind === 'response' && (
        <>
          <Box name={`${config.id}-red-light`} color={pulse ? '#ef4444' : '#7f1d1d'} position={[-0.18, 0.86, -0.22]} scale={[0.16, 0.06, 0.12]} />
          <Box name={`${config.id}-blue-light`} color={pulse ? '#2563eb' : '#1e3a8a'} position={[0.18, 0.86, -0.22]} scale={[0.16, 0.06, 0.12]} />
          <TransparentBox
            name={`${config.id}-light-wash`}
            color={pulse ? '#bfdbfe' : '#fecaca'}
            opacity={0.16}
            position={[0, 0.54, -0.8]}
            scale={[1.14, 0.08, 0.18]}
          />
        </>
      )}
      <Wheel x={-0.5} z={-0.5} />
      <Wheel x={0.5} z={-0.5} />
      <Wheel x={-0.5} z={0.48} />
      <Wheel x={0.5} z={0.48} />
    </group>
  )
}

function RegionalGroundPlan({ theme }: { theme: CityThemeSpec }) {
  const zones = regionZonesForTheme(theme)
  const labels = regionLabelsForTheme(theme)

  return (
    <group>
      {zones.map((zone, index) => (
        <Box
          color={zone.color}
          key={`${zone.name}-${index}`}
          name={`regional-zone-${theme.id}-${zone.name}`}
          position={zone.position}
          scale={zone.scale}
        />
      ))}
      <DistrictParcelGrid theme={theme} />
      <RegionalInfrastructure theme={theme} />
      {labels.map((label) => (
        <Text
          color={label.color}
          fontSize={label.size}
          key={label.text}
          position={label.position}
          rotation={[-Math.PI / 2, 0, label.rotationY]}
        >
          {label.text}
        </Text>
      ))}
    </group>
  )
}

function regionZonesForTheme(
  theme: CityThemeSpec,
): Array<{ name: string; color: string; position: Vec3; scale: Vec3 }> {
  if (theme.id === 'harbor') {
    return [
      { name: 'working-waterfront', color: '#386f7c', position: [-20.9, -0.218, -0.3], scale: [7.6, 0.045, 34.0] },
      { name: 'dockyards', color: '#5f6f71', position: [-11.5, -0.216, 0.15], scale: [7.0, 0.045, 30.0] },
      { name: 'harbor-apartments', color: '#74887d', position: [8.4, -0.216, 11.9], scale: [15.2, 0.045, 8.2] },
      { name: 'market-strip', color: '#77746a', position: [8.2, -0.216, -10.4], scale: [15.6, 0.045, 9.0] },
      { name: 'service-yard', color: '#636a66', position: [20.7, -0.216, -0.1], scale: [6.9, 0.045, 28.8] },
    ]
  }

  if (theme.id === 'downtown') {
    return [
      { name: 'core', color: '#515a63', position: [0, -0.216, -0.2], scale: [15.4, 0.045, 18.8] },
      { name: 'uptown-grid', color: '#5c6671', position: [-17.8, -0.216, -10.5], scale: [13.8, 0.045, 10.8] },
      { name: 'warehouse-edge', color: '#4f585f', position: [17.8, -0.216, 10.4], scale: [13.8, 0.045, 10.8] },
      { name: 'neighborhood-west', color: '#596f5a', position: [-18.1, -0.216, 9.4], scale: [12.8, 0.045, 11.0] },
      { name: 'night-market', color: '#635569', position: [18.2, -0.216, -9.8], scale: [12.8, 0.045, 11.0] },
    ]
  }

  if (theme.id === 'snow') {
    return [
      { name: 'snowfield-west', color: '#edf5f7', position: [-20.1, -0.216, -1.0], scale: [9.0, 0.045, 30.5] },
      { name: 'resort-row', color: '#cfdcd8', position: [0, -0.216, -11.8], scale: [22.5, 0.045, 8.8] },
      { name: 'service-village', color: '#c7d4d2', position: [0, -0.216, 10.8], scale: [22.5, 0.045, 9.0] },
      { name: 'tree-belt', color: '#b9d0c2', position: [20.4, -0.216, -0.4], scale: [8.4, 0.045, 31.4] },
      { name: 'ice-pond-zone', color: '#d8edf4', position: [11.6, -0.215, -1.0], scale: [4.5, 0.045, 11.4] },
    ]
  }

  if (theme.id === 'beltline') {
    return [
      { name: 'logistics-west', color: '#555d5b', position: [-18.6, -0.216, -0.2], scale: [13.2, 0.045, 28.8] },
      { name: 'commuter-commercial', color: '#66665c', position: [0, -0.216, -11.6], scale: [20.5, 0.045, 8.6] },
      { name: 'fleet-yards', color: '#575250', position: [0, -0.216, 10.8], scale: [21.0, 0.045, 9.0] },
      { name: 'industrial-east', color: '#4d5558', position: [18.9, -0.216, -0.1], scale: [13.0, 0.045, 29.0] },
      { name: 'green-buffer', color: '#506544', position: [0, -0.215, -0.25], scale: [7.2, 0.045, 11.6] },
    ]
  }

  return [
    { name: 'old-town', color: '#78865f', position: [-18.0, -0.216, -10.4], scale: [13.5, 0.045, 10.7] },
    { name: 'commercial-strip', color: '#736f64', position: [0, -0.216, -10.55], scale: [18.4, 0.045, 8.5] },
    { name: 'neighborhood-east', color: '#71825e', position: [18.2, -0.216, 9.3], scale: [13.2, 0.045, 11.5] },
    { name: 'service-quarter', color: '#686457', position: [-18.3, -0.216, 8.8], scale: [13.2, 0.045, 12.0] },
    { name: 'civic-green', color: '#5e794d', position: [8.6, -0.216, 0.2], scale: [9.2, 0.045, 11.5] },
  ]
}

function regionLabelsForTheme(
  theme: CityThemeSpec,
): Array<{ text: string; color: string; position: Vec3; rotationY: number; size: number }> {
  if (theme.id === 'harbor') {
    return [
      { text: 'DOCKSIDE', color: '#dff5f4', position: [-20.6, -0.02, -14.2], rotationY: Math.PI / 2, size: 0.2 },
      { text: 'MARKET ROW', color: '#e0f2fe', position: [7.4, -0.02, -14.2], rotationY: 0, size: 0.18 },
      { text: 'APARTMENTS', color: '#e0f2fe', position: [7.6, -0.02, 13.9], rotationY: 0, size: 0.17 },
    ]
  }

  if (theme.id === 'downtown') {
    return [
      { text: 'CITY CORE', color: '#e0f2fe', position: [-3.7, -0.02, -14.2], rotationY: 0, size: 0.2 },
      { text: 'METRO', color: theme.accent, position: [11.3, -0.02, -11.7], rotationY: 0, size: 0.18 },
      { text: 'NIGHT MARKET', color: '#fce7f3', position: [17.4, -0.02, -14.2], rotationY: 0, size: 0.16 },
    ]
  }

  if (theme.id === 'snow') {
    return [
      { text: 'RESORT ROUTE', color: '#075985', position: [-5.2, -0.02, -14.1], rotationY: 0, size: 0.19 },
      { text: 'PLOW YARD', color: '#075985', position: [17.5, -0.02, -4.2], rotationY: Math.PI / 2, size: 0.16 },
      { text: 'LODGE ROW', color: '#075985', position: [-18.6, -0.02, 14.0], rotationY: 0, size: 0.16 },
    ]
  }

  if (theme.id === 'beltline') {
    return [
      { text: 'BELTLINE', color: '#fde68a', position: [-5.2, -0.02, -14.35], rotationY: 0, size: 0.2 },
      { text: 'FLEET DISTRICT', color: '#e0f2fe', position: [-20.1, -0.02, 8.4], rotationY: Math.PI / 2, size: 0.16 },
      { text: 'LOGISTICS', color: '#fed7aa', position: [18.3, -0.02, -6.8], rotationY: Math.PI / 2, size: 0.17 },
    ]
  }

  return [
    { text: 'OLD TOWN', color: '#f8fafc', position: [-20.1, -0.02, -14.1], rotationY: 0, size: 0.18 },
    { text: 'MAIN STRIP', color: '#fde68a', position: [-3.8, -0.02, -14.1], rotationY: 0, size: 0.18 },
    { text: 'CIVIC GREEN', color: '#f8fafc', position: [11.7, -0.02, 4.2], rotationY: Math.PI / 2, size: 0.16 },
  ]
}

function DistrictParcelGrid({ theme }: { theme: CityThemeSpec }) {
  const lineColor = theme.id === 'snow' ? '#cad8d7' : '#63705b'
  const verticals = [-18.2, 0, 18.2]
  const horizontals = [-12.6, 0.2, 12.6]

  return (
    <group>
      {verticals.map((x) => (
        <Box
          color={lineColor}
          key={`parcel-v-${x}`}
          name={`parcel-v-${theme.id}-${x}`}
          position={[x, -0.188, -0.35]}
          scale={[0.035, 0.014, 29.6]}
        />
      ))}
      {horizontals.map((z) => (
        <Box
          color={lineColor}
          key={`parcel-h-${z}`}
          name={`parcel-h-${theme.id}-${z}`}
          position={[0, -0.188, z]}
          scale={[45.4, 0.014, 0.035]}
        />
      ))}
    </group>
  )
}

function RegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  if (theme.id === 'harbor') return <HarborRegionalInfrastructure theme={theme} />
  if (theme.id === 'downtown') return <DowntownRegionalInfrastructure theme={theme} />
  if (theme.id === 'snow') return <SnowRegionalInfrastructure theme={theme} />
  if (theme.id === 'beltline') return <BeltlineRegionalInfrastructure theme={theme} />
  return <SmallTownRegionalInfrastructure theme={theme} />
}

function SmallTownRegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="smalltown-rail-bed" color="#4b5563" position={[-18.4, -0.105, -0.35]} scale={[0.34, 0.04, 31.6]} />
      {Array.from({ length: 13 }, (_, index) => (
        <Box
          color="#8b6f55"
          key={`smalltown-rail-tie-${index}`}
          name={`smalltown-rail-tie-${index}`}
          position={[-18.4, -0.06, -15.4 + index * 2.5]}
          scale={[0.72, 0.035, 0.08]}
        />
      ))}
      <WaterTower position={[20.4, -0.02, -14.0]} color={theme.trim} />
      <FarmField position={[-23.0, -0.12, 0.2]} color="#8b995d" />
    </group>
  )
}

function HarborRegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="harbor-west-basin" color={theme.water} position={[-24.4, -0.12, -0.35]} scale={[2.4, 0.055, 33.8]} />
      <Box name="harbor-ferry-slip" color={theme.water} position={[-18.2, -0.115, 12.4]} scale={[5.4, 0.055, 1.2]} />
      {[-15.0, -11.8, 18.1, 21.0].map((x, index) => (
        <ContainerStack key={`regional-container-${index}`} position={[x, -0.01, index < 2 ? -14.4 : 13.6]} theme={theme} />
      ))}
      <Crane position={[-22.4, -0.02, -12.8]} color={theme.stripe} />
      <Crane position={[-22.2, -0.02, 9.6]} color={theme.stripe} />
    </group>
  )
}

function DowntownRegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="downtown-elevated-track" color="#26323d" position={[0, 0.38, -13.45]} scale={[42.0, 0.16, 0.28]} />
      {Array.from({ length: 9 }, (_, index) => (
        <Box
          color="#4b5563"
          key={`downtown-track-pier-${index}`}
          name={`downtown-track-pier-${index}`}
          position={[-20 + index * 5, 0.16, -13.45]}
          scale={[0.16, 0.54, 0.16]}
        />
      ))}
      <Box name="downtown-train-a" color={theme.accent} position={[-5.2, 0.58, -13.45]} scale={[3.2, 0.34, 0.46]} />
      <Box name="downtown-train-b" color="#f8fafc" position={[-1.7, 0.58, -13.45]} scale={[3.2, 0.34, 0.46]} />
      <TransitPlaza position={[0.0, -0.02, -11.85]} theme={theme} />
    </group>
  )
}

function SnowRegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      {[-23.4, -21.6, 21.8, 23.6].map((x, index) => (
        <EvergreenRow key={`snow-evergreen-row-${index}`} x={x} theme={theme} />
      ))}
      <Box name="snow-groomed-route" color="#eef8fb" position={[0, -0.065, 14.0]} scale={[46.0, 0.05, 0.48]} />
      <Box name="snow-guardrail-left" color="#94a3b8" position={[-13.6, 0.04, -14.0]} scale={[8.8, 0.08, 0.08]} />
      <Box name="snow-guardrail-right" color="#94a3b8" position={[13.6, 0.04, -14.0]} scale={[8.8, 0.08, 0.08]} />
      <SkiLiftLine theme={theme} />
    </group>
  )
}

function BeltlineRegionalInfrastructure({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="beltline-overpass-deck" color="#29313a" position={[0, 0.7, -15.5]} scale={[48.5, 0.28, 1.0]} />
      <Box name="beltline-overpass-stripe" color={theme.stripe} position={[0, 0.88, -15.5]} scale={[45.2, 0.035, 0.06]} />
      {Array.from({ length: 8 }, (_, index) => (
        <Box
          color="#4b5563"
          key={`beltline-overpass-pier-${index}`}
          name={`beltline-overpass-pier-${index}`}
          position={[-20.5 + index * 5.85, 0.24, -15.5]}
          scale={[0.22, 0.92, 0.22]}
        />
      ))}
      <ContainerStack position={[-20.0, -0.01, 13.2]} theme={theme} />
      <ContainerStack position={[20.0, -0.01, 13.2]} theme={theme} />
      <GantrySign position={[8.4, -0.02, -13.2]} theme={theme} />
    </group>
  )
}

function WaterTower({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.62, 18]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </mesh>
      <Box name="water-tower-cap" color="#e5e7eb" position={[0, 1.78, 0]} scale={[0.84, 0.08, 0.84]} />
      {[-0.26, 0.26].map((x, index) => (
        <Box key={`water-tower-leg-${index}`} name={`water-tower-leg-${index}`} color="#334155" position={[x, 0.72, index === 0 ? -0.26 : 0.26]} scale={[0.07, 1.42, 0.07]} />
      ))}
      <Text color="#f8fafc" fontSize={0.09} position={[-0.28, 1.45, -0.43]}>
        WASH
      </Text>
    </group>
  )
}

function FarmField({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <Box name="regional-farm-field" color={color} position={[0, 0, 0]} scale={[3.6, 0.035, 8.6]} />
      {Array.from({ length: 5 }, (_, index) => (
        <Box
          color="#d6b35f"
          key={`field-row-${index}`}
          name={`regional-field-row-${index}`}
          position={[-1.45 + index * 0.72, 0.035, 0]}
          scale={[0.08, 0.025, 8.1]}
        />
      ))}
    </group>
  )
}

function ContainerStack({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      {[
        [0, 0.22, 0, theme.accent],
        [0.82, 0.22, 0.18, '#0f4f9c'],
        [-0.72, 0.22, -0.2, '#f97316'],
        [0.22, 0.62, -0.1, theme.trim],
      ].map(([x, y, z, color], index) => (
        <Box
          color={String(color)}
          key={`container-${index}`}
          name={`container-stack-${position.join('-')}-${index}`}
          position={[Number(x), Number(y), Number(z)]}
          scale={[0.82, 0.36, 0.44]}
        />
      ))}
    </group>
  )
}

function Crane({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <Box name={`regional-crane-base-${position.join('-')}`} color="#334155" position={[0, 0.34, 0]} scale={[0.24, 0.68, 0.24]} />
      <Box name={`regional-crane-arm-${position.join('-')}`} color={color} position={[0.88, 0.82, 0]} scale={[1.72, 0.08, 0.08]} />
      <Box name={`regional-crane-hook-${position.join('-')}`} color="#111827" position={[1.56, 0.54, 0]} scale={[0.05, 0.44, 0.05]} />
    </group>
  )
}

function TransitPlaza({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="transit-plaza-pad" color="#c9c4ba" position={[0, 0, 0]} scale={[5.1, 0.045, 1.25]} />
      <Box name="transit-plaza-canopy" color={theme.trim} position={[0, 0.56, 0]} scale={[2.8, 0.12, 0.72]} />
      {[-1.1, 0, 1.1].map((x, index) => (
        <Box key={`transit-pier-${index}`} name={`transit-pier-${index}`} color="#26323d" position={[x, 0.28, 0]} scale={[0.08, 0.56, 0.08]} />
      ))}
    </group>
  )
}

function EvergreenRow({ x, theme }: { x: number; theme: CityThemeSpec }) {
  return (
    <group>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={`evergreen-${x}-${index}`} position={[x, 0.24, -15.4 + index * 3.55]} castShadow>
          <coneGeometry args={[0.38 + (index % 3) * 0.06, 0.92, 9]} />
          <meshStandardMaterial color={theme.foliage} roughness={0.68} />
        </mesh>
      ))}
    </group>
  )
}

function SkiLiftLine({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <RotBox name="ski-lift-cable" color="#64748b" position={[-12.0, 1.42, 13.4]} rotationY={0.18} scale={[9.5, 0.045, 0.045]} />
      {[-15.2, -11.8, -8.4].map((x, index) => (
        <group key={`lift-chair-${index}`} position={[x, 0, 12.8 + index * 0.58]}>
          <Box name={`lift-chair-post-${index}`} color="#64748b" position={[0, 0.82, 0]} scale={[0.06, 1.3, 0.06]} />
          <Box name={`lift-chair-seat-${index}`} color={theme.accent} position={[0.18, 0.72, 0]} scale={[0.42, 0.08, 0.26]} />
        </group>
      ))}
    </group>
  )
}

function GantrySign({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="gantry-left-post" color="#334155" position={[-1.25, 0.72, 0]} scale={[0.1, 1.44, 0.1]} />
      <Box name="gantry-right-post" color="#334155" position={[1.25, 0.72, 0]} scale={[0.1, 1.44, 0.1]} />
      <Box name="gantry-face" color="#0f172a" position={[0, 1.36, 0]} scale={[2.7, 0.52, 0.12]} />
      <Text color={theme.accent} fontSize={0.12} position={[-0.9, 1.38, -0.08]}>
        EXPRESS
      </Text>
    </group>
  )
}

function CityRoadNetwork({ theme }: { theme: CityThemeSpec }) {
  const roads: Array<{ name: string; position: Vec3; scale: Vec3; rotationY?: number }> = [
    { name: 'city-road-far-north', position: [0, -0.17, -18.1], scale: [51.4, 0.08, 0.72] },
    { name: 'city-road-far-south', position: [0, -0.17, 17.25], scale: [51.4, 0.08, 0.72] },
    { name: 'city-road-far-west', position: [-26.1, -0.17, -0.35], scale: [0.76, 0.08, 35.6] },
    { name: 'city-road-far-east', position: [26.1, -0.17, -0.35], scale: [0.76, 0.08, 35.6] },
    { name: 'city-road-north', position: [0, -0.17, -10.05], scale: [46.8, 0.08, 0.72] },
    { name: 'city-road-south', position: [0, -0.17, 9.15], scale: [46.8, 0.08, 0.72] },
    { name: 'city-road-west', position: [-15.1, -0.17, -0.35], scale: [0.76, 0.08, 31.8] },
    { name: 'city-road-east', position: [15.1, -0.17, -0.35], scale: [0.76, 0.08, 31.8] },
    { name: 'city-road-main', position: [0, -0.16, -6.2], scale: [22.4, 0.08, 0.86] },
    { name: 'city-road-back', position: [0, -0.16, 6.75], scale: [22.4, 0.08, 0.82] },
    { name: 'city-road-left-feed', position: [-8.1, -0.16, 0.15], scale: [0.78, 0.08, 12.6] },
    { name: 'city-road-right-feed', position: [8.1, -0.16, 0.15], scale: [0.78, 0.08, 12.6] },
    { name: 'city-road-outer-left-feed', position: [-21.0, -0.16, 0.2], scale: [0.74, 0.08, 22.0] },
    { name: 'city-road-outer-right-feed', position: [21.2, -0.16, 0.2], scale: [0.74, 0.08, 22.0] },
    { name: 'city-road-nw-diagonal', position: [-6.8, -0.155, -8.25], scale: [7.4, 0.08, 0.54], rotationY: -0.36 },
    { name: 'city-road-se-diagonal', position: [7.1, -0.155, 7.95], scale: [7.2, 0.08, 0.54], rotationY: -0.31 },
  ]

  return (
    <group>
      {roads.map((road) => (
        <RotBox
          color={theme.road}
          key={road.name}
          name={road.name}
          position={road.position}
          rotationY={road.rotationY}
          scale={road.scale}
        />
      ))}
      <SecondaryStreetGrid theme={theme} />
      {[
        [-8.1, -0.1, -6.2],
        [8.1, -0.1, -6.2],
        [-8.1, -0.1, 6.75],
        [8.1, -0.1, 6.75],
        [-21.0, -0.1, -10.05],
        [21.2, -0.1, -10.05],
        [-21.0, -0.1, 9.15],
        [21.2, -0.1, 9.15],
        [-15.1, -0.1, -10.05],
        [15.1, -0.1, -10.05],
        [-15.1, -0.1, 9.15],
        [15.1, -0.1, 9.15],
        [-26.1, -0.1, -18.1],
        [26.1, -0.1, -18.1],
        [-26.1, -0.1, 17.25],
        [26.1, -0.1, 17.25],
      ].map((position, index) => (
        <RoadDisc
          color={theme.road}
          key={`junction-${index}`}
          name={`city-junction-${index}`}
          position={position as Vec3}
          radius={0.72}
        />
      ))}
      {[-18.1, -10.05, 9.15, 17.25, -6.2, 6.75].map((z) => (
        <RoadStripe color={theme.stripe} key={`stripe-${z}`} z={z} />
      ))}
      {[-26.1, -21.0, -15.1, -8.1, 8.1, 15.1, 21.2, 26.1].map((x) => (
        <VerticalRoadStripe color={theme.stripe} key={`vstripe-${x}`} x={x} />
      ))}
      <RoadSurfaceDetails theme={theme} />
    </group>
  )
}

function SecondaryStreetGrid({ theme }: { theme: CityThemeSpec }) {
  const minorRoad = theme.id === 'snow' ? '#34424d' : theme.id === 'harbor' ? '#223441' : '#29313a'
  const baseRoads: Array<{ name: string; position: Vec3; scale: Vec3; rotationY?: number }> = [
    { name: 'minor-road-neighborhood-northwest', position: [-18.1, -0.176, -13.15], scale: [9.8, 0.045, 0.28] },
    { name: 'minor-road-neighborhood-southeast', position: [18.1, -0.176, 13.05], scale: [9.8, 0.045, 0.28] },
    { name: 'minor-road-core-west', position: [-4.0, -0.176, -0.35], scale: [0.28, 0.045, 13.8] },
    { name: 'minor-road-core-east', position: [4.0, -0.176, -0.35], scale: [0.28, 0.045, 13.8] },
    { name: 'minor-road-civic-north', position: [0, -0.176, -13.2], scale: [14.8, 0.045, 0.28] },
    { name: 'minor-road-civic-south', position: [0, -0.176, 13.0], scale: [14.8, 0.045, 0.28] },
  ]
  const roads = [...baseRoads]

  if (theme.id === 'downtown') {
    roads.push(
      { name: 'minor-road-downtown-ring-west', position: [-10.9, -0.176, -0.35], scale: [0.26, 0.045, 20.0] },
      { name: 'minor-road-downtown-ring-east', position: [10.9, -0.176, -0.35], scale: [0.26, 0.045, 20.0] },
      { name: 'minor-road-downtown-cross-north', position: [0, -0.176, -5.7], scale: [18.0, 0.045, 0.24] },
      { name: 'minor-road-downtown-cross-south', position: [0, -0.176, 5.4], scale: [18.0, 0.045, 0.24] },
    )
  }

  if (theme.id === 'snow') {
    const sparseNames = new Set(['minor-road-core-west', 'minor-road-core-east'])
    for (let index = roads.length - 1; index >= 0; index -= 1) {
      if (sparseNames.has(roads[index].name)) roads.splice(index, 1)
    }
  }

  return (
    <group>
      {roads.map((road) => (
        <RotBox
          color={minorRoad}
          key={road.name}
          name={road.name}
          position={road.position}
          rotationY={road.rotationY}
          scale={road.scale}
        />
      ))}
      {[-18.1, 18.1].map((x) =>
        [-13.15, 13.05].map((z) => (
          <RoadDisc
            color={minorRoad}
            key={`minor-junction-${x}-${z}`}
            name={`minor-junction-${x}-${z}`}
            position={[x, -0.14, z]}
            radius={0.34}
          />
        )),
      )}
      <MinorStreetLaneLines theme={theme} />
    </group>
  )
}

function MinorStreetLaneLines({ theme }: { theme: CityThemeSpec }) {
  const stripe = theme.id === 'snow' ? '#dbeafe' : '#94a3b8'

  return (
    <group>
      {[-13.15, 13.05].map((z) => (
        <group key={`minor-h-stripes-${z}`}>
          {Array.from({ length: 7 }, (_, index) => (
            <Box
              color={stripe}
              key={`minor-h-stripe-${z}-${index}`}
              name={`minor-h-stripe-${z}-${index}`}
              position={[-19.5 + index * 6.5, -0.092, z]}
              scale={[0.48, 0.014, 0.03]}
            />
          ))}
        </group>
      ))}
      {[-4.0, 4.0].map((x) => (
        <group key={`minor-v-stripes-${x}`}>
          {Array.from({ length: 7 }, (_, index) => (
            <Box
              color={stripe}
              key={`minor-v-stripe-${x}-${index}`}
              name={`minor-v-stripe-${x}-${index}`}
              position={[x, -0.092, -8.1 + index * 2.6]}
              scale={[0.035, 0.018, 0.46]}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

function RoadSurfaceDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <RoadEdgeLines theme={theme} />
      <SidewalkGrid theme={theme} />
      <IntersectionCrosswalks theme={theme} />
      <StopBars />
      <LaneDirectionArrows />
      <RoadWearAndUtilities />
      <RoadTextMarkings theme={theme} />
      <CarWashFrontageRoadDetails theme={theme} />
      <TrafficSignal position={[-8.1, 0, -6.2]} rotationY={0.4} />
      <TrafficSignal position={[8.1, 0, -6.2]} rotationY={-0.4} />
      <TrafficSignal position={[-8.1, 0, 6.75]} rotationY={2.74} />
      <TrafficSignal position={[8.1, 0, 6.75]} rotationY={-2.74} />
      <StopSign position={[-15.1, 0, -9.38]} rotationY={0} />
      <StopSign position={[15.1, 0, 8.45]} rotationY={Math.PI} />
      <StreetlightRow positions={[[-13.1, -8.9], [-2.8, -8.9], [2.8, -8.9], [13.1, -8.9], [-13.1, 8.0], [13.1, 8.0]]} />
    </group>
  )
}

function RoadEdgeLines({ theme }: { theme: CityThemeSpec }) {
  const yellow = theme.stripe
  const curb = theme.id === 'snow' ? '#f8fafc' : '#b9b4aa'
  return (
    <group>
      {[-10.05, 9.15].map((z) => (
        <group key={`road-edge-horizontal-${z}`}>
          <Box name={`road-curb-h-${z}-north`} color={curb} position={[0, -0.064, z - 0.52]} scale={[45.2, 0.04, 0.08]} />
          <Box name={`road-curb-h-${z}-south`} color={curb} position={[0, -0.064, z + 0.52]} scale={[45.2, 0.04, 0.08]} />
        </group>
      ))}
      {[-21.0, 21.2].map((x) => (
        <group key={`road-edge-vertical-${x}`}>
          <Box name={`road-curb-v-${x}-west`} color={curb} position={[x - 0.52, -0.064, -0.35]} scale={[0.08, 0.04, 29.6]} />
          <Box name={`road-curb-v-${x}-east`} color={curb} position={[x + 0.52, -0.064, -0.35]} scale={[0.08, 0.04, 29.6]} />
        </group>
      ))}
      <Box name="center-turn-lane-main" color={yellow} position={[0, -0.065, -6.2]} scale={[10.5, 0.02, 0.045]} />
      <Box name="center-turn-lane-back" color={yellow} position={[0, -0.065, 6.75]} scale={[10.5, 0.02, 0.045]} />
    </group>
  )
}

function SidewalkGrid({ theme }: { theme: CityThemeSpec }) {
  const concrete = theme.id === 'snow' ? '#e5edf0' : '#a9afa6'
  const curb = theme.id === 'snow' ? '#f8fafc' : '#d7d1c6'
  return (
    <group>
      {[
        [0, -9.05, 43.8, 0.38],
        [0, 8.15, 43.8, 0.38],
        [0, -17.3, 51.4, 0.32],
        [0, 16.45, 51.4, 0.32],
      ].map(([x, z, sx, sz], index) => (
        <Box
          color={concrete}
          key={`sidewalk-h-${index}`}
          name={`sidewalk-h-${index}`}
          position={[x, -0.105, z]}
          scale={[sx, 0.035, sz]}
        />
      ))}
      {[
        [-20.15, -0.35, 0.38, 28.8],
        [20.35, -0.35, 0.38, 28.8],
        [-14.15, -0.35, 0.32, 17.0],
        [14.15, -0.35, 0.32, 17.0],
      ].map(([x, z, sx, sz], index) => (
        <Box
          color={concrete}
          key={`sidewalk-v-${index}`}
          name={`sidewalk-v-${index}`}
          position={[x, -0.105, z]}
          scale={[sx, 0.035, sz]}
        />
      ))}
      {[
        [0, -8.78, 43.4, 0.06],
        [0, 7.88, 43.4, 0.06],
        [-19.88, -0.35, 0.06, 28.4],
        [20.08, -0.35, 0.06, 28.4],
      ].map(([x, z, sx, sz], index) => (
        <Box
          color={curb}
          key={`sidewalk-curb-${index}`}
          name={`sidewalk-curb-${index}`}
          position={[x, -0.056, z]}
          scale={[sx, 0.04, sz]}
        />
      ))}
      {[
        [0, -6.2, 3.9, 1.18],
        [0, 6.75, 3.9, 1.12],
      ].map(([x, z, sx, sz], index) => (
        <Box
          color={theme.road}
          key={`wash-driveway-throat-${index}`}
          name={`wash-driveway-throat-${index}`}
          position={[x, -0.052, z]}
          scale={[sx, 0.036, sz]}
        />
      ))}
    </group>
  )
}

function StopBars() {
  const bars: Array<{ position: Vec3; scale: Vec3 }> = [
    { position: [-7.3, -0.05, -6.75], scale: [0.86, 0.02, 0.08] },
    { position: [-8.9, -0.05, -5.65], scale: [0.86, 0.02, 0.08] },
    { position: [7.3, -0.05, -5.65], scale: [0.86, 0.02, 0.08] },
    { position: [8.9, -0.05, -6.75], scale: [0.86, 0.02, 0.08] },
    { position: [-8.9, -0.05, 6.25], scale: [0.86, 0.02, 0.08] },
    { position: [8.9, -0.05, 7.28], scale: [0.86, 0.02, 0.08] },
    { position: [-15.1, -0.05, -9.3], scale: [0.08, 0.02, 0.86] },
    { position: [15.1, -0.05, 8.42], scale: [0.08, 0.02, 0.86] },
  ]

  return (
    <group>
      {bars.map((bar, index) => (
        <Box color="#f8fafc" key={index} name={`stop-bar-${index}`} position={bar.position} scale={bar.scale} />
      ))}
    </group>
  )
}

function IntersectionCrosswalks({ theme }: { theme: CityThemeSpec }) {
  const stripe = theme.id === 'snow' ? '#f8fafc' : '#e5e7eb'
  const crosswalks: Array<{ name: string; position: Vec3; rotationY?: number; width?: number }> = [
    { name: 'wash-entry-west', position: [-8.1, -0.045, -6.95], width: 1.18 },
    { name: 'wash-entry-east', position: [8.1, -0.045, -5.45], width: 1.18 },
    { name: 'wash-exit-west', position: [-8.1, -0.045, 6.02], width: 1.1 },
    { name: 'wash-exit-east', position: [8.1, -0.045, 7.48], width: 1.1 },
  ]

  return (
    <group>
      {crosswalks.map((crosswalk) => (
        <Crosswalk
          color={stripe}
          key={crosswalk.name}
          name={crosswalk.name}
          position={crosswalk.position}
          rotationY={crosswalk.rotationY}
          width={crosswalk.width}
        />
      ))}
    </group>
  )
}

function Crosswalk({
  color,
  name,
  position,
  rotationY = 0,
  width = 1,
}: {
  color: string
  name: string
  position: Vec3
  rotationY?: number
  width?: number
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: 5 }, (_, index) => (
        <Box
          color={color}
          key={`${name}-${index}`}
          name={`crosswalk-${name}-${index}`}
          position={[-0.42 + index * 0.21, 0, 0]}
          scale={[0.09, 0.018, width]}
        />
      ))}
    </group>
  )
}

function LaneDirectionArrows() {
  return (
    <group>
      <LaneArrow name="lane-arrow-entry-left" position={[-4.2, -0.037, -6.2]} rotationY={Math.PI} />
      <LaneArrow name="lane-arrow-entry-right" position={[4.2, -0.037, -6.2]} rotationY={Math.PI} />
      <LaneArrow name="lane-arrow-exit-left" position={[-4.2, -0.037, 6.75]} />
      <LaneArrow name="lane-arrow-exit-right" position={[4.2, -0.037, 6.75]} />
      <LaneArrow name="lane-arrow-side-north" position={[-8.1, -0.037, -2.3]} rotationY={Math.PI / 2} />
      <LaneArrow name="lane-arrow-side-south" position={[8.1, -0.037, 2.4]} rotationY={-Math.PI / 2} />
    </group>
  )
}

function LaneArrow({ name, position, rotationY = 0 }: { name: string; position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`${name}-stem`} color="#f8fafc" position={[0, 0, 0.18]} scale={[0.08, 0.018, 0.55]} />
      <RotBox name={`${name}-left-head`} color="#f8fafc" position={[-0.13, 0, -0.13]} rotationY={0.62} scale={[0.08, 0.018, 0.34]} />
      <RotBox name={`${name}-right-head`} color="#f8fafc" position={[0.13, 0, -0.13]} rotationY={-0.62} scale={[0.08, 0.018, 0.34]} />
    </group>
  )
}

function RoadWearAndUtilities() {
  return (
    <group>
      {[
        [-6.4, -5.72],
        [6.4, -6.72],
        [-6.7, 6.32],
        [6.65, 7.12],
        [-15.7, -9.55],
        [15.72, 8.64],
      ].map(([x, z], index) => (
        <ManholeCover key={`manhole-${index}`} position={[x, -0.044, z]} />
      ))}
      {[
        [-7.55, -5.72, 0],
        [7.55, -6.72, 0],
        [-14.58, -9.55, Math.PI / 2],
        [14.58, 8.65, Math.PI / 2],
        [-20.42, 8.48, Math.PI / 2],
        [20.64, -9.4, Math.PI / 2],
      ].map(([x, z, rotationY], index) => (
        <StormDrain key={`storm-drain-${index}`} position={[x, -0.04, z]} rotationY={rotationY} />
      ))}
    </group>
  )
}

function ManholeCover({ position }: { position: Vec3 }) {
  return (
    <mesh name={`manhole-${position.join('-')}`} position={position} receiveShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.018, 24]} />
      <meshStandardMaterial color="#475569" roughness={0.72} metalness={0.15} />
    </mesh>
  )
}

function StormDrain({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`storm-drain-face-${position.join('-')}`} color="#1f2937" position={[0, 0, 0]} scale={[0.4, 0.014, 0.12]} />
      {[-0.12, 0, 0.12].map((x, index) => (
        <Box
          color="#94a3b8"
          key={`storm-drain-slat-${index}`}
          name={`storm-drain-slat-${position.join('-')}-${index}`}
          position={[x, 0.01, 0]}
          scale={[0.025, 0.012, 0.13]}
        />
      ))}
    </group>
  )
}

function RoadTextMarkings({ theme }: { theme: CityThemeSpec }) {
  const labels = roadLabelsForTheme(theme)

  return (
    <group>
      <RoadNameBlade label={labels.main} position={[-8.82, 0, -9.15]} rotationY={0.2} theme={theme} />
      <RoadNameBlade label={labels.cross} position={[-14.18, 0, -7.38]} rotationY={Math.PI / 2} theme={theme} />
      <RoadNameBlade label={labels.entry} position={[-5.5, 0, -5.42]} rotationY={0} theme={theme} compact />
      <RoadNameBlade label={labels.exit} position={[5.42, 0, 5.92]} rotationY={Math.PI} theme={theme} compact />
    </group>
  )
}

function RoadNameBlade({
  compact = false,
  label,
  position,
  rotationY,
  theme,
}: {
  compact?: boolean
  label: string
  position: Vec3
  rotationY: number
  theme: CityThemeSpec
}) {
  const width = compact ? 0.92 : 1.22
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`${label}-road-blade-post`} color="#26323d" position={[0, 0.42, 0]} scale={[0.055, 0.84, 0.055]} />
      <Box name={`${label}-road-blade-face`} color={theme.trim} position={[0, 0.84, -0.03]} scale={[width, 0.24, 0.06]} />
      <Text color="#f8fafc" fontSize={compact ? 0.045 : 0.055} position={[-width * 0.38, 0.84, -0.08]}>
        {label}
      </Text>
    </group>
  )
}

function CarWashFrontageRoadDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="frontage-left-turn-pocket" color={theme.road} position={[-3.25, -0.052, -5.25]} scale={[1.18, 0.035, 1.52]} />
      <Box name="frontage-right-turn-pocket" color={theme.road} position={[3.25, -0.052, 4.25]} scale={[1.18, 0.035, 1.52]} />
      <Box name="frontage-entry-curb-cut-left" color="#d7d1c6" position={[-2.35, -0.032, -5.96]} scale={[0.7, 0.05, 0.14]} />
      <Box name="frontage-entry-curb-cut-right" color="#d7d1c6" position={[2.35, -0.032, -5.96]} scale={[0.7, 0.05, 0.14]} />
      <Box name="frontage-exit-curb-cut-left" color="#d7d1c6" position={[-2.35, -0.032, 5.06]} scale={[0.7, 0.05, 0.14]} />
      <Box name="frontage-exit-curb-cut-right" color="#d7d1c6" position={[2.35, -0.032, 5.06]} scale={[0.7, 0.05, 0.14]} />
      <Box name="frontage-no-parking-red-left" color="#dc2626" position={[-4.52, -0.018, -5.92]} scale={[1.4, 0.03, 0.045]} />
      <Box name="frontage-no-parking-red-right" color="#dc2626" position={[4.52, -0.018, 5.02]} scale={[1.4, 0.03, 0.045]} />
      <Text color="#f8fafc" fontSize={0.1} position={[-1.82, -0.025, -5.24]} rotation={[-Math.PI / 2, 0, 0]}>
        ENTER
      </Text>
      <Text color="#f8fafc" fontSize={0.1} position={[1.42, -0.025, 4.24]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        EXIT
      </Text>
    </group>
  )
}

function roadLabelsForTheme(theme: CityThemeSpec): { entry: string; exit: string; main: string; cross: string } {
  if (theme.id === 'harbor') return { entry: 'WASH DOCK', exit: 'PIER EXIT', main: 'PIER AVE', cross: 'HARBOR RD' }
  if (theme.id === 'downtown') return { entry: 'WASH ENTRY', exit: 'CITY EXIT', main: 'CENTER ST', cross: 'METRO AVE' }
  if (theme.id === 'snow') return { entry: 'WASH BAY', exit: 'RESORT EXIT', main: 'SUMMIT ST', cross: 'SNOW ROUTE' }
  if (theme.id === 'beltline') return { entry: 'TUNNEL IN', exit: 'TUNNEL OUT', main: 'BELTLINE', cross: 'FLEET RD' }
  return { entry: 'WASH ENTRY', exit: 'EXIT', main: 'MAIN ST', cross: 'RUSTWATER RD' }
}

function TrafficSignal({ position, rotationY }: { position: Vec3; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`traffic-signal-pole-${position.join('-')}`} color="#26323d" position={[0, 0.9, 0]} scale={[0.08, 1.8, 0.08]} />
      <Box name={`traffic-signal-arm-${position.join('-')}`} color="#26323d" position={[0.45, 1.72, 0]} scale={[0.9, 0.08, 0.08]} />
      <Box name={`traffic-signal-head-${position.join('-')}`} color="#111827" position={[0.92, 1.58, 0]} scale={[0.22, 0.48, 0.16]} />
      <Box name={`traffic-light-red-${position.join('-')}`} color="#dc2626" position={[0.92, 1.72, -0.09]} scale={[0.09, 0.09, 0.025]} />
      <Box name={`traffic-light-yellow-${position.join('-')}`} color="#facc15" position={[0.92, 1.58, -0.09]} scale={[0.09, 0.09, 0.025]} />
      <Box name={`traffic-light-green-${position.join('-')}`} color="#22c55e" position={[0.92, 1.44, -0.09]} scale={[0.09, 0.09, 0.025]} />
    </group>
  )
}

function StopSign({ position, rotationY }: { position: Vec3; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`stop-sign-post-${position.join('-')}`} color="#6b7280" position={[0, 0.48, 0]} scale={[0.06, 0.96, 0.06]} />
      <Box name={`stop-sign-face-${position.join('-')}`} color="#dc2626" position={[0, 1.0, -0.03]} scale={[0.44, 0.32, 0.06]} />
      <Text color="#f8fafc" fontSize={0.09} position={[-0.17, 1.0, -0.08]}>
        STOP
      </Text>
    </group>
  )
}

function StreetlightRow({ positions }: { positions: Array<[number, number]> }) {
  return (
    <group>
      {positions.map(([x, z], index) => (
        <group key={`streetlight-${index}`} position={[x, 0, z]}>
          <Box name={`streetlight-post-${index}`} color="#26323d" position={[0, 1.0, 0]} scale={[0.08, 2.0, 0.08]} />
          <Box name={`streetlight-arm-${index}`} color="#26323d" position={[0.28, 1.92, 0]} scale={[0.56, 0.06, 0.06]} />
          <Box name={`streetlight-head-${index}`} color="#fde68a" position={[0.58, 1.86, 0]} scale={[0.3, 0.09, 0.18]} />
        </group>
      ))}
    </group>
  )
}

function RoadStripe({ color, z }: { color: string; z: number }) {
  return (
    <group>
      {Array.from({ length: 14 }, (_, index) => (
        <Box
          color={color}
          key={index}
          name={`road-stripe-${z}-${index}`}
          position={[-22.0 + index * 3.4, -0.09, z]}
          scale={[0.68, 0.02, 0.05]}
        />
      ))}
    </group>
  )
}

function VerticalRoadStripe({ color, x }: { color: string; x: number }) {
  return (
    <group>
      {Array.from({ length: 9 }, (_, index) => (
        <Box
          color={color}
          key={index}
          name={`vertical-road-stripe-${x}-${index}`}
          position={[x, -0.09, -14.2 + index * 3.45]}
          scale={[0.05, 0.02, 0.68]}
        />
      ))}
    </group>
  )
}

function CityLandmarks({ theme }: { theme: CityThemeSpec }) {
  const neighborhoodBlocks: Array<{ position: Vec3; tone: string }> = [
    { position: [-22.5, -0.02, -16.0], tone: theme.blockTones[0] },
    { position: [-17.8, -0.02, -16.2], tone: theme.blockTones[1] },
    { position: [-11.7, -0.02, -16.05], tone: theme.blockTones[2] },
    { position: [-5.6, -0.02, -16.35], tone: theme.blockTones[3] },
    { position: [6.1, -0.02, -16.25], tone: theme.blockTones[4] },
    { position: [12.0, -0.02, -16.0], tone: theme.blockTones[0] },
    { position: [18.4, -0.02, -16.2], tone: theme.blockTones[1] },
    { position: [23.0, -0.02, -7.0], tone: theme.blockTones[2] },
    { position: [23.0, -0.02, 0.4], tone: theme.blockTones[3] },
    { position: [22.8, -0.02, 7.4], tone: theme.blockTones[4] },
    { position: [18.3, -0.02, 15.25], tone: theme.blockTones[0] },
    { position: [11.6, -0.02, 15.4], tone: theme.blockTones[1] },
    { position: [5.0, -0.02, 15.25], tone: theme.blockTones[2] },
    { position: [-5.3, -0.02, 15.35], tone: theme.blockTones[3] },
    { position: [-11.6, -0.02, 15.1], tone: theme.blockTones[4] },
    { position: [-18.2, -0.02, 15.25], tone: theme.blockTones[0] },
    { position: [-23.6, -0.02, 5.8], tone: theme.blockTones[1] },
    { position: [-23.3, -0.02, -4.8], tone: theme.blockTones[2] },
  ]

  return (
    <group>
      <Pond color={theme.water} position={[-12.6, -0.1, 0.4]} scale={[1.6, 1, 0.92]} />
      <Pond color={theme.water} position={[11.4, -0.1, 0.9]} scale={[1.2, 1, 0.74]} />
      <Pond color={theme.water} position={[-20.5, -0.1, -0.6]} scale={[1.2, 1, 0.76]} />
      <Pond color={theme.water} position={[20.4, -0.1, -0.8]} scale={[1.36, 1, 0.82]} />
      <RoadsideBusinessDistrict theme={theme} />
      <DistrictGatewayLandmarks theme={theme} />
      <Park position={[-3.8, -0.1, 8.05]} theme={theme} />
      <Park position={[4.7, -0.1, -9.15]} theme={theme} />
      <Park position={[-18.1, -0.1, -3.5]} theme={theme} />
      <Park position={[18.1, -0.1, 3.7]} theme={theme} />
      <MiniBlock position={[-4.8, -0.02, -9.0]} tone={theme.blockTones[1]} />
      <MiniBlock position={[4.8, -0.02, 8.35]} tone={theme.blockTones[2]} />
      <MiniBlock position={[-12.2, -0.02, -2.6]} tone={theme.blockTones[0]} />
      <MiniBlock position={[12.0, -0.02, 3.8]} tone={theme.blockTones[4]} />
      <MiniBlock position={[-2.1, -0.02, -10.82]} tone={theme.blockTones[3]} />
      <MiniBlock position={[2.2, -0.02, 9.95]} tone={theme.blockTones[0]} />
      {neighborhoodBlocks.map((block) => (
        <MiniBlock key={`${block.position[0]}-${block.position[2]}`} position={block.position} tone={block.tone} />
      ))}
      <SkylineCluster position={[-1.4, -0.02, -15.95]} theme={theme} />
      <SkylineCluster position={[1.2, -0.02, 15.25]} theme={theme} />
      <SkylineCluster position={[23.0, -0.02, -12.0]} theme={theme} />
      <SkylineCluster position={[-23.0, -0.02, 12.0]} theme={theme} />
      <ThemeLandmarks theme={theme} />
    </group>
  )
}

function DistrictGatewayLandmarks({ theme }: { theme: CityThemeSpec }) {
  if (theme.id === 'downtown') {
    return (
      <group>
        <Box name="downtown-gateway-plaza" color="#2d2431" position={[0, -0.03, -12.55]} scale={[5.1, 0.05, 0.95]} />
        <Box name="downtown-gateway-pylon-west" color="#1f2937" position={[-2.45, 0.84, -12.6]} scale={[0.28, 1.58, 0.22]} />
        <Box name="downtown-gateway-pylon-east" color="#1f2937" position={[2.45, 0.84, -12.6]} scale={[0.28, 1.58, 0.22]} />
        <Box name="downtown-gateway-header" color="#111827" position={[0, 1.46, -12.6]} scale={[5.2, 0.24, 0.18]} />
        <Box name="downtown-gateway-band-pink" color="#f472b6" position={[0, 0.62, -12.92]} scale={[4.5, 0.14, 0.1]} />
        <Box name="downtown-gateway-band-cyan" color="#22d3ee" position={[0, 0.42, -12.18]} scale={[4.5, 0.14, 0.1]} />
        <Box name="downtown-gateway-header-neon-pink" color="#f472b6" position={[0, 1.5, -12.82]} scale={[4.8, 0.08, 0.08]} />
        <Box name="downtown-gateway-header-neon-cyan" color="#22d3ee" position={[0, 1.38, -12.38]} scale={[4.8, 0.08, 0.08]} />
      </group>
    )
  }

  if (theme.id === 'snow') {
    return (
      <group>
        <Box name="snow-gateway-berm" color="#f8fafc" position={[0, -0.035, -12.5]} scale={[5.5, 0.06, 0.9]} />
        <Box name="snow-gateway-arch-west" color="#94a3b8" position={[-2.1, 0.76, -12.56]} scale={[0.2, 1.34, 0.2]} />
        <Box name="snow-gateway-arch-east" color="#94a3b8" position={[2.1, 0.76, -12.56]} scale={[0.2, 1.34, 0.2]} />
        <Box name="snow-gateway-arch-top" color="#cbd5e1" position={[0, 1.34, -12.56]} scale={[4.35, 0.18, 0.2]} />
        {[-1.6, 0, 1.6].map((x, index) => (
          <group key={`snow-gateway-marker-${index}`} position={[x, 0, -12.9]}>
            <Box name={`snow-gateway-post-${index}`} color="#64748b" position={[0, 0.36, 0]} scale={[0.08, 0.72, 0.08]} />
            <Box name={`snow-gateway-cap-${index}`} color="#f97316" position={[0, 0.74, 0]} scale={[0.24, 0.14, 0.12]} />
          </group>
        ))}
      </group>
    )
  }

  if (theme.id === 'harbor') {
    return (
      <group>
        <Box name="harbor-gateway-dock" color="#8b6f55" position={[0, -0.02, -12.55]} scale={[5.1, 0.08, 0.7]} />
        <Box name="harbor-gateway-water" color={theme.water} position={[0, -0.08, -13.05]} scale={[4.8, 0.04, 0.52]} />
        <Box name="harbor-gateway-lighthouse-base" color="#e2e8f0" position={[2.05, 0.64, -12.62]} scale={[0.48, 1.28, 0.38]} />
        <Box name="harbor-gateway-lighthouse-cap" color="#dc2626" position={[2.05, 1.36, -12.62]} scale={[0.56, 0.18, 0.46]} />
        <Box name="harbor-gateway-lighthouse-light" color="#fde68a" position={[2.05, 1.24, -12.4]} scale={[0.18, 0.12, 0.1]} />
        <Box name="harbor-gateway-crane-post" color="#334155" position={[-1.9, 0.62, -12.5]} scale={[0.16, 1.24, 0.16]} />
        <Box name="harbor-gateway-crane-arm" color="#facc15" position={[-1.15, 1.1, -12.5]} scale={[1.5, 0.1, 0.1]} />
      </group>
    )
  }

  if (theme.id === 'beltline') {
    return (
      <group>
        <Box name="beltline-gateway-service-road" color="#0f172a" position={[0, -0.08, -12.55]} scale={[5.8, 0.04, 0.42]} />
        <Box name="beltline-gateway-overhead-beam" color="#1f2937" position={[0.15, 1.02, -12.55]} scale={[5.2, 0.16, 0.2]} />
        <Box name="beltline-gateway-support-west" color="#4b5563" position={[-2.35, 0.58, -12.55]} scale={[0.28, 0.96, 0.22]} />
        <Box name="beltline-gateway-support-east" color="#4b5563" position={[2.65, 0.58, -12.55]} scale={[0.28, 0.96, 0.22]} />
        {[-1.6, 0.2, 2.0].map((x, index) => (
          <Box
            key={`beltline-gateway-van-${index}`}
            name={`beltline-gateway-van-${index}`}
            color={index === 1 ? theme.accent : '#f8fafc'}
            position={[x, 0.22, -12.55]}
            scale={[0.62, 0.32, 0.3]}
          />
        ))}
      </group>
    )
  }

  return (
    <group>
      <Box name="smalltown-gateway-square" color={theme.park} position={[0, -0.03, -12.6]} scale={[5.0, 0.05, 1.0]} />
      <Box name="smalltown-gateway-arch-west" color="#9a3412" position={[-2.2, 0.62, -12.56]} scale={[0.22, 1.06, 0.22]} />
      <Box name="smalltown-gateway-arch-east" color="#9a3412" position={[2.2, 0.62, -12.56]} scale={[0.22, 1.06, 0.22]} />
      <Box name="smalltown-gateway-arch-top" color="#b45309" position={[0, 1.12, -12.56]} scale={[4.5, 0.16, 0.2]} />
      <Box name="smalltown-gateway-monument-base" color="#d7d1c6" position={[0, 0.24, -12.55]} scale={[0.62, 0.48, 0.48]} />
      <Box name="smalltown-gateway-monument-cap" color={theme.trim} position={[0, 0.58, -12.55]} scale={[0.42, 0.2, 0.42]} />
    </group>
  )
}

function ThemeLandmarks({ theme }: { theme: CityThemeSpec }) {
  if (theme.id === 'snow') return <SnowCityDetails />
  if (theme.id === 'downtown') return <DowntownCityDetails theme={theme} />
  if (theme.id === 'harbor') return <HarborCityDetails theme={theme} />
  if (theme.id === 'beltline') return <BeltlineCityDetails theme={theme} />
  return <SmallTownCityDetails theme={theme} />
}

function SkylineCluster({ position, theme, dense = false }: { position: Vec3; theme: CityThemeSpec; dense?: boolean }) {
  return (
    <group position={position}>
      {Array.from({ length: dense ? 12 : 8 }, (_, index) => (
        <Box
          color={index % 2 === 0 ? theme.skylineA : theme.skylineB}
          key={index}
          name={`skyline-${position.join('-')}-${index}`}
          position={[-1.5 + (index % 6) * 0.58, 0.42 + index * 0.045, -0.46 + Math.floor(index / 6) * 0.72]}
          scale={[0.38, (dense ? 1.25 : 0.9) + (index % 6) * 0.17, 0.38]}
        />
      ))}
      <Box name={`skyline-block-lot-${position.join('-')}`} color={theme.ground} position={[0, -0.035, 0]} scale={[3.4, 0.05, 2.05]} />
    </group>
  )
}

function MiniBlock({ position, tone, lotColor = '#65724f' }: { position: Vec3; tone: string; lotColor?: string }) {
  const id = position.map((value) => String(value).replace('-', 'm').replace('.', 'p')).join('-')
  const storefronts = ['MARKET', 'CAFE', 'AUTO', 'LEASE']
  const roofColor = '#26323d'
  const curbColor = '#d7d1c6'

  return (
    <group position={position}>
      <Box name={`mini-block-lot-${id}`} color={lotColor} position={[0, -0.035, 0.05]} scale={[2.65, 0.055, 2.08]} />
      <Box name={`mini-block-parking-apron-${id}`} color="#3f4547" position={[0, 0.006, -0.72]} scale={[2.32, 0.042, 0.62]} />
      <Box name={`mini-block-service-apron-${id}`} color="#4b5563" position={[0.02, 0.006, 0.96]} scale={[2.1, 0.038, 0.42]} />
      <Box name={`mini-block-front-sidewalk-${id}`} color={curbColor} position={[0, 0.028, -1.08]} scale={[2.78, 0.052, 0.2]} />
      <Box name={`mini-block-back-sidewalk-${id}`} color={curbColor} position={[0, 0.028, 1.11]} scale={[2.46, 0.052, 0.16]} />
      <Box name={`mini-block-front-curb-${id}`} color="#facc15" position={[0, 0.07, -1.2]} scale={[2.4, 0.034, 0.045]} />
      <Box name={`mini-block-driveway-${id}`} color="#0f172a" position={[0.74, 0.052, -1.04]} scale={[0.52, 0.026, 0.32]} />
      <ParkingLines name={`mini-block-parking-${id}`} position={[0, 0.052, -0.72]} spaces={4} rotationY={0} />
      {storefronts.map((label, index) => {
        const x = -0.62 + (index % 2) * 1.18
        const z = -0.02 + Math.floor(index / 2) * 0.74
        const safeLabel = label.toLowerCase()

        return (
          <group key={`mini-block-store-${id}-${label}`} position={[x, 0, z]}>
            <Box
              name={`mini-building-${id}-${safeLabel}-body`}
              color={index % 2 === 0 ? tone : '#d7d1c6'}
              position={[0, 0.38 + index * 0.018, 0]}
              scale={[0.82, 0.72 + index * 0.05, 0.5]}
            />
            <Box name={`mini-building-${id}-${safeLabel}-roof`} color={roofColor} position={[0, 0.79 + index * 0.018, 0]} scale={[0.92, 0.12, 0.6]} />
            <Box name={`mini-building-${id}-${safeLabel}-awning`} color={index % 2 === 0 ? '#0ea5e9' : '#b45309'} position={[0, 0.58, -0.28]} scale={[0.86, 0.1, 0.08]} />
            <Box name={`mini-building-${id}-${safeLabel}-door`} color="#111827" position={[-0.28, 0.29, -0.29]} scale={[0.17, 0.42, 0.04]} />
            <Box name={`mini-building-${id}-${safeLabel}-window-a`} color="#bae6fd" position={[0.06, 0.42, -0.3]} scale={[0.18, 0.2, 0.04]} />
            <Box name={`mini-building-${id}-${safeLabel}-window-b`} color="#bae6fd" position={[0.31, 0.42, -0.3]} scale={[0.18, 0.2, 0.04]} />
            <Box name={`mini-building-${id}-${safeLabel}-sign-chip`} color={index % 2 === 0 ? '#f8fafc' : '#22d3ee'} position={[-0.18, 0.59, -0.35]} scale={[0.28, 0.055, 0.035]} />
          </group>
        )
      })}
      <MiniParcelCar name={`mini-block-car-a-${id}`} color="#f8fafc" position={[-0.72, 0, -0.72]} rotationY={Math.PI / 2} />
      <MiniParcelCar name={`mini-block-car-b-${id}`} color="#0ea5e9" position={[0.42, 0, 0.96]} rotationY={-Math.PI / 2} />
      <ParcelStreetLight name={`mini-block-light-a-${id}`} position={[-1.18, 0, -1.05]} />
      <ParcelStreetLight name={`mini-block-light-b-${id}`} position={[1.18, 0, 1.0]} />
      <MiniParcelTree name={`mini-block-tree-a-${id}`} position={[-1.06, 0, 0.62]} />
      <MiniParcelTree name={`mini-block-tree-b-${id}`} position={[1.08, 0, -0.12]} />
    </group>
  )
}

function MiniParcelCar({
  name,
  color,
  position,
  rotationY,
}: {
  name: string
  color: string
  position: Vec3
  rotationY: number
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box name={`${name}-body`} color={color} position={[0, 0.16, 0]} scale={[0.28, 0.18, 0.52]} />
      <Box name={`${name}-cabin`} color="#1e293b" position={[0, 0.28, -0.04]} scale={[0.2, 0.14, 0.24]} />
      <Box name={`${name}-front-light`} color="#fde68a" position={[0, 0.18, -0.28]} scale={[0.2, 0.035, 0.025]} />
      <Box name={`${name}-rear-light`} color="#b91c1c" position={[0, 0.18, 0.28]} scale={[0.2, 0.035, 0.025]} />
      <Box name={`${name}-shadow`} color="#111827" position={[0, 0.04, 0]} scale={[0.35, 0.02, 0.64]} />
    </group>
  )
}

function ParcelStreetLight({ name, position }: { name: string; position: Vec3 }) {
  return (
    <group position={position}>
      <Box name={`${name}-pole`} color="#26323d" position={[0, 0.5, 0]} scale={[0.045, 1.0, 0.045]} />
      <Box name={`${name}-head`} color="#fde68a" position={[0.12, 1.02, 0]} scale={[0.24, 0.08, 0.1]} />
    </group>
  )
}

function MiniParcelTree({ name, position }: { name: string; position: Vec3 }) {
  return (
    <group position={position}>
      <Box name={`${name}-trunk`} color="#7c4a25" position={[0, 0.16, 0]} scale={[0.08, 0.32, 0.08]} />
      <mesh name={`${name}-canopy`} position={[0, 0.42, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.22, 0.46, 8]} />
        <meshStandardMaterial color="#254d2c" roughness={0.72} />
      </mesh>
    </group>
  )
}

function RoadsideBusinessDistrict({ theme }: { theme: CityThemeSpec }) {
  if (theme.id === 'harbor') return <HarborRoadsideDistrict theme={theme} />
  if (theme.id === 'downtown') return <DowntownRoadsideDistrict theme={theme} />
  if (theme.id === 'snow') return <SnowRoadsideDistrict theme={theme} />
  if (theme.id === 'beltline') return <BeltlineRoadsideDistrict theme={theme} />

  return (
    <group>
      <DistrictMarquee label="MAIN ST SHOPS" color="#b45309" position={[0, -0.02, -10.95]} />
      <Box name="smalltown-mainstreet-brick-band" color="#9a3412" position={[0, 0.01, -8.18]} scale={[4.3, 0.03, 0.3]} />
      {[-1.55, -0.55, 0.55, 1.55].map((x, index) => (
        <Box name={`smalltown-crosswalk-bar-${index}`} color="#fef3c7" key={`smalltown-crosswalk-${index}`} position={[x, 0.02, -8.18]} scale={[0.45, 0.03, 0.16]} />
      ))}
      <Box name="smalltown-clock-plaza-pad" color="#9a8f84" position={[-18.8, 0.02, -8.4]} scale={[3.2, 0.05, 2.0]} />
      <Box name="smalltown-clock-plaza-tower" color="#d7d1c6" position={[-18.8, 0.92, -8.4]} scale={[0.82, 1.8, 0.82]} />
      <Box name="smalltown-clock-plaza-cap" color="#2f6fba" position={[-18.8, 1.92, -8.4]} scale={[0.92, 0.2, 0.92]} />
      <Box name="smalltown-civic-roofline-west" color="#7c2d12" position={[-8.6, 1.26, -8.62]} scale={[1.9, 0.24, 0.34]} />
      <Box name="smalltown-civic-roofline-east" color="#b45309" position={[8.9, 1.22, -8.6]} scale={[1.7, 0.24, 0.34]} />
      <Box name="smalltown-civic-banner" color="#f59e0b" position={[0.1, 1.08, -8.66]} scale={[1.4, 0.12, 0.08]} />
      <GasStation position={[-12.0, -0.02, -6.2]} theme={theme} />
      <Diner position={[12.25, -0.02, -6.18]} theme={theme} />
      <AutoPartsStore position={[-12.25, -0.02, 6.55]} theme={theme} />
      <ApartmentCourt position={[12.35, -0.02, 6.72]} theme={theme} />
      <StorageWarehouse position={[-19.0, -0.02, 0.6]} theme={theme} />
      <MotelStrip position={[19.0, -0.02, -1.25]} theme={theme} />
      <NeighborhoodHomes position={[-19.2, -0.02, 13.8]} theme={theme} />
      <NeighborhoodHomes position={[18.8, -0.02, 13.8]} theme={theme} mirrored />
    </group>
  )
}

function HarborRoadsideDistrict({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <DistrictMarquee label="FISH MARKET ROW" color="#0e7490" position={[0, -0.02, -10.95]} />
      <Box name="harbor-waterfront-channel" color={theme.water} position={[-17.4, -0.08, -6.2]} scale={[0.42, 0.05, 8.4]} />
      <Box name="harbor-dock-lane-marking" color="#bae6fd" position={[0, 0.02, -8.08]} scale={[3.9, 0.03, 0.08]} />
      {[-2.35, -1.1, 1.15, 2.4].map((x, index) => (
        <Box name={`harbor-bollard-${index}`} color="#475569" key={`harbor-bollard-${index}`} position={[x, 0.2, -7.52]} scale={[0.1, 0.38, 0.1]} />
      ))}
      <GasStation position={[-12.0, -0.02, -6.2]} theme={theme} />
      <SeafoodMarket position={[12.25, -0.02, -6.18]} theme={theme} />
      <AutoPartsStore position={[-12.25, -0.02, 6.55]} theme={theme} />
      <ApartmentCourt position={[12.35, -0.02, 6.72]} theme={theme} />
      <StorageWarehouse position={[-19.0, -0.02, 0.6]} theme={theme} />
      <DockWarehouse position={[19.0, -0.02, -1.25]} theme={theme} />
      <Box name="harbor-crane-base" color="#334155" position={[-20.2, 0.36, -7.6]} scale={[0.28, 0.72, 0.28]} />
      <Box name="harbor-crane-arm" color="#facc15" position={[-19.25, 0.92, -7.6]} scale={[1.8, 0.1, 0.1]} />
      <Box name="harbor-ferry-pier" color="#8b6f55" position={[17.6, 0.02, -8.15]} scale={[2.3, 0.06, 0.78]} />
      <Box name="harbor-ferry-cabin" color="#dbe3e7" position={[17.6, 0.4, -8.15]} scale={[1.26, 0.72, 0.58]} />
      <Box name="harbor-ferry-stripe" color="#0284c7" position={[17.6, 0.52, -8.46]} scale={[1.16, 0.12, 0.08]} />
      <Box name="harbor-container-stack-a" color="#0f766e" position={[-8.4, 0.56, -8.72]} scale={[1.4, 1.0, 0.56]} />
      <Box name="harbor-container-stack-b" color="#0ea5e9" position={[-6.8, 0.46, -8.68]} scale={[1.3, 0.82, 0.54]} />
      <Box name="harbor-container-stack-c" color="#0369a1" position={[-7.55, 1.06, -8.7]} scale={[1.15, 0.38, 0.54]} />
    </group>
  )
}

function DowntownRoadsideDistrict({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <DistrictMarquee label="NEON ARCADE BLVD" color="#ec4899" position={[0, -0.02, -10.95]} />
      <Box name="downtown-curb-neon-north" color="#f472b6" position={[-10.4, 0.08, -8.1]} scale={[3.6, 0.035, 0.08]} />
      <Box name="downtown-curb-neon-south" color="#22d3ee" position={[10.2, 0.08, -8.05]} scale={[3.2, 0.035, 0.08]} />
      {[-2.1, 0, 2.1].map((x, index) => (
        <Box name={`downtown-bus-lane-bar-${index}`} color={index === 1 ? '#22d3ee' : '#f472b6'} key={`downtown-bus-lane-bar-${index}`} position={[x, 0.02, -8.02]} scale={[1.35, 0.028, 0.08]} />
      ))}
      <Box name="downtown-crosswalk-a" color="#e2e8f0" position={[-0.85, 0.01, -10.35]} scale={[1.3, 0.03, 0.11]} />
      <Box name="downtown-crosswalk-b" color="#e2e8f0" position={[0.85, 0.01, -10.35]} scale={[1.3, 0.03, 0.11]} />
      <QuickMart position={[-12.0, -0.02, -6.2]} theme={theme} />
      <Diner position={[12.25, -0.02, -6.18]} theme={theme} />
      <ParkingGarage position={[-12.25, -0.02, 6.55]} theme={theme} />
      <ApartmentCourt position={[12.35, -0.02, 6.72]} theme={theme} />
      <MetroStop position={[0, -0.02, -10.95]} theme={theme} />
      <BillboardTower position={[17.8, -0.02, -8.6]} theme={theme} />
      <SkylineCluster dense position={[-19.0, -0.02, -1.25]} theme={theme} />
      <SkylineCluster dense position={[19.0, -0.02, 1.2]} theme={theme} />
      <Box name="downtown-ped-skybridge-body" color="#475569" position={[0, 1.18, -8.02]} scale={[2.9, 0.24, 0.34]} />
      <Box name="downtown-ped-skybridge-neon-a" color="#22d3ee" position={[0, 1.3, -8.22]} scale={[2.7, 0.08, 0.07]} />
      <Box name="downtown-ped-skybridge-neon-b" color="#f472b6" position={[0, 1.3, -7.82]} scale={[2.7, 0.08, 0.07]} />
      <Box name="downtown-roofline-led-west" color="#1f2937" position={[-8.8, 1.46, -8.66]} scale={[1.95, 0.22, 0.3]} />
      <Box name="downtown-roofline-led-west-band" color="#22d3ee" position={[-8.8, 1.56, -8.86]} scale={[1.72, 0.08, 0.07]} />
      <Box name="downtown-roofline-led-east" color="#1f2937" position={[8.7, 1.44, -8.64]} scale={[1.9, 0.22, 0.3]} />
      <Box name="downtown-roofline-led-east-band" color="#f472b6" position={[8.7, 1.54, -8.84]} scale={[1.68, 0.08, 0.07]} />
    </group>
  )
}

function SnowRoadsideDistrict({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <DistrictMarquee label="SUMMIT LODGE WAY" color="#0f766e" position={[0, -0.02, -10.95]} />
      <Box name="snow-road-berm-north" color="#f8fafc" position={[0, -0.04, -8.55]} scale={[23.5, 0.05, 0.42]} />
      <Box name="snow-road-berm-south" color="#f8fafc" position={[0, -0.04, 8.22]} scale={[23.5, 0.05, 0.42]} />
      {[-3.1, -1.1, 1.1, 3.1].map((x, index) => (
        <Box name={`snow-chain-lane-${index}`} color="#64748b" key={`snow-chain-lane-${index}`} position={[x, 0.015, -8.16]} scale={[0.18, 0.02, 0.42]} />
      ))}
      {[-10.8, -6.4, -2.0, 2.4, 6.8, 11.2].map((x, index) => (
        <group key={`snow-route-marker-${index}`} position={[x, 0, -8.9]}>
          <Box name={`snow-route-post-${index}`} color="#64748b" position={[0, 0.36, 0]} scale={[0.06, 0.72, 0.06]} />
          <Box name={`snow-route-cap-${index}`} color="#f97316" position={[0, 0.72, 0]} scale={[0.2, 0.16, 0.1]} />
        </group>
      ))}
      <FuelAndSaltStop position={[-12.0, -0.02, -6.2]} theme={theme} />
      <SkiRentalLodge position={[12.25, -0.02, -6.18]} theme={theme} />
      <AutoPartsStore position={[-12.25, -0.02, 6.55]} theme={theme} />
      <MotelStrip position={[12.35, -0.02, 6.72]} theme={theme} />
      <NeighborhoodHomes position={[-19.2, -0.02, 13.8]} theme={theme} />
      <Box name="snow-plow-yard" color="#8d9490" position={[19.0, 0.02, -1.25]} scale={[3.9, 0.05, 3.1]} />
      <Box name="snow-plow-shed" color="#cbd5e1" position={[18.6, 0.46, -1.18]} scale={[1.9, 0.92, 1.1]} />
      <Box name="snow-plow-truck" color="#f97316" position={[20.0, 0.32, -1.9]} scale={[0.88, 0.46, 0.5]} />
      <Box name="snow-chairlift-base-a" color="#475569" position={[-18.6, 0.86, -8.3]} scale={[0.16, 1.72, 0.16]} />
      <Box name="snow-chairlift-base-b" color="#475569" position={[-16.5, 0.86, -8.3]} scale={[0.16, 1.72, 0.16]} />
      <Box name="snow-chairlift-cable" color="#94a3b8" position={[-17.55, 1.62, -8.3]} scale={[2.25, 0.07, 0.07]} />
      <Box name="snow-lodge-ridgeline-west" color="#334155" position={[-8.7, 1.22, -8.62]} scale={[1.95, 0.2, 0.28]} />
      <Box name="snow-lodge-ridgeline-east" color="#475569" position={[8.6, 1.2, -8.62]} scale={[1.75, 0.2, 0.28]} />
      <Box name="snow-lodge-ridgeline-snowcap" color="#f8fafc" position={[0, 1.26, -8.72]} scale={[1.5, 0.09, 0.08]} />
    </group>
  )
}

function BeltlineRoadsideDistrict({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <DistrictMarquee label="FLEET SERVICE CORR" color="#f59e0b" position={[0, -0.02, -10.95]} />
      <Box name="beltline-service-road" color="#111827" position={[0, -0.08, -12.0]} scale={[48.0, 0.035, 0.32]} />
      {[-3.3, -1.1, 1.1, 3.3].map((x, index) => (
        <Box name={`beltline-heavy-lane-${index}`} color={index % 2 === 0 ? '#f59e0b' : '#fbbf24'} key={`beltline-heavy-lane-${index}`} position={[x, 0.02, -8.16]} scale={[0.38, 0.028, 0.16]} />
      ))}
      <DistributionCenter position={[-12.0, -0.02, -6.2]} theme={theme} />
      <FastFoodDriveThru position={[12.25, -0.02, -6.18]} theme={theme} />
      <StorageWarehouse position={[-12.25, -0.02, 6.55]} theme={theme} />
      <FleetDepot position={[12.35, -0.02, 6.72]} theme={theme} />
      <BillboardTower position={[-20.0, -0.02, -8.4]} theme={theme} />
      <DockWarehouse position={[19.0, -0.02, -1.25]} theme={theme} />
      <Box name="beltline-overpass-deck" color="#374151" position={[0, 1.16, -8.2]} scale={[5.2, 0.26, 0.86]} />
      <Box name="beltline-overpass-pier-west" color="#1f2937" position={[-2.2, 0.58, -8.2]} scale={[0.36, 1.16, 0.42]} />
      <Box name="beltline-overpass-pier-east" color="#1f2937" position={[2.2, 0.58, -8.2]} scale={[0.36, 1.16, 0.42]} />
      <Box name="beltline-service-gantry-west" color="#111827" position={[-8.9, 1.18, -8.56]} scale={[2.0, 0.22, 0.28]} />
      <Box name="beltline-service-gantry-east" color="#111827" position={[8.9, 1.18, -8.56]} scale={[2.0, 0.22, 0.28]} />
      <Box name="beltline-service-gantry-stripe-west" color="#f59e0b" position={[-8.9, 1.28, -8.74]} scale={[1.8, 0.08, 0.07]} />
      <Box name="beltline-service-gantry-stripe-east" color="#f59e0b" position={[8.9, 1.28, -8.74]} scale={[1.8, 0.08, 0.07]} />
    </group>
  )
}

function GasStation({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="gas-station-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.7, 0.05, 2.7]} />
      <Box name="gas-store" color="#e5e7eb" position={[-1.15, 0.45, 0.62]} scale={[1.55, 0.9, 0.85]} />
      <Box name="gas-store-roof" color="#26323d" position={[-1.15, 0.94, 0.62]} scale={[1.72, 0.16, 1.0]} />
      <Box name="gas-store-awning" color={theme.trim} position={[-1.15, 0.68, 0.08]} scale={[1.55, 0.12, 0.12]} />
      <Box name="gas-store-door" color="#0f172a" position={[-1.45, 0.34, 0.16]} scale={[0.26, 0.5, 0.05]} />
      <Box name="gas-store-window" color="#bae6fd" position={[-0.78, 0.48, 0.16]} scale={[0.48, 0.3, 0.05]} />
      <Box name="gas-canopy-top" color="#f8fafc" position={[1.1, 1.28, -0.18]} scale={[2.15, 0.18, 1.62]} />
      <Box name="gas-canopy-trim" color={theme.accent} position={[1.1, 1.42, -0.18]} scale={[2.25, 0.12, 1.72]} />
      {[-0.02, 0.72].map((x, index) => (
        <group key={`gas-pump-${index}`} position={[0.65 + x, 0, -0.18]}>
          <Box name={`gas-pump-base-${index}`} color="#26323d" position={[0, 0.34, 0]} scale={[0.24, 0.68, 0.22]} />
          <Box name={`gas-pump-face-${index}`} color="#0ea5e9" position={[0, 0.55, -0.13]} scale={[0.18, 0.18, 0.04]} />
          <mesh position={[0.0, 0.88, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.82, 12]} />
            <meshStandardMaterial color="#26323d" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <BusinessSign label="GAS" color={theme.accent} position={[2.15, 0, -1.06]} />
      <ParkingLines name="gas-parking" position={[-1.18, 0.055, -0.88]} spaces={3} rotationY={0} />
    </group>
  )
}

function Diner({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="diner-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.35, 0.05, 2.55]} />
      <Box name="diner-building" color="#f4f1ea" position={[0, 0.42, 0.36]} scale={[2.55, 0.84, 0.92]} />
      <Box name="diner-roof" color="#dc2626" position={[0, 0.9, 0.36]} scale={[2.72, 0.2, 1.05]} />
      <Box name="diner-awning" color={theme.accent} position={[0, 0.64, -0.14]} scale={[2.62, 0.12, 0.16]} />
      {[-0.82, -0.28, 0.28, 0.82].map((x, index) => (
        <Box key={`diner-window-${index}`} name={`diner-window-${index}`} color="#bae6fd" position={[x, 0.48, -0.16]} scale={[0.32, 0.32, 0.05]} />
      ))}
      <Box name="diner-door" color="#0f172a" position={[1.25, 0.35, -0.16]} scale={[0.28, 0.52, 0.06]} />
      <BusinessSign label="DINER" color="#dc2626" position={[1.92, 0, -0.98]} />
      <ParkingLines name="diner-parking" position={[-0.52, 0.055, -0.86]} spaces={4} rotationY={0} />
    </group>
  )
}

function SeafoodMarket({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="seafood-market-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.35, 0.05, 2.55]} />
      <Box name="seafood-market-main" color="#e5f3f4" position={[0, 0.44, 0.3]} scale={[2.4, 0.88, 0.95]} />
      <Box name="seafood-market-roof" color={theme.trim} position={[0, 0.94, 0.3]} scale={[2.55, 0.18, 1.08]} />
      <Box name="seafood-market-awning" color={theme.accent} position={[0, 0.65, -0.22]} scale={[2.48, 0.14, 0.18]} />
      <Text color="#0f172a" fontSize={0.1} position={[-0.86, 0.66, -0.33]}>
        FRESH FISH
      </Text>
      <Box name="seafood-ice-bin" color="#dbeafe" position={[1.1, 0.24, -0.74]} scale={[0.7, 0.28, 0.42]} />
      <BusinessSign label="PIER" color={theme.accent} position={[1.92, 0, -0.98]} />
      <ParkingLines name="seafood-parking" position={[-0.52, 0.055, -0.86]} spaces={4} rotationY={0} />
    </group>
  )
}

function DockWarehouse({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="dock-yard" color="#5b554f" position={[0, 0.02, 0]} scale={[3.95, 0.05, 3.1]} />
      <Box name="dock-main" color="#64748b" position={[0, 0.58, 0.2]} scale={[2.55, 1.16, 1.26]} />
      <Box name="dock-roof" color="#26323d" position={[0, 1.24, 0.2]} scale={[2.72, 0.18, 1.42]} />
      <Box name="dock-door" color="#334155" position={[0.76, 0.48, -0.48]} scale={[0.72, 0.78, 0.08]} />
      <Box name="dock-container-a" color={theme.accent} position={[-1.16, 0.26, -0.84]} scale={[0.82, 0.52, 0.42]} />
      <Box name="dock-container-b" color="#0f4f9c" position={[-1.08, 0.78, -0.84]} scale={[0.78, 0.42, 0.38]} />
      <BusinessSign label="DOCKS" color={theme.trim} position={[-1.78, 0, -1.02]} />
    </group>
  )
}

function QuickMart({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="quickmart-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.7, 0.05, 2.7]} />
      <Box name="quickmart-store" color="#e5e7eb" position={[-0.45, 0.5, 0.42]} scale={[2.5, 1.0, 1.0]} />
      <Box name="quickmart-roof" color="#111827" position={[-0.45, 1.08, 0.42]} scale={[2.72, 0.18, 1.16]} />
      <Box name="quickmart-neon-band" color={theme.accent} position={[-0.45, 0.82, -0.16]} scale={[2.6, 0.12, 0.16]} />
      <Text color="#f8fafc" fontSize={0.11} position={[-1.48, 0.83, -0.27]}>
        QUICK MART
      </Text>
      <Box name="quickmart-window" color="#bae6fd" position={[0.34, 0.5, -0.16]} scale={[0.78, 0.38, 0.06]} />
      <ParkingLines name="quickmart-parking" position={[-0.4, 0.055, -0.92]} spaces={5} rotationY={0} />
    </group>
  )
}

function ParkingGarage({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="parking-garage-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.55, 0.05, 2.45]} />
      <Box name="parking-garage-main" color="#94a3b8" position={[0, 0.78, 0]} scale={[2.8, 1.56, 1.22]} />
      <Box name="parking-garage-roof" color="#64748b" position={[0, 1.6, 0]} scale={[2.95, 0.14, 1.34]} />
      {[0.25, 0.75, 1.2].map((y, row) => (
        <Box key={`garage-slat-${row}`} name={`garage-slat-${row}`} color="#26323d" position={[0, y, -0.64]} scale={[2.55, 0.06, 0.05]} />
      ))}
      <Box name="garage-neon-p" color={theme.accent} position={[-1.08, 1.28, -0.68]} scale={[0.32, 0.38, 0.06]} />
      <Text color="#f8fafc" fontSize={0.16} position={[-1.17, 1.28, -0.74]}>
        P
      </Text>
    </group>
  )
}

function MetroStop({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="metro-platform" color="#c9c4ba" position={[0, 0.04, 0]} scale={[3.7, 0.08, 0.42]} />
      <Box name="metro-shelter-roof" color={theme.trim} position={[0, 0.92, 0]} scale={[2.0, 0.12, 0.52]} />
      <Box name="metro-shelter-post-left" color="#26323d" position={[-0.8, 0.5, 0]} scale={[0.08, 0.9, 0.08]} />
      <Box name="metro-shelter-post-right" color="#26323d" position={[0.8, 0.5, 0]} scale={[0.08, 0.9, 0.08]} />
      <Text color="#f8fafc" fontSize={0.09} position={[-0.52, 0.94, -0.3]}>
        TRANSIT
      </Text>
    </group>
  )
}

function BillboardTower({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="billboard-pole-left" color="#26323d" position={[-0.58, 0.78, 0]} scale={[0.08, 1.56, 0.08]} />
      <Box name="billboard-pole-right" color="#26323d" position={[0.58, 0.78, 0]} scale={[0.08, 1.56, 0.08]} />
      <Box name="billboard-face" color="#0f172a" position={[0, 1.55, -0.05]} scale={[1.7, 0.72, 0.12]} />
      <Text color={theme.accent} fontSize={0.1} position={[-0.66, 1.66, -0.13]}>
        WASH
      </Text>
      <Text color="#f8fafc" fontSize={0.08} position={[-0.62, 1.42, -0.13]}>
        CLEAN CARS
      </Text>
    </group>
  )
}

function FuelAndSaltStop({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <GasStation position={[0, 0, 0]} theme={theme} />
      <Box name="salt-stop-pile" color="#f8fafc" position={[1.9, 0.28, 0.92]} scale={[0.9, 0.46, 0.7]} />
      <Box name="salt-stop-shed" color="#cbd5e1" position={[-2.0, 0.4, -0.78]} scale={[0.84, 0.8, 0.62]} />
    </group>
  )
}

function SkiRentalLodge({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="ski-lodge-lot" color="#8d9490" position={[0, 0.02, 0]} scale={[4.35, 0.05, 2.55]} />
      <Box name="ski-lodge-main" color="#c4a77f" position={[0, 0.54, 0.32]} scale={[2.35, 1.08, 1.08]} />
      <RotBox name="ski-lodge-roof" color="#334155" position={[0, 1.2, 0.32]} rotationY={0.78} scale={[2.1, 0.28, 1.12]} />
      <Text color="#f8fafc" fontSize={0.1} position={[-0.74, 0.74, -0.3]}>
        SKI RENTAL
      </Text>
      <Box name="ski-rack" color="#0ea5e9" position={[1.4, 0.44, -0.68]} scale={[0.1, 0.88, 0.62]} />
      <BusinessSign label="LODGE" color={theme.trim} position={[1.92, 0, -0.98]} />
    </group>
  )
}

function DistributionCenter({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="distribution-yard" color="#5b554f" position={[0, 0.02, 0]} scale={[4.7, 0.05, 2.7]} />
      <Box name="distribution-main" color="#64748b" position={[-0.5, 0.6, 0.2]} scale={[2.75, 1.2, 1.2]} />
      <Box name="distribution-roof" color="#111827" position={[-0.5, 1.28, 0.2]} scale={[2.9, 0.18, 1.36]} />
      {[0, 1, 2].map((index) => (
        <Box key={`dock-door-${index}`} name={`distribution-dock-${index}`} color="#334155" position={[-1.35 + index * 0.72, 0.48, -0.44]} scale={[0.5, 0.68, 0.08]} />
      ))}
      <Box name="distribution-trailer" color="#f8fafc" position={[1.55, 0.36, -0.64]} scale={[1.14, 0.52, 0.42]} />
      <BusinessSign label="LOGIX" color={theme.accent} position={[1.9, 0, -1.0]} />
    </group>
  )
}

function FastFoodDriveThru({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="fastfood-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.35, 0.05, 2.55]} />
      <Box name="fastfood-main" color="#f4f1ea" position={[-0.3, 0.44, 0.25]} scale={[1.8, 0.88, 0.9]} />
      <Box name="fastfood-roof" color="#dc2626" position={[-0.3, 0.94, 0.25]} scale={[1.95, 0.18, 1.05]} />
      <Box name="drive-thru-loop" color="#111827" position={[0.8, 0.05, -0.32]} scale={[1.5, 0.04, 0.52]} />
      <Box name="order-board" color="#0f172a" position={[1.3, 0.44, -0.82]} scale={[0.36, 0.72, 0.08]} />
      <Text color="#f8fafc" fontSize={0.08} position={[-0.92, 0.7, -0.24]}>
        DRIVE THRU
      </Text>
      <BusinessSign label="GRILL" color={theme.accent} position={[1.92, 0, -0.98]} />
    </group>
  )
}

function FleetDepot({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="fleet-yard" color="#5b554f" position={[0, 0.02, 0]} scale={[4.6, 0.05, 2.85]} />
      <Box name="fleet-office" color="#c9c4ba" position={[-1.25, 0.42, 0.25]} scale={[1.0, 0.84, 0.82]} />
      <Box name="fleet-garage" color="#64748b" position={[0.55, 0.58, 0.16]} scale={[1.8, 1.16, 1.12]} />
      <Box name="fleet-garage-door" color="#334155" position={[0.55, 0.46, -0.44]} scale={[0.9, 0.7, 0.08]} />
      <Box name="fleet-van-a" color="#f8fafc" position={[-0.72, 0.28, -0.76]} scale={[0.58, 0.36, 0.34]} />
      <Box name="fleet-van-b" color={theme.accent} position={[1.45, 0.28, -0.72]} scale={[0.58, 0.36, 0.34]} />
      <BusinessSign label="FLEET" color={theme.trim} position={[-1.92, 0, -1.0]} />
    </group>
  )
}

function AutoPartsStore({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="parts-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[4.55, 0.05, 2.45]} />
      <Box name="parts-building" color="#d7d1c6" position={[-0.38, 0.48, -0.05]} scale={[2.65, 0.96, 1.12]} />
      <Box name="parts-roof" color="#334155" position={[-0.38, 1.02, -0.05]} scale={[2.82, 0.18, 1.28]} />
      <Box name="parts-sign-band" color={theme.trim} position={[-0.38, 0.78, -0.66]} scale={[2.62, 0.22, 0.12]} />
      <Text color="#f8fafc" fontSize={0.12} position={[-1.44, 0.78, -0.75]}>
        AUTO PARTS
      </Text>
      <Box name="parts-garage-door" color="#94a3b8" position={[0.72, 0.42, -0.66]} scale={[0.78, 0.62, 0.08]} />
      <Box name="parts-entry-door" color="#0f172a" position={[-1.54, 0.36, -0.66]} scale={[0.28, 0.56, 0.08]} />
      <ParkingLines name="parts-parking" position={[0.1, 0.055, 0.9]} spaces={4} rotationY={Math.PI} />
    </group>
  )
}

function ApartmentCourt({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="apartment-lot" color="#65724f" position={[0, 0.02, 0]} scale={[4.6, 0.05, 2.85]} />
      <Box name="apartment-parking" color="#5b554f" position={[0, 0.045, -0.95]} scale={[4.12, 0.04, 0.8]} />
      {[-1.38, 0, 1.38].map((x, index) => (
        <group key={`apartment-building-${index}`} position={[x, 0, 0.3]}>
          <Box name={`apartment-block-${index}`} color={theme.blockTones[(index + 1) % theme.blockTones.length]} position={[0, 0.56, 0]} scale={[1.04, 1.12, 1.0]} />
          <Box name={`apartment-roof-${index}`} color="#26323d" position={[0, 1.18, 0]} scale={[1.14, 0.14, 1.1]} />
          {[-0.22, 0.22].map((wx, windowIndex) => (
            <Box key={`apt-window-${index}-${windowIndex}`} name={`apt-window-${index}-${windowIndex}`} color="#bae6fd" position={[wx, 0.68, -0.52]} scale={[0.18, 0.2, 0.05]} />
          ))}
        </group>
      ))}
      <ParkingLines name="apartment-parking-lines" position={[0, 0.07, -0.96]} spaces={6} rotationY={0} />
    </group>
  )
}

function StorageWarehouse({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="warehouse-yard" color="#5b554f" position={[0, 0.02, 0]} scale={[3.85, 0.05, 3.15]} />
      <Box name="warehouse-main" color="#94a3b8" position={[0, 0.66, 0]} scale={[2.15, 1.32, 1.62]} />
      <Box name="warehouse-roof" color="#334155" position={[0, 1.38, 0]} scale={[2.32, 0.18, 1.78]} />
      <Box name="warehouse-rollup" color="#64748b" position={[0.0, 0.48, -0.85]} scale={[0.85, 0.72, 0.08]} />
      <Box name="warehouse-office-window" color="#bae6fd" position={[-0.72, 0.66, -0.85]} scale={[0.28, 0.24, 0.06]} />
      <Box name="warehouse-loading-dock" color="#26323d" position={[0, 0.18, -1.18]} scale={[1.15, 0.28, 0.32]} />
      <Box name="warehouse-sign" color={theme.trim} position={[0.2, 1.06, -0.87]} scale={[1.38, 0.18, 0.06]} />
      <Text color="#f8fafc" fontSize={0.08} position={[-0.44, 1.06, -0.93]}>
        STORAGE
      </Text>
      <Box name="warehouse-truck-bay" color="#111827" position={[1.25, 0.06, -0.98]} scale={[0.64, 0.04, 1.15]} />
    </group>
  )
}

function MotelStrip({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name="motel-lot" color="#5b554f" position={[0, 0.02, 0]} scale={[3.95, 0.05, 3.1]} />
      <Box name="motel-main" color="#d7d1c6" position={[0, 0.52, 0.42]} scale={[2.75, 1.04, 0.82]} />
      <Box name="motel-roof" color="#26323d" position={[0, 1.12, 0.42]} scale={[2.92, 0.16, 0.96]} />
      <Box name="motel-balcony" color="#475569" position={[0, 0.86, -0.06]} scale={[2.92, 0.08, 0.12]} />
      {[-1.0, -0.5, 0, 0.5, 1.0].map((x, index) => (
        <Box key={`motel-door-${index}`} name={`motel-door-${index}`} color={index % 2 ? '#0f172a' : '#1e293b'} position={[x, 0.42, -0.03]} scale={[0.24, 0.56, 0.06]} />
      ))}
      <BusinessSign label="MOTEL" color={theme.accent} position={[-1.78, 0, -0.92]} />
      <ParkingLines name="motel-parking" position={[0.48, 0.055, -0.98]} spaces={5} rotationY={0} />
    </group>
  )
}

function NeighborhoodHomes({
  position,
  theme,
  mirrored = false,
}: {
  position: Vec3
  theme: CityThemeSpec
  mirrored?: boolean
}) {
  return (
    <group position={position} rotation={[0, mirrored ? Math.PI : 0, 0]}>
      {[-1.15, 0, 1.15].map((x, index) => (
        <group key={`home-${index}`} position={[x, 0, 0]}>
          <Box name={`home-lawn-${index}`} color={theme.park} position={[0, 0.02, 0]} scale={[0.96, 0.05, 1.18]} />
          <Box name={`home-body-${index}`} color={theme.blockTones[(index + 2) % theme.blockTones.length]} position={[0, 0.34, 0.18]} scale={[0.62, 0.68, 0.56]} />
          <RotBox name={`home-roof-${index}`} color="#334155" position={[0, 0.76, 0.18]} rotationY={0.78} scale={[0.58, 0.18, 0.58]} />
          <Box name={`home-driveway-${index}`} color="#c9c4ba" position={[0.24, 0.04, -0.44]} scale={[0.22, 0.04, 0.64]} />
        </group>
      ))}
    </group>
  )
}

function BusinessSign({
  label,
  color,
  position,
}: {
  label: string
  color: string
  position: Vec3
}) {
  return (
    <group position={position}>
      <Box name={`${label}-business-sign-post`} color="#26323d" position={[0, 0.64, 0]} scale={[0.08, 1.28, 0.08]} />
      <Box name={`${label}-business-sign-face`} color={color} position={[0, 1.18, -0.04]} scale={[0.92, 0.42, 0.1]} />
      <Text color="#f8fafc" fontSize={0.1} position={[-0.36, 1.18, -0.11]}>
        {label}
      </Text>
    </group>
  )
}

function ParkingLines({
  name,
  position,
  spaces,
  rotationY,
}: {
  name: string
  position: Vec3
  spaces: number
  rotationY: number
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: spaces + 1 }, (_, index) => (
        <Box
          color="#f8fafc"
          key={`${name}-${index}`}
          name={`${name}-line-${index}`}
          position={[-spaces * 0.22 + index * 0.44, 0, 0]}
          scale={[0.035, 0.018, 0.58]}
        />
      ))}
    </group>
  )
}

function Park({ position, theme }: { position: Vec3; theme: CityThemeSpec }) {
  return (
    <group position={position}>
      <Box name={`park-${position.join('-')}`} color={theme.park} position={[0, -0.04, 0]} scale={[2.2, 0.055, 1.54]} />
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[-0.75 + index * 0.5, 0.22, -0.28 + (index % 2) * 0.58]} castShadow>
          <cylinderGeometry args={[0.13, 0.18, 0.36, 10]} />
          <meshStandardMaterial color={theme.foliage} roughness={0.65} />
        </mesh>
      ))}
    </group>
  )
}

function Pond({ color, position, scale }: { color: string; position: Vec3; scale: Vec3 }) {
  return (
    <mesh name={`pond-${position.join('-')}`} position={position} scale={scale} receiveShadow>
      <cylinderGeometry args={[0.88, 0.88, 0.045, 36]} />
      <meshStandardMaterial color={color} roughness={0.12} metalness={0.2} />
    </mesh>
  )
}

function SmallTownCityDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      {[
        [-18.6, -0.05, 4.1],
        [17.3, -0.05, -4.8],
        [-10.2, -0.05, 12.0],
      ].map((position, index) => (
        <group key={`small-main-${index}`} position={position as Vec3}>
          <Box name={`small-store-${index}`} color={theme.blockTones[index % theme.blockTones.length]} position={[0, 0.28, 0]} scale={[1.25, 0.56, 0.7]} />
          <Box name={`small-awning-${index}`} color={theme.trim} position={[0, 0.64, -0.38]} scale={[1.36, 0.12, 0.12]} />
          <Box name={`small-lot-${index}`} color={theme.lot} position={[0, -0.02, 0]} scale={[1.7, 0.04, 1.18]} />
        </group>
      ))}
    </group>
  )
}

function HarborCityDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <Box name="harbor-canal-west" color={theme.water} position={[-18.2, -0.08, 0.4]} scale={[0.68, 0.05, 18.8]} />
      <Box name="harbor-canal-east" color={theme.water} position={[18.4, -0.08, -0.6]} scale={[0.68, 0.05, 16.6]} />
      {[
        [-19.0, 0, -6.8],
        [-19.0, 0, 6.5],
        [19.2, 0, -5.7],
        [19.2, 0, 5.6],
      ].map((position, index) => (
        <group key={`dock-${index}`} position={position as Vec3}>
          <Box name={`dock-plank-${index}`} color="#8b6f55" position={[0, -0.015, 0]} scale={[1.4, 0.04, 0.18]} />
          <Box name={`dock-post-a-${index}`} color="#334155" position={[-0.58, 0.2, 0.18]} scale={[0.08, 0.4, 0.08]} />
          <Box name={`dock-post-b-${index}`} color="#334155" position={[0.58, 0.2, 0.18]} scale={[0.08, 0.4, 0.08]} />
        </group>
      ))}
      <SkylineCluster position={[22.8, -0.02, 12.5]} theme={theme} />
    </group>
  )
}

function DowntownCityDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      <SkylineCluster dense position={[-7.0, -0.02, -15.6]} theme={theme} />
      <SkylineCluster dense position={[7.0, -0.02, 15.2]} theme={theme} />
      <SkylineCluster dense position={[18.0, -0.02, -1.8]} theme={theme} />
      {[-11.0, -3.4, 3.6, 11.2].map((x, index) => (
        <Box
          color={index % 2 === 0 ? theme.accent : theme.trim}
          key={`neon-strip-${index}`}
          name={`downtown-neon-strip-${index}`}
          position={[x, 0.16, -10.05]}
          scale={[1.6, 0.05, 0.08]}
        />
      ))}
      <Box name="downtown-parking-deck" color="#3f4547" position={[-17.7, 0.24, 1.8]} scale={[2.5, 0.55, 1.85]} />
      <Box name="downtown-parking-roof" color="#94a3b8" position={[-17.7, 0.56, 1.8]} scale={[2.6, 0.08, 1.95]} />
    </group>
  )
}

function SnowCityDetails() {
  return (
    <group>
      {[
        [-24.3, -0.045, -13.4, 3.4, 0.8],
        [-13.5, -0.045, 11.0, 2.8, 0.7],
        [9.4, -0.045, -14.0, 3.2, 0.68],
        [21.0, -0.045, 6.4, 2.4, 0.74],
        [0.8, -0.045, 12.6, 4.1, 0.62],
      ].map(([x, y, z, sx, sz], index) => (
        <Box
          color="#f8fafc"
          key={`snow-patch-${index}`}
          name={`snow-patch-${index}`}
          position={[x, y, z]}
          scale={[sx, 0.04, sz]}
        />
      ))}
      <Box name="snow-lodge-main" color="#c4a77f" position={[-20.6, 0.35, 8.8]} scale={[1.9, 0.72, 1.1]} />
      <RotBox name="snow-lodge-roof" color="#334155" position={[-20.6, 0.84, 8.8]} rotationY={0.0} scale={[2.1, 0.18, 1.25]} />
      <Box name="snow-salt-shed" color="#cbd5e1" position={[16.2, 0.28, -13.7]} scale={[1.5, 0.56, 0.92]} />
    </group>
  )
}

function BeltlineCityDetails({ theme }: { theme: CityThemeSpec }) {
  return (
    <group>
      {[
        [-22.8, -0.02, -2.8],
        [22.6, -0.02, 2.8],
        [-9.5, -0.02, 14.4],
        [9.7, -0.02, -14.4],
      ].map((position, index) => (
        <group key={`industrial-${index}`} position={position as Vec3}>
          <Box name={`industrial-yard-${index}`} color={theme.lot} position={[0, -0.02, 0]} scale={[3.3, 0.05, 1.6]} />
          <Box name={`industrial-building-${index}`} color={theme.blockTones[index % theme.blockTones.length]} position={[-0.45, 0.38, 0]} scale={[1.35, 0.72, 0.9]} />
          <Box name={`industrial-stack-${index}`} color="#334155" position={[0.92, 0.62, -0.18]} scale={[0.22, 1.2, 0.22]} />
          <Box name={`industrial-accent-${index}`} color={theme.accent} position={[-0.45, 0.76, -0.5]} scale={[1.18, 0.07, 0.08]} />
        </group>
      ))}
      <Box name="beltline-express-road" color="#0f172a" position={[0, -0.11, -2.4]} scale={[46.0, 0.035, 0.22]} />
    </group>
  )
}

function SnowLotDetails() {
  return (
    <group>
      <Box name="wash-snow-front" color="#f8fafc" position={[-5.2, 0.02, -5.95]} scale={[2.1, 0.035, 0.42]} />
      <Box name="wash-snow-office" color="#f8fafc" position={[6.2, 0.02, 3.95]} scale={[2.4, 0.035, 0.45]} />
      <Box name="wash-salt-bin" color="#cbd5e1" position={[6.7, 0.34, -4.2]} scale={[0.48, 0.52, 0.42]} />
    </group>
  )
}

function HarborLotDetails() {
  return (
    <group>
      <Box name="harbor-lot-drain" color="#0e7490" position={[-6.6, 0.02, 1.8]} scale={[0.38, 0.035, 3.4]} />
      <Box name="harbor-service-pipe" color="#64748b" position={[6.95, 0.7, -1.4]} scale={[0.16, 1.4, 0.16]} />
    </group>
  )
}

function DowntownLotDetails() {
  return (
    <group>
      <Box name="downtown-lot-neon-left" color="#f472b6" position={[-5.75, 0.14, -5.25]} scale={[0.9, 0.05, 0.08]} />
      <Box name="downtown-lot-neon-right" color="#22d3ee" position={[5.75, 0.14, 4.25]} scale={[0.9, 0.05, 0.08]} />
      <Box name="downtown-meter-bank" color="#334155" position={[7.1, 0.52, 3.2]} scale={[0.46, 1.04, 0.28]} />
    </group>
  )
}

function CityDistrictIsland({
  active,
  city,
  district,
  position,
  theme,
}: {
  active: boolean
  city: CityDefinition
  district: CityDistrictState | undefined
  position: Vec3
  theme: CityThemeSpec
}) {
  const owned = Boolean(district?.owned)
  const restoration = district?.restoration ?? 0
  const trim = active ? theme.accent : owned ? theme.trim : '#64748b'
  const wall = owned ? theme.wall : '#9b9489'
  const footprint = 1 + restoration * 0.05
  const scale = active ? 1 : 0.82

  if (!active && !owned) {
    return <LockedDistrictPreview city={city} position={position} theme={theme} />
  }

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <Box name={`${city.id}-parcel`} color={owned ? theme.lot : '#57534e'} position={[0, -0.08, 0]} scale={[4.65, 0.12, 3.2]} />
      <Box name={`${city.id}-road-spur`} color={theme.road} position={[0, -0.02, -0.42]} scale={[4.1, 0.07, 0.55]} />
      <Box name={`${city.id}-wash-pad`} color={theme.pad} position={[-0.72, 0.05, 0.55]} scale={[1.65 * footprint, 0.08, 1.9]} />
      <Box name={`${city.id}-wash-wall`} color={wall} position={[-1.5, 0.56, 0.55]} scale={[0.12, 1.04, 1.85]} />
      <Box name={`${city.id}-wash-post`} color={trim} position={[0.1, 0.6, -0.36]} scale={[0.12, 1.08, 0.12]} />
      <Box name={`${city.id}-mini-sign`} color={trim} position={[1.48, 0.49, -0.72]} scale={[0.9, 0.3, 0.08]} />
      <Text color="#f8fafc" fontSize={0.12} position={[1.08, 0.49, -0.78]}>
        {owned ? city.name.toUpperCase() : 'FOR SALE'}
      </Text>
      {Array.from({ length: 2 + Math.min(4, restoration) }, (_, tower) => (
        <Box
          color={tower % 2 === 0 ? theme.skylineA : theme.skylineB}
          key={tower}
          name={`${city.id}-tower-${tower}`}
          position={[0.7 + tower * 0.38, 0.34 + tower * 0.08, 0.35 + (tower % 2) * 0.58]}
          scale={[0.24, 0.76 + tower * 0.12, 0.24]}
        />
      ))}
      {theme.id === 'snow' && (
        <>
          <Box name={`${city.id}-snow-cap`} color="#f8fafc" position={[-0.72, 0.13, 0.55]} scale={[1.7 * footprint, 0.035, 1.95]} />
          <Box name={`${city.id}-ice-strip`} color="#7dd3fc" position={[0.8, -0.01, 1.25]} scale={[0.7, 0.03, 0.18]} />
        </>
      )}
      {theme.id === 'harbor' && <Box name={`${city.id}-dock`} color="#8b6f55" position={[1.52, 0.03, 0.9]} scale={[0.92, 0.06, 0.2]} />}
      {theme.id === 'beltline' && <Box name={`${city.id}-mini-conveyor`} color="#111827" position={[-0.72, 0.14, 0.55]} scale={[0.24, 0.08, 1.6]} />}
      {(active || restoration > 2) && <DistrictMiniMapDetails city={city} owned={owned} restoration={restoration} theme={theme} />}
      {active && <Box name={`${city.id}-active-glow`} color="#22d3ee" position={[0, 0.24, -1.75]} scale={[3.5, 0.08, 0.12]} />}
    </group>
  )
}

function DistrictMarquee({
  label,
  color,
  position,
}: {
  label: string
  color: string
  position: Vec3
}) {
  return (
    <group position={position}>
      <Box name={`${label}-marquee-base`} color="#1f2937" position={[0, 0.64, 0]} scale={[4.2, 0.28, 0.18]} />
      <Box name={`${label}-marquee-face`} color={color} position={[0, 0.66, -0.1]} scale={[4.0, 0.22, 0.08]} />
      <Text color="#f8fafc" fontSize={0.14} position={[-1.8, 0.66, -0.16]}>
        {label}
      </Text>
    </group>
  )
}

function LockedDistrictPreview({
  city,
  position,
  theme,
}: {
  city: CityDefinition
  position: Vec3
  theme: CityThemeSpec
}) {
  return (
    <group position={position} scale={[0.72, 0.72, 0.72]}>
      <Box name={`${city.id}-locked-parcel`} color="#4b5563" position={[0, -0.06, 0]} scale={[3.85, 0.1, 2.54]} />
      <Box name={`${city.id}-locked-pad`} color="#8b8a82" position={[-0.46, 0.05, 0.28]} scale={[1.15, 0.08, 1.36]} />
      <Box name={`${city.id}-locked-wall`} color="#a8a29e" position={[-1.06, 0.42, 0.28]} scale={[0.12, 0.78, 1.28]} />
      <Box name={`${city.id}-locked-sign`} color="#64748b" position={[1.08, 0.38, -0.62]} scale={[0.74, 0.24, 0.08]} />
      <Text color="#e5e7eb" fontSize={0.1} position={[0.72, 0.38, -0.68]}>
        {city.name.toUpperCase()}
      </Text>
      <Text color={theme.accent} fontSize={0.075} position={[-1.08, 0.8, -0.28]}>
        LOCKED
      </Text>
    </group>
  )
}

function DistrictMiniMapDetails({
  city,
  owned,
  restoration,
  theme,
}: {
  city: CityDefinition
  owned: boolean
  restoration: number
  theme: CityThemeSpec
}) {
  const progress = Math.max(1, restoration)
  const curbColor = theme.id === 'snow' ? '#f8fafc' : '#d7d1c6'
  const detailColor = owned ? theme.accent : '#78716c'

  return (
    <group>
      <Box name={`${city.id}-mini-curb-north`} color={curbColor} position={[0, 0.005, -1.52]} scale={[4.45, 0.035, 0.08]} />
      <Box name={`${city.id}-mini-curb-south`} color={curbColor} position={[0, 0.005, 1.42]} scale={[4.45, 0.035, 0.08]} />
      <Box name={`${city.id}-mini-curb-west`} color={curbColor} position={[-2.22, 0.005, -0.05]} scale={[0.08, 0.035, 2.8]} />
      <Box name={`${city.id}-mini-curb-east`} color={curbColor} position={[2.22, 0.005, -0.05]} scale={[0.08, 0.035, 2.8]} />
      <Box name={`${city.id}-district-mini-main-st`} color={theme.road} position={[0, 0.0, -0.42]} scale={[4.08, 0.035, 0.28]} />
      <Box name={`${city.id}-district-mini-cross-st`} color={theme.road} position={[0.62, 0.0, 0.55]} scale={[0.28, 0.035, 1.62]} />
      {Array.from({ length: progress }, (_, index) => (
        <Box
          color={detailColor}
          key={`district-progress-${city.id}-${index}`}
          name={`${city.id}-restored-frontage-${index}`}
          position={[-1.7 + index * 0.32, 0.08, -1.28]}
          scale={[0.22, 0.13, 0.12]}
        />
      ))}
      {theme.id === 'downtown' && (
        <Box name={`${city.id}-mini-transit-stop`} color="#f472b6" position={[0.68, 0.12, -0.98]} scale={[0.7, 0.08, 0.08]} />
      )}
      {theme.id === 'smallTown' && (
        <Box name={`${city.id}-mini-neighborhood-lawn`} color={theme.park} position={[1.36, -0.005, 1.06]} scale={[1.18, 0.03, 0.46]} />
      )}
      {theme.id === 'harbor' && (
        <Box name={`${city.id}-mini-water-edge`} color={theme.water} position={[2.0, -0.005, 0.55]} scale={[0.28, 0.03, 1.5]} />
      )}
    </group>
  )
}

function LanePaint({ x, index, theme }: { x: number; index: number; theme: CityThemeSpec }) {
  return (
    <group>
      <Box name={`bay-${index + 1}-approach`} color={theme.road} position={[x, 0.012, -2.15]} scale={[1.12, 0.045, 5.8]} />
      <Box name={`bay-${index + 1}-line`} color={theme.stripe} position={[x, 0.048, -2.15]} scale={[0.06, 0.024, 5.25]} />
    </group>
  )
}

function ClosedBayExpansionPads({ bayCount, theme }: { bayCount: number; theme: CityThemeSpec }) {
  const closed = futureBayXPositions(bayCount)
  if (closed.length === 0) return null

  return (
    <group>
      {closed.map((x, index) => (
        <group key={`future-bay-pad-${index}`} position={[x, 0, 0.05]}>
          <Box name={`future-bay-${index + 1}-pad`} color="#8b8580" position={[0, 0.035, 0]} scale={[2.22, 0.055, 5.2]} />
          <Box name={`future-bay-${index + 1}-outline-front`} color={theme.trim} position={[0, 0.09, -2.32]} scale={[1.5, 0.035, 0.06]} />
          <Box name={`future-bay-${index + 1}-outline-back`} color={theme.trim} position={[0, 0.09, 2.32]} scale={[1.5, 0.035, 0.06]} />
          <Text color="#f8fafc" fontSize={0.12} position={[-0.58, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            FUTURE BAY
          </Text>
        </group>
      ))}
    </group>
  )
}

function BayRow({ state, onCollect, theme }: { state: GameState; onCollect: () => void; theme: CityThemeSpec }) {
  const count = activeBayCount(state)
  const bays = state.bays.slice(0, count)
  const headerWidth = count === 2 ? 5.8 : count === 3 ? 8.6 : 11.3

  return (
    <group>
      {bays.map((bay, index) => (
        <SelfServeBay
          bay={bay}
          index={index}
          key={bay.id}
          state={state}
          onCollect={onCollect}
          theme={theme}
          x={bayXForIndex(index, count)}
        />
      ))}
      <Box name="row-header" color="#26323d" position={[0, 2.44, -2.88]} scale={[headerWidth, 0.28, 0.22]} />
      <Box name="row-front-fascia" color="#54707f" position={[0, 2.74, -2.88]} scale={[headerWidth + 0.25, 0.18, 0.44]} />
      <Box name="row-rear-fascia" color="#54707f" position={[0, 2.58, 2.78]} scale={[headerWidth + 0.25, 0.14, 0.3]} />
      <Box name="row-blue-trim-front" color="#0284c7" position={[0, 2.91, -2.88]} scale={[headerWidth + 0.45, 0.08, 0.56]} />
      <Box name="row-wash-awning" color="#e5e7eb" position={[0, 2.36, -3.18]} scale={[headerWidth - 0.15, 0.09, 0.42]} />
      <Text color="#f8fafc" fontSize={count === 2 ? 0.2 : 0.26} position={[count === 2 ? -1.55 : -1.35, 2.42, -3.03]}>
        SELF-SERVE WASH
      </Text>
      <Text color="#22d3ee" fontSize={0.15} position={[headerWidth * 0.26, 2.74, -3.18]}>
        {count} BAYS
      </Text>
      {state.upgrades.securityLights && (
        <>
          <Box name="light-bar-front" color="#fde68a" position={[0, 2.2, -2.62]} scale={[10.4, 0.05, 0.08]} />
          <Box name="light-bar-rear" color="#fde68a" position={[0, 2.2, 2.25]} scale={[10.4, 0.05, 0.08]} />
        </>
      )}
    </group>
  )
}

function SelfServeBay({
  bay,
  index,
  state,
  onCollect,
  theme,
  x,
}: {
  bay: BayState
  index: number
  state: GameState
  onCollect: () => void
  theme: CityThemeSpec
  x: number
}) {
  const trimColor = state.upgrades.paint ? theme.trim : '#2f6fba'
  const due = cashBoxValue(bay.cashBox)
  const activeCar = state.cars.find((car) => car.stage === 'washing' && car.bayIndex === index)

  return (
    <group position={[x, 0, 0.05]}>
      <Box name={`bay-${bay.id}-pad`} color={theme.pad} position={[0, 0.04, 0]} scale={[2.55, 0.08, 5.95]} />
      <Box name={`bay-${bay.id}-drain`} color="#111827" position={[0, 0.105, 0.45]} scale={[0.28, 0.035, 3.6]} />
      <Box name={`bay-${bay.id}-guide`} color={theme.stripe} position={[0, 0.13, -0.35]} scale={[0.07, 0.03, 4.45]} />
      <Box name={`bay-${bay.id}-left-wall`} color={theme.wall} position={[-1.28, 1.1, 0]} scale={[0.16, 2.2, 5.9]} />
      <Box name={`bay-${bay.id}-right-wall`} color={theme.wall} position={[1.28, 1.1, 0]} scale={[0.16, 2.2, 5.9]} />
      <Box name={`bay-${bay.id}-left-tile-band`} color={trimColor} position={[-1.36, 0.72, 0]} scale={[0.045, 0.28, 5.55]} />
      <Box name={`bay-${bay.id}-right-tile-band`} color={trimColor} position={[1.36, 0.72, 0]} scale={[0.045, 0.28, 5.55]} />
      <Box name={`bay-${bay.id}-wet-pad`} color="#94a3b8" position={[0, 0.125, 0.52]} scale={[1.24, 0.026, 3.1]} />
      <TransparentBox
        name={`bay-${bay.id}-soap-sheen`}
        color="#bae6fd"
        position={[0, 0.15, 0.18]}
        scale={[1.06, 0.024, 2.42]}
        opacity={0.22}
      />
      <Box name={`bay-${bay.id}-front-post-left`} color={trimColor} position={[-1.28, 1.15, -2.78]} scale={[0.25, 2.3, 0.2]} />
      <Box name={`bay-${bay.id}-front-post-right`} color={trimColor} position={[1.28, 1.15, -2.78]} scale={[0.25, 2.3, 0.2]} />
      {/* Light, slim roof rails — the bays must read from the default camera. */}
      <Box name={`bay-${bay.id}-roof-left`} color="#a9b8c2" position={[-1.28, 2.55, 0]} scale={[0.18, 0.13, 5.95]} />
      <Box name={`bay-${bay.id}-roof-right`} color="#a9b8c2" position={[1.28, 2.55, 0]} scale={[0.18, 0.13, 5.95]} />
      <Box name={`bay-${bay.id}-roof-center-beam`} color="#8fa2ae" position={[0, 2.5, 0]} scale={[0.09, 0.09, 5.78]} />
      <Text color="#111827" fontSize={0.3} position={[-0.22, 0.16, -2.22]} rotation={[-Math.PI / 2, 0, 0]}>
        {bay.id}
      </Text>
      <InstructionWall selectorLevel={bay.upgrades.selector} cardReader={state.upgrades.cardReader} />
      <PressureWand wandLevel={bay.upgrades.wand} soapLevel={bay.upgrades.soap} />
      {bay.upgrades.rinse > 0 && <RinseRail level={bay.upgrades.rinse} />}
      {bay.upgrades.dryer > 0 && <DryerBoom level={bay.upgrades.dryer} />}
      {bay.upgrades.vault > 0 && <VaultMarker level={bay.upgrades.vault} />}
      <BayUpgradeRewardSet bay={bay} theme={theme} />
      <BayEquipmentSkyline bay={bay} />
      {bay.upgrades.rinse + bay.upgrades.dryer + bay.upgrades.selector > 5 && (
        <Box name={`bay-${bay.id}-premium-strip`} color="#22d3ee" position={[0, 2.34, -2.65]} scale={[2.05, 0.07, 0.09]} />
      )}
      {state.upgrades.coinCameras && <SecurityCamera />}
      {activeCar && <BayWashActivity car={activeCar} bayIndex={index} />}
      <PayBoxHotspot
        bay={bay}
        due={due}
        collectRequired={state.collectRequired}
        onCollect={onCollect}
      />
    </group>
  )
}

const SPRAY_DROP_COUNT = 9
const SPRAY_CYCLE_SECONDS = 1.35

/** Looped low-count spray + suds while a wash runs (art bible §17: 5–20 particles). */
function WashSprayFX({ bayId }: { bayId: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: SPRAY_DROP_COUNT }, (_, index) => ({
        phase: (index / SPRAY_DROP_COUNT) * SPRAY_CYCLE_SECONDS,
        x: -0.55 + (index % 3) * 0.55 + (index % 2) * 0.1,
        z: -0.55 + ((index * 0.47) % 1.65),
        speed: 0.85 + ((index * 0.13) % 0.5),
      })),
    [],
  )
  const dropRefs = useRef<(THREE.Mesh | null)[]>([])
  const sudsRefs = useRef<(THREE.Mesh | null)[]>([])
  const time = useRef(0)

  useFrame((_, delta) => {
    time.current += delta
    const t = time.current
    seeds.forEach((seed, index) => {
      const drop = dropRefs.current[index]
      if (!drop) return
      const cycle = ((t * seed.speed + seed.phase) % SPRAY_CYCLE_SECONDS) / SPRAY_CYCLE_SECONDS
      drop.position.set(seed.x, 0.35 + cycle * 1.15, seed.z)
      drop.scale.setScalar(0.06 + Math.sin(cycle * Math.PI) * 0.085)
    })
    sudsRefs.current.forEach((suds, index) => {
      if (!suds) return
      const pulse = 0.75 + Math.sin(t * 2.1 + index * 1.7) * 0.25
      suds.scale.setScalar((0.2 + index * 0.04) * pulse)
    })
  })

  return (
    <group name={`bay-${bayId}-wash-spray`}>
      {seeds.map((seed, index) => (
        <mesh
          key={`drop-${index}`}
          position={[seed.x, 0.4, seed.z]}
          ref={(el) => {
            dropRefs.current[index] = el
          }}
        >
          <primitive attach="geometry" object={getSphereGeometry(1, 6, 5)} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.55} transparent opacity={0.9} roughness={0.25} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={`suds-${index}`}
          position={[index % 2 === 0 ? -0.34 : 0.34, 0.58, -0.5 + index * 0.4]}
          ref={(el) => {
            sudsRefs.current[index] = el
          }}
        >
          <primitive attach="geometry" object={getSphereGeometry(1, 6, 5)} />
          <meshStandardMaterial color="#ffffff" emissive="#bfdbfe" emissiveIntensity={0.2} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}

function BayWashActivity({ bayIndex, car }: { bayIndex: number; car: Car }) {
  const side = (Math.floor(car.progress * 4) + bayIndex) % 2 === 0 ? 1 : -1
  const sweep = (car.progress * 2.2) % 1
  const workerZ = lerp(-0.72, 0.84, sweep)
  const mistColor = car.progress < 0.38 ? '#bfdbfe' : car.progress < 0.7 ? '#f8fafc' : '#bae6fd'
  const stageLabel = washStageLabel(car.progress)

  return (
    <group>
      <WashSprayFX bayId={bayIndex + 1} />
      <group position={[0, 2.62, -2.42]}>
        <Box name={`bay-${bayIndex + 1}-occupied-header`} color="#0f172a" position={[0, 0, 0]} scale={[1.52, 0.2, 0.08]} />
        <Box name={`bay-${bayIndex + 1}-occupied-state`} color={mistColor} position={[-0.58, 0.01, -0.05]} scale={[0.14, 0.12, 0.04]} />
        <Text color="#f8fafc" fontSize={0.092} anchorX="center" anchorY="middle" position={[0.1, 0.01, -0.05]}>
          {stageLabel}
        </Text>
      </group>
      <group position={[0, 2.43, -2.42]}>
        <Box name={`bay-${bayIndex + 1}-occupied-progress-bg`} color="#0b1220" position={[0, 0, 0]} scale={[1.52, 0.1, 0.05]} />
        <Box
          name={`bay-${bayIndex + 1}-occupied-progress-fill`}
          color={mistColor}
          position={[-0.76 + car.progress * 0.76, 0.01, -0.01]}
          scale={[1.52 * car.progress, 0.11, 0.04]}
        />
      </group>
      <TransparentBox
        name={`bay-${bayIndex + 1}-active-mist`}
        color={mistColor}
        opacity={0.28}
        position={[0, 0.96, 0.42]}
        scale={[1.48, 0.46, 2.22]}
      />
      <TransparentBox
        name={`bay-${bayIndex + 1}-active-spray-line`}
        color="#bfdbfe"
        opacity={0.42}
        position={[side * 0.45, 1.0, workerZ]}
        scale={[0.86, 0.045, 0.24]}
      />
      <group position={[side * 0.92, 0, workerZ]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
        <Box name={`bay-${bayIndex + 1}-worker-shirt`} color="#f97316" position={[0, 0.75, 0]} scale={[0.28, 0.56, 0.18]} />
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.15, 18, 18]} />
          <meshStandardMaterial color="#c08457" roughness={0.5} />
        </mesh>
        <Box name={`bay-${bayIndex + 1}-worker-leg-left`} color="#111827" position={[-0.08, 0.34, 0]} scale={[0.08, 0.42, 0.08]} />
        <Box name={`bay-${bayIndex + 1}-worker-leg-right`} color="#111827" position={[0.08, 0.34, 0]} scale={[0.08, 0.42, 0.08]} />
        <mesh position={[0.32, 0.78, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.72, 14]} />
          <meshStandardMaterial color="#111827" roughness={0.35} />
        </mesh>
      </group>
    </group>
  )
}

function InstructionWall({ selectorLevel, cardReader }: { selectorLevel: number; cardReader: boolean }) {
  return (
    <group position={[-1.18, 0, -0.52]} rotation={[0, Math.PI / 2, 0]}>
      <Box name="instruction-board" color="#0f4f9c" position={[0, 1.45, 0]} scale={[0.94, 1.42, 0.05]} />
      <Text color="#f8fafc" fontSize={0.095} position={[-0.38, 1.96, -0.04]}>
        INSTRUCTIONS
      </Text>
      {['PRE SOAK', 'SOAP', 'BRUSH', 'RINSE'].map((label, stripIndex) => (
        <group key={label} position={[0, 1.72 - stripIndex * 0.23, -0.065]}>
          <Box name={`${label}-strip`} color={stripColor(stripIndex)} position={[0, 0, 0]} scale={[0.78, 0.14, 0.03]} />
          <Text color="#ffffff" fontSize={0.047} position={[-0.3, -0.015, -0.026]}>
            {label}
          </Text>
        </group>
      ))}
      <Box name="pay-box-cabinet" color="#b8c0c8" position={[0.9, 1.04, 0]} scale={[0.55, 1.15, 0.28]} />
      <Box name="pay-box-face" color="#0756a5" position={[0.9, 1.06, -0.165]} scale={[0.45, 0.88, 0.055]} />
      <Box name="coin-slot" color="#111827" position={[0.98, 1.12, -0.2]} scale={[0.23, 0.05, 0.04]} />
      <Box name="bill-slot" color="#111827" position={[0.98, 0.75, -0.2]} scale={[0.28, 0.06, 0.04]} />
      {selectorLevel > 0 && <DialCluster level={selectorLevel} />}
      {cardReader && <CardReader />}
    </group>
  )
}

function DialCluster({ level }: { level: number }) {
  return (
    <group position={[0.87, 1.34, -0.21]}>
      {['#ef4444', '#22c55e', '#38bdf8'].map((color, index) => (
        <mesh key={color} position={[-0.12 + index * 0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.026, 24]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
      {level >= 4 && <Box name="selector-screen" color="#22d3ee" position={[0, 0.16, 0]} scale={[0.26, 0.08, 0.03]} />}
    </group>
  )
}

function CardReader() {
  return (
    <group position={[1.12, 0.96, -0.21]}>
      <Box name="card-reader" color="#0f172a" position={[0, 0, 0]} scale={[0.12, 0.36, 0.04]} />
      <Box name="tap-light" color="#22c55e" position={[0, 0.13, -0.03]} scale={[0.08, 0.06, 0.018]} />
    </group>
  )
}

function PressureWand({ wandLevel, soapLevel }: { wandLevel: number; soapLevel: number }) {
  return (
    <group>
      <mesh position={[-1.03, 1.26, -2.0]} rotation={[0.42, 0, -0.25]}>
        <cylinderGeometry args={[wandLevel > 0 ? 0.044 : 0.034, wandLevel > 0 ? 0.044 : 0.034, 1.02, 18]} />
        <meshStandardMaterial color={wandLevel > 0 ? '#2563eb' : '#111827'} roughness={0.42} />
      </mesh>
      <mesh position={[-0.96, 0.9, -1.74]} rotation={[0.65, 0.2, -0.2]}>
        <cylinderGeometry args={[0.024, 0.024, 1.12, 18]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
      </mesh>
      {soapLevel > 0 && (
        <group position={[0.86, 0.62, -1.75]}>
          <mesh castShadow>
            <cylinderGeometry
              args={[0.18 + soapLevel * 0.028, 0.18 + soapLevel * 0.028, 0.56 + soapLevel * 0.09, 28]}
            />
            <meshStandardMaterial color="#10b981" roughness={0.42} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function RinseRail({ level }: { level: number }) {
  return (
    <group position={[1.04, 1.55, 0.65]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2.7, 18]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.35} />
      </mesh>
      {level >= 3 && <TransparentBox name="rinse-mist" color="#bae6fd" position={[-0.2, -0.25, 0]} scale={[0.1, 0.7, 1.6]} opacity={0.28} />}
    </group>
  )
}

function DryerBoom({ level }: { level: number }) {
  const nozzles = Math.min(5, 1 + level)
  const width = 1.4 + level * 0.12
  return (
    <group position={[0, 1.8, 2.35]}>
      <Box name="dryer-header" color={level >= 4 ? '#0f766e' : '#334155'} position={[0, 0, 0]} scale={[width, 0.16, 0.18]} />
      {Array.from({ length: nozzles }, (_, index) => (
        <Box
          key={`dryer-nozzle-${index}`}
          name={`dryer-nozzle-${index}`}
          color="#111827"
          position={[-(width / 2 - 0.28) + index * ((width - 0.56) / Math.max(1, nozzles - 1)), -0.15, -0.06]}
          scale={[0.16, 0.22, 0.14]}
        />
      ))}
    </group>
  )
}

function VaultMarker({ level }: { level: number }) {
  return (
    <group position={[-1.08, 1.74, 0.35]}>
      <Box name="vault-marker" color={level >= 4 ? '#facc15' : '#475569'} position={[0, 0, 0]} scale={[0.16, 0.16, 0.44]} />
      <Text color="#111827" fontSize={0.045} position={[-0.09, 0, -0.24]} rotation={[0, -Math.PI / 2, 0]}>
        Lv{level}
      </Text>
    </group>
  )
}

function BayUpgradeRewardSet({ bay, theme }: { bay: BayState; theme: CityThemeSpec }) {
  const levels = bay.upgrades
  const totalLevel = levels.selector + levels.wand + levels.soap + levels.rinse + levels.dryer + levels.vault
  if (totalLevel <= 0) return null

  return (
    <group>
      {/* High-contrast bay header so level 1 upgrades read from default camera. */}
      <group position={[0, 2.55, 0.05]}>
        <Box name={`bay-${bay.id}-upgrade-header-bar`} color={theme.accent} position={[0, 0, 0]} scale={[2.35, 0.12, 0.16]} />
        <Box name={`bay-${bay.id}-upgrade-header-glow`} color="#f8fafc" position={[0, 0.02, -0.06]} scale={[1.4, 0.04, 0.05]} />
        <mesh position={[0, 0.18, 0]} castShadow>
          <sphereGeometry args={[0.09 + Math.min(0.08, totalLevel * 0.01), 16, 16]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.55} roughness={0.35} />
        </mesh>
      </group>
      <BayLevelRail bayId={bay.id} levels={levels} />
      {levels.selector > 0 && <SelectorUpgradeProps bayId={bay.id} level={levels.selector} theme={theme} />}
      {levels.wand > 0 && <WandUpgradeProps bayId={bay.id} level={levels.wand} />}
      {levels.soap > 0 && <SoapUpgradeProps bayId={bay.id} level={levels.soap} theme={theme} />}
      {levels.rinse > 0 && <RinseUpgradeProps bayId={bay.id} level={levels.rinse} />}
      {levels.dryer > 0 && <DryerUpgradeProps bayId={bay.id} level={levels.dryer} />}
      {levels.vault > 0 && <VaultUpgradeProps bayId={bay.id} level={levels.vault} />}
    </group>
  )
}

const SKYLINE_ENTRIES: Array<{ id: BayUpgradeId; color: string }> = [
  { id: 'selector', color: '#f97316' },
  { id: 'wand', color: '#2563eb' },
  { id: 'soap', color: '#10b981' },
  { id: 'rinse', color: '#38bdf8' },
  { id: 'dryer', color: '#facc15' },
  { id: 'vault', color: '#22c55e' },
]

/**
 * Rooftop equipment that grows with each level — height reads at any zoom, so
 * every purchase visibly changes the building (art bible: upgrades are *seen*).
 */
function BayEquipmentSkyline({ bay }: { bay: BayState }) {
  const levels = bay.upgrades
  const total = levels.selector + levels.wand + levels.soap + levels.rinse + levels.dryer + levels.vault
  if (total <= 0) return null

  return (
    <group position={[0, 2.62, 1.05]}>
      <Box name={`bay-${bay.id}-skyline-base`} color="#8fa2ae" position={[0, 0.05, 0]} scale={[2.14, 0.1, 0.56]} />
      {SKYLINE_ENTRIES.map((entry, index) => {
        const level = levels[entry.id]
        if (level <= 0) return null
        const height = 0.14 + level * 0.1
        const maxed = level >= 6
        return (
          <group key={`bay-${bay.id}-skyline-${entry.id}`} position={[-0.85 + index * 0.34, 0.1, 0]}>
            <Box
              name={`bay-${bay.id}-skyline-${entry.id}-unit`}
              color={entry.color}
              position={[0, height / 2, 0]}
              scale={[0.25, height, 0.32]}
            />
            <Box
              name={`bay-${bay.id}-skyline-${entry.id}-vent`}
              color="#f8fafc"
              position={[0, height + 0.03, 0]}
              scale={[maxed ? 0.31 : 0.17, 0.06, maxed ? 0.38 : 0.2]}
            />
            {maxed && (
              <mesh position={[0, height + 0.16, 0]} castShadow>
                <sphereGeometry args={[0.07, 12, 10]} />
                <meshStandardMaterial color={entry.color} emissive={entry.color} emissiveIntensity={0.6} roughness={0.3} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

const UPGRADE_POP_SPARKS = 10
const UPGRADE_POP_LIFE = 0.85

/** Short gold sparkle at a bay right after buying equipment there. */
function UpgradePop({ bayX }: { bayX: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: UPGRADE_POP_SPARKS }, (_, index) => ({
        velocity: [
          Math.cos((index / UPGRADE_POP_SPARKS) * Math.PI * 2) * (1.1 + (index % 3) * 0.35),
          1.6 + (index % 4) * 0.45,
          Math.sin((index / UPGRADE_POP_SPARKS) * Math.PI * 2) * (1.1 + (index % 3) * 0.35),
        ] as Vec3,
      })),
    [],
  )
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([])
  const life = useRef(0)

  useFrame((_, delta) => {
    life.current = Math.min(UPGRADE_POP_LIFE, life.current + delta)
    const t = life.current
    const fade = Math.max(0.001, 1 - Math.pow(t / UPGRADE_POP_LIFE, 2))
    seeds.forEach((seed, index) => {
      const spark = sparkRefs.current[index]
      if (!spark) return
      spark.position.set(bayX + seed.velocity[0] * t, 2.7 + seed.velocity[1] * t - 2.6 * t * t, 0.6 + seed.velocity[2] * t)
      spark.scale.setScalar(0.14 * fade)
    })
  })

  return (
    <group>
      {seeds.map((_, index) => (
        <mesh
          key={index}
          position={[bayX, 2.7, 0.6]}
          scale={[0.001, 0.001, 0.001]}
          ref={(el) => {
            sparkRefs.current[index] = el
          }}
        >
          <primitive attach="geometry" object={getSphereGeometry(1, 8, 6)} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#facc15' : '#f8fafc'}
            emissive="#f59e0b"
            emissiveIntensity={0.7}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  )
}

function BayLevelRail({ bayId, levels }: { bayId: number; levels: BayState['upgrades'] }) {
  const entries: Array<{ id: keyof BayState['upgrades']; color: string; label: string }> = [
    { id: 'selector', color: '#f97316', label: 'SEL' },
    { id: 'wand', color: '#2563eb', label: 'PSI' },
    { id: 'soap', color: '#10b981', label: 'FOAM' },
    { id: 'rinse', color: '#38bdf8', label: 'RINSE' },
    { id: 'dryer', color: '#facc15', label: 'DRY' },
    { id: 'vault', color: '#22c55e', label: 'SAFE' },
  ]

  return (
    <group position={[0, 2.2, -2.54]}>
      <Box name={`bay-${bayId}-upgrade-rail-bg`} color="#0f172a" position={[0, 0, 0]} scale={[2.18, 0.18, 0.08]} />
      {entries.map((entry, index) => {
        const level = levels[entry.id]
        return (
          <group key={`bay-${bayId}-upgrade-rail-${entry.id}`} position={[-0.92 + index * 0.37, 0, -0.06]}>
            <Box
              name={`bay-${bayId}-${entry.id}-upgrade-chip`}
              color={level > 0 ? entry.color : '#334155'}
              position={[0, 0.01, 0]}
              scale={[0.28, 0.11, 0.04]}
            />
            <Box
              name={`bay-${bayId}-${entry.id}-upgrade-fill`}
              color={level > 0 ? '#f8fafc' : '#64748b'}
              position={[-0.1 + level * 0.017, 0.014, -0.025]}
              scale={[Math.max(0.025, level * 0.034), 0.03, 0.02]}
            />
            <Text color="#f8fafc" fontSize={0.033} anchorX="center" anchorY="middle" position={[0, 0.012, -0.045]}>
              {entry.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

function SelectorUpgradeProps({ bayId, level, theme }: { bayId: number; level: number; theme: CityThemeSpec }) {
  return (
    <group>
      {/* Larger freestanding kiosk so dial upgrades read from the default camera. */}
      <group position={[-1.35, 0, -0.35]}>
        <Box name={`bay-${bayId}-selector-kiosk-post`} color="#1e293b" position={[0, 0.55, 0]} scale={[0.16, 1.1, 0.16]} />
        <Box name={`bay-${bayId}-selector-kiosk-body`} color="#0f172a" position={[0, 1.25, 0]} scale={[0.72, 0.55, 0.22]} />
        <Box name={`bay-${bayId}-selector-kiosk-face`} color={theme.accent} position={[0, 1.25, -0.12]} scale={[0.62, 0.42, 0.04]} />
        {Array.from({ length: Math.min(6, level + 2) }, (_, index) => (
          <mesh
            key={`bay-${bayId}-selector-upgrade-dial-${index}`}
            position={[-0.2 + (index % 3) * 0.2, 1.34 - Math.floor(index / 3) * 0.16, -0.16]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.055, 0.055, 0.05, 20]} />
            <meshStandardMaterial
              color={[theme.accent, '#22c55e', '#facc15'][index % 3]}
              emissive={[theme.accent, '#22c55e', '#facc15'][index % 3]}
              emissiveIntensity={0.25}
              roughness={0.4}
            />
          </mesh>
        ))}
        <Box name={`bay-${bayId}-selector-led-readout`} color="#22d3ee" position={[0, 1.02, -0.14]} scale={[0.42, 0.08, 0.03]} />
        {level >= 2 && (
          <Box name={`bay-${bayId}-selector-side-flag`} color="#facc15" position={[0.42, 1.55, 0]} scale={[0.08, 0.42, 0.08]} />
        )}
      </group>
      {level >= 4 && (
        <group position={[0, 0, -2.28]}>
          <Box name={`bay-${bayId}-selector-floor-menu-bg`} color="#111827" position={[0, 0.158, 0]} scale={[0.9, 0.024, 0.24]} />
          <Box name={`bay-${bayId}-selector-floor-menu-chip`} color="#22d3ee" position={[0, 0.18, -0.02]} scale={[0.55, 0.02, 0.12]} />
        </group>
      )}
    </group>
  )
}

function WandUpgradeProps({ bayId, level }: { bayId: number; level: number }) {
  return (
    <group>
      <mesh name={`bay-${bayId}-wand-upgrade-hose-reel`} position={[-1.16, 1.3, -2.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.22 + level * 0.014, 0.035, 12, 36]} />
        <meshStandardMaterial color={level >= 4 ? '#2563eb' : '#1e3a8a'} roughness={0.42} />
      </mesh>
      <Box name={`bay-${bayId}-wand-upgrade-swivel-arm`} color="#1d4ed8" position={[-0.72, 1.98, -1.45]} rotation={[0, 0.15, -0.2]} scale={[0.82 + level * 0.05, 0.06, 0.06]} />
      <Box name={`bay-${bayId}-wand-upgrade-gun-rack`} color="#0f172a" position={[-1.12, 0.86, -2.0]} scale={[0.12, 0.38, 0.16]} />
      {level >= 4 && <Box name={`bay-${bayId}-second-wand-hook`} color="#60a5fa" position={[1.12, 1.0, -1.92]} scale={[0.09, 0.42, 0.13]} />}
    </group>
  )
}

function SoapUpgradeProps({ bayId, level, theme }: { bayId: number; level: number; theme: CityThemeSpec }) {
  return (
    <group position={[0.9, 0, -1.8]}>
      {Array.from({ length: Math.min(3, Math.ceil(level / 2)) }, (_, index) => (
        <group key={`bay-${bayId}-soap-tank-${index}`} position={[0, 0, index * 0.32]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16 + level * 0.006, 0.16 + level * 0.006, 0.58 + level * 0.035, 24]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#10b981' : theme.accent} roughness={0.42} />
          </mesh>
          <Box name={`bay-${bayId}-soap-tank-band-${index}`} color="#f8fafc" position={[0, 0.06, 0]} scale={[0.34, 0.06, 0.04]} />
        </group>
      ))}
      <Box name={`bay-${bayId}-soap-line-wall`} color="#22c55e" position={[0.24, 1.04, 0.24]} scale={[0.05, 1.42, 0.05]} />
      {level >= 3 && <TransparentBox name={`bay-${bayId}-foam-preview`} color="#f8fafc" position={[-0.42, 0.58, 0.18]} scale={[0.48, 0.22, 0.58]} opacity={0.32} />}
      {level >= 5 && <Box name={`bay-${bayId}-premium-foam-canister`} color="#facc15" position={[0.35, 0.46, -0.24]} scale={[0.18, 0.74, 0.18]} />}
    </group>
  )
}

function RinseUpgradeProps({ bayId, level }: { bayId: number; level: number }) {
  return (
    <group>
      <Box name={`bay-${bayId}-rinse-wall-manifold`} color="#0284c7" position={[1.14, 1.28, 0.6]} scale={[0.08, 0.82, 0.18]} />
      {Array.from({ length: Math.min(5, level) }, (_, index) => (
        <Box
          color="#7dd3fc"
          key={`bay-${bayId}-rinse-nozzle-${index}`}
          name={`bay-${bayId}-rinse-nozzle-${index}`}
          position={[0.92, 1.58, -1.0 + index * 0.48]}
          scale={[0.32, 0.045, 0.045]}
        />
      ))}
      {level >= 4 && <TransparentBox name={`bay-${bayId}-spot-free-rinse-gloss`} color="#bae6fd" position={[0, 0.18, 1.16]} scale={[1.2, 0.026, 1.45]} opacity={0.36} />}
    </group>
  )
}

function DryerUpgradeProps({ bayId, level }: { bayId: number; level: number }) {
  return (
    <group>
      <Box name={`bay-${bayId}-dryer-side-blower-left`} color="#0f766e" position={[-1.08, 1.22, 2.0]} scale={[0.18, 0.58, 0.22]} />
      <Box name={`bay-${bayId}-dryer-side-blower-right`} color="#0f766e" position={[1.08, 1.22, 2.0]} scale={[0.18, 0.58, 0.22]} />
      {Array.from({ length: Math.min(4, level) }, (_, index) => (
        <TransparentBox
          key={`bay-${bayId}-dryer-air-stream-${index}`}
          name={`bay-${bayId}-dryer-air-stream-${index}`}
          color="#dbeafe"
          position={[-0.45 + index * 0.3, 1.08, 1.72 + index * 0.12]}
          scale={[0.12, 0.06, 0.8]}
          opacity={0.18}
        />
      ))}
      {level >= 5 && <Box name={`bay-${bayId}-dryer-exit-status`} color="#facc15" position={[0, 2.05, 2.42]} scale={[1.18, 0.1, 0.07]} />}
    </group>
  )
}

function VaultUpgradeProps({ bayId, level }: { bayId: number; level: number }) {
  return (
    <group position={[-1.12, 0, 0.45]}>
      <Box name={`bay-${bayId}-vault-expanded-cabinet`} color={level >= 4 ? '#facc15' : '#475569'} position={[0, 0.84, 0]} scale={[0.2, 1.12 + level * 0.03, 0.72]} />
      <Box name={`bay-${bayId}-vault-token-cassette`} color="#22c55e" position={[-0.07, 0.6, -0.38]} scale={[0.08, 0.28 + level * 0.035, 0.05]} />
      <Box name={`bay-${bayId}-vault-bill-door`} color="#111827" position={[-0.07, 1.12, -0.38]} scale={[0.09, 0.24, 0.05]} />
      {level >= 3 && <Box name={`bay-${bayId}-vault-drop-safe-base`} color="#26323d" position={[0.08, 0.2, 0.18]} scale={[0.28, 0.34, 0.36]} />}
      {level >= 5 && <TransparentBox name={`bay-${bayId}-vault-active-glow`} color="#22c55e" position={[-0.12, 0.86, -0.46]} scale={[0.11, 1.0, 0.08]} opacity={0.2} />}
    </group>
  )
}

function SecurityCamera() {
  return (
    <group position={[-1.18, 1.95, -1.7]} rotation={[0, 0.3, 0]}>
      <Box name="camera-body" color="#111827" position={[0, 0, 0]} scale={[0.2, 0.12, 0.16]} />
      <mesh position={[0.12, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.09, 18]} />
        <meshStandardMaterial color="#020617" roughness={0.4} />
      </mesh>
    </group>
  )
}

function PayBoxHotspot({
  bay,
  due,
  collectRequired,
  onCollect,
}: {
  bay: BayState
  due: number
  collectRequired: boolean
  onCollect: () => void
}) {
  const active = due > 0 || collectRequired
  return (
    <group position={[-1.08, 1.04, 0.35]}>
      <mesh onClick={onCollect} castShadow>
        <boxGeometry args={[0.14, 1.12, 0.64]} />
        <meshStandardMaterial
          color={active ? '#fbbf24' : '#64748b'}
          emissive={active ? '#7c2d12' : '#000000'}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.38}
        />
      </mesh>
      <Box name={`bay-${bay.id}-vault-face`} color={bay.upgrades.vault > 0 ? '#22c55e' : '#1f2937'} position={[-0.09, -0.06, -0.36]} scale={[0.08, 0.48, 0.04]} />
      <Text color="#111827" fontSize={0.055} position={[-0.07, 0.58, -0.33]} rotation={[0, -Math.PI / 2, 0]}>
        BAY {bay.id}
      </Text>
    </group>
  )
}

function Office({ state, onCollect, theme }: { state: GameState; onCollect: () => void; theme: CityThemeSpec }) {
  const depositActive = cashBoxValue(totalCashBox(state.bays)) > 0 || state.collectRequired
  return (
    <group position={[6.3, 0, 1.8]}>
      <Box name="office-floor" color={theme.pad} position={[0, 0.04, 0]} scale={[2.5, 0.08, 3.0]} />
      <Box name="office-back" color={theme.wall} position={[0, 1.05, 1.45]} scale={[2.5, 2.1, 0.16]} />
      <Box name="office-left" color={theme.wall} position={[-1.18, 1.05, 0]} scale={[0.16, 2.1, 3.0]} />
      <Box name="office-right" color={theme.wall} position={[1.18, 1.05, 0]} scale={[0.16, 2.1, 3.0]} />
      <Box name="counter" color="#6b5d51" position={[0, 0.58, 0.78]} scale={[1.8, 0.7, 0.52]} />
      <Box name="terminal" color="#111827" position={[0, 1.05, 0.4]} scale={[0.62, 0.38, 0.08]} />
      <mesh name="deposit-safe" position={[0.62, 0.78, 0.31]} scale={[0.44, 0.42, 0.15]} onClick={onCollect} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={depositActive ? '#facc15' : '#334155'}
          emissive={depositActive ? '#7c2d12' : '#000000'}
          emissiveIntensity={depositActive ? 0.16 : 0}
          roughness={0.45}
        />
      </mesh>
      <Text color="#22c55e" fontSize={0.095} position={[-0.3, 1.05, 0.33]}>
        DEPOSIT
      </Text>
      {state.collectRequired && (
        <Text color="#fbbf24" fontSize={0.13} position={[-0.62, 1.63, -0.18]}>
          WEEK CLOSE
        </Text>
      )}
    </group>
  )
}

function RoadSign({
  lit,
  painted,
  label,
  theme,
}: {
  lit: boolean
  painted: boolean
  label: string
  theme: CityThemeSpec
}) {
  const signLabel = label.length > 16 ? `${label.slice(0, 15)}...` : label
  return (
    <group position={[-6.0, 0, -4.95]}>
      <Box name="sign-post" color="#1f2937" position={[0, 0.8, 0]} scale={[0.12, 1.6, 0.12]} />
      <Box name="sign-face" color={painted ? theme.trim : '#0756a5'} position={[0, 1.55, 0]} scale={[2.15, 0.55, 0.12]} />
      <Text color="#f8fafc" fontSize={0.13} position={[-0.88, 1.55, -0.08]}>
        {signLabel.toUpperCase()}
      </Text>
      {lit && <Box name="sign-light" color="#fde68a" position={[0, 1.15, -0.09]} scale={[1.8, 0.07, 0.04]} />}
    </group>
  )
}

function EmployeeParking({ state }: { state: GameState }) {
  const staffCount = Object.values(state.employees).filter(Boolean).length
  if (staffCount === 0) return null

  return (
    <group position={[5.6, 0.02, -5.0]}>
      <Box name="staff-parking-pad" color="#1f2933" position={[0, 0, 0]} scale={[1.65, 0.04, 0.82]} />
      <Box name="staff-van-body" color="#f8fafc" position={[0, 0.34, 0]} scale={[0.95, 0.42, 0.58]} />
      <Box name="staff-van-cab" color="#0f4f9c" position={[0.34, 0.5, -0.02]} scale={[0.38, 0.28, 0.48]} />
      <Text color="#0f172a" fontSize={0.09} position={[-0.38, 0.58, -0.33]}>
        STAFF
      </Text>
      {state.employees.bayTech && <Box name="tech-toolbox" color="#facc15" position={[-0.56, 0.25, 0.32]} scale={[0.26, 0.18, 0.2]} />}
      {state.employees.nightManager && <Box name="manager-light" color="#22c55e" position={[0.58, 0.58, 0.32]} scale={[0.18, 0.08, 0.12]} />}
    </group>
  )
}

function StaffCollectionMarker() {
  return (
    <group position={[5.36, 0, -3.98]}>
      <Box name="staff-collection-cart" color="#facc15" position={[0, 0.34, 0]} scale={[0.48, 0.48, 0.36]} />
      <Box name="staff-cash-bag" color="#166534" position={[-0.38, 0.38, 0.05]} scale={[0.26, 0.32, 0.26]} />
      <Text color="#f8fafc" fontSize={0.12} position={[-0.72, 0.86, -0.18]} rotation={[0, 0.24, 0]}>
        STAFF PICKUP
      </Text>
    </group>
  )
}

function VacuumIsland({ automatic = false }: { automatic?: boolean }) {
  const position: Vec3 = automatic ? [6.35, 0, -3.45] : [6.2, 0, -3.15]
  const stations = [
    { id: 'left', postName: 'vacuum-post-left', hoseName: 'vacuum-hose-left', x: -0.58, hoseTilt: -0.36 },
    { id: 'right', postName: 'vacuum-post-right', hoseName: 'vacuum-hose-right', x: 0.58, hoseTilt: 0.36 },
  ] as const

  return (
    <group position={position}>
      <Box name="vacuum-island-pad" color="#4b5563" position={[0, 0.06, 0]} scale={[2.35, 0.08, 1.52]} />
      <Box name="vacuum-island-curb-front" color="#e5e7eb" position={[0, 0.16, -0.78]} scale={[2.44, 0.18, 0.08]} />
      <Box name="vacuum-island-curb-back" color="#e5e7eb" position={[0, 0.16, 0.78]} scale={[2.44, 0.18, 0.08]} />
      <Box name="vacuum-island-curb-left" color="#e5e7eb" position={[-1.22, 0.16, 0]} scale={[0.08, 0.18, 1.52]} />
      <Box name="vacuum-island-curb-right" color="#e5e7eb" position={[1.22, 0.16, 0]} scale={[0.08, 0.18, 1.52]} />
      <Box name="vacuum-mat-lines" color="#f8fafc" position={[-0.58, 0.12, -0.36]} scale={[0.72, 0.025, 0.06]} />
      <Box name="vacuum-mat-lines-right" color="#f8fafc" position={[0.58, 0.12, -0.36]} scale={[0.72, 0.025, 0.06]} />
      <Box name="vacuum-mat-lines-rear-left" color="#f8fafc" position={[-0.58, 0.12, 0.36]} scale={[0.72, 0.025, 0.06]} />
      <Box name="vacuum-mat-lines-rear-right" color="#f8fafc" position={[0.58, 0.12, 0.36]} scale={[0.72, 0.025, 0.06]} />
      <Box name="vacuum-canopy-left-post" color="#26323d" position={[-1.0, 0.86, -0.52]} scale={[0.08, 1.72, 0.08]} />
      <Box name="vacuum-canopy-right-post" color="#26323d" position={[1.0, 0.86, -0.52]} scale={[0.08, 1.72, 0.08]} />
      <Box name="vacuum-canopy-header" color="#0f4f9c" position={[0, 1.78, -0.52]} scale={[2.28, 0.22, 0.18]} />
      {stations.map((station) => (
        <group key={station.id} position={[station.x, 0, 0]}>
          <Box name={station.postName} color="#0f4f9c" position={[0, 0.68, 0]} scale={[0.32, 1.35, 0.32]} />
          <Box name={`vacuum-post-trim-${station.id}`} color="#facc15" position={[0, 1.28, -0.01]} scale={[0.36, 0.09, 0.34]} />
          <Box name={`vacuum-face-${station.id}`} color="#e8e0d0" position={[0, 0.95, -0.16]} scale={[0.2, 0.36, 0.04]} />
          <Box name={`vacuum-coin-slot-${station.id}`} color="#111827" position={[0, 0.9, -0.2]} scale={[0.16, 0.04, 0.03]} />
          <mesh name={station.hoseName} position={[0.03 * Math.sign(station.x), 1.22, 0.22]} rotation={[Math.PI / 2, 0, station.hoseTilt]}>
            <torusGeometry args={[0.34, 0.025, 10, 28, Math.PI]} />
            <meshStandardMaterial color="#111827" roughness={0.4} />
          </mesh>
          <Box
            name={`vacuum-nozzle-${station.id}`}
            color="#111827"
            position={[0.38 * Math.sign(station.x), 0.62, 0.48]}
            rotation={[0, 0.2 * Math.sign(station.x), 0]}
            scale={[0.08, 0.22, 0.36]}
          />
        </group>
      ))}
      <group name="vacuum-service-car" position={[0, 0, 0.56]} rotation={[0, Math.PI / 2, 0]}>
        <Box name="vacuum-car-body" color="#f8fafc" position={[0, 0.34, 0]} scale={[0.48, 0.3, 0.9]} />
        <Box name="vacuum-car-cabin" color="#0f172a" position={[0, 0.56, -0.08]} scale={[0.38, 0.2, 0.42]} />
        <Wheel x={-0.28} z={-0.32} />
        <Wheel x={0.28} z={-0.32} />
        <Wheel x={-0.28} z={0.32} />
        <Wheel x={0.28} z={0.32} />
      </group>
      <TransparentBox name="vacuum-dust-puff" color="#cbd5e1" position={[0.0, 0.38, 0.52]} scale={[1.2, 0.34, 0.22]} opacity={0.18} />
      <Text color="#ffffff" fontSize={0.11} position={[-0.7, 1.8, -0.65]}>
        VACUUMS
      </Text>
    </group>
  )
}

function washStageLabel(progress: number): string {
  if (progress < 0.36) return 'SOAP'
  if (progress < 0.68) return 'SCRUB'
  return 'RINSE'
}

function LaserWashExpansion() {
  return (
    <group name="touch-free-gantry" position={[7.4, 0, 0.3]}>
      <Box name="laser-pad" color="#c9c8c1" position={[0, 0.05, 0]} scale={[2.2, 0.08, 4.5]} />
      <Box name="laser-left-rail" color="#f8fafc" position={[-0.8, 1.1, 0.1]} scale={[0.13, 2.2, 0.13]} />
      <Box name="laser-right-rail" color="#f8fafc" position={[0.8, 1.1, 0.1]} scale={[0.13, 2.2, 0.13]} />
      <Box name="laser-header" color="#18c7c5" position={[0, 2.18, 0.1]} scale={[2.05, 0.34, 0.16]} />
      <Text color="#0756a5" fontSize={0.12} position={[-0.42, 2.18, -0.02]}>
        TOUCH FREE
      </Text>
    </group>
  )
}

function CarWithCustomer({ car, state }: { car: Car; state: GameState }) {
  const pose = carPose(car, state)
  const bodyColor = car.color || TRAFFIC_PALETTE[car.variant % TRAFFIC_PALETTE.length] || TRAFFIC_PALETTE[0]
  const accentColor = car.stage === 'passing' ? '#0a8496' : '#0f4f9c'
  const automatic = isConveyorCity(state)

  return (
    <group>
      <group position={pose.position} rotation={[0, pose.rotationY, 0]}>
        <VehicleModel car={car} bodyColor={bodyColor} accentColor={accentColor} />
      </group>
      {car.stage === 'queued' && <QueuePatience car={car} carPosition={pose.position} />}
      {car.stage === 'washing' &&
        (automatic ? <AutomaticWashGlow car={car} carPosition={pose.position} /> : <WashCustomer car={car} carPosition={pose.position} />)}
    </group>
  )
}

function CarOccupants({ variant }: { variant: number }) {
  const passenger = variant % 3 === 0

  return (
    <group>
      <Box name="driver-torso" color="#334155" position={[-0.16, 0.66, -0.1]} scale={[0.14, 0.18, 0.12]} />
      <mesh position={[-0.16, 0.82, -0.12]} castShadow dispose={null}>
        <primitive attach="geometry" object={getSphereGeometry(0.075, 16, 16)} />
        <primitive attach="material" object={getStandardMaterial(variant % 2 === 0 ? '#c08457' : '#8d5524', 0.5, 0)} />
      </mesh>
      {passenger && (
        <>
          <Box name="passenger-torso" color="#475569" position={[0.16, 0.66, -0.06]} scale={[0.14, 0.18, 0.12]} />
          <mesh position={[0.16, 0.82, -0.08]} castShadow dispose={null}>
            <primitive attach="geometry" object={getSphereGeometry(0.07, 16, 16)} />
            <primitive attach="material" object={getStandardMaterial('#c08457', 0.5, 0)} />
          </mesh>
        </>
      )}
    </group>
  )
}

function VehicleModel({
  car,
  bodyColor,
  accentColor,
}: {
  car: Car
  bodyColor: string
  accentColor: string
}) {
  const isPickup = car.variant % 5 === 2
  const isVan = car.variant % 5 === 4
  const cabinColor = isVan ? bodyColor : '#eef2f7'
  const windowColor = '#0f172a'

  return (
    <group>
      <TransparentBox name={`${car.id}-vehicle-shadow`} color="#020617" position={[0, 0.12, 0.08]} scale={[1.18, 0.035, 1.98]} opacity={0.24} />
      <Box name={`${car.id}-chassis`} color="#111827" position={[0, 0.24, 0.04]} scale={[1.02, 0.14, 1.86]} />
      <Box name={`${car.id}-body-main`} color={bodyColor} position={[0, 0.43, 0.1]} scale={[0.96, 0.36, isPickup ? 1.72 : 1.6]} metalness={0.16} roughness={0.24} />
      <Box
        name={`${car.id}-hood-slope`}
        color={bodyColor}
        position={[0, 0.53, -0.64]}
        rotation={[0.12, 0, 0]}
        scale={[0.86, 0.14, 0.46]}
        metalness={0.16}
        roughness={0.24}
      />
      {isPickup ? (
        <Box name={`${car.id}-pickup-bed`} color="#1f2937" position={[0, 0.56, 0.57]} scale={[0.76, 0.16, 0.54]} />
      ) : (
        <Box name={`${car.id}-trunk-slope`} color={bodyColor} position={[0, 0.55, 0.64]} rotation={[-0.08, 0, 0]} scale={[0.84, 0.14, 0.4]} metalness={0.16} roughness={0.24} />
      )}
      <Box name={`${car.id}-cabin`} color={cabinColor} position={[0, isVan ? 0.72 : 0.72, isVan ? -0.02 : -0.11]} scale={[0.68, isVan ? 0.5 : 0.36, isVan ? 1.0 : 0.72]} metalness={0.12} roughness={0.3} />
      <Box name={`${car.id}-windshield`} color={windowColor} position={[0, 0.83, -0.55]} rotation={[0.22, 0, 0]} scale={[0.55, 0.055, 0.2]} metalness={0.2} roughness={0.08} />
      <Box name={`${car.id}-rear-window`} color={windowColor} position={[0, 0.82, isVan ? 0.48 : 0.35]} rotation={[-0.18, 0, 0]} scale={[0.55, 0.055, 0.18]} metalness={0.2} roughness={0.08} />
      <Box name={`${car.id}-left-window`} color="#1e293b" position={[-0.37, 0.74, -0.08]} scale={[0.05, 0.22, isVan ? 0.72 : 0.5]} metalness={0.2} roughness={0.08} />
      <Box name={`${car.id}-right-window`} color="#1e293b" position={[0.37, 0.74, -0.08]} scale={[0.05, 0.22, isVan ? 0.72 : 0.5]} metalness={0.2} roughness={0.08} />
      <CarOccupants variant={car.variant} />
      <Box name={`${car.id}-stripe-left`} color={accentColor} position={[-0.51, 0.46, -0.02]} scale={[0.045, 0.1, 1.18]} />
      <Box name={`${car.id}-stripe-right`} color={accentColor} position={[0.51, 0.46, -0.02]} scale={[0.045, 0.1, 1.18]} />
      <Box name={`${car.id}-front-bumper`} color="#020617" position={[0, 0.34, -0.94]} scale={[0.76, 0.14, 0.08]} />
      <Box name={`${car.id}-rear-bumper`} color="#020617" position={[0, 0.34, 0.98]} scale={[0.76, 0.14, 0.08]} />
      <Box name={`${car.id}-headlight-left`} color="#fde68a" position={[-0.26, 0.45, -0.99]} scale={[0.22, 0.055, 0.04]} />
      <Box name={`${car.id}-headlight-right`} color="#fde68a" position={[0.26, 0.45, -0.99]} scale={[0.22, 0.055, 0.04]} />
      <Box name={`${car.id}-tail-left`} color="#b91c1c" position={[-0.26, 0.45, 1.03]} scale={[0.22, 0.055, 0.04]} />
      <Box name={`${car.id}-tail-right`} color="#b91c1c" position={[0.26, 0.45, 1.03]} scale={[0.22, 0.055, 0.04]} />
      <Box name={`${car.id}-mirror-left`} color="#111827" position={[-0.55, 0.66, -0.42]} scale={[0.08, 0.08, 0.12]} />
      <Box name={`${car.id}-mirror-right`} color="#111827" position={[0.55, 0.66, -0.42]} scale={[0.08, 0.08, 0.12]} />
      <Wheel x={-0.54} z={-0.58} />
      <Wheel x={0.54} z={-0.58} />
      <Wheel x={-0.54} z={0.58} />
      <Wheel x={0.54} z={0.58} />
    </group>
  )
}

function AutomaticWashGlow({ car, carPosition }: { car: Car; carPosition: Vec3 }) {
  const foam = car.progress < 0.48
  const dryer = car.progress > 0.68

  return (
    <group position={[carPosition[0], 0, carPosition[2]]}>
      <TransparentBox
        name={`${car.id}-auto-wash-foam`}
        color={foam ? '#bfdbfe' : '#e0f2fe'}
        position={[0, 0.78, foam ? -0.15 : 0.32]}
        scale={[1.1, 0.72, foam ? 0.5 : 0.18]}
        opacity={foam ? 0.42 : 0.22}
      />
      {dryer && (
        <TransparentBox
          name={`${car.id}-auto-dryer-air`}
          color="#fef3c7"
          position={[0, 0.92, -0.55]}
          scale={[1.1, 0.28, 0.9]}
          opacity={0.24}
        />
      )}
      <WashProgress value={car.progress} />
    </group>
  )
}

function QueuePatience({ car, carPosition }: { car: Car; carPosition: Vec3 }) {
  return (
    <group position={[carPosition[0], 1.03, carPosition[2] - 0.82]}>
      <Box name={`${car.id}-queue-bg`} color="#111827" position={[0, 0, 0]} scale={[0.72, 0.06, 0.06]} />
      <Box
        name={`${car.id}-queue-fill`}
        color={car.progress > 0.72 ? '#f97316' : '#22c55e'}
        position={[-0.36 + (1 - car.progress) * 0.36, 0.01, 0]}
        scale={[0.72 * (1 - car.progress), 0.07, 0.07]}
      />
    </group>
  )
}

function WashCustomer({ car, carPosition }: { car: Car; carPosition: Vec3 }) {
  const side = (Math.floor(car.progress * 4) + car.variant) % 2 === 0 ? 1 : -1
  const sweep = (car.progress * 2.4) % 1
  const personX = carPosition[0] + side * 0.88
  const personZ = carPosition[2] + lerp(-0.78, 0.86, sweep)
  const sprayColor = car.progress < 0.36 ? '#bfdbfe' : car.progress < 0.68 ? '#f8fafc' : '#bae6fd'
  const foamOpacity = car.progress > 0.16 && car.progress < 0.72 ? 0.38 : 0.16
  const brushVisible = car.progress > 0.34 && car.progress < 0.62

  return (
    <group>
      <group position={[carPosition[0], 0, carPosition[2]]}>
        <TransparentBox
          name={`${car.id}-foam-over-car`}
          color={sprayColor}
          position={[0, 0.74, 0.04]}
          scale={[1.04, 0.26, 1.44]}
          opacity={foamOpacity}
        />
        <TransparentBox
          name={`${car.id}-wet-floor`}
          color="#bae6fd"
          position={[0, 0.16, 0.4]}
          scale={[1.34, 0.035, 1.96]}
          opacity={0.22}
        />
        <WashProgress value={car.progress} />
      </group>
      <group position={[personX, 0, personZ]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
        <Box name={`${car.id}-washer-body`} color="#f97316" position={[0, 0.62, 0]} scale={[0.22, 0.48, 0.16]} />
        <mesh position={[0, 0.96, 0]} castShadow dispose={null}>
          <primitive attach="geometry" object={getSphereGeometry(0.13, 18, 18)} />
          <primitive attach="material" object={getStandardMaterial('#c08457', 0.5, 0)} />
        </mesh>
        <Box name={`${car.id}-washer-leg-left`} color="#1f2937" position={[-0.06, 0.28, 0]} scale={[0.07, 0.35, 0.08]} />
        <Box name={`${car.id}-washer-leg-right`} color="#1f2937" position={[0.06, 0.28, 0]} scale={[0.07, 0.35, 0.08]} />
        <Box name={`${car.id}-washer-arm-left`} color="#c08457" position={[0.13, 0.74, -0.06]} scale={[0.08, 0.26, 0.06]} />
        <Box name={`${car.id}-washer-arm-right`} color="#c08457" position={[0.13, 0.74, 0.08]} scale={[0.08, 0.26, 0.06]} />
        <mesh position={[0.26, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null}>
          <primitive attach="geometry" object={getCylinderGeometry(0.022, 0.022, 0.66, 14)} />
          <primitive attach="material" object={getStandardMaterial('#111827', 0.35, 0)} />
        </mesh>
        {brushVisible && (
          <Box name={`${car.id}-foam-brush`} color="#f8fafc" position={[0.58, 0.62, 0]} scale={[0.16, 0.28, 0.42]} />
        )}
        <TransparentBox
          name={`${car.id}-spray`}
          color={sprayColor}
          position={[0.55, 0.62, 0]}
          scale={[0.84, 0.045, 0.26]}
          opacity={0.48}
        />
      </group>
    </group>
  )
}

function WashProgress({ value }: { value: number }) {
  return (
    <group position={[0, 1.28, 0]}>
      <Box name="wash-progress-bg" color="#111827" position={[0, 0, 0]} scale={[0.72, 0.055, 0.055]} />
      <Box name="wash-progress-fill" color="#22c55e" position={[-0.36 + value * 0.36, 0.006, 0]} scale={[0.72 * value, 0.06, 0.06]} />
    </group>
  )
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null}>
      <primitive attach="geometry" object={getCylinderGeometry(0.14, 0.14, 0.12, 24)} />
      <primitive attach="material" object={getStandardMaterial('#020617', 0.62, 0)} />
    </mesh>
  )
}

function RoadDisc({
  color = '#1f2933',
  name,
  position,
  radius,
}: {
  color?: string
  name: string
  position: Vec3
  radius: number
}) {
  return (
    <mesh name={name} position={position} receiveShadow>
      <cylinderGeometry args={[radius, radius, 0.07, 36]} />
      <meshStandardMaterial color={color} roughness={0.58} metalness={0.02} />
    </mesh>
  )
}

function RotBox({
  name,
  color,
  position,
  scale,
  rotationY = 0,
}: {
  name: string
  color: string
  position: Vec3
  scale: Vec3
  rotationY?: number
}) {
  return (
    <mesh name={name} position={position} rotation={[0, rotationY, 0]} scale={scale} castShadow receiveShadow dispose={null}>
      <primitive attach="geometry" object={SHARED_BOX_GEOMETRY} />
      <primitive attach="material" object={getStandardMaterial(color, 0.58, 0.02)} />
    </mesh>
  )
}

function Box({
  name,
  color,
  position,
  scale,
  rotation = [0, 0, 0],
  roughness = 0.58,
  metalness = 0.02,
}: {
  name: string
  color: string
  position: Vec3
  scale: Vec3
  rotation?: Vec3
  roughness?: number
  metalness?: number
}) {
  return (
    <mesh name={name} position={position} rotation={rotation} scale={scale} castShadow receiveShadow dispose={null}>
      <primitive attach="geometry" object={SHARED_BOX_GEOMETRY} />
      <primitive attach="material" object={getStandardMaterial(color, roughness, metalness)} />
    </mesh>
  )
}

function TransparentBox({
  name,
  color,
  position,
  scale,
  opacity,
}: {
  name: string
  color: string
  position: Vec3
  scale: Vec3
  opacity: number
}) {
  return (
    <mesh name={name} position={position} scale={scale} dispose={null}>
      <primitive attach="geometry" object={SHARED_BOX_GEOMETRY} />
      <primitive attach="material" object={getStandardMaterial(color, 0.25, 0.02, opacity)} />
    </mesh>
  )
}

function carPose(car: Car, state: GameState): { position: Vec3; rotationY: number } {
  const conveyor = isConveyorCity(state)
  const x = laneXForCar(car, state, conveyor)
  if (car.stage === 'approaching') {
    return poseFromPath(arrivalRoute(car, x), ease(car.progress))
  }
  if (car.stage === 'passing') {
    return poseFromPath(passByRoute(car), ease(car.progress))
  }
  if (car.stage === 'queued') {
    return { position: [x, 0.02, -6.12], rotationY: Math.PI }
  }
  if (car.stage === 'entering') {
    return {
      position: [x, 0.02, lerp(-6.12, conveyor ? -2.82 : 0.42, ease(car.progress))],
      rotationY: Math.PI,
    }
  }
  if (car.stage === 'washing') {
    return {
      position: [x, 0.02, conveyor ? lerp(-2.82, 3.55, ease(car.progress)) : 0.42],
      rotationY: Math.PI,
    }
  }
  return {
    position: [x, 0.02, lerp(conveyor ? 3.55 : 0.42, 6.8, ease(car.progress))],
    rotationY: Math.PI,
  }
}

function laneXForCar(car: Car, state: GameState, conveyor: boolean): number {
  if (conveyor) return CONVEYOR_X[car.bayIndex % CONVEYOR_X.length] ?? 0
  return bayXForIndex(car.bayIndex, activeBayCount(state))
}

function bayXPositions(count: number): number[] {
  if (count <= 1) return [0]
  if (count === 2) return [-1.45, 1.45]
  if (count === 3) return [-2.85, 0, 2.85]
  return BAY_X
}

function futureBayXPositions(count: number): number[] {
  if (count <= 1) return [-2.85, 2.85, 4.2]
  if (count === 2) return [-4.2, 4.2]
  if (count === 3) return [4.2]
  return []
}

function bayXForIndex(index: number, count: number): number {
  const positions = bayXPositions(count)
  return positions[index] ?? positions[positions.length - 1] ?? 0
}

function arrivalRoute(car: Car, bayX: number): PathPoint[] {
  const route = routeIndex(car)
  const laneMouth: PathPoint = [bayX, -6.12]

  if (route === 0) {
    return [
      [-21.0, -15.6],
      [-21.0, -10.05],
      [-15.1, -10.05],
      [-8.1, -10.05],
      [-8.1, -6.2],
      [bayX, -6.2],
      laneMouth,
    ]
  }

  if (route === 1) {
    return [
      [21.2, -15.8],
      [21.2, -10.05],
      [15.1, -10.05],
      [8.1, -10.05],
      [8.1, -6.2],
      [bayX, -6.2],
      laneMouth,
    ]
  }

  if (route === 2) {
    return [
      [-21.0, 15.2],
      [-21.0, 9.15],
      [-15.1, 9.15],
      [-8.1, 9.15],
      [-8.1, -6.2],
      [bayX, -6.2],
      laneMouth,
    ]
  }

  return [
    [21.2, 15.0],
    [21.2, 9.15],
    [15.1, 9.15],
    [8.1, 9.15],
    [8.1, -6.2],
    [bayX, -6.2],
    laneMouth,
  ]
}

function passByRoute(car: Car): PathPoint[] {
  const route = routeIndex(car)
  const towardsNegative = route % 2 === 0
  const nearOuterX = towardsNegative ? -21.0 : 21.2
  const innerOuterX = towardsNegative ? -15.1 : 15.1
  const sideFeedX = towardsNegative ? -8.1 : 8.1
  const topRoadY = route < 2 ? 15.2 : 15.0
  const topLaneY = 9.15
  const bottomLaneY = -10.05
  const bottomRoadY = -15.6

  return [
    [nearOuterX, topRoadY],
    [nearOuterX, topLaneY],
    [innerOuterX, topLaneY],
    [sideFeedX, topLaneY],
    [sideFeedX, bottomLaneY],
    [innerOuterX, bottomLaneY],
    [nearOuterX, bottomLaneY],
    [nearOuterX, bottomRoadY],
  ]
}

function poseFromPath(points: PathPoint[], progress: number): { position: Vec3; rotationY: number } {
  const safeProgress = Math.min(1, Math.max(0, progress))
  const segments = smoothPathSegments(points)
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0)
  const distance = safeProgress * totalLength

  if (segments.length === 0 || totalLength <= 0) {
    const fallback = points[points.length - 1] ?? [0, 0]
    return { position: [fallback[0], 0.02, fallback[1]], rotationY: 0 }
  }

  const point = sampleSegments(segments, distance)
  const ahead = sampleSegments(segments, Math.min(totalLength, distance + CAR_LOOKAHEAD_DISTANCE))
  const behind = sampleSegments(segments, Math.max(0, distance - CAR_LOOKAHEAD_DISTANCE))
  const lookEnd = distance2d(behind, ahead) > 0.001 ? ahead : sampleSegments(segments, Math.min(totalLength, distance + 0.08))

  return {
    position: [point[0], 0.02, point[1]],
    rotationY: rotationForDirection(behind, lookEnd),
  }
}

function smoothPathSegments(points: PathPoint[]): SmoothPathSegment[] {
  if (points.length < 2) return []

  const segments: SmoothPathSegment[] = []
  let cursor = points[0]

  for (let index = 1; index < points.length; index += 1) {
    const corner = points[index]
    const next = points[index + 1]
    const previous = points[index - 1]
    if (!cursor || !corner || !previous) continue

    if (next) {
      const previousLength = distance2d(previous, corner)
      const nextLength = distance2d(corner, next)
      const incoming = normalize2d([previous[0] - corner[0], previous[1] - corner[1]])
      const outgoing = normalize2d([next[0] - corner[0], next[1] - corner[1]])
      const dot = incoming[0] * outgoing[0] + incoming[1] * outgoing[1]
      const cut = Math.min(CORNER_RADIUS, previousLength * 0.38, nextLength * 0.38)

      if (cut > 0.08 && dot > -0.94) {
        const before: PathPoint = [corner[0] + incoming[0] * cut, corner[1] + incoming[1] * cut]
        const after: PathPoint = [corner[0] + outgoing[0] * cut, corner[1] + outgoing[1] * cut]
        addLineSegment(segments, cursor, before)
        addCurveSegment(segments, before, corner, after)
        cursor = after
        continue
      }
    }

    addLineSegment(segments, cursor, corner)
    cursor = corner
  }

  return segments
}

function addLineSegment(segments: SmoothPathSegment[], from: PathPoint, to: PathPoint): void {
  const length = distance2d(from, to)
  if (length <= 0.001) return
  segments.push({ type: 'line', from, to, length })
}

function addCurveSegment(
  segments: SmoothPathSegment[],
  from: PathPoint,
  control: PathPoint,
  to: PathPoint,
): void {
  const samples = 8
  let length = 0
  let previous = from

  for (let index = 1; index <= samples; index += 1) {
    const point = quadraticPoint(from, control, to, index / samples)
    length += distance2d(previous, point)
    previous = point
  }

  if (length <= 0.001) return
  segments.push({ type: 'curve', from, control, to, length })
}

function sampleSegments(segments: SmoothPathSegment[], distance: number): PathPoint {
  let remaining = Math.max(0, distance)

  for (const segment of segments) {
    if (remaining <= segment.length || segment === segments[segments.length - 1]) {
      const t = segment.length <= 0 ? 1 : Math.min(1, Math.max(0, remaining / segment.length))
      if (segment.type === 'curve') return quadraticPoint(segment.from, segment.control, segment.to, t)
      return [lerp(segment.from[0], segment.to[0], t), lerp(segment.from[1], segment.to[1], t)]
    }
    remaining -= segment.length
  }

  const fallback = segments[segments.length - 1]
  return fallback?.to ?? [0, 0]
}

function quadraticPoint(from: PathPoint, control: PathPoint, to: PathPoint, t: number): PathPoint {
  const inverse = 1 - t
  return [
    inverse * inverse * from[0] + 2 * inverse * t * control[0] + t * t * to[0],
    inverse * inverse * from[1] + 2 * inverse * t * control[1] + t * t * to[1],
  ]
}

function normalize2d(vector: PathPoint): PathPoint {
  const length = Math.hypot(vector[0], vector[1])
  if (length <= 0.001) return [0, 0]
  return [vector[0] / length, vector[1] / length]
}

function transformCarLocal(position: Vec3, rotationY: number, local: Vec3): Vec3 {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return [
    position[0] + local[0] * cos + local[2] * sin,
    position[1] + local[1],
    position[2] - local[0] * sin + local[2] * cos,
  ]
}

function routeIndex(car: Car): number {
  const numericId = Number(car.id.replace(/\D/g, ''))
  return ((Number.isFinite(numericId) ? numericId : car.variant) + car.bayIndex) % 4
}

function distance2d(a: PathPoint, b: PathPoint): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function rotationForDirection(start: PathPoint, end: PathPoint): number {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  return Math.atan2(-dx, -dz)
}

function stripColor(index: number): string {
  return ['#ef4444', '#0ea5e9', '#a855f7', '#2563eb'][index] ?? '#f8fafc'
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function ease(t: number): number {
  return t * t * (3 - 2 * t)
}
