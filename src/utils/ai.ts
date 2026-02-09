import axios from 'axios';

const API_KEY = import.meta.env.VITE_UPSTAGE_API_KEY; // .env 파일에 키 저장
const API_URL = 'https://api.upstage.ai/v1/solar/chat/completions';

export const sendChatToAI = async (message: string, context: string) => {
    const systemPrompt = `
    당신은 SIMVEX의 AI 튜터입니다. 공학적 지식을 바탕으로 사용자의 질문에 답변하세요.
    답변과 함께 3D 뷰어를 제어할 필요가 있다면, 답변 끝에 JSON 형식의 명령을 추가하세요.
    
    [제어 명령 형식]
    ///CONTROL_START///
    {
      "action": "FOCUS" | "EXPLODE" | "RESET",
      "targetPartId": "부품ID", 
      "explodeValue": 0~100
    }
    ///CONTROL_END///
    
    [현재 컨텍스트]
    ${context}
  `;

    try {
        const response = await axios.post(
            API_URL,
            {
                model: 'solar-1-mini-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const rawContent = response.data.choices[0].message.content;

        // 제어 명령 파싱
        const controlBlockRegex = /\/\/\/CONTROL_START\/\/\/([\s\S]*?)\/\/\/CONTROL_END\/\/\//;
        const match = rawContent.match(controlBlockRegex);

        let reply = rawContent.replace(controlBlockRegex, '').trim();
        let command = null;

        if (match && match[1]) {
            try {
                command = JSON.parse(match[1]);
            } catch (e) {
                console.error("Failed to parse control command", e);
            }
        }

        return { reply, command };
    } catch (error) {
        console.error("AI API Error:", error);
        return { reply: "죄송합니다. 오류가 발생했습니다.", command: null };
    }
};