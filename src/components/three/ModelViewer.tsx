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

    // [최적화] 초기 위치(position)와 함께 '폭발 방향(visualCenter)'을 저장
    const initialTransforms = useRef<{
        [key: number]: {
            position: THREE.Vector3,
            direction: THREE.Vector3 // 분해되어야 할 방향 벡터
        }
    }>({});

    const gltfs = useLoader(GLTFLoader, models.map(model => model.modelUrl));

    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;

        group.clear();

        // 1. 모델 배치 및 데이터 준비
        models.forEach((model, index) => {
            const gltf = gltfs[index];
            const object = gltf.scene.clone(true);

            // Transform 적용
            object.position.set(...model.transform.position);
            object.rotation.set(...model.transform.rotation);
            object.scale.set(...model.transform.scale);

            // [핵심 수정 1] 분해 방향 계산 (단순 position이 아닌, 부품의 시각적 중심점 활용)
            // 부품의 BoundingBox(부피)를 계산해서 그 중심이 어디인지 찾습니다.
            const box = new THREE.Box3().setFromObject(object);
            const center = new THREE.Vector3();
            box.getCenter(center);

            // 중심점이 (0,0,0)인 경우(전체 프레임 등)는 위쪽(Y축)이나 앞쪽(Z축)으로 설정 방지
            // 만약 center가 거의 0이라면 분해되지 않거나 특정 축으로만 가게 조정 필요.
            // 여기서는 center 벡터 자체를 분해 방향으로 사용합니다.
            const explosionDir = center.clone().normalize();

            // 만약 방향이 너무 미미하면(중심에 있는 부품) Y축으로 살짝 뜨게 설정
            if (explosionDir.length() === 0) {
                explosionDir.set(0, 1, 0);
            }

            // 초기 상태 저장
            initialTransforms.current[model.modelId] = {
                position: object.position.clone(),
                direction: explosionDir // 계산된 방향 저장
            };

            const modelGroup = new THREE.Group();
            modelGroup.name = `model-${model.modelId}`;
            modelGroup.add(object);

            group.add(modelGroup);
        });

        // [핵심 수정 2] 모델 전체를 화면 중앙으로 정렬 (Auto-Centering)
        // 모든 부품이 추가된 후, 전체 그룹의 중심을 계산하여 (0,0,0)으로 이동시킵니다.
        // 이렇게 해야 OrbitControls의 회전/줌이 자연스러워집니다.
        const groupBox = new THREE.Box3().setFromObject(group);
        const groupCenter = new THREE.Vector3();
        groupBox.getCenter(groupCenter);

        // 그룹 자체를 반대 방향으로 이동시켜 중심을 맞춤
        group.position.x = -groupCenter.x;
        group.position.y = -groupCenter.y;
        group.position.z = -groupCenter.z;

        return () => {
            group.clear();
        };
    }, [gltfs, models]);

    useFrame(() => {
        if (!groupRef.current) return;

        groupRef.current.children.forEach((child) => {
            // child.name에서 ID 추출 (예: "model-51")
            const modelId = Number(child.name.replace('model-', ''));
            const initialData = initialTransforms.current[modelId];

            if (initialData) {
                const { position: initialPos, direction } = initialData;

                // [핵심 수정 3] 분해 로직 개선
                // assemblyProgress(0~1)에 따라 방향(direction) * 거리(distance) 만큼 이동
                const explodeDistance = 3; // 분해 거리 (필요시 조절)

                // 목표 위치 = 초기위치 + (방향 * 거리 * 진행도)
                // lerpVectors 대신 직접 계산이 더 직선적으로 반응함
                const offset = direction.clone().multiplyScalar(explodeDistance * assemblyProgress);
                const targetPos = initialPos.clone().add(offset);

                // 부드러운 이동 (선형 보간)
                // 단순히 targetPos를 넣어도 되지만, lerp를 쓰면 0.1 정도의 damping 효과를 줄 수 있음.
                // 하지만 여기서는 sliderValue가 이미 애니메이션 값이므로 직접 할당이 반응성이 좋음.
                child.position.copy(targetPos);
            }
        });
    });

    return <group ref={groupRef} />;
};