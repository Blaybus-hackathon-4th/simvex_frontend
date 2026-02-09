import { Suspense, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Box, MessageSquare, ArrowLeft, Send, Search, Bell, User } from 'lucide-react';
import { ModelViewer } from '@/components/three/ModelViewer';
import { useViewerStore } from '@/store/viewerStore';
import { sendChatToAI } from '@/utils/ai';
import { useControls, button, Leva } from 'leva';
import type {ChatMessage, ControlsWithTarget, SceneControllerProps, TreeItemProps, TreeNode} from "@/types";

// [1] 파일 자동 불러오기
// import.meta.glob은 기본적으로 Record<string, unknown>을 반환하므로 string으로 단언
const allModelFiles = import.meta.glob('/src/assets/models/**/*.glb', {
    eager: true,
    import: 'default'
}) as Record<string, string>;

const MODEL_ASSETS: Record<string, string[]> = {};

Object.entries(allModelFiles).forEach(([path, fileUrl]) => {
    const pathParts = path.split('/');
    const modelsIndex = pathParts.indexOf('models');
    if (modelsIndex !== -1 && pathParts[modelsIndex + 1]) {
        const modelId = pathParts[modelsIndex + 1];
        if (!MODEL_ASSETS[modelId]) {
            MODEL_ASSETS[modelId] = [];
        }
        MODEL_ASSETS[modelId].push(fileUrl);
    }
});

// Tree Item Component
const TreeItem = ({ node, level = 0, onSelect, selectedId }: TreeItemProps) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-white/5 transition rounded-md ${isSelected ? 'bg-primary/20 text-primary font-medium' : 'text-gray-400'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.id);
                    if (hasChildren) setIsOpen(!isOpen);
                }}
            >
                {hasChildren ? (
                    isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                    <Box size={14} className="opacity-50" />
                )}
                <span className="text-sm truncate">{node.name}</span>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children!.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// SceneController Component
const SceneController = ({ id, children }: SceneControllerProps) => {
    const { camera, controls } = useThree();

    const { posX, posY, posZ, rotX, rotY, rotZ, scale } = useControls('Model Transform', {
        posX: { value: 0, min: -10, max: 10, step: 0.1 },
        posY: { value: 0, min: -10, max: 10, step: 0.1 },
        posZ: { value: 0, min: -10, max: 10, step: 0.1 },
        rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
        rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
        rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
        scale: { value: 1, min: 0.1, max: 5, step: 0.1 },
        '📸 JSON 추출': button(() => exportConfig()),
    });

    const exportConfig = () => {
        const camPos = camera.position;
        // controls가 null이 아니고 target 속성이 있다고 단언
        const target = controls
            ? (controls as unknown as ControlsWithTarget).target
            : { x: 0, y: 0, z: 0 };

        const configData = {
            id: id,
            transform: {
                position: [posX, posY, posZ],
                rotation: [rotX, rotY, rotZ],
                scale: [scale, scale, scale]
            },
            camera: {
                position: [Number(camPos.x.toFixed(2)), Number(camPos.y.toFixed(2)), Number(camPos.z.toFixed(2))],
                target: [Number(target.x.toFixed(2)), Number(target.y.toFixed(2)), Number(target.z.toFixed(2))],
                fov: 45
            }
        };

        console.log("백엔드 전달용 JSON 데이터");
        console.log(JSON.stringify(configData, null, 2));
        alert("F12 콘솔을 확인하세요!");
    };

    return (
        <group
            position={[posX, posY, posZ]}
            rotation={[rotX, rotY, rotZ]}
            scale={[scale, scale, scale]}
        >
            {children}
        </group>
    );
};

