import { useState, useEffect } from 'react';
import { Edit3, FileText, Trash2, Save } from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';

// 타입 정의 (필요하다면 src/types/index.ts로 이동 가능)
export interface NoteItem {
    noteId: number;
    noteContent: string;
}

interface NotePanelProps {
    objectId: string;
}

const NotePanel = ({ objectId }: NotePanelProps) => {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1. 노트 목록 조회
    const fetchNotes = async () => {
        try {
            const res = await callApi<{ result: NoteItem[] }>(
                `/notes?objectId=${objectId}`,
                HttpMethod.GET
            );
            if (res?.result) {
                setNotes(res.result);
            }
        } catch (err) {
            console.error("Failed to fetch notes:", err);
            // 더미 데이터 (API 실패 시)
            setNotes([
                { noteId: 1, noteContent: "[더미] 엔진의 피스톤 운동 원리에 대해 더 공부해야 함." },
                { noteId: 2, noteContent: "[더미] 크랭크축 회전 비율 2:1 메모." }
            ]);
        }
    };

    useEffect(() => {
        if (objectId) fetchNotes();
    }, [objectId]);

    // 2. 노트 생성
    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        setIsLoading(true);

        try {
            const body = {
                objectId: Number(objectId),
                noteContent: newNote
            };

            const res = await callApi<any>('/notes', HttpMethod.POST, body);

            if (res?.isSuccess) {
                setNewNote('');
                fetchNotes(); // 목록 갱신
            } else {
                alert(res?.message || "노트 저장 실패");
            }
        } catch (err) {
            console.error("Failed to save note:", err);
            // 더미 저장 처리
            const dummyNote = { noteId: Date.now(), noteContent: newNote };
            setNotes(prev => [...prev, dummyNote]);
            setNewNote('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Edit3 size={20} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">학습 노트</h2>
                </div>
                <span className="text-xs text-gray-500 bg-[#252525] px-2 py-1 rounded">
                    {notes.length}개의 메모
                </span>
            </div>

            {/* Note List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-4">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-600 space-y-2">
                        <FileText size={30} className="opacity-20" />
                        <span className="text-sm">작성된 노트가 없습니다.</span>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.noteId} className="bg-[#1e1e1e] p-4 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-all">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {note.noteContent}
                            </p>
                            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-gray-600 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="mt-auto pt-4 border-t border-white/10 bg-[#161616]">
                <div className="relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="학습 내용을 기록하세요..."
                        className="w-full bg-[#1e1e1e] text-sm text-white p-4 rounded-xl border border-white/10 focus:border-blue-500 focus:outline-none resize-none h-24 placeholder:text-gray-600 custom-scrollbar"
                    />
                    <button
                        onClick={handleSaveNote}
                        disabled={!newNote.trim() || isLoading}
                        className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotePanel;