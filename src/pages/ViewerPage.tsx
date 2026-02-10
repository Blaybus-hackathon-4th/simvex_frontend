import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { ModelViewer } from '@/components/three/ModelViewer';
import ViewerSidebar from '@/components/viewer/ViewerLeftSidebar';
import ViewerRightSidebar from '@/components/viewer/ViewerRightSidebar';

import { useViewerStore } from '@/store/viewerStore';
import { useLearningStore } from '@/store/learningStore'; // [NEW] 1. 스토어 임포트
import callApi, { HttpMethod } from '@/api/callApi';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

// --- [Dummy Data for Fallback] ---
const DUMMY_OBJECT_DATA: ObjectDetailResult = {
    objectId: 1,
    objectNameKr: "V4 엔진 (Dummy)",
    objectNameEn: "V4 Engine",
    discription: {
        objectContent: "이 데이터는 API 호출 실패 시 표시되는 더미 데이터입니다. V4 엔진은 4개의 실린더가 V자 형태로 배열된 내연기관입니다.",
        principle: ["API 연결 상태를 확인해주세요.", "현재 더미 모드로 동작 중입니다.", "4행정 사이클로 동작합니다."],
        structuralAdvantages: ["컴팩트한 사이즈", "높은 출력 밀도"],
        designConstraints: ["복잡한 배기 구조"]
    },
    models: [
        {
            modelId: 1,
            nameKr: "피스톤",
            nameEn: "Piston",
            description: "피스톤 더미 설명",
            modelUrl: "/models/v4_engine/Piston.glb",
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
        },
        {
            modelId: 2,
            nameKr: "크랭크샤프트",
            nameEn: "Crankshaft",
            description: "크랭크축 더미 설명",
            modelUrl: "/models/v4_engine/Crankshaft.glb",
            transform: { position: [0, -2, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
        }
        // ... 필요한 더미 모델 추가
    ]
};

const DUMMY_COMPONENT_DATA: ComponentDetailResult = {
    componentId: 1,
    componentNameKr: "피스톤 (Dummy)",
    componentNameEn: "Piston",
    componentContent: "API 호출 실패로 로드된 피스톤 상세 정보입니다.",
    elements: [
        { elementName: "헤드", elementContent: "연소 압력을 받는 부위" },
        { elementName: "스커트", elementContent: "실린더 내벽을 지지하는 부위" }
    ]
};

const ViewerPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Zustand Store
    const { sliderValue, setSliderValue, selectedPartId, setSelectedPartId } = useViewerStore();

    // [NEW] 2. 학습 포인트 적립 액션 가져오기
    const addPartInteraction = useLearningStore(state => state.addPartInteraction);

    // Local Data State
    const [objectData, setObjectData] = useState<ObjectDetailResult | null>(null);
    const [componentData, setComponentData] = useState<ComponentDetailResult | null>(null);

    // [API 1] 초기 로드: 오브젝트 상세 조회
    useEffect(() => {
        const fetchObjectDetail = async () => {
            if (!id) console.warn("No ID provided");

            try {
                // API 호출은 하되, 현재 모델 경로가 깨져 있으므로 로그만 찍음
                const res = await callApi<{ result: ObjectDetailResult }>(
                    `/objects/${id}/details`,
                    HttpMethod.GET
                );

                console.log("API Response:", res); // API 응답 확인용 로그

                // 백엔드 경로("assets/models/...")가 해결될 때까지
                // 강제로 더미 데이터를 사용하여 에러를 방지합니다.
                console.warn("⚠️ 모델 로딩 에러 방지를 위해 더미 데이터를 사용합니다.");
                setObjectData(DUMMY_OBJECT_DATA);

                /* // 나중에 백엔드 경로가 고쳐지면 아래 코드로 원복하세요.
                if (res?.result) {
                     setObjectData(res.result);
                } else {
                     throw new Error("Result is empty");
                }
                */

            } catch (err) {
                console.error("Failed to fetch object details:", err);
                setObjectData(DUMMY_OBJECT_DATA);
            }
        };
        fetchObjectDetail();
    }, [id]);

    // [API 2] 인터랙션: 부품 상세 조회 및 [학습 포인트 적립]
    useEffect(() => {
        const handlePartInteraction = async () => {
            if (!selectedPartId) {
                setComponentData(null);
                return;
            }

            // [NEW] 3. 부품 클릭 시 학습 포인트 적립 (1점)
            if (id) {
                addPartInteraction(id, selectedPartId);
            }

            try {
                const res = await callApi<{ result: ComponentDetailResult }>(
                    `/objects/components/${selectedPartId}`,
                    HttpMethod.GET
                );
                if (res?.result) {
                    setComponentData(res.result);
                } else {
                    // API 실패 시 Fallback: objectData에 있는 기본 정보라도 보여줌
                    const fallbackModel = objectData?.models.find(m => m.modelId.toString() === selectedPartId);

                    if (fallbackModel) {
                        setComponentData({
                            componentId: Number(fallbackModel.modelId),
                            componentNameKr: fallbackModel.nameKr,
                            componentNameEn: fallbackModel.nameEn,
                            componentContent: fallbackModel.description,
                            elements: []
                        });
                    } else {
                        // 진짜 아무것도 없으면 더미 사용
                        setComponentData({
                            ...DUMMY_COMPONENT_DATA,
                            componentId: Number(selectedPartId),
                            componentNameKr: `부품 ${selectedPartId}`
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch component details:", err);
                setComponentData({
                    ...DUMMY_COMPONENT_DATA,
                    componentId: Number(selectedPartId),
                    componentNameKr: `부품 ${selectedPartId} (Dummy)`
                });
            }
        };
        handlePartInteraction();
    }, [selectedPartId, id, addPartInteraction, objectData]); // 의존성 배열에 addPartInteraction 추가

    // 데이터 로딩 중 표시
    if (!objectData) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Data...</div>;

    return (
        <div className="flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans">

            {/* 1. Header (공통 헤더) */}
            <header className="absolute top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={() => navigate(-1)} className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition">
                        <ChevronLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide text-white">
                        {objectData.objectNameEn} <span className="text-gray-400 font-normal ml-2">{objectData.objectNameKr}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                    {/* 학습 체크 뱃지는 ViewerRightSidebar에서 관리하므로 여기선 제거하거나 단순 장식용으로 둠 */}
                    <button className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg transition">
                        <Share2 size={18} />
                    </button>
                </div>
            </header>

            {/* 2. Left Sidebar (조립/분해 제어 & 미니맵) */}
            <ViewerSidebar
                objectData={objectData}
                sliderValue={sliderValue}
                setSliderValue={setSliderValue}
                selectedPartId={selectedPartId}
                setSelectedPartId={setSelectedPartId}
            />

            {/* 3. Center (Main 3D Canvas) */}
            <main className="flex-1 relative bg-linear-to-b from-[#1a1a1a] to-[#050505]">
                <Canvas camera={{ position: [8, 6, 8], fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
                    <Suspense fallback={<Html center><div className="text-blue-400 animate-pulse">Loading Engine...</div></Html>}>
                        <Environment preset="city" />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

                        {/* 메인 3D 모델 뷰어 */}
                        <ModelViewer models={objectData.models} assemblyProgress={sliderValue / 100} />

                        <ContactShadows position={[0, -2, 0]} opacity={0.4} blur={2} />
                        <OrbitControls minDistance={5} maxDistance={20} />
                    </Suspense>
                </Canvas>
            </main>

            {/* 4. Right Sidebar (설명, 노트, AI 탭) */}
            <ViewerRightSidebar
                objectId={id || ""}
                objectData={objectData}
                componentData={componentData}
                selectedPartId={selectedPartId}
                setSelectedPartId={setSelectedPartId}
            />
        </div>
    );
};

export default ViewerPage;