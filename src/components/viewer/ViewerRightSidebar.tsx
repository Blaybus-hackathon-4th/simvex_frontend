import { useState } from 'react';
import {
    FileText, Bot, Edit3, HelpCircle,
    Layers
} from 'lucide-react';
import NotePanel from '@/components/viewer/NotePanel';
import AIChatPanel from '@/components/viewer/AIChatPanel';
import ReportGenerationModal from '@/components/viewer/ReportGenerationModal';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

interface ViewerRightSidebarProps {
    objectId: string;
    objectData: ObjectDetailResult;
    componentData: ComponentDetailResult | null;
    selectedPartId: string | null;
    setSelectedPartId: (id: string | null) => void;
}

type TabType = 'desc' | 'ai' | 'note' | 'quiz';

const ViewerRightSidebar = ({
                                objectId,
                                objectData,
                                componentData,
                                selectedPartId,
                            }: ViewerRightSidebarProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('desc');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    return (
        <>
            <aside
                className="bg-[#161616] border-l border-white/10 flex z-50 shadow-2xl relative shrink-0 w-[460px]"
            >
                {/* --- [A] Main Content Area --- */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">

                    {/* 1. 상단 컨트롤 바 */}
                    <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                            {/* 닫기 버튼(PanelRightClose) 제거됨 */}
                        </div>
                        <HelpCircle size={18} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
                    </div>

                    {/* 2. 스크롤 가능한 컨텐츠 영역 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                        {/* [Tab 1] 설명 */}
                        {activeTab === 'desc' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Layers size={20} className="text-blue-400" />
                                        </div>
                                        <span className="text-sm font-bold text-blue-400">오브젝트 정보</span>
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
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {/* [Tab 2] AI Chat */}
                        {activeTab === 'ai' && (
                            <div className="h-full animate-in fade-in duration-300">
                                {objectId && <AIChatPanel objectId={objectId} />}
                            </div>
                        )}

                        {/* [Tab 3] Note */}
                        {activeTab === 'note' && (
                            <div className="h-full">
                                {objectId && <NotePanel objectId={objectId} />}
                            </div>
                        )}

                        {/* [Tab 4] Quiz */}
                        {activeTab === 'quiz' && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                                <Bot size={40} className="opacity-20" />
                                <span className="text-sm">퀴즈 기능 준비 중입니다.</span>
                            </div>
                        )}
                    </div>

                    {/* 기존 플로팅 버튼 제거됨 */}
                </div>

                {/* --- [B] Tab Navigation --- */}
                <div className="flex flex-col gap-4 w-16 py-6 items-center border-l border-white/10 bg-[#1a1a1a] shrink-0 z-10">
                    {/* 열기 버튼 제거됨 */}

                    {[
                        { id: 'desc', icon: FileText, label: '설명' },
                        { id: 'ai', icon: Bot, label: 'AI' },
                        { id: 'note', icon: Edit3, label: '노트' },
                        { id: 'quiz', icon: HelpCircle, label: '퀴즈' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14 cursor-pointer
                           ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a]'}`}
                        >
                            <tab.icon size={20} />
                            <span className="text-[10px]">{tab.label}</span>
                        </button>
                    ))}

                    {/* [NEW] 리포트 생성 아이콘 버튼 (탭 네비게이션 하단에 추가) */}
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14 cursor-pointer mt-auto mb-4 bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
                        title="리포트 생성"
                    >
                        <FileText size={20} className="text-blue-500" />
                        <span className="text-[10px] text-blue-500">리포트</span>
                    </button>
                </div>
            </aside>

            {/* 모달 렌더링 */}
            {isReportModalOpen && (
                <ReportGenerationModal
                    objectId={objectId}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
        </>
    );
};

export default ViewerRightSidebar;