import { create } from 'zustand';

interface ViewerState {
    sliderValue: number; // 0 ~ 100 (분해 정도)
    selectedPartId: string | null;
    isGhostMode: boolean;

    setSliderValue: (value: number) => void;
    setSelectedPartId: (id: string | null) => void;
    toggleGhostMode: (active: boolean) => void;
    resetViewer: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
    sliderValue: 0,
    selectedPartId: null,
    isGhostMode: false,

    setSliderValue: (value) => set({ sliderValue: value }),
    setSelectedPartId: (id) => set({ selectedPartId: id, isGhostMode: !!id }),
    toggleGhostMode: (active) => set({ isGhostMode: active }),
    resetViewer: () => set({ sliderValue: 0, selectedPartId: null, isGhostMode: false }),
}));