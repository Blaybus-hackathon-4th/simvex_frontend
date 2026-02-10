import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 오브젝트별 학습 데이터 구조
interface ModelLearningData {
    points: number;            // 학습 포인트 (5점 이상 시 퀴즈 활성화)
    interactedParts: string[]; // 사용자가 클릭해본 부품 ID 목록 (중복 제거)
    isQuizUnlocked: boolean;   // 퀴즈 해금 여부
}

interface LearningStore {
    data: Record<string, ModelLearningData>; // { "V4_Engine": { ... }, "Drone": { ... } }

    // 액션: 부품 클릭 시 (1점)
    addPartInteraction: (modelId: string, partId: string) => void;

    // 액션: 채팅 시 (2점)
    addChatInteraction: (modelId: string) => void;

    // 유틸: 퀴즈 해금 확인
    checkUnlock: (modelId: string) => boolean;

    // 유틸: 데이터 가져오기 (API 전송용)
    getLearningContext: (modelId: string) => { interactedParts: string[] };

    // 퀴즈 완료 후 초기화 (선택 사항)
    resetProgress: (modelId: string) => void;
}

export const useLearningStore = create(
    persist<LearningStore>(
        (set, get) => ({
            data: {},

            addPartInteraction: (modelId, partId) => set((state) => {
                const current = state.data[modelId] || { points: 0, interactedParts: [], isQuizUnlocked: false };

                // 이미 본 부품이면 무시 (중복 점수 방지)
                if (current.interactedParts.includes(partId)) {
                    return state;
                }

                const newPoints = current.points + 1;
                return {
                    data: {
                        ...state.data,
                        [modelId]: {
                            ...current,
                            points: newPoints,
                            interactedParts: [...current.interactedParts, partId],
                            isQuizUnlocked: newPoints >= 5 // 5점 이상이면 해금
                        }
                    }
                };
            }),

            addChatInteraction: (modelId) => set((state) => {
                const current = state.data[modelId] || { points: 0, interactedParts: [], isQuizUnlocked: false };
                const newPoints = current.points + 2; // 채팅은 2점

                return {
                    data: {
                        ...state.data,
                        [modelId]: {
                            ...current,
                            points: newPoints,
                            isQuizUnlocked: newPoints >= 5
                        }
                    }
                };
            }),

            checkUnlock: (modelId) => {
                return get().data[modelId]?.isQuizUnlocked || false;
            },

            getLearningContext: (modelId) => {
                return { interactedParts: get().data[modelId]?.interactedParts || [] };
            },

            resetProgress: (modelId) => set((state) => ({
                data: {
                    ...state.data,
                    [modelId]: { points: 0, interactedParts: [], isQuizUnlocked: false }
                }
            }))
        }),
        {
            name: 'simvex-learning-storage', // LocalStorage Key 이름
            storage: createJSONStorage(() => localStorage),
        }
    )
);