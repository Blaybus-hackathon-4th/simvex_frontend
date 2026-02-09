import { useRef, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useViewerStore } from '@/store/viewerStore';
import type {ModelViewerProps, PartMeshProps, SingleGLBLoaderProps} from "@/types";

// 개별 GLB 파일을 로드하는 컴포넌트
const SingleGLBLoader = ({ url, index }: SingleGLBLoaderProps) => {
    const { scene } = useGLTF(url);

    // 모델마다 랜덤 분해 방향 설정
    const explodeDir = useMemo(() => {
        return new THREE.Vector3(
            Math.sin(index * 123),
            Math.cos(index * 234),
            Math.sin(index * 345)
        ).normalize();
    }, [index]);

    return (
        <group>
            {scene.children.map((child) => {
                // THREE.Object3D가 Mesh인지 확인
                if ((child as THREE.Mesh).isMesh) {
                    const meshChild = child as THREE.Mesh;

                    // 파일명에서 ID 추출 (예: /models/v4/piston.glb -> piston)
                    const fileName = url.split('/').pop() || '';
                    const partId = fileName.replace('.glb', '') || meshChild.uuid;

                    return (
                        <PartMesh
                            key={meshChild.uuid}
                            node={meshChild}
                            partId={partId}
                            explodeDir={explodeDir}
                            explodeDist={5}
                        />
                    );
                }
                // Mesh가 아닌 경우(Group, Light 등) 그대로 렌더링
                return <primitive key={child.uuid} object={child} />;
            })}
        </group>
    );
};

// PartMesh 컴포넌트
const PartMesh = ({ node, partId, explodeDir, explodeDist }: PartMeshProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { sliderValue, selectedPartId, setSelectedPartId } = useViewerStore();

    // 초기 위치 저장
    const initialPos = useRef(node.position.clone());

    // Material Clone (원본 훼손 방지)
    const material = useMemo(() => {
        return node.material instanceof THREE.Material ? node.material.clone() : node.material;
    }, [node.material]);

    useFrame(() => {
        if (!meshRef.current) return;

        // 1. 분해 애니메이션 로직
        const progress = sliderValue / 100;
        const targetPos = initialPos.current.clone().add(
            explodeDir.clone().multiplyScalar(explodeDist * progress)
        );
        meshRef.current.position.lerp(targetPos, 0.1);

        // 2. 하이라이트 로직
        const isSelected = selectedPartId === partId;
        const isGhostMode = selectedPartId !== null && !isSelected;

        // Material 타입 단언: emissive 속성은 Standard/Physical Material에만 존재함
        // 만약 BasicMaterial을 쓴다면 이 부분 로직 수정 필요
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;

        // Material 속성 변경
        if (mat.emissive) {
            if (isSelected) {
                mat.emissive.setHex(0x00E0FF);
                mat.emissiveIntensity = 0.5;
                mat.transparent = false;
                mat.opacity = 1.0;
            } else if (isGhostMode) {
                mat.emissive.setHex(0x000000);
                mat.transparent = true;
                mat.opacity = 0.2;
            } else {
                mat.emissive.setHex(0x000000);
                mat.transparent = false;
                mat.opacity = 1.0;
            }
        }
    });

    return (
        <primitive
            object={node}
            ref={meshRef}
            material={material}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                console.log("Selected Part:", partId);
                setSelectedPartId(partId);
            }}
        />
    );
};

// 메인 ModelViewer 컴포넌트
export const ModelViewer = ({ filePaths }: ModelViewerProps) => {
    const { setSelectedPartId } = useViewerStore();

    return (
        <group dispose={null} onPointerMissed={() => setSelectedPartId(null)}>
            {filePaths.map((path, index) => (
                <SingleGLBLoader key={path} url={path} index={index} />
            ))}
        </group>
    );
};