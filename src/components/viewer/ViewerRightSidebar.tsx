import { useState, useEffect } from 'react';
import {
    FileText, Bot, Edit3, HelpCircle,
    Layers, FileText as ReportIcon, X, Lock // [추가] 자물쇠 아이콘 추가
} from 'lucide-react';
import NotePanel from '@/components/viewer/NotePanel';
import AIChatPanel from '@/components/viewer/AIChatPanel';
import ReportGenerationModal from '@/components/viewer/ReportGenerationModal';
import QuizModePanel from '@/components/viewer/QuizModePanel';
import { useLearningStore } from '@/store/learningStore';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

interface ViewerRightSidebarProps {
    objectId: string;
    objectData: ObjectDetailResult;
    componentData: ComponentDetailResult | null;
    selectedPartId: string | null;
    setSelectedPartId: (id: string | null) => void;
}

export type ViewerTabType = 'desc' | 'ai' | 'note' | 'quiz';

interface TabItem {
    id: ViewerTabType;
    icon: any;
    label: string;
}

const TABS: TabItem[] = [
    { id: 'desc', icon: FileText, label: '설명' },
    { id: 'ai', icon: Bot, label: 'AI' },
    { id: 'note', icon: Edit3, label: '노트' },
];

const ViewerRightSidebar = ({
                                objectId,
                                objectData,
                                componentData,
                                selectedPartId,
                                setSelectedPartId
                            }: ViewerRightSidebarProps) => {
    const [activeTab, setActiveTab] = useState<ViewerTabType>('desc');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // 스토어
    const isQuizUnlocked = useLearningStore(state => state.checkUnlock(objectId));
    // [테스트용] 강제 해금 함수 가져오기 (테스트 편의성 위해 추가)
    const addChatInteraction = useLearningStore(state => state.addChatInteraction);

    const [isQuizBlinking, setIsQuizBlinking] = useState(false);
    const isQuizMode = activeTab === 'quiz';

    useEffect(() => {
        if (isQuizUnlocked) {
            let count = 0;
            const interval = setInterval(() => {
                setIsQuizBlinking(prev => !prev);
                count++;
                if (count >= 8) {
                    clearInterval(interval);
                    setIsQuizBlinking(false);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isQuizUnlocked]);

    // [테스트용] 개발 중에만 사용하는 강제 해금 버튼 핸들러
    const handleForceUnlock = () => {
        // 채팅 3번 한 것처럼 처리하면 6점(2*3)이 되어 즉시 해금됨
        addChatInteraction(objectId);
        addChatInteraction(objectId);
        addChatInteraction(objectId);
        alert("테스트 모드: 퀴즈가 해금되었습니다!");
    };

    return (
        <>
            <aside className="bg-[#161616] border-l border-white/10 flex z-50 shadow-2xl relative shrink-0 w-[460px]">

                {/* --- [A] Main Content Area --- */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                    {/* 상단 컨트롤 바 */}
                    {!isQuizMode && (
                        <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-2"></div>
                            {/* [테스트용] 이 물음표 아이콘을 누르면 강제로 퀴즈가 해금되도록 임시 연결 */}
                            <button onClick={handleForceUnlock} title="[개발용] 퀴즈 강제 해금">
                                <HelpCircle size={18} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
                            </button>
                        </div>
                    )}

                    {/* 컨텐츠 영역 */}
                    <div className={`flex-1 overflow-y-auto custom-scrollbar ${!isQuizMode ? 'p-6' : ''}`}>
                        {/* 탭 내용들 (생략 - 기존 코드 유지) */}
                        {activeTab === 'desc' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* ... (기존 설명 탭 코드) ... */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Layers size={20} className="text-blue-400" />
                                        </div>
                                        <span className="text-sm font-bold text-blue-400">오브젝트 정보</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        {selectedPartId && componentData ? componentData.componentNameEn : objectData.objectNameEn}
                                    </h2>
                                    <h3 className="text-lg text-gray-400 font-medium mb-4">
                                        {selectedPartId && componentData ? componentData.componentNameKr : objectData.objectNameKr}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-300">
                                        {selectedPartId && componentData ? componentData.componentContent : objectData.discription.objectContent}
                                    </p>

                                    {/* 상세 패널 (닫기 버튼 등 포함) */}
                                    {selectedPartId && componentData && (
                                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                                            <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-400 text-xs font-bold">COMPONENT ID</span>
                                                    <span className="text-gray-500 text-xs">{componentData.componentId}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedPartId(null)}
                                                className="w-full mt-8 py-3 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded-lg transition border border-white/5 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <X size={14} />
                                                전체 뷰로 돌아가기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'ai' && objectId && <AIChatPanel objectId={objectId} />}
                        {activeTab === 'note' && objectId && <NotePanel objectId={objectId} />}
                        {activeTab === 'quiz' && (
                            <div className="h-full bg-[#1A1A1A]">
                                <QuizModePanel
                                    objectId={objectId}
                                    selectedPartId={selectedPartId}
                                    onClose={() => setActiveTab('desc')}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- [B] Tab Navigation --- */}
                <div className="flex flex-col gap-4 w-16 py-6 items-center border-l border-white/10 bg-[#1a1a1a] shrink-0 z-10 relative">

                    {/* 일반 탭 버튼들 */}
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            disabled={isQuizMode}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14 cursor-pointer
                                ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a]'}
                                ${isQuizMode ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                            `}
                        >
                            <tab.icon size={20} />
                            <span className="text-[10px]">{tab.label}</span>
                        </button>
                    ))}

                    {/* 퀴즈 탭 버튼 */}
                    <div className="relative group">
                        <button
                            disabled={!isQuizUnlocked || isQuizMode}
                            onClick={() => setActiveTab('quiz')}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14 relative z-10
                                ${activeTab === 'quiz'
                                ? 'bg-purple-600 text-white shadow-lg scale-105 cursor-pointer'
                                : (!isQuizUnlocked)
                                    // [수정] 잠김 상태여도 잘 보이게(text-gray-500), 하지만 커서는 금지 표시
                                    ? 'bg-[#1e1e1e] text-gray-500 cursor-not-allowed hover:bg-[#252525]'
                                    : isQuizBlinking
                                        ? 'bg-purple-500/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105 ring-2 ring-purple-400 cursor-pointer'
                                        : 'bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a] cursor-pointer'
                            }
                            `}
                        >
                            <HelpCircle size={20} className={isQuizBlinking ? 'animate-pulse' : ''} />
                            <span className="text-[10px]">퀴즈</span>

                            {/* [추가] 잠김 상태 자물쇠 아이콘 (빨간 점 대신 명확한 자물쇠 사용) */}
                            {!isQuizUnlocked && (
                                <div className="absolute -top-1 -right-1 bg-[#252525] rounded-full p-1 border border-white/10 shadow-sm">
                                    <Lock size={10} className="text-gray-400" />
                                </div>
                            )}
                        </button>

                        {/* 해금 알림 툴팁 */}
                        {isQuizUnlocked && (isQuizBlinking || !isQuizMode) && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-in slide-in-from-right-2">
                                학습 체크! ✨
                            </div>
                        )}
                        {/* [추가] 잠김 상태일 때 툴팁 */}
                        {!isQuizUnlocked && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                학습 포인트 5점 필요 (현재 잠김) 🔒
                            </div>
                        )}
                    </div>

                    {/* 리포트 생성 버튼 */}
                    <button
                        disabled={isQuizMode}
                        onClick={() => setIsReportModalOpen(true)}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-14 cursor-pointer mt-auto mb-4 bg-[#1e1e1e] text-gray-500 hover:text-white hover:bg-[#2a2a2a]
                            ${isQuizMode ? 'opacity-30 cursor-not-allowed' : ''}
                        `}
                        title="리포트 생성"
                    >
                        <ReportIcon size={20} className="text-blue-500" />
                        <span className="text-[10px] text-blue-500">리포트</span>
                    </button>
                </div>
            </aside>

            {/* 리포트 모달 */}
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