import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, AlertCircle, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
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

// [Helper] 지연 함수 (Polling 간격용)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AIChatPanel = ({ objectId }: AIChatPanelProps) => {
    // State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 세션 관련 State
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // [API 1] 대화 내역 조회
    const fetchChatHistory = async () => {
        if (!objectId) return null; // Polling에서 사용하기 위해 return 값 추가

        try {
            const res = await callApi<{ result: ChatSession[] }>(
                `/chat/${objectId}`,
                HttpMethod.GET,
                null,
                null,
                { timeout: 60000 }
            );

            if (res?.result && Array.isArray(res.result) && res.result.length > 0) {
                return res.result; // 데이터 반환
            }
            return [];
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
            return null;
        }
    };

    // 초기 로드용 Effect
    useEffect(() => {
        const initChat = async () => {
            const sessions = await fetchChatHistory();
            if (sessions && sessions.length > 0) {
                setChatSessions(sessions);

                // 세션 ID가 없으면 최신 세션 선택
                if (!sessionId) {
                    const latestSession = sessions.reduce((prev, current) =>
                        (prev.chatSessionId > current.chatSessionId) ? prev : current
                    );
                    setSessionId(latestSession.chatSessionId);
                    setMessages(latestSession.chatMessages || []);
                } else {
                    const currentSession = sessions.find(s => s.chatSessionId === sessionId);
                    if (currentSession) setMessages(currentSession.chatMessages || []);
                }
            } else {
                setChatSessions([]);
                setMessages([]);
                setSessionId(null);
            }
        };
        initChat();
    }, [objectId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSwitchSession = (session: ChatSession) => {
        setSessionId(session.chatSessionId);
        setMessages(session.chatMessages || []);
        setIsHistoryOpen(false);
    };

    // [API 2 & Polling] 메시지 전송 및 답변 대기
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setIsLoading(true);

        // 1. 낙관적 업데이트 (사용자 메시지 즉시 표시)
        const tempUserMessage: ChatMessage = { chatContent: userMsg, senderType: 'USER' };
        setMessages(prev => [...prev, tempUserMessage]);
        scrollToBottom();

        try {
            // 2. 메시지 전송 (POST)
            const body = {
                objectId: Number(objectId),
                userMessage: userMsg,
                chatSessionId: sessionId
            };

            // POST 요청은 "요청 접수"의 의미로 보냄 (응답에 바로 AI 답변이 없을 수 있음)
            await callApi(
                `/chat/${objectId}`,
                HttpMethod.POST,
                body,
                null,
                { timeout: 60000 }
            );

            // 3. Polling 시작 (AI 답변이 올 때까지 반복 조회)
            let attempts = 0;
            const maxAttempts = 30; // 최대 30회 시도 (2초 * 30 = 약 60초 대기)
            let aiResponded = false;

            while (attempts < maxAttempts) {
                await wait(2000); // 2초 대기
                attempts++;

                // 최신 데이터 조회 (GET)
                const sessions = await fetchChatHistory();

                if (sessions && sessions.length > 0) {
                    // 현재 세션 찾기 (없으면 최신 세션으로 간주 - 새 세션 생성 시)
                    let currentSession;
                    if (sessionId) {
                        currentSession = sessions.find(s => s.chatSessionId === sessionId);
                    } else {
                        // 세션 ID가 없었다면 방금 생성된 최신 세션 찾기
                        currentSession = sessions.reduce((prev, current) =>
                            (prev.chatSessionId > current.chatSessionId) ? prev : current
                        );
                    }

                    if (currentSession && currentSession.chatMessages.length > 0) {
                        const lastMsg = currentSession.chatMessages[currentSession.chatMessages.length - 1];

                        // [조건 충족] 마지막 메시지가 AI인 경우 Polling 종료
                        if (lastMsg.senderType === 'AI') {
                            setChatSessions(sessions);
                            setSessionId(currentSession.chatSessionId);
                            setMessages(currentSession.chatMessages);
                            aiResponded = true;
                            break; // Loop 종료
                        }
                    }
                }
            }

            if (!aiResponded) {
                throw new Error("Timeout: AI did not respond in time.");
            }

        } catch (err) {
            console.error("Polling failed:", err);
            setMessages(prev => [...prev, {
                chatContent: "답변을 불러오는 데 시간이 너무 오래 걸리거나 오류가 발생했습니다.",
                senderType: 'AI'
            }]);
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
        <div className="flex flex-col h-full relative bg-[#161616]">

            {/* Header Area */}
            <div className="flex items-center justify-between mb-4 px-1 relative z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">AI 어시스턴트</h2>
                        <p className="text-[10px] text-purple-300">궁금한 점을 물어보세요</p>
                    </div>
                </div>

                {/* 채팅 이력 드롭다운 */}
                <div className="relative">
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
                    >
                        <span>채팅 이력</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {isHistoryOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {chatSessions.length === 0 ? (
                                    <div className="p-4 text-center text-[10px] text-gray-500">
                                        이전 대화 내역이 없습니다.
                                    </div>
                                ) : (
                                    [...chatSessions].sort((a, b) => b.chatSessionId - a.chatSessionId).map((session) => (
                                        <button
                                            key={session.chatSessionId}
                                            onClick={() => handleSwitchSession(session)}
                                            className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-start gap-2 transition-colors cursor-pointer
                                                ${sessionId === session.chatSessionId
                                                ? 'bg-purple-500/20 text-white'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                            }`}
                                        >
                                            <MessageSquare size={12} className="mt-0.5 shrink-0 opacity-70" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-medium truncate">
                                                    {session.chatSessionTitle || `세션 #${session.chatSessionId}`}
                                                </div>
                                                <div className="text-[9px] opacity-50 truncate mt-0.5">
                                                    {session.chatMessages && session.chatMessages.length > 0
                                                        ? session.chatMessages[session.chatMessages.length - 1].chatContent
                                                        : "대화 없음"}
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
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4 relative z-10 min-h-0"
                onClick={() => setIsHistoryOpen(false)}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3 opacity-60">
                        <Bot size={40} strokeWidth={1} />
                        <p className="text-xs text-center">
                            "피스톤의 역할이 뭐야?"<br/>
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
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-lg">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[85%] px-4 py-2.5 text-xs leading-relaxed rounded-2xl whitespace-pre-wrap shadow-sm
                                    ${msg.senderType === 'USER'
                                    ? 'bg-[#2a2a2a] text-gray-200 rounded-tr-sm border border-white/5'
                                    : 'bg-transparent text-gray-100 pl-0'
                                }`}
                            >
                                {msg.chatContent}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start w-full animate-in fade-in duration-300">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Sparkles size={12} className="text-white animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1 h-7 pl-2">
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-auto pt-3 pb-1 z-20 bg-[#161616] border-t border-white/5">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur-sm"></div>
                    <div className="relative flex items-center bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 group-focus-within:border-purple-500/50 transition-colors">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="무엇을 도와드릴까요?"
                            className="flex-1 bg-transparent text-xs text-white px-4 py-3.5 focus:outline-none placeholder:text-gray-600"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-2 mr-1.5 bg-[#2a2a2a] hover:bg-purple-600 text-gray-400 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-[#2a2a2a] disabled:hover:text-gray-400 cursor-pointer"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-2 px-1 opacity-50">
                    <AlertCircle size={10} className="text-gray-500" />
                    <span className="text-[9px] text-gray-500">
                        AI는 부정확한 정보를 제공할 수 있습니다.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AIChatPanel;