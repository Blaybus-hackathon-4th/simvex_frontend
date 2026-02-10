import { useState, useEffect, useRef } from 'react';
import {Edit3, FileText, Save, MoreVertical, Check, Trash2} from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';
import type {NoteItem} from "@/types";

interface NotePanelProps {
    objectId: string;
}

const NotePanel = ({ objectId }: NotePanelProps) => {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 수정 관련 상태
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    // 메뉴(더보기) 열림 상태 관리 (열린 노트의 ID 저장)
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    // 외부 클릭 감지를 위한 Ref
    const menuRef = useRef<HTMLDivElement>(null);

    // --- [API 1] 노트 목록 조회 ---
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
            // 더미 데이터
            setNotes([
                { noteId: 1, noteContent: "[더미] 엔진의 피스톤 운동 원리에 대해 더 공부해야 함." },
                { noteId: 2, noteContent: "[더미] 크랭크축 회전 비율 2:1 메모." }
            ]);
        }
    };

    useEffect(() => {
        if (objectId) fetchNotes();
    }, [objectId]);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- [API 2] 노트 생성 ---
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
                fetchNotes();
            } else {
                alert(res?.message || "노트 저장 실패");
            }
        } catch (err) {
            console.error("Failed to save note:", err);
            // 더미 로직
            const dummyNote = { noteId: Date.now(), noteContent: newNote };
            setNotes(prev => [...prev, dummyNote]);
            setNewNote('');
        } finally {
            setIsLoading(false);
        }
    };

    // --- [API 3] 노트 삭제 (DELETE) ---
    const handleDeleteNote = async (noteId: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            // 명세: DELETE /notes/{noteId}
            const res = await callApi<any>(`/notes/${noteId}`, HttpMethod.DELETE);

            if (res?.isSuccess) {
                setActiveMenuId(null);
                fetchNotes();
            } else {
                alert(res?.message || "삭제 실패");
            }
        } catch (err) {
            console.error("Failed to delete note:", err);
            // 더미 삭제
            setNotes(prev => prev.filter(n => n.noteId !== noteId));
            setActiveMenuId(null);
        }
    };

    // --- [API 4] 노트 수정 (PATCH) ---
    const handleUpdateNote = async () => {
        if (!editingId || !editContent.trim()) return;

        try {
            const body = {
                noteId: editingId,
                noteContent: editContent
            };
            // 명세: PATCH /notes/{noteId}
            const res = await callApi<any>(`/notes/${editingId}`, HttpMethod.PUT, body);

            if (res?.isSuccess) {
                setEditingId(null);
                setEditContent('');
                fetchNotes();
            } else {
                alert(res?.message || "수정 실패");
            }
        } catch (err) {
            console.error("Failed to update note:", err);
            // 더미 수정
            setNotes(prev => prev.map(n => n.noteId === editingId ? { ...n, noteContent: editContent } : n));
            setEditingId(null);
        }
    };

    // 수정 모드 진입
    const startEditing = (note: NoteItem) => {
        setEditingId(note.noteId);
        setEditContent(note.noteContent);
        setActiveMenuId(null); // 메뉴 닫기
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
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-4 pb-10">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-600 space-y-2">
                        <FileText size={30} className="opacity-20" />
                        <span className="text-sm">작성된 노트가 없습니다.</span>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.noteId} className="relative bg-[#1e1e1e] p-4 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-all">

                            {/* 수정 모드일 때 */}
                            {editingId === note.noteId ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-[#161616] text-sm text-white p-3 rounded-lg border border-blue-500/50 focus:outline-none resize-none h-24 custom-scrollbar"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 rounded-lg transition"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleUpdateNote}
                                            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1"
                                        >
                                            <Check size={12} /> 저장
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* 일반 보기 모드일 때 */
                                <>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pr-6">
                                            {note.noteContent}
                                        </p>

                                        {/* 더보기 버튼 (메뉴 토글) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === note.noteId ? null : note.noteId);
                                            }}
                                            className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>

                                    {/* 컨텍스트 메뉴 (Dropdown) */}
                                    {activeMenuId === note.noteId && (
                                        <div
                                            ref={menuRef}
                                            className="absolute top-8 right-2 w-28 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
                                        >
                                            <button
                                                onClick={() => startEditing(note)}
                                                className="px-4 py-2.5 text-xs text-left text-gray-200 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <Edit3 size={12} /> 수정
                                            </button>
                                            <div className="h-[1px] bg-white/5 mx-2 my-1" />
                                            <button
                                                onClick={() => handleDeleteNote(note.noteId)}
                                                className="px-4 py-2.5 text-xs text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 size={12} /> 삭제
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Area (New Note) */}
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