// Main ViewerPage Component
const ViewerPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // URL 파라미터 타입 지정
    const { sliderValue, setSliderValue, selectedPartId, setSelectedPartId } = useViewerStore();
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: `안녕하세요! ${id || '모델'}에 대해 궁금한 점을 물어보세요.` }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. 현재 ID에 맞는 파일 목록 가져오기
    const filePaths = id ? MODEL_ASSETS[id] || [] : [];

    // 파일 목록을 기반으로 동적 트리 생성
    const partTree: TreeNode[] = useMemo(() => {
        if (!id || filePaths.length === 0) return [];

        const children: TreeNode[] = filePaths.map((path) => {
            const fileName = path.split('/').pop() || '';
            const partName = fileName.replace('.glb', '');

            return {
                id: partName,
                name: partName.replace(/_/g, ' '),
                children: [] // Leaf node라도 타입 일관성을 위해 빈 배열 혹은 undefined
            };
        });

        return [
            {
                id: id,
                name: `${id.toUpperCase().replace(/_/g, ' ')} (Main)`,
                children: children
            }
        ];
    }, [id, filePaths]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: chatInput };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsLoading(true);

        try {
            const context = `현재 모델: ${id}, 분해 레벨: ${sliderValue}%, 선택된 부품: ${selectedPartId || '없음'}`;
            const { reply, command } = await sendChatToAI(userMsg.content, context);

            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

            if (command) {
                if (command.action === 'EXPLODE') setSliderValue(command.explodeValue);
                if (command.action === 'FOCUS') setSelectedPartId(command.targetPartId);
                if (command.action === 'RESET') { setSliderValue(0); setSelectedPartId(null); }
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background text-white overflow-hidden">

            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-surface z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} className="text-gray-400" />
                        <span className="font-bold tracking-wider">SIMVEX</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                        <span className="hover:text-white cursor-pointer">Home</span>
                        <span className="text-white cursor-pointer border-b-2 border-primary h-14 flex items-center">Study</span>
                        <span className="hover:text-white cursor-pointer">CAD</span>
                        <span className="hover:text-white cursor-pointer">Lab</span>
                    </nav>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <Search size={18} className="cursor-pointer hover:text-white" />
                    <Bell size={18} className="cursor-pointer hover:text-white" />
                    <div className="w-7 h-7 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center">
                        <User size={14} className="text-black" />
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar */}
                <aside className="w-64 bg-surface border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-bold text-sm text-gray-300 flex items-center gap-2">
                            <Box size={16} className="text-primary" />
                            부품 목록 (Hierarchy)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* 동적으로 생성된 partTree 렌더링 */}
                        {partTree.map((node) => (
                            <TreeItem key={node.id} node={node} onSelect={setSelectedPartId} selectedId={selectedPartId} />
                        ))}
                    </div>
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="text-sm font-medium text-primary">
                            {selectedPartId ? `Selected: ${selectedPartId}` : 'Ready'}
                        </div>
                    </div>
                </aside>

                {/* Center 3D Viewport */}
                <main className="flex-1 relative bg-black">

                    {/* Leva 패널 */}
                    <Leva collapsed={false} />

                    <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
                        <color attach="background" args={['#050505']} />

                        <Suspense fallback={<Html center><div className="text-white">Loading Models...</div></Html>}>
                            <Environment preset="city" />
                            <ambientLight intensity={0.4} />
                            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />

                            <SceneController id={id || 'unknown'} key={id}>
                                {filePaths.length > 0 ? (
                                    <ModelViewer filePaths={filePaths} />
                                ) : (
                                    <Html center>
                                        <div className="flex flex-col items-center gap-2 text-red-400">
                                            <span className="font-bold text-lg">모델 파일 없음</span>
                                            <span className="text-xs text-gray-400">
                                                ID: {id}<br/>
                                                (src/assets/models/{id}/ 경로 확인 필요)
                                            </span>
                                        </div>
                                    </Html>
                                )}
                            </SceneController>

                            <ContactShadows position={[0, -2, 0]} opacity={0.4} blur={2.5} />
                            <OrbitControls minDistance={2} maxDistance={20} makeDefault />
                        </Suspense>
                    </Canvas>

                    {/* Explode Slider */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-80 bg-surface/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl">
                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                            <span>조립 (Assembly)</span>
                            <span>분해 (Explode)</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-80 bg-surface border-l border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-sm text-gray-300 flex items-center gap-2">
                            <MessageSquare size={16} className="text-secondary" />
                            AI 어시스턴트
                        </h2>
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Online</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed 
                  ${msg.role === 'user'
                                        ? 'bg-primary text-black rounded-tr-none font-medium'
                                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-gray-400 animate-pulse">
                                    답변 생성 중...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-black/30 border border-white/20 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                placeholder="질문을 입력하세요..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary rounded-lg text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
};

export default ViewerPage;