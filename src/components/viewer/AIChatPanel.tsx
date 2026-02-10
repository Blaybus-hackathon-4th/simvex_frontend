import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, AlertCircle, ChevronDown, MessageSquare } from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';

// --- [Type Definitions] ---
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

    // 세션 관련 State
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]); // 전체 세션 목록
    const [sessionId, setSessionId] = useState<number | null>(null);     // 현재 세션 ID
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);           // 이력 메뉴 토글

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // [API 1] 대화 내역 조회 (GET /chat/{objectId})
    const fetchChatHistory = async () => {
        if (!objectId) return;

        try {
            const res = await callApi<{ result: ChatSession[] }>(
                `/chat/${objectId}`,
                HttpMethod.GET
            );

            if (res?.result && Array.isArray(res.result) && res.result.length > 0) {
                // 전체 세션 목록 저장
                setChatSessions(res.result);

                // 현재 선택된 세션이 없다면 가장 최근 세션(마지막)을 로드
                if (!sessionId) {
                    const lastSession = res.result[res.result.length - 1];
                    setSessionId(lastSession.chatSessionId);
                    setMessages(lastSession.chatMessages || []);
                } else {
                    // 이미 보고 있던 세션이 있다면, 해당 세션의 최신 상태로 업데이트 (새 메시지 반영 등)
                    const currentSession = res.result.find(s => s.chatSessionId === sessionId);
                    if (currentSession) {
                        setMessages(currentSession.chatMessages || []);
                    }
                }
            } else {
                setChatSessions([]);
                setMessages([]);
                setSessionId(null);
            }
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
        }
    };

    // 초기 로드
    useEffect(() => {
        fetchChatHistory();
    }, [objectId]);

    // 메시지/세션 변경 시 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, sessionId]);

    // 세션 변경 핸들러
    const handleSwitchSession = (session: ChatSession) => {
        setSessionId(session.chatSessionId);
        setMessages(session.chatMessages || []);
        setIsHistoryOpen(false); // 메뉴 닫기
    };

    // [API 2] 대화 요청 (POST /chat/{objectId})
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setIsLoading(true);

        // 낙관적 업데이트
        const tempUserMessage: ChatMessage = { chatContent: userMsg, senderType: 'USER' };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const body = {
                objectId: Number(objectId),
                userMessage: userMsg,
                chatSessionId: sessionId
            };

            const res = await callApi<{ result: ChatSession[] }>(
                `/chat/${objectId}`,
                HttpMethod.POST,
                body
            );

            if (res?.result && Array.isArray(res.result)) {
                // 응답으로 전체 세션 리스트가 온다고 가정 시 업데이트
                setChatSessions(res.result);

                // 현재 세션 찾아서 메시지 갱신
                const updatedSession = sessionId
                    ? res.result.find(s => s.chatSessionId === sessionId)
                    : res.result[res.result.length - 1]; // 없으면 새 세션(마지막)

                if (updatedSession) {
                    setSessionId(updatedSession.chatSessionId);
                    setMessages(updatedSession.chatMessages);
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setMessages(prev => [...prev, { chatContent: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", senderType: 'AI' }]);
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

            {/* Header Area */}
            <div className="flex items-center justify-between mb-6 px-1 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">AI 어시스턴트</h2>
                        <p className="text-xs text-purple-300">궁금한 점을 물어보세요</p>
                    </div>
                </div>

                {/* [NEW] 채팅 이력 드롭다운 트리거 */}
                <div className="relative">
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-white/5"
                    >
                        <span>채팅 이력</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* [NEW] 드롭다운 메뉴 */}
                    {isHistoryOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#252525] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {chatSessions.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-500">
                                        이전 대화 내역이 없습니다.
                                    </div>
                                ) : (
                                    // 최신순 정렬 (ID 내림차순)
                                    [...chatSessions].reverse().map((session) => (
                                        <button
                                            key={session.chatSessionId}
                                            onClick={() => handleSwitchSession(session)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-start gap-2 transition-colors
                                                ${sessionId === session.chatSessionId
                                                ? 'bg-purple-500/20 text-white'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                            }`}
                                        >
                                            <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-70" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium truncate">
                                                    {session.chatSessionTitle || `대화 세션 ${session.chatSessionId}`}
                                                </div>
                                                <div className="text-[10px] opacity-50 truncate mt-0.5">
                                                    {session.chatMessages[session.chatMessages.length - 1]?.chatContent || "대화 내용 없음"}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Messages Area */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4 relative z-10"
                onClick={() => setIsHistoryOpen(false)} // 배경 클릭 시 메뉴 닫기
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-60 mt-10">
                        <Bot size={48} strokeWidth={1.5} />
                        <p className="text-sm text-center">
                            "피스톤은 어떤 역할을 해?"<br/>
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
                                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl whitespace-pre-wrap
                                    ${msg.senderType === 'USER'
                                    ? 'bg-[#2a2a2a] text-gray-200 rounded-tr-sm'
                                    : 'text-gray-100'
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

            {/* Input Area */}
            <div className="mt-auto pt-4 pb-2 z-20 bg-[#161616]">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur-xs"></div>
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