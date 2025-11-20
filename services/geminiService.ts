
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { UserPreferences, WorkoutPlan, WeeklyDay } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Treino Fácil IA, um aplicativo que cria treinos personalizados, organiza uma agenda semanal, e atua como um personal trainer virtual.
Seu objetivo é ajudar qualquer pessoa a treinar em casa ou na academia, com treinos seguros, detalhados e eficazes.

Sua função é:

🎯 1. GERAR TREINOS PERSONALIZADOS
Gere um treino completo com: nome do exercício, séries, repetições ou tempo, descanso, explicação rápida de como executar, versão mais fácil e mais difícil (opcional).
O treino deve ser claro, direto e seguro. Evite exercícios perigosos para iniciantes.

📅 2. CRIAR AGENDA SEMANAL
Gere uma agenda semanal (Seg a Dom) personalizada conforme o objetivo do usuário.

🧠 3. PERSONAL TRAINER VIRTUAL
Responda dúvidas sobre execução, dores, alongamento, dieta simples, etc.
Responder sempre com empatia, clareza e dicas práticas.

⚠️ REGRAS IMPORTANTES
- Nunca fale como médico.
- Não sugira remédios.
- Incentive sempre segurança.
- Trate o usuário com motivação.
- Estilo de resposta: Direto, motivador, profissional, fácil de entender, listas e passos curtos.
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas
const exerciseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Nome do exercício (em Português)" },
    nameEnglish: { type: Type.STRING, description: "Nome do exercício em Inglês (Obrigatório para busca de imagens)" },
    sets: { type: Type.STRING, description: "Número de séries (ex: 3)" },
    reps: { type: Type.STRING, description: "Repetições ou tempo (ex: 12 reps ou 30s)" },
    rest: { type: Type.STRING, description: "Tempo de descanso (ex: 60s)" },
    instructions: { type: Type.STRING, description: "Breve explicação de execução" },
    variationEasy: { type: Type.STRING, description: "Variação mais fácil" },
    variationHard: { type: Type.STRING, description: "Variação mais difícil" },
  },
  required: ["name", "nameEnglish", "sets", "reps", "instructions"],
};

const workoutPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título motivador do treino" },
    duration: { type: Type.STRING, description: "Duração estimada total" },
    focus: { type: Type.STRING, description: "Foco muscular principal" },
    exercises: {
      type: Type.ARRAY,
      items: exerciseSchema,
    },
  },
  required: ["title", "exercises", "duration"],
};

const weeklyPlanSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, description: "Dia da semana (ex: Segunda)" },
      focus: { type: Type.STRING, description: "Foco do treino (ex: Pernas)" },
      details: { type: Type.STRING, description: "Breve descrição do que fazer" },
    },
    required: ["day", "focus", "details"],
  },
};

export const generateWorkout = async (prefs: UserPreferences): Promise<WorkoutPlan> => {
  // Contextualize based on custom focus if provided
  const focusContext = prefs.customFocus && prefs.customFocus !== 'Corpo Todo (Full Body)'
    ? `IMPORTANTE: O treino DEVE ser focado EXCLUSIVAMENTE em: ${prefs.customFocus}. Selecione exercícios que trabalhem principalmente essa região, mantendo o estilo de treino para o objetivo ${prefs.goal}.` 
    : 'O treino deve trabalhar o corpo todo (Full Body) ou ser dividido de forma equilibrada.';

  const prompt = `
    Crie um treino personalizado com as seguintes características:
    Gênero do Usuário: ${prefs.gender}
    Objetivo Geral: ${prefs.goal}
    ${focusContext}
    Local: ${prefs.location}
    Tempo disponível: ${prefs.duration}
    Nível: ${prefs.level}
    Equipamentos: ${prefs.equipment.join(', ')}
    
    IMPORTANTE: Para cada exercício, forneça o "nameEnglish" correto (ex: Squat, Push-up, Lunges) para que possamos gerar a imagem ilustrativa corretamente.

    Responda estritamente seguindo o esquema JSON fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: workoutPlanSchema,
      },
    });
    
    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as WorkoutPlan;
  } catch (error) {
    console.error("Error generating workout:", error);
    throw error;
  }
};

export const generateWeeklySchedule = async (goal: string, level: string, location: string, gender: string): Promise<WeeklyDay[]> => {
  const prompt = `
    Crie uma agenda semanal de treinos (Segunda a Domingo) com as seguintes características:
    Gênero do Usuário: ${gender}
    Objetivo: ${goal}
    Nível: ${level}
    Local: ${location}

    Inclua dias de descanso se necessário.
    Responda estritamente seguindo o esquema JSON fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: weeklyPlanSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as WeeklyDay[];
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Desculpe, não consegui processar sua resposta.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Áudio não retornado pela API");
    return base64Audio;
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
};
