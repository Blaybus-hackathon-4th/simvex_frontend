import { useRef, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import type { Model3DInfo } from '@/types';

interface ModelViewerProps {
    models: Model3DInfo[];
    assemblyProgress: number;
}

export const ModelViewer = ({ models, assemblyProgress }: ModelViewerProps) => {
    const groupRef = useRef<THREE.Group>(null);

    // [최적화] initialTransforms는 렌더링마다 초기화되면 안 되므로 useRef 유지
    const initialTransforms = useRef<{ [key: number]: { position: THREE.Vector3, rotation: THREE.Euler } }>({});

    // 모든 모델 파일 로드
    const gltfs = useLoader(GLTFLoader, models.map(model => model.modelUrl));

    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;

        // [중요] 기존에 추가된 모델이 있다면 제거 (중복 방지)
        group.clear();

        models.forEach((model, index) => {
            const gltf = gltfs[index];
            // 씬을 복제하여 독립적인 객체로 만듦
            const object = gltf.scene.clone(true);

            // API에서 받아온 transform 적용
            object.position.set(...model.transform.position);
            object.rotation.set(...model.transform.rotation);
            object.scale.set(...model.transform.scale);

            // 초기 위치/회전 저장 (애니메이션 기준점)
            initialTransforms.current[model.modelId] = {
                position: object.position.clone(),
                rotation: object.rotation.clone()
            };

            // 식별을 위해 이름 설정
            const modelGroup = new THREE.Group();
            modelGroup.name = `model-${model.modelId}`;
            modelGroup.add(object);

            group.add(modelGroup);
        });

        // 언마운트 시 클린업
        return () => {
            group.clear();
        };
    }, [gltfs, models]);

    useFrame(() => {
        // Null Check (groupRef.current가 null일 수 있음을 처리)
        if (!groupRef.current) return;

        groupRef.current.children.forEach((child) => {
            const modelId = Number(child.name.replace('model-', ''));
            const initialTransform = initialTransforms.current[modelId];

            if (initialTransform) {
                const { position: initialPos } = initialTransform;

                // 분해 방향 계산
                const explodeDirection = initialPos.clone().normalize();
                if (explodeDirection.length() === 0) {
                    explodeDirection.set(0, 1, 0);
                }

                const explodeDistance = 5;
                const explodedPos = initialPos.clone().add(explodeDirection.multiplyScalar(explodeDistance));

                // 선형 보간 (Lerp)
                child.position.lerpVectors(initialPos, explodedPos, assemblyProgress);
            }
        });
    });

    return <group ref={groupRef} />;
};