import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Box, FileText, Bot, Edit3, HelpCircle,
    Layers, Search, Share2, X
} from 'lucide-react';

import { ModelViewer } from '@/components/three/ModelViewer';
import { useViewerStore } from '@/store/viewerStore';
import callApi, { HttpMethod } from '@/api/callApi';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

// [1] 더미 데이터 정의 (API 실패 시 사용)
const DUMMY_OBJECT_DATA: ObjectDetailResult = {
    objectId: 1,
    objectNameKr: "V4 엔진 (Dummy)",
    objectNameEn: "V4 Engine",
    discription: {
        objectContent: "이 데이터는 API 호출 실패 시 표시되는 더미 데이터입니다. V4 엔진은 4개의 실린더가 V자 형태로 배열된 내연기관입니다.",
        principle: [
            "API 연결 상태를 확인해주세요.",
            "현재 더미 모드로 동작 중입니다.",
            "4행정 사이클(흡입-압축-폭발-배기)로 동작합니다."
        ],
        structuralAdvantages: ["컴팩트한 사이즈", "높은 출력 밀도"],
        designConstraints: ["복잡한 배기 구조"]
    },
    models: [
        // 실제 로컬에 있는 glb 파일 경로로 수정해서 테스트하세요
        {
            modelId: 1,
            nameKr: "피스톤",
            nameEn: "Piston",
            description: "피스톤 더미 설명",
            modelUrl: "/models/v4_engine/Piston.glb", // public/models 폴더에 파일이 있어야 보입니다.
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
    const { sliderValue, setSliderValue, selectedPartId, setSelectedPartId } = useViewerStore();

    // Data State
    const [objectData, setObjectData] = useState<ObjectDetailResult | null>(null);
    const [componentData, setComponentData] = useState<ComponentDetailResult | null>(null);
    const [activeTab, setActiveTab] = useState<'desc' | 'ai' | 'note' | 'quiz'>('desc');

    // [API 1] 초기 로드: 오브젝트 상세 조회
    useEffect(() => {
        const fetchObjectDetail = async () => {
            // id가 없어도 더미 데이터 테스트를 위해 return 제거 가능 (필요 시)
            if (!id) console.warn("No ID provided, defaulting to dummy ID 1");

            try {
                // 실제 호출: /api/v1/objects/{id}/details
                const res = await callApi<{ result: ObjectDetailResult }>(
                    `/objects/${id}/details`,
                    HttpMethod.GET
                );

                if (res?.result) {
                    setObjectData(res.result);
                } else {
                    throw new Error("Result is empty"); // 강제로 catch로 보냄
                }
            } catch (err) {
                console.error("Failed to fetch object details (Using Dummy):", err);
                // 에러 발생 시 더미 데이터 세팅
                setObjectData(DUMMY_OBJECT_DATA);
            }
        };
        fetchObjectDetail();
    }, [id]);

    // [API 2] 인터랙션: 부품 상세 조회 (selectedPartId 변경 시)
    useEffect(() => {
        const fetchComponentDetail = async () => {
            if (!selectedPartId) {
                setComponentData(null);
                return;
            }
            try {
                const res = await callApi<{ result: ComponentDetailResult }>(
                    `/objects/components/${selectedPartId}`,
                    HttpMethod.GET
                );

                if (res?.result) {
                    setComponentData(res.result);
                } else {
                    throw new Error("Component Result is empty");
                }
            } catch (err) {
                console.error("Failed to fetch component details (Using Dummy):", err);
                // 에러 발생 시 더미 데이터 세팅
                // 실제로는 선택된 ID에 따라 내용을 바꿔야 하지만 테스트용이므로 고정값 사용
                setComponentData({
                    ...DUMMY_COMPONENT_DATA,
                    componentId: Number(selectedPartId), // 선택한 ID 반영하는 척
                    componentNameKr: `부품 ${selectedPartId} (Dummy)`
                });
            }
        };
        fetchComponentDetail();
    }, [selectedPartId]);


    if (!objectData) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Data...</div>;

    return (
        <div className="flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans">

            {/* 1. Header */}
            <header className="absolute top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-6 bg-linear-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
                        <ChevronLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide text-white">
                        {objectData.objectNameEn} <span className="text-gray-400 font-normal ml-2">{objectData.objectNameKr}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="text-xs text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/10">학습 체크</span>
                    <button className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg transition">
                        <Share2 size={18} />
                    </button>
                </div>
            </header>

            {/* 2. Left Sidebar */}
            <aside className="absolute left-6 top-24 w-64 z-40 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-150px)]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-200">조립 상태</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                </div>

                <div className="px-4 py-6 border-b border-white/10">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>조립</span>
                        <span>분해</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-xs text-gray-500 px-2 py-2 uppercase font-semibold">부품 {objectData.models.length}</div>
                    {objectData.models.map((model) => (
                        <div
                            key={model.modelId}
                            onClick={() => setSelectedPartId(model.modelId.toString())}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all mb-1
                                ${selectedPartId === model.modelId.toString()
                                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-200'
                                : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Box size={14} />
                            <span className="text-sm truncate">{model.nameKr}</span>
                            <span className="ml-auto opacity-0 group-hover:opacity-100">
                                <Search size={12} />
                            </span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* 3. Center (3D Canvas) */}
            <main className="flex-1 relative bg-linear-to-b from-[#1a1a1a] to-[#050505]">
                <Canvas camera={{ position: [8, 6, 8], fov: 40 }}>
                    <Suspense fallback={<Html center><div className="text-blue-400 animate-pulse">Loading Engine...</div></Html>}>
                        <Environment preset="city" />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

                        {/* ModelViewer에 더미 데이터 모델 전달 */}
                        <ModelViewer models={objectData.models} />

                        <ContactShadows position={[0, -2, 0]} opacity={0.4} blur={2} />
                        <OrbitControls minDistance={5} maxDistance={20} />
                    </Suspense>
                </Canvas>

                <div className="absolute bottom-6 left-8 text-[10px] text-gray-600 font-mono">
                    X: 12.4 / Y: -8.1 / Z: 35.0
                </div>
            </main>

            {/* 4. Right Sidebar */}
            <aside className="w-[460px] bg-[#161616] border-l border-white/10 flex z-50 shadow-2xl">

                {/* Content Area (왼쪽) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'desc' && (
                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <Layers size={20} className="text-gray-400" />
                                    </div>
                                    <HelpCircle size={18} className="text-gray-500 cursor-pointer" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {selectedPartId && componentData
                                        ? componentData.componentNameEn
                                        : objectData.objectNameEn}
                                </h2>
                                <h3 className="text-lg text-gray-400 font-medium mb-4">
                                    {selectedPartId && componentData
                                        ? componentData.componentNameKr
                                        : objectData.objectNameKr}
                                </h3>

                                <div className="flex gap-2 flex-wrap mb-6">
                                    {['#내연기관', '#에너지변환', '#기구학'].map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-[#252525] text-blue-400 text-xs rounded border border-blue-900/30">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-sm leading-relaxed text-gray-300">
                                    {selectedPartId && componentData
                                        ? componentData.componentContent
                                        : objectData.discription.objectContent}
                                </p>
                            </div>

                            {!selectedPartId ? (
                                <>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-gray-200 border-l-2 border-blue-500 pl-3">
                                            공학적 원리 및 작동 메커니즘
                                        </h4>
                                        <div className="space-y-3">
                                            {objectData.discription.principle.map((text, idx) => (
                                                <div key={idx} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 hover:border-white/10 transition">
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        {text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {objectData.discription.structuralAdvantages && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-200 border-l-2 border-green-500 pl-3">
                                                구조적 장점
                                            </h4>
                                            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 ml-1">
                                                {objectData.discription.structuralAdvantages.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                componentData && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-blue-400 text-xs font-bold">COMPONENT ID</span>
                                                <span className="text-gray-500 text-xs">{componentData.componentId}</span>
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-bold text-gray-200 mt-6 mb-3">구성 요소 상세</h4>
                                        {componentData.elements.map((el, idx) => (
                                            <div key={idx} className="group">
                                                <div className="text-xs font-bold text-gray-300 mb-1 group-hover:text-blue-400 transition-colors">
                                                    • {el.elementName}
                                                </div>
                                                <div className="text-xs text-gray-500 pl-3 border-l border-white/10 group-hover:border-blue-500/50 transition-colors">
                                                    {el.elementContent}
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => setSelectedPartId(null)}
                                            className="w-full mt-8 py-3 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded-lg transition border border-white/5 flex items-center justify-center gap-2"
                                        >
                                            <X size={14} />
                                            전체 뷰로 돌아가기
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {activeTab !== 'desc' && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                            <Bot size={40} className="opacity-20" />
                            <span className="text-sm">기능 준비 중입니다.</span>
                        </div>
                    )}
                </div>

                {/* Sidebar Tabs (오른쪽) */}
                <div className="flex flex-col gap-4 w-16 py-6 items-center border-l border-white/10 bg-[#1a1a1a]">
                    {[
                        { id: 'desc', icon: FileText, label: '설명' },
                        { id: 'ai', icon: Bot, label: 'AI' },
                        { id: 'note', icon: Edit3, label: '노트' },
                        { id: 'quiz', icon: HelpCircle, label: '퀴즈' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14
                               ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a]'}`}
                        >
                            <tab.icon size={20} />
                            <span className="text-[10px]">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </aside>
        </div>
    );
};

export default ViewerPage;