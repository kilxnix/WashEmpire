import { Suspense, useEffect, useState } from 'react'
import { Clone, useGLTF } from '@react-three/drei'

type Vec3 = [number, number, number]

interface PrototypeSceneAsset {
  id: string
  url: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

const MANIFEST_URL = '/prototype-assets/manifest.json'

export function PrototypeAssetLayer() {
  const [assets, setAssets] = useState<PrototypeSceneAsset[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
      try {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' })
        if (!response.ok) return

        const manifest = await response.json()
        const candidates = normalizeManifest(manifest)
        const available = await Promise.all(
          candidates.map(async (asset) => {
            try {
              const assetResponse = await fetch(asset.url, { method: 'HEAD', cache: 'no-store' })
              return assetResponse.ok ? asset : null
            } catch {
              return null
            }
          }),
        )

        if (!cancelled) {
          setAssets(available.filter((asset): asset is PrototypeSceneAsset => asset !== null))
        }
      } catch {
        if (!cancelled) setAssets([])
      }
    }

    void loadAssets()

    return () => {
      cancelled = true
    }
  }, [])

  if (assets.length === 0) return null

  return (
    <Suspense fallback={null}>
      <group name="prototype-asset-layer">
        {assets.map((asset) => (
          <PrototypeSceneModel asset={asset} key={asset.id} />
        ))}
      </group>
    </Suspense>
  )
}

function PrototypeSceneModel({ asset }: { asset: PrototypeSceneAsset }) {
  const gltf = useGLTF(asset.url)

  return (
    <group name={`prototype-asset-${asset.id}`} position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <Clone object={gltf.scene} />
    </group>
  )
}

function normalizeManifest(value: unknown): PrototypeSceneAsset[] {
  if (!value || typeof value !== 'object') return []

  const assets = (value as { assets?: unknown }).assets
  if (!Array.isArray(assets)) return []

  return assets
    .map(normalizeAsset)
    .filter((asset): asset is PrototypeSceneAsset => asset !== null)
}

function normalizeAsset(value: unknown): PrototypeSceneAsset | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (record.visible === false || typeof record.id !== 'string' || typeof record.url !== 'string') return null

  return {
    id: record.id,
    url: record.url,
    position: toVec3(record.position, [0, 0, 0]),
    rotation: toVec3(record.rotation, [0, 0, 0]),
    scale: toVec3(record.scale, [1, 1, 1]),
  }
}

function toVec3(value: unknown, fallback: Vec3): Vec3 {
  if (!Array.isArray(value) || value.length !== 3) return fallback
  if (!value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))) return fallback
  return [value[0], value[1], value[2]]
}
