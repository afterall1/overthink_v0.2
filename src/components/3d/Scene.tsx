'use client'

import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment, Preload } from '@react-three/drei'
import Habitat from './Habitat'
import { DailyStatus } from './types'
import { CategorySlug } from '@/types/database.types'

// Hook to detect mobile devices
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

interface SceneProps {
    dailyStatus: DailyStatus
    onSectorClick?: (slug: CategorySlug) => void
}

function Lighting() {
    return (
        <>
            {/* Ambient base light */}
            <ambientLight intensity={0.15} color="#1e1b4b" />

            {/* Main purple spotlight */}
            <spotLight
                position={[5, 8, 5]}
                angle={0.5}
                penumbra={1}
                intensity={1.5}
                color="#8b5cf6"
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            {/* Blue accent light */}
            <spotLight
                position={[-5, 6, -5]}
                angle={0.6}
                penumbra={0.8}
                intensity={1}
                color="#3b82f6"
            />

            {/* Rim light from below */}
            <pointLight
                position={[0, -3, 0]}
                intensity={0.5}
                color="#6366f1"
            />

            {/* Top fill light */}
            <directionalLight
                position={[0, 10, 0]}
                intensity={0.3}
                color="#ffffff"
            />
        </>
    )
}

function SceneContent({ dailyStatus, onSectorClick }: SceneProps) {
    return (
        <>
            {/* Atmospheric background */}
            <Stars
                radius={100}
                depth={50}
                count={3000}
                factor={4}
                saturation={0.5}
                fade
                speed={0.5}
            />

            {/* Fog for depth */}
            <fog attach="fog" args={['#0a0a0a', 8, 30]} />

            {/* Lighting setup */}
            <Lighting />

            {/* Main habitat */}
            <Habitat dailyStatus={dailyStatus} onSectorClick={onSectorClick} />

            {/* Environment for reflections */}
            <Environment preset="night" />

            {/* Camera controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={12}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.2}
                autoRotate
                autoRotateSpeed={0.3}
                dampingFactor={0.05}
                enableDamping
            />
        </>
    )
}

function LoadingFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#374151" wireframe />
        </mesh>
    )
}

export default function Scene({ dailyStatus, onSectorClick }: SceneProps) {
    const isMobile = useIsMobile()

    return (
        <div className="fixed inset-0 w-full h-full">
            <Canvas
                camera={{
                    position: [5, 4, 5],
                    fov: isMobile ? 60 : 50,
                    near: 0.1,
                    far: 100,
                }}
                shadows={!isMobile}
                dpr={isMobile ? [1, 1.5] : [1, 2]}
                gl={{
                    antialias: !isMobile,
                    alpha: false,
                    powerPreference: isMobile ? 'low-power' : 'high-performance',
                }}
                style={{ background: '#0a0a0a' }}
            >
                <Suspense fallback={<LoadingFallback />}>
                    <SceneContent dailyStatus={dailyStatus} onSectorClick={onSectorClick} />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    )
}
