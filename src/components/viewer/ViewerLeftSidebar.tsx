import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Box, ChevronDown, ChevronRight, Eye } from 'lucide-react'; // [수정] ChevronRight 추가
import { ModelViewer } from '@/components/three/ModelViewer';
import type { ObjectDetailResult } from '@/types';

interface ViewerSidebarProps {
    objectData: ObjectDetailResult;
    sliderValue: number;
    setSliderValue: (value: number) => void;
    selectedPartId: string | null;
    setSelectedPartId: (id: string | null) => void;
}

const ViewerLeftSidebar = ({
                               objectData,
                               sliderValue,
                               setSliderValue,
                               selectedPartId,
                               setSelectedPartId
                           }: ViewerSidebarProps) => {
    // 부품 리스트 접기/펼치기 상태 관리
    const [isListOpen, setIsListOpen] = useState(true);

    const toggleList = () => {
        setIsListOpen(!isListOpen);
    };

    return (
        <aside className="absolute left-6 top-20 w-80 z-40 flex flex-col gap-4 max-h-[calc(100vh-100px)] pointer-events-auto">

            {/* 1-1. Mini Map / Status Box (상단 미니맵 영역) */}
            <div className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 rounded-xl p-1 relative group overflow-hidden shrink-0">
                <div className="relative w-full h-32 bg-surface rounded-lg border border-blue-500/30 flex items-center justify-center overflow-hidden">
                    {/* 미니맵 3D 뷰어 */}
                    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                        <Suspense fallback={null}>
                            <Environment preset="city" />
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[5, 10, 5]} intensity={1.5} />
                            {/* 메인 뷰어와 동일한 모델 표시 (조립 상태 반영 X - 항상 조립된 상태) */}
                            <ModelViewer models={objectData.models} assemblyProgress={0} />
                            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                        </Suspense>
                    </Canvas>

                    {/* 좌표 정보 (더미) */}
                    <div className="absolute bottom-2 left-3 text-[10px] text-gray-400 font-mono pointer-events-none">
                        X: 12.4 / Y: -8.1 / Z: 35.0
                    </div>
                </div>
            </div>

            {/* 1-2. Controls & List Container (하단 리스트 영역) */}
            {/* max-h 값을 isListOpen 상태에 따라 동적으로 변경하여 부드럽게 접히도록 함 */}
            <div className={`flex-1 bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${isListOpen ? 'max-h-150' : 'max-h-40'}`}>

                {/* 조립 상태 슬라이더 */}
                <div className="px-5 py-4 border-b border-white/5 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-200">조립 상태</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-medium">
                        <span>조립</span>
                        <span>분해</span>
                    </div>
                </div>

                {/* 부품 헤더 (Accordion Trigger) */}
                <div
                    className="px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 shrink-0"
                    onClick={toggleList}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-200">부품</span>
                        <span className="bg-blue-600/90 text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {objectData.models.length}
                        </span>
                    </div>

                    {/* isListOpen 상태에 따라 아이콘 변경 (ChevronDown <-> ChevronRight) */}
                    {isListOpen ? (
                        <ChevronDown size={16} className="text-gray-400 transition-colors" />
                    ) : (
                        <ChevronRight size={16} className="text-gray-400 transition-colors" />
                    )}
                </div>

                {/* 부품 리스트 (상태에 따라 표시 여부 결정) */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 transition-all duration-300 ${isListOpen ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'}`}>
                    {objectData.models.map((model) => (
                        <div
                            key={model.modelId}
                            onClick={() => setSelectedPartId(model.modelId.toString())}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group relative
                                ${selectedPartId === model.modelId.toString()
                                ? 'bg-white/10 border border-white/5' // 선택되었을 때
                                : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            {/* 썸네일 아이콘 */}
                            <div className="w-10 h-10 rounded-md bg-[#252525] flex items-center justify-center shrink-0 border border-white/5">
                                <Box size={18} className={selectedPartId === model.modelId.toString() ? "text-gray-200" : "text-gray-600"} />
                            </div>

                            {/* 텍스트 정보 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className={`text-sm font-medium truncate ${selectedPartId === model.modelId.toString() ? 'text-white' : 'text-gray-300'}`}>
                                    {model.nameEn}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                                    {model.nameKr}
                                </div>
                            </div>

                            {/* 가시성 토글 아이콘 */}
                            <button
                                className={`p-1.5 rounded-md transition-colors shrink-0
                                    ${selectedPartId === model.modelId.toString()
                                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                                    : 'text-gray-600 hover:text-gray-300'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(`Toggle visibility for ${model.modelId}`);
                                }}
                            >
                                <Eye size={16} />
                            </button>

                            {/* 선택 표시 바 (왼쪽) */}
                            {selectedPartId === model.modelId.toString() && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r-full" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default ViewerLeftSidebar;