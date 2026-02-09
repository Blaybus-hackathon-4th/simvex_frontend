# 🧬 SIMVEX (Simulation for Engineering X)

> **"보는 것을 넘어, 대화하며 익히는 3D 공학 랩"**
>
> **SIMVEX**는 별도의 설치 없이 웹 브라우저에서 3D 엔지니어링 모델을 학습할 수 있는 차세대 교육 플랫폼입니다. 단순한 시각화를 넘어, **맥락을 이해하는 AI 도슨트**가 사용자의 질문에 답변하고 직접 3D 뷰어를 제어하여 몰입감 있는 학습 경험을 제공합니다.

<div align="center">

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?logo=three.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Zustand](https://img.shields.io/badge/State-Zustand-orange)
![Upstage](https://img.shields.io/badge/AI-Upstage_Solar-purple)

</div>

---

## 🚀 Key Features (핵심 기능)

### 1. 🏗️ Immersive 3D Viewer (몰입형 3D 뷰어)
* **Zero Installation:** 고사양 CAD 프로그램 설치 없이 웹에서 즉시 실행됩니다.
* **Smart Explode:** 슬라이더 조작만으로 복잡한 기계 부품을 부드럽게 분해/조립(Lerp Interpolation)하여 내부 구조를 파악할 수 있습니다.
* **Focus & Highlight:** 부품 클릭 시 카메라가 자동으로 이동하며, 선택된 부품 외에는 반투명(Ghost Mode) 처리되어 집중도를 높입니다.
* **Interactive Controls:** 자유로운 시점 이동(Orbit), 줌(Zoom), 팬(Pan)을 지원합니다.

### 2. 🤖 AI Docent (AI 도슨트)
* **Context-Aware:** AI가 현재 사용자가 보고 있는 모델, 선택된 부품, 분해 상태 등 '맥락'을 인식하여 답변합니다.
* **Viewer Control Agent:** 단순 텍스트 답변을 넘어, AI가 판단하여 3D 뷰어를 직접 제어합니다.
    * 🗣️ *"이 엔진 내부가 보고 싶어, 분해해줘."* → **⚙️ (자동으로 슬라이더가 움직이며 분해 실행)**
    * 🗣️ *"피스톤이 어디 있어?"* → **⚙️ (피스톤 부품 포커싱 및 하이라이트)**
* **Powered by Upstage Solar:** Solar LLM API를 활용하여 빠르고 정확한 공학 튜터링을 제공합니다.

### 3. 🎓 Adaptive Learning (적응형 학습)
* **Gamification:** 학습 이력을 실시간으로 분석하여 맞춤형 퀴즈를 자동으로 생성합니다.
* **Automatic Reporting:** 현재 학습 화면의 3D 스냅샷과 AI와의 대화 내용을 요약하여 PDF 학습 리포트를 생성합니다.

---

## 🛠️ Tech Stack (기술 스택)

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | 빠른 개발 환경 및 타입 안정성 확보 |
| **Styling** | Tailwind CSS | 유틸리티 퍼스트 CSS로 다크 모드 및 반응형 UI 구현 |
| **3D Engine** | Three.js, React Three Fiber | 선언형 3D 씬 구성 및 렌더링 최적화 |
| **Animation** | GSAP | 부드러운 카메라 무빙 및 UI 인터랙션 |
| **State Mgmt** | Zustand | 뷰어 상태(슬라이더, 선택 부품) 전역 관리 |
| **AI / LLM** | Upstage Solar API | 맥락 인식 및 JSON 기반 뷰어 제어 명령 생성 |

---

## 📂 Project Structure (프로젝트 구조)

```bash
src/
├── assets/
│   └── models/          # .glb 3D 모델 파일 (Draco 압축 최적화)
├── components/
│   ├── three/           # 3D 관련 컴포넌트
│   │   ├── ModelViewer.tsx  # R3F Canvas 메인
│   │   ├── PartMesh.tsx     # 개별 부품 로직 (분해/하이라이트/이벤트)
│   │   └── Controls.tsx     # OrbitControls 설정
│   └── ui/              # UI 컴포넌트
│       ├── ChatPanel.tsx    # AI 도슨트 채팅창 (스트리밍 처리)
│       └── ControlBar.tsx   # 분해 슬라이더 및 하단 툴바
├── hooks/
│   └── useAIControl.ts  # LLM 응답 파싱 및 제어 명령 실행 훅
├── store/
│   ├── useViewerStore.ts # 3D 뷰어 상태 (Slider, Camera, Selection)
│   └── useAuthStore.ts   # 기관 인증 및 세션 관리
├── utils/
│   └── llm.ts           # Upstage API 호출 및 프롬프트 관리
└── App.tsx
