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

const DUMMY_OBJECT_DATA: ObjectDetailResult = {
  objectId: 1,
  objectNameKr: 'V4 엔진 (Dummy)',
  objectNameEn: 'V4 Engine',
  discription: {
    objectContent: '더미 데이터입니다.',
    principle: [],
    structuralAdvantages: [],
    designConstraints: [],
  },
  models: [],
};

const DUMMY_COMPONENT_DATA: ComponentDetailResult = {
  componentId: 1,
  componentNameKr: '피스톤 (Dummy)',
  componentNameEn: 'Piston',
  componentContent: 'API 호출 실패 더미',
  elements: [],
};

const ViewerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  /** 학습/퀴즈/스토리지 모두 이 키로 통일 */
  const objectKey = String(id ?? '');

  const { sliderValue, setSliderValue, selectedPartId, setSelectedPartId } = useViewerStore();
  const addPartInteraction = useLearningStore((s) => s.addPartInteraction);

  const [objectData, setObjectData] = useState<ObjectDetailResult | null>(null);
  const [componentData, setComponentData] = useState<ComponentDetailResult | null>(null);

  useEffect(() => {
    const fetchObjectDetail = async () => {
      if (!objectKey) return;

      try {
        const res = await callApi<{ result: ObjectDetailResult }>(`/objects/${objectKey}/details`, HttpMethod.GET);

        if (res?.result) {
          const componentModels = res.result.models.slice(1);

          const FOLDER_MAP: Record<string, string> = {
            '1': 'v4_engine',
            '2': 'drone',
            '4': 'leaf spring',
            '5': 'machine vice',
            '6': 'robot arm',
            '7': 'robot gripper',
            '8': 'suspension',
          };

          const folderName = FOLDER_MAP[objectKey] || 'v4_engine';

          const localModels = componentModels.map((model) => {
            const fileName = model.modelUrl.split('/').pop() ?? '';
            const cleanFileName = decodeURIComponent(fileName.replace(/\+/g, ' '));
            return { ...model, modelUrl: `/models/${folderName}/${cleanFileName}` };
          });

          setObjectData({ ...res.result, models: localModels });
        } else {
          setObjectData(DUMMY_OBJECT_DATA);
        }
      } catch (err) {
        console.error(err);
        setObjectData(DUMMY_OBJECT_DATA);
      }
    };

    fetchObjectDetail();
  }, [objectKey]);

  useEffect(() => {
    const handlePartInteraction = async () => {
      if (!selectedPartId) {
        setComponentData(null);
        return;
      }

      const componentId = Number(selectedPartId);
      if (Number.isNaN(componentId)) return;

      /** 학습 포인트 적립도 objectKey로 통일 */
      if (objectKey) addPartInteraction(objectKey, selectedPartId);

      try {
        const res = await callApi<{ result: ComponentDetailResult }>(
          `/api/v1/objects/components/${componentId}`,
          HttpMethod.GET
        );

        if (res?.result) {
          setComponentData(res.result);
          return;
        }

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

        setComponentData({ ...DUMMY_COMPONENT_DATA, componentId });
      } catch (err) {
        console.error(err);
        setComponentData({ ...DUMMY_COMPONENT_DATA, componentId });
      }
    };

    handlePartInteraction();
  }, [selectedPartId, objectKey, addPartInteraction, objectData]);

  if (!objectData) {
    return <div className='h-screen bg-black text-white flex items-center justify-center'>Loading Data...</div>;
  }

  return (
    <div className='flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans'>
      <header className='absolute top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-6 bg-linear-to-b from-black/80 to-transparent pointer-events-none'>
        <div className='flex items-center gap-4 pointer-events-auto'>
          <button onClick={() => navigate(-1)} className='cursor-pointer p-2 hover:bg-white/10 rounded-full transition'>
            <ChevronLeft className='w-6 h-6 text-gray-300' />
          </button>
          <h1 className='text-lg font-bold tracking-wide text-white'>
            {objectData.objectNameEn}
            <span className='text-gray-400 font-normal ml-2'>{objectData.objectNameKr}</span>
          </h1>
        </div>
        <div className='flex items-center gap-3 pointer-events-auto'>
          <button className='p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg transition'>
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <ViewerSidebar
        objectId={objectKey}
        objectData={objectData}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
      />

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

      <ViewerRightSidebar
        objectId={objectKey}
        objectData={objectData}
        componentData={componentData}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
      />
    </div>
  );
};

export default ViewerPage;
