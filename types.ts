
export interface Exercise {
  name: string;
  nameEnglish?: string; // Used for image generation
  sets: string;
  reps: string;
  rest: string;
  instructions: string;
  variationEasy?: string;
  variationHard?: string;
}

export interface WorkoutPlan {
  title: string;
  duration: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeeklyDay {
  day: string;
  focus: string;
  details: string;
}

export interface UserPreferences {
  goal: 'emagrecer' | 'hipertrofia' | 'definir' | 'condicionamento';
  location: 'casa' | 'academia';
  gender: 'masculino' | 'feminino';
  duration: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  equipment: string[];
  customFocus?: string; // Optional: specific focus for a single day generation
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  audioBase64?: string;
}

export const AVAILABLE_EQUIPMENT = [
  'Nenhum (Peso do corpo)',
  'Halteres',
  'Elásticos',
  'Kettlebell',
  'Barra Fixa',
  'Banco',
  'Corda de Pular',
  'Máquinas (Academia)'
];

export const AVAILABLE_FOCUSES = [
  'Corpo Todo (Full Body)',
  'Superiores (Peito/Costas/Braços)',
  'Inferiores (Pernas Completo)',
  'Peito e Tríceps',
  'Costas e Bíceps',
  'Pernas e Glúteos',
  'Glúteos Isolado',
  'Ombros e Trapézio',
  'Abdômen e Core',
  'Cardio / HIIT'
];
