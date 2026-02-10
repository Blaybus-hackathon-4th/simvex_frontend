import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ModelLearningData {
  points: number;
  clickedCount: number;
  interactedParts: string[];
  isQuizUnlocked: boolean;
}

interface LearningStore {
  data: Record<string, ModelLearningData>;

  addPartInteraction: (modelId: string, partId: string) => void;
  addChatInteraction: (modelId: string) => void;

  checkUnlock: (modelId: string) => boolean;
  getLearningContext: (modelId: string) => { interactedParts: string[] };

  resetProgress: (modelId: string) => void;
}

/** 매번 새 객체를 반환해서 참조 공유 방지 */
const createDefaultData = (): ModelLearningData => ({
  points: 0,
  clickedCount: 0,
  interactedParts: [],
  isQuizUnlocked: false,
});

export const useLearningStore = create(
  persist<LearningStore>(
    (set, get) => ({
      data: {},

      /** 부품 클릭 = 무조건 +1점 (중복 클릭도 카운트) */
      addPartInteraction: (modelId, partId) =>
        set((state) => {
          if (!modelId) return state;

          const current = state.data[modelId] ?? createDefaultData();

          const newPoints = current.points + 1;
          const newClickedCount = current.clickedCount + 1;

          // interactedParts는 "컨텍스트용"으로만 중복 제거
          const nextParts = current.interactedParts.includes(partId)
            ? current.interactedParts
            : [...current.interactedParts, partId];

          return {
            data: {
              ...state.data,
              [modelId]: {
                ...current,
                points: newPoints,
                clickedCount: newClickedCount,
                interactedParts: nextParts,
                isQuizUnlocked: newPoints >= 5,
              },
            },
          };
        }),

      /** 채팅 = +2점 */
      addChatInteraction: (modelId) =>
        set((state) => {
          if (!modelId) return state;

          const current = state.data[modelId] ?? createDefaultData();
          const newPoints = current.points + 2;

          return {
            data: {
              ...state.data,
              [modelId]: {
                ...current,
                points: newPoints,
                isQuizUnlocked: newPoints >= 5,
              },
            },
          };
        }),

      checkUnlock: (modelId) => {
        if (!modelId) return false;
        return get().data[modelId]?.isQuizUnlocked ?? false;
      },

      getLearningContext: (modelId) => ({
        interactedParts: modelId ? (get().data[modelId]?.interactedParts ?? []) : [],
      }),

      resetProgress: (modelId) =>
        set((state) => ({
          data: {
            ...state.data,
            [modelId]: createDefaultData(),
          },
        })),
    }),
    {
      name: 'simvex-learning-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
