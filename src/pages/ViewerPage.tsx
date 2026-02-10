import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { ModelViewer } from '@/components/three/ModelViewer';
import ViewerSidebar from '@/components/viewer/ViewerLeftSidebar';
import ViewerRightSidebar from '@/components/viewer/ViewerRightSidebar';

import { useViewerStore } from '@/store/viewerStore';
import { useLearningStore } from '@/store/learningStore';
import callApi, { HttpMethod } from '@/api/callApi';
import type { ObjectDetailResult, ComponentDetailResult } from '@/types';

// --- [Dummy Data for Fallback] ---
const DUMMY_OBJECT_DATA: ObjectDetailResult = {
  objectId: 1,
  objectNameKr: 'V4 엔진 (Dummy)',
  objectNameEn: 'V4 Engine',
  discription: {
    objectContent:
      '이 데이터는 API 호출 실패 시 표시되는 더미 데이터입니다. V4 엔진은 4개의 실린더가 V자 형태로 배열된 내연기관입니다.',
    principle: ['API 연결 상태를 확인해주세요.', '현재 더미 모드로 동작 중입니다.', '4행정 사이클로 동작합니다.'],
    structuralAdvantages: ['컴팩트한 사이즈', '높은 출력 밀도'],
    designConstraints: ['복잡한 배기 구조'],
  },
  models: [
    {
      modelId: 1,
      nameKr: '피스톤',
      nameEn: 'Piston',
      description: '피스톤 더미 설명',
      modelUrl: '/models/v4_engine/Piston.glb',
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      modelId: 2,
      nameKr: '크랭크샤프트',
      nameEn: 'Crankshaft',
      description: '크랭크축 더미 설명',
      modelUrl: '/models/v4_engine/Crankshaft.glb',
      transform: { position: [0, -2, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
  ],
};

const DUMMY_COMPONENT_DATA: ComponentDetailResult = {
  componentId: 1,
  componentNameKr: '피스톤 (Dummy)',
  componentNameEn: 'Piston',
  componentContent: 'API 호출 실패로 로드된 피스톤 상세 정보입니다.',
  elements: [
    { elementName: '헤드', elementContent: '연소 압력을 받는 부위' },
    { elementName: '스커트', elementContent: '실린더 내벽을 지지하는 부위' },
  ],
};

const ViewerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Zustand Store
  const { sliderValue, setSliderValue, selectedPartId, setSelectedPartId } = useViewerStore();

  // 학습 포인트 적립
  const addPartInteraction = useLearningStore((state) => state.addPartInteraction);

  // Local State
  const [objectData, setObjectData] = useState<ObjectDetailResult | null>(null);
  const [componentData, setComponentData] = useState<ComponentDetailResult | null>(null);

  // [API 1] 오브젝트 상세 조회
  useEffect(() => {
    const fetchObjectDetail = async () => {
      if (!id) return;

      try {
        const res = await callApi<{ result: ObjectDetailResult }>(`/objects/${id}/details`, HttpMethod.GET);

        if (res?.result) {
          console.log('📡 Original API Data:', res.result);

          // 0번째 모델(전체 껍데기) 제거
          const componentModels = res.result.models.slice(1);

          // ID -> 로컬 폴더명 매핑
          const FOLDER_MAP: Record<string, string> = {
            '1': 'v4_engine',
            '2': 'drone',
            '4': 'leaf spring',
            '5': 'machine vice',
            '6': 'robot arm',
            '7': 'robot gripper',
            '8': 'suspension',
          };

          const folderName = FOLDER_MAP[id] || 'v4_engine';

          // 로컬 경로 변환
          const localModels = componentModels.map((model) => {
            const fileName = model.modelUrl.split('/').pop();
            const cleanFileName = fileName ? decodeURIComponent(fileName.replace(/\+/g, ' ')) : '';

            return {
              ...model,
              modelUrl: `/models/${folderName}/${cleanFileName}`,
            };
          });

          const transformedData = { ...res.result, models: localModels };

          console.log('📂 Converted Local Data:', transformedData);
          setObjectData(transformedData);
        } else {
          console.warn('⚠️ API 결과 없음, 더미 데이터 사용');
          setObjectData(DUMMY_OBJECT_DATA);
        }
      } catch (err) {
        console.error('Failed to fetch object details:', err);
        setObjectData(DUMMY_OBJECT_DATA);
      }
    };

    fetchObjectDetail();
  }, [id]);

  // [API 2] 부품 상세 조회 (+ 학습 포인트)
  useEffect(() => {
    const handlePartInteraction = async () => {
      if (!selectedPartId) {
        setComponentData(null);
        return;
      }

      const componentId = Number(selectedPartId);
      if (Number.isNaN(componentId)) {
        console.warn('selectedPartId is not a number:', selectedPartId);
        setComponentData(null);
        return;
      }

      // 학습 포인트 적립
      if (id) addPartInteraction(id, selectedPartId);

      try {
        // ✅ 이미지 스펙: GET /api/v1/objects/components/{componentId}
        // callApi baseUrl이 이미 /api/v1 포함이면 "/api/v1" 제거하세요.
        const res = await callApi<{ result: ComponentDetailResult }>(
          `/api/v1/objects/components/${componentId}`,
          HttpMethod.GET
        );

        if (res?.result) {
          setComponentData(res.result);
          return;
        }

        // fallback
        const fallbackModel = objectData?.models.find((m) => Number(m.modelId) === componentId);

        if (fallbackModel) {
          setComponentData({
            componentId,
            componentNameKr: fallbackModel.nameKr,
            componentNameEn: fallbackModel.nameEn,
            componentContent: fallbackModel.description,
            elements: [],
          });
          return;
        }

        setComponentData({
          ...DUMMY_COMPONENT_DATA,
          componentId,
          componentNameKr: `부품 ${componentId}`,
        });
      } catch (err) {
        console.error('Failed to fetch component details:', err);
        setComponentData({
          ...DUMMY_COMPONENT_DATA,
          componentId,
          componentNameKr: `부품 ${componentId} (Dummy)`,
        });
      }
    };

    handlePartInteraction();
  }, [selectedPartId, id, addPartInteraction, objectData]);

  if (!objectData) {
    return <div className='h-screen bg-black text-white flex items-center justify-center'>Loading Data...</div>;
  }

  return (
    <div className='flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans'>
      {/* Header */}
      <header className='absolute top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-6 bg-linear-to-b from-black/80 to-transparent pointer-events-none'>
        <div className='flex items-center gap-4 pointer-events-auto'>
          <button onClick={() => navigate(-1)} className='cursor-pointer p-2 hover:bg-white/10 rounded-full transition'>
            <ChevronLeft className='w-6 h-6 text-gray-300' />
          </button>
          <h1 className='text-lg font-bold tracking-wide text-white'>
            {objectData.objectNameEn} <span className='text-gray-400 font-normal ml-2'>{objectData.objectNameKr}</span>
          </h1>
        </div>
        <div className='flex items-center gap-3 pointer-events-auto'>
          <button className='p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg transition'>
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Left Sidebar */}
      <ViewerSidebar
        objectId={id || ''} // ✅ 추가 (폴더 매핑용)
        objectData={objectData}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
      />

      {/* Main Canvas */}
      <main className='flex-1 relative bg-linear-to-b from-[#1a1a1a] to-[#050505]'>
        <Canvas camera={{ position: [8, 6, 8], fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
          <Suspense
            fallback={
              <Html center>
                <div className='text-blue-400 animate-pulse'>Loading Engine...</div>
              </Html>
            }
          >
            <Environment preset='city' />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
            <ModelViewer models={objectData.models} assemblyProgress={sliderValue / 100} />
            <ContactShadows position={[0, -2, 0]} opacity={0.4} blur={2} />
            <OrbitControls minDistance={5} maxDistance={20} />
          </Suspense>
        </Canvas>
      </main>

      {/* Right Sidebar */}
      <ViewerRightSidebar
        objectId={id || ''}
        objectData={objectData}
        componentData={componentData}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
      />
    </div>
  );
};

export default ViewerPage;
