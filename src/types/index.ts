import * as THREE from 'three';
import React from "react";

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PartData {
    id: string;
    name: string; // 국문/영문 명칭
    description: string;
    position: Vector3; // 조립 위치
    rotation: Vector3;
    scale: Vector3;
    direction: Vector3; // 분해 방향
    distance: number;   // 분해 최대 거리
    opacity: number;    // 투명도 (0.0 ~ 1.0)
}

export interface ThreeDObject {
    id: string; // e.g., 'V4_Engine'
    nameKr: string;
    nameEn: string;
    category: string; // e.g., 'AUTOMOTIVE_ENGINEERING'
    thumbnailUrl: string;
    modelUrl: string; // .glb 파일 경로
    parts: PartData[];
    viewConfig: ViewConfig;
}

export interface ViewConfig {
    cameraPosition: [number, number, number];
    targetPosition: [number, number, number];
    fov: number;
    minDistance: number;
    maxDistance: number;
}

// 트리 노드 데이터 타입
export interface TreeNode {
    id: string;
    name: string;
    children?: TreeNode[];
}

// TreeItem 컴포넌트 Props 타입
export interface TreeItemProps {
    node: TreeNode;
    level?: number;
    onSelect: (id: string) => void;
    selectedId: string | null;
}

// 채팅 메시지 타입
export interface ChatMessage {
    role: string;
    content: string;
}

// SceneController Props 타입
export interface SceneControllerProps {
    id: string;
    children: React.ReactNode;
}

// Controls 타입 (OrbitControls가 target 속성을 가짐을 명시)
export interface ControlsWithTarget {
    target: THREE.Vector3;
}

// 타입 정의
export interface ModelViewerProps {
    filePaths: string[];
}

export interface SingleGLBLoaderProps {
    url: string;
    index: number;
}

export interface PartMeshProps {
    node: THREE.Mesh;
    partId: string;
    explodeDir: THREE.Vector3;
    explodeDist: number;
}

// 기관 데이터 인터페이스 정의
export interface Institution {
    institutionId: number;
    institutionName: string;
}
