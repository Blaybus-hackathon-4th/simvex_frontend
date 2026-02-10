import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';

// --- [Type Definitions based on API Images] ---
interface ChatMessage {
    chatContent: string;
    senderType: 'USER' | 'AI';
}

interface ChatSession {
    chatSessionId: number;
    chatSessionTitle: string;
    chatMessages: ChatMessage[];
}

interface AIChatPanelProps {
    objectId: string;
}

const AIChatPanel = ({ objectId }: AIChatPanelProps) => {
    // State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<number | null>(null); // 현재 대화 세션 ID

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // [API 1] 대화 내역 조회 (GET /chat/{objectId})
    const fetchChatHistory = async () => {
        try {
            const res = await callApi<{ result: ChatSession[] }>(
                `/chat/${objectId}`,
                HttpMethod.GET
            );

            if (res?.result && res.result.length > 0) {
                // 가장 최근 세션을 가져옵니다 (또는 UX에 따라 선택 로직 추가 가능)
                // 여기서는 마지막 세션을 이어가는 것으로 가정
                const lastSession = res.result[res.result.length - 1];
                setSessionId(lastSession.chatSessionId);
                setMessages(lastSession.chatMessages);
            }
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
        }
    };

    // 초기 로드 시 대화 내역 불러오기
    useEffect(() => {
        if (objectId) {
            fetchChatHistory();
        }
    }, [objectId]);

    // 메시지 업데이트 시 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // [API 2] 대화 요청 (POST /chat/{objectId})
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput(''); // 입력창 초기화
        setIsLoading(true);

        // 낙관적 업데이트 (사용자 메시지 먼저 표시)
        const tempUserMessage: ChatMessage = { chatContent: userMsg, senderType: 'USER' };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const body = {
                objectId: Number(objectId),
                userMessage: userMsg,
                chatSessionId: sessionId // 기존 세션이 있으면 ID 포함, 없으면 null/undefined
            };

            // 백엔드 API 호출
            const res = await callApi<{ result: ChatSession[] }>(
                `/chat/${objectId}`,
                HttpMethod.POST,
                body
            );

            if (res?.result && res.result.length > 0) {
                // 응답으로 전체 세션 리스트가 옴.
                // 현재 세션(또는 새로 생성된 세션)을 찾아 메시지 업데이트
                const updatedSession = sessionId
                    ? res.result.find(s => s.chatSessionId === sessionId)
                    : res.result[res.result.length - 1]; // 세션 없었으면 가장 최근꺼(새로 생긴거)

                if (updatedSession) {
                    setSessionId(updatedSession.chatSessionId);
                    setMessages(updatedSession.chatMessages);
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            // 에러 표시용 메시지 추가
            setMessages(prev => [...prev, { chatContent: "오류가 발생했습니다. 다시 시도해주세요.", senderType: 'AI' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* 1. Header Area (ViewerRightSidebar에서 타이틀은 제어하지만, 내부 컨텐츠 시작점) */}
            <div className="flex items-center gap-2 mb-6 px-1">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles size={20} className="text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">AI 어시스턴트</h2>
                    <p className="text-xs text-purple-300">궁금한 점을 자유롭게 물어보세요</p>
                </div>
            </div>

            {/* 2. Chat Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-60 mt-10">
                        <Bot size={48} strokeWidth={1.5} />
                        <p className="text-sm text-center">
                            "피스톤은 어떻게 움직이는거야?"<br/>
                            라고 물어보세요.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex w-full ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* AI Icon */}
                            {msg.senderType === 'AI' && (
                                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-600 to-blue-600 flex items-center justify-center mr-3 mt-1 shrink-0 shadow-lg">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl
                                    ${msg.senderType === 'USER'
                                    ? 'bg-[#2a2a2a] text-gray-200 rounded-tr-sm'
                                    : 'text-gray-100' // AI 메시지는 배경 없이 텍스트만 깔끔하게 (이미지 참고)
                                }`}
                            >
                                {msg.chatContent}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start w-full">
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-600 to-blue-600 flex items-center justify-center mr-3 mt-1 shrink-0">
                            <Sparkles size={14} className="text-white animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1 h-8">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. Input Area */}
            <div className="mt-auto pt-4 pb-2">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur-xs"></div>
                    <div className="relative flex items-center bg-[#1e1e1e] rounded-xl overflow-hidden">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="무엇을 도와드릴까요?"
                            className="flex-1 bg-transparent text-sm text-white px-4 py-4 focus:outline-none placeholder:text-gray-600"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-2 mr-2 bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 px-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                         <AlertCircle size={10} /> AI는 부정확한 정보를 제공할 수 있습니다.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AIChatPanel;