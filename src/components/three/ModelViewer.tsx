import { useRef, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useViewerStore } from '@/store/viewerStore';
import type { Model3DInfo } from '@/types';

// index 파라미터 제거
const PartModel = ({ model }: { model: Model3DInfo }) => {
    // 실제 환경에서는 model.modelUrl 사용
    const { scene } = useGLTF(model.modelUrl);
    const meshRef = useRef<THREE.Group>(null);

    const { sliderValue, selectedPartId, setSelectedPartId } = useViewerStore();

    // API에서 받은 Transform 적용
    const initialPos = useMemo(() => new THREE.Vector3(...model.transform.position), [model]);
    const initialRot = useMemo(() => new THREE.Euler(...model.transform.rotation), [model]);
    const initialScale = useMemo(() => new THREE.Vector3(...model.transform.scale), [model]);

    // 분해 방향 (중심점에서 바깥으로)
    const explodeDir = useMemo(() => {
        return initialPos.clone().normalize();
    }, [initialPos]);

    // Material 복제 (Highlight 처리를 위해)
    const clone = useMemo(() => scene.clone(), [scene]);

    useFrame(() => {
        if (!meshRef.current) return;

        // 1. 분해 애니메이션
        const explodeDist = 5; // 최대 분해 거리
        const progress = sliderValue / 100;
        const targetPos = initialPos.clone().add(explodeDir.clone().multiplyScalar(explodeDist * progress));

        meshRef.current.position.lerp(targetPos, 0.1);

        // 2. 하이라이트/고스트 효과
        const isSelected = selectedPartId === model.modelId.toString();
        const isGhostMode = selectedPartId !== null && !isSelected;

        // [최적화] traverse는 매 프레임 돌면 무거울 수 있으므로, 상태가 변했을 때만 실행하도록 리팩토링 고려 가능
        // 현재 로직 유지 시:
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // Material 타입 단언 (필요 시 더 안전하게 체크)
                const mat = mesh.material as THREE.MeshStandardMaterial;

                if (mat) {
                    // 기존 Material 속성 유지하면서 투명도만 조절
                    if (isSelected) {
                        mat.emissive.setHex(0x00E0FF);
                        mat.emissiveIntensity = 0.3;
                        mat.transparent = false;
                        mat.opacity = 1;
                    } else if (isGhostMode) {
                        mat.emissive.setHex(0x000000);
                        mat.transparent = true;
                        mat.opacity = 0.1;
                    } else {
                        mat.emissive.setHex(0x000000);
                        mat.transparent = false;
                        mat.opacity = 1;
                    }
                }
            }
        });
    });

    return (
        <primitive
            ref={meshRef}
            object={clone}
            position={initialPos}
            rotation={initialRot}
            scale={initialScale}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                setSelectedPartId(model.modelId.toString());
            }}
        />
    );
};

// 메인 뷰어
export const ModelViewer = ({ models }: { models: Model3DInfo[] }) => {
    const { setSelectedPartId } = useViewerStore();

    return (
        <group onPointerMissed={() => setSelectedPartId(null)}>
            {/* map에서 index 제거 및 props 전달 제거 */}
            {models.map((model) => (
                <PartModel key={model.modelId} model={model} />
            ))}
        </group>
    );
};