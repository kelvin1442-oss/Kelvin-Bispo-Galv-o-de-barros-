
import React, { useState, useEffect } from 'react';
import { UserPreferences, AVAILABLE_EQUIPMENT, AVAILABLE_FOCUSES, WorkoutPlan, Exercise } from '../types';
import { generateWorkout } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Play, Clock, Repeat, Dumbbell, AlertCircle, Target, ExternalLink, Film, ChevronDown } from 'lucide-react';

interface WorkoutGeneratorProps {
  initialParams?: Partial<UserPreferences> | null;
  onParamsConsumed?: () => void;
}

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({ initialParams, onParamsConsumed }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>({
    goal: 'emagrecer',
    location: 'casa',
    gender: 'masculino',
    duration: '30 min',
    level: 'iniciante',
    equipment: [],
    customFocus: 'Corpo Todo (Full Body)'
  });

  // Effect to handle incoming parameters from Weekly Planner
  useEffect(() => {
    if (initialParams) {
      setPrefs(prev => ({ ...prev, ...initialParams }));
      // Automatically trigger generation if we have enough info
      // We use a small timeout to let state update
      const timer = setTimeout(() => {
        handleGenerate(initialParams);
      }, 100);
      
      if (onParamsConsumed) onParamsConsumed();
      return () => clearTimeout(timer);
    }
  }, [initialParams]);

  const handleGenerate = async (overridePrefs?: Partial<UserPreferences>) => {
    const prefsToUse = { ...prefs, ...overridePrefs };
    setStep('loading');
    try {
      const result = await generateWorkout(prefsToUse);
      setWorkout(result);
      setStep('result');
    } catch (error) {
      console.error(error);
      setStep('form');
      alert("Ocorreu um erro ao gerar o treino. Tente novamente.");
    }
  };

  const toggleEquipment = (item: string) => {
    setPrefs(prev => {
      if (prev.equipment.includes(item)) {
        return { ...prev, equipment: prev.equipment.filter(e => e !== item) };
      }
      return { ...prev, equipment: [...prev.equipment, item] };
    });
  };

  // Generate a dynamic image URL representing a sequence of movement
  const getExerciseImageUrl = (exercise: Exercise) => {
    const term = exercise.nameEnglish || exercise.name;
    const cleanName = term.split('(')[0].trim();
    const imagePrompt = `technical illustration sequence showing 2 steps of ${cleanName} exercise, start and finish position, flat vector style, white background, educational guide`;
    const encodedName = encodeURIComponent(imagePrompt);
    return `https://image.pollinations.ai/prompt/${encodedName}?width=320&height=320&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  };

  const openGifSearch = (exercise: Exercise) => {
    const term = exercise.nameEnglish || exercise.name;
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}+exercise+gif&tbm=isch&tbs=itp:animated`;
    window.open(url, '_blank');
  };

  const openYoutubeSearch = (exercise: Exercise) => {
    const term = exercise.nameEnglish || exercise.name;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}+exercise+technique`;
    window.open(url, '_blank');
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center px-4">
        <LoadingSpinner />
        <div>
          <p className="text-brand-400 text-xl font-bold animate-pulse mb-2">Criando seu treino...</p>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">A IA está selecionando os melhores exercícios para seu objetivo.</p>
        </div>
      </div>
    );
  }

  if (step === 'result' && workout) {
    return (
      <div className="space-y-6">
        <div className="bg-brand-900/20 border border-brand-500/30 rounded-2xl p-6 shadow-lg backdrop-blur-sm text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-400 mb-3">{workout.title}</h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1.5 bg-dark-900/50 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 text-brand-500" /> {workout.duration}</div>
            <div className="flex items-center gap-1.5 bg-dark-900/50 px-3 py-1.5 rounded-full"><Dumbbell className="w-4 h-4 text-brand-500" /> {workout.focus}</div>
          </div>
        </div>

        <div className="space-y-4">
          {workout.exercises.map((exercise, idx) => (
            <div key={idx} className="bg-dark-800 rounded-xl p-4 sm:p-5 border border-dark-700 shadow-md transition-colors">
              <div className="flex flex-col sm:flex-row gap-5">
                
                {/* Image/GIF Section - Centered on mobile, left on desktop */}
                <div className="shrink-0 self-center sm:self-start relative group cursor-pointer w-full sm:w-auto flex justify-center sm:block" onClick={() => openGifSearch(exercise)}>
                   <div className="w-full max-w-[200px] aspect-square sm:w-40 sm:h-40 rounded-xl bg-white overflow-hidden border-2 border-dark-600 flex items-center justify-center relative shadow-inner">
                      <img 
                        src={getExerciseImageUrl(exercise)} 
                        alt={exercise.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                        <div className="bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 absolute bottom-2 right-2">
                           <Film className="w-3 h-3" />
                           GIF
                        </div>
                      </div>
                   </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-start gap-3 leading-tight">
                      <span className="bg-brand-600 text-sm font-extrabold w-6 h-6 flex items-center justify-center rounded text-white shrink-0 mt-0.5">{idx + 1}</span>
                      <span className="uppercase tracking-tight">{exercise.name}</span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-dark-900/50 p-3 rounded-xl text-center">
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Séries</p>
                      <p className="text-lg font-bold text-brand-300">{exercise.sets}</p>
                    </div>
                    <div className="border-x border-dark-700/50 flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Reps</p>
                      <p className="text-lg font-bold text-brand-300">{exercise.reps}</p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Descanso</p>
                      <p className="text-lg font-bold text-brand-300">{exercise.rest}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 items-start text-gray-300 bg-dark-900/30 p-3 rounded-lg border border-dark-700/30">
                      <Play className="w-5 h-5 mt-0.5 text-brand-500 shrink-0" />
                      <p className="text-sm leading-relaxed">{exercise.instructions}</p>
                    </div>
                    
                    {(exercise.variationEasy || exercise.variationHard) && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {exercise.variationEasy && (
                            <p className="text-xs text-green-400/90 bg-green-900/10 p-2 rounded border border-green-900/20">
                                <span className="font-bold block mb-0.5">🟢 Facilitar:</span> {exercise.variationEasy}
                            </p>
                          )}
                          {exercise.variationHard && (
                            <p className="text-xs text-red-400/90 bg-red-900/10 p-2 rounded border border-red-900/20">
                                <span className="font-bold block mb-0.5">🔴 Dificultar:</span> {exercise.variationHard}
                            </p>
                          )}
                       </div>
                    )}

                    <div className="flex gap-3 pt-2">
                       <button 
                         onClick={() => openGifSearch(exercise)}
                         className="flex-1 bg-dark-700 active:bg-dark-600 py-3 rounded-lg text-sm font-medium text-gray-300 transition-colors flex items-center justify-center gap-2 border border-dark-600"
                       >
                         <Film className="w-4 h-4" /> Ver GIF
                       </button>
                       <button 
                         onClick={() => openYoutubeSearch(exercise)}
                         className="flex-1 bg-red-600/10 active:bg-red-600/20 border border-red-900/30 text-red-400 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                       >
                         <Play className="w-4 h-4" /> YouTube
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setStep('form')}
          className="w-full py-4 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mb-8 shadow-lg border border-dark-600"
        >
          <Repeat className="w-5 h-5" />
          Gerar Novo Treino
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Gerador de Treino</h1>
        <p className="text-gray-400 text-sm">Preencha rápido e comece agora</p>
      </div>

      <div className="bg-dark-800 p-4 lg:p-6 rounded-2xl border border-dark-700 shadow-xl space-y-5 lg:space-y-6">
          
          {/* Gender & Goal - Stacked on mobile, Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-300 block">Você é?</label>
              <div className="flex gap-3">
                {['masculino', 'feminino'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setPrefs({ ...prefs, gender: g as any })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border-2
                      ${prefs.gender === g 
                        ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-900/20' 
                        : 'bg-dark-900 border-dark-700 text-gray-500'}`}
                  >
                    {g === 'masculino' ? 'Homem' : 'Mulher'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-brand-300 block">Qual seu objetivo?</label>
                <div className="relative">
                    <select 
                        value={prefs.goal}
                        onChange={(e) => setPrefs({ ...prefs, goal: e.target.value as any })}
                        className="w-full appearance-none bg-dark-900 border-2 border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-medium"
                    >
                        <option value="emagrecer">🔥 Emagrecer / Secar</option>
                        <option value="hipertrofia">💪 Ganhar Massa (Hipertrofia)</option>
                        <option value="definir">🔪 Definir Musculatura</option>
                        <option value="condicionamento">⚡ Condicionamento Físico</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
            </div>
          </div>

          {/* Focus Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Foco do Treino de Hoje
            </label>
            <div className="flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-2 px-2 lg:mx-0 lg:px-0">
              {AVAILABLE_FOCUSES.map((f) => (
                <button
                  key={f}
                  onClick={() => setPrefs({ ...prefs, customFocus: f })}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0
                    ${prefs.customFocus === f
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                      : 'bg-dark-900 border-dark-700 text-gray-400'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Level & Time - Grid System */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-400">Local</label>
               <div className="relative">
                  <select 
                    value={prefs.location}
                    onChange={(e) => {
                        const newLoc = e.target.value as any;
                        let newEq = prefs.equipment;
                        if(newLoc === 'academia' && !newEq.includes('Máquinas (Academia)')) {
                            newEq = [...newEq, 'Máquinas (Academia)'];
                        }
                        setPrefs({ ...prefs, location: newLoc, equipment: newEq });
                    }}
                    className="w-full appearance-none bg-dark-900 border border-dark-700 rounded-lg p-3 text-white outline-none focus:border-brand-500"
                  >
                    <option value="casa">🏠 Casa</option>
                    <option value="academia">🏋️ Academia</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-400">Nível</label>
               <div className="relative">
                 <select 
                    value={prefs.level}
                    onChange={(e) => setPrefs({ ...prefs, level: e.target.value as any })}
                    className="w-full appearance-none bg-dark-900 border border-dark-700 rounded-lg p-3 text-white outline-none focus:border-brand-500"
                 >
                    <option value="iniciante">👶 Iniciante</option>
                    <option value="intermediario">🏃 Intermediário</option>
                    <option value="avancado">🦍 Avançado</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-400">Tempo</label>
               <div className="relative">
                 <select 
                    value={prefs.duration}
                    onChange={(e) => setPrefs({ ...prefs, duration: e.target.value })}
                    className="w-full appearance-none bg-dark-900 border border-dark-700 rounded-lg p-3 text-white outline-none focus:border-brand-500"
                 >
                    <option value="10 min">10 min (Rápido)</option>
                    <option value="20 min">20 min</option>
                    <option value="30 min">30 min (Ideal)</option>
                    <option value="45 min">45 min</option>
                    <option value="60 min">60 min</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
               </div>
             </div>
          </div>

          {/* Equipment - Collapsible or Grid */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-brand-300 block mb-2">Equipamentos Disponíveis</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_EQUIPMENT.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-left transition-all border
                    ${prefs.equipment.includes(eq)
                      ? 'bg-brand-900/30 border-brand-500 text-brand-200'
                      : 'bg-dark-900 border-transparent text-gray-500 hover:border-dark-600'}`}
                >
                  {prefs.equipment.includes(eq) ? '✓' : '+'} {eq.replace(' (Academia)', '').replace(' (Peso do corpo)', '')}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-brand-900/50 transition-all transform active:scale-[0.98] mt-4"
          >
            GERAR TREINO AGORA
          </button>
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start text-xs sm:text-sm text-blue-300/80">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
        <p>Para sua segurança, respeite seus limites e consulte um médico antes de iniciar novas rotinas.</p>
      </div>
    </div>
  );
};
