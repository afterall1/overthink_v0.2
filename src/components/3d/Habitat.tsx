'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import { DailyStatus, SECTOR_COLORS, CATEGORY_COLORS } from './types'
import { CategorySlug } from '@/types/database.types'

interface HabitatProps {
    dailyStatus: DailyStatus
    onSectorClick?: (slug: CategorySlug) => void
}

interface SectorConfig {
    slug: CategorySlug
    name: string
    angle: number
    objectType: 'box' | 'sphere' | 'cone' | 'cylinder' | 'octahedron' | 'torus'
}

const SECTORS: SectorConfig[] = [
    { slug: 'trade', name: 'Trade', angle: 0, objectType: 'box' },
    { slug: 'food', name: 'Food', angle: 60, objectType: 'sphere' },
    { slug: 'sport', name: 'Sport', angle: 120, objectType: 'octahedron' },
    { slug: 'dev', name: 'Dev', angle: 180, objectType: 'cylinder' },
    { slug: 'etsy', name: 'Etsy', angle: 240, objectType: 'cone' },
    { slug: 'gaming', name: 'Gaming', angle: 300, objectType: 'torus' },
]

function HexSector({
    config,
    isCompleted,
    onClick,
    isActive
}: {
    config: SectorConfig
    isCompleted: boolean
    onClick: () => void
    isActive: boolean
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const objectRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    const angleRad = (config.angle * Math.PI) / 180
    const radius = 2.2
    const position: [number, number, number] = [
        Math.cos(angleRad) * radius,
        0,
        Math.sin(angleRad) * radius,
    ]

    const objectPosition: [number, number, number] = [
        Math.cos(angleRad) * radius,
        0.8,
        Math.sin(angleRad) * radius,
    ]

    // Animated glow effect
    useFrame((state) => {
        if (objectRef.current) {
            const material = objectRef.current.material as THREE.MeshStandardMaterial
            if (isCompleted) {
                const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8
                material.emissiveIntensity = pulse
            } else {
                material.emissiveIntensity = hovered ? 0.3 : 0.1
            }

            // Gentle rotation
            objectRef.current.rotation.y += 0.005
            objectRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
        }
    })

    const sectorColor = isCompleted ? SECTOR_COLORS.completed : SECTOR_COLORS.incomplete
    const categoryColor = CATEGORY_COLORS[config.slug]

    const ObjectComponent = useMemo(() => {
        const props = {
            ref: objectRef,
            position: objectPosition,
            scale: isActive ? 1.2 : hovered ? 1.1 : 1,
            onClick: (e: { stopPropagation: () => void }) => {
                e.stopPropagation()
                onClick()
            },
            onPointerOver: () => setHovered(true),
            onPointerOut: () => setHovered(false),
        }

        const materialProps = {
            color: isCompleted ? categoryColor : '#1f2937',
            emissive: isCompleted ? categoryColor : '#374151',
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2,
        }

        switch (config.objectType) {
            case 'box':
                return (
                    <mesh {...props}>
                        <boxGeometry args={[0.6, 0.6, 0.6]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            case 'sphere':
                return (
                    <mesh {...props}>
                        <sphereGeometry args={[0.4, 32, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            case 'cone':
                return (
                    <mesh {...props}>
                        <coneGeometry args={[0.4, 0.8, 6]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            case 'cylinder':
                return (
                    <mesh {...props}>
                        <cylinderGeometry args={[0.3, 0.3, 0.7, 8]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            case 'octahedron':
                return (
                    <mesh {...props}>
                        <octahedronGeometry args={[0.45]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            case 'torus':
                return (
                    <mesh {...props}>
                        <torusGeometry args={[0.35, 0.15, 16, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
        }
    }, [config.objectType, isCompleted, hovered, isActive, categoryColor, onClick, objectPosition])

    return (
        <group>
            {/* Hexagon sector base */}
            <mesh
                ref={meshRef}
                position={position}
                rotation={[-Math.PI / 2, 0, angleRad + Math.PI / 6]}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <cylinderGeometry args={[1.3, 1.3, 0.15, 6]} />
                <meshStandardMaterial
                    color={hovered ? SECTOR_COLORS.hover : sectorColor}
                    metalness={0.6}
                    roughness={0.4}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Floating object */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {ObjectComponent}
            </Float>

            {/* Category label */}
            <Text
                position={[position[0], -0.2, position[2]]}
                fontSize={0.25}
                color={isCompleted ? '#ffffff' : '#6b7280'}
                anchorX="center"
                anchorY="middle"
                font="/fonts/inter.woff"
            >
                {config.name}
            </Text>

            {/* Status indicator ring */}
            {isCompleted && (
                <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.1, 1.25, 6]} />
                    <meshBasicMaterial color={SECTOR_COLORS.completed} transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    )
}

function CenterCore({ dailyStatus }: { dailyStatus: DailyStatus }) {
    const coreRef = useRef<THREE.Mesh>(null)
    const completedCount = Object.values(dailyStatus).filter(Boolean).length
    const progress = completedCount / 6

    useFrame((state) => {
        if (coreRef.current) {
            coreRef.current.rotation.y += 0.003
            const scale = 1 + Math.sin(state.clock.elapsedTime) * 0.05
            coreRef.current.scale.setScalar(scale)
        }
    })

    return (
        <group>
            {/* Central hexagonal platform */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 0.1, 6]} />
                <meshStandardMaterial
                    color="#1e1b4b"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Floating core orb */}
            <mesh ref={coreRef} position={[0, 0.6, 0]}>
                <icosahedronGeometry args={[0.35, 1]} />
                <meshStandardMaterial
                    color={progress > 0.5 ? '#22c55e' : '#8b5cf6'}
                    emissive={progress > 0.5 ? '#22c55e' : '#8b5cf6'}
                    emissiveIntensity={0.8}
                    metalness={0.3}
                    roughness={0.2}
                    wireframe
                />
            </mesh>

            {/* Inner solid core */}
            <mesh position={[0, 0.6, 0]}>
                <icosahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Progress text */}
            <Text
                position={[0, 1.2, 0]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                {`${completedCount}/6`}
            </Text>
        </group>
    )
}

export default function Habitat({ dailyStatus, onSectorClick }: HabitatProps) {
    const [activeSector, setActiveSector] = useState<CategorySlug | null>(null)
    const { camera } = useThree()
    const targetPosition = useRef(new THREE.Vector3(5, 4, 5))

    const handleSectorClick = (slug: CategorySlug) => {
        const config = SECTORS.find(s => s.slug === slug)
        if (!config) return

        if (activeSector === slug) {
            // Zoom out
            setActiveSector(null)
            targetPosition.current.set(5, 4, 5)
        } else {
            // Zoom in
            setActiveSector(slug)
            const angleRad = (config.angle * Math.PI) / 180
            const zoomRadius = 3.5
            targetPosition.current.set(
                Math.cos(angleRad) * zoomRadius,
                2.5,
                Math.sin(angleRad) * zoomRadius
            )
        }

        onSectorClick?.(slug)
    }

    useFrame(() => {
        camera.position.lerp(targetPosition.current, 0.02)
        camera.lookAt(0, 0, 0)
    })

    return (
        <group>
            {/* Base platform */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                <cylinderGeometry args={[4, 4.2, 0.3, 6]} />
                <meshStandardMaterial
                    color="#0f0f23"
                    metalness={0.8}
                    roughness={0.3}
                />
            </mesh>

            {/* Sectors */}
            {SECTORS.map((config) => (
                <HexSector
                    key={config.slug}
                    config={config}
                    isCompleted={dailyStatus[config.slug]}
                    onClick={() => handleSectorClick(config.slug)}
                    isActive={activeSector === config.slug}
                />
            ))}

            {/* Center */}
            <CenterCore dailyStatus={dailyStatus} />
        </group>
    )
}
