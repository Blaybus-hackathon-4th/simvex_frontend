import { useState } from 'react';
import {
    FileText, Bot, Edit3, HelpCircle,
    Layers, X
} from 'lucide-react';
import NotePanel from '@/components/viewer/NotePanel';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

interface ViewerRightSidebarProps {
    objectId: string; // 노트 조회용
    objectData: ObjectDetailResult; // 전체 오브젝트 데이터
    componentData: ComponentDetailResult | null; // 선택된 부품 데이터
    selectedPartId: string | null; // 현재 선택된 부품 ID
    setSelectedPartId: (id: string | null) => void; // 부품 선택 해제용 함수
}

type TabType = 'desc' | 'ai' | 'note' | 'quiz';

const ViewerRightSidebar = ({
                                objectId,
                                objectData,
                                componentData,
                                selectedPartId,
                                setSelectedPartId
                            }: ViewerRightSidebarProps) => {
    // 탭 상태는 이 컴포넌트 내부에서만 관리하면 됩니다.
    const [activeTab, setActiveTab] = useState<TabType>('desc');

    return (
        <aside className="w-[460px] bg-[#161616] border-l border-white/10 flex z-50 shadow-2xl">

            {/* --- [A] Main Content Area (좌측 콘텐츠 영역) --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                {/* 1. 설명(Description) 탭 */}
                {activeTab === 'desc' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* 1-1. 공통 헤더 (타이틀 & 태그) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <Layers size={20} className="text-gray-400" />
                                </div>
                                <HelpCircle size={18} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
                            </div>

                            {/* 타이틀 (부품 선택 여부에 따라 변경) */}
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

                            {/* 태그 (임시 데이터) */}
                            <div className="flex gap-2 flex-wrap mb-6">
                                {['#내연기관', '#에너지변환', '#기구학'].map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-[#252525] text-blue-400 text-xs rounded border border-blue-900/30">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* 본문 설명 */}
                            <p className="text-sm leading-relaxed text-gray-300">
                                {selectedPartId && componentData
                                    ? componentData.componentContent
                                    : objectData.discription.objectContent}
                            </p>
                        </div>

                        {/* 1-2. 상세 내용 (오브젝트 전체 vs 부품 개별) */}
                        {!selectedPartId ? (
                            // [오브젝트 전체 뷰] 원리 및 장점 표시
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
                            // [부품 개별 뷰] 구성 요소 표시
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

                {/* 2. 노트(Note) 탭 */}
                {activeTab === 'note' && (
                    <div className="h-full">
                        {objectId && <NotePanel objectId={objectId} />}
                    </div>
                )}

                {/* 3. 기타 탭 (AI, Quiz) 플레이스홀더 */}
                {(activeTab !== 'desc' && activeTab !== 'note') && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <Bot size={40} className="opacity-20" />
                        <span className="text-sm">기능 준비 중입니다.</span>
                    </div>
                )}
            </div>

            {/* --- [B] Tab Navigation (우측 탭 버튼 영역) --- */}
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
    );
};

export default ViewerRightSidebar;