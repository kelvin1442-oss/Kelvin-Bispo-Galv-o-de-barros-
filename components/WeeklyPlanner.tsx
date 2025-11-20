
import React, { useState } from 'react';
import { WeeklyDay, UserPreferences } from '../types';
import { generateWeeklySchedule } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Calendar, ChevronDown, Target, Dumbbell, Zap, Flame, ArrowRight } from 'lucide-react';

interface WeeklyPlannerProps {
  onGenerateWorkout?: (params: Partial<UserPreferences>) => void;
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onGenerateWorkout }) => {
  const [schedule, setSchedule] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('emagrecer');
  const [level, setLevel] = useState('iniciante');
  const [location, setLocation] = useState('casa');
  const [gender, setGender] = useState('masculino');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [hasPlan, setHasPlan] = useState(false);

  const generate = async (selectedGoal: string) => {
    setLoading(true);
    try {
      const result = await generateWeeklySchedule(selectedGoal, level, location, gender);
      setSchedule(result);
      setGoal(selectedGoal);
      setHasPlan(true);
      
      // Auto expand current day
      const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayMatch = result.find(d => d.day.toLowerCase().includes(today.split('-')[0].toLowerCase()));
      if (dayMatch) setExpandedDay(dayMatch.day);
    } catch (error) {
      console.error(error);
      // If error occurs on first load, allow retry
      if (!hasPlan) setHasPlan(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    generate(goal);
  };

  const handleGoalSwitch = (newGoal: string) => {
    if (newGoal === goal && schedule.length > 0) return;
    generate(newGoal);
  };

  const goals = [
    { id: 'emagrecer', label: 'Emagrecer', icon: Flame },
    { id: 'hipertrofia', label: 'Hipertrofia', icon: Dumbbell },
    { id: 'condicionamento', label: 'Condicionamento', icon: Zap },
  ];

  return (
    <div className="space-y-6">
       <div className="text-center mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Agenda Semanal</h1>
        <p className="text-gray-400 text-sm">Organize sua rotina para maximizar resultados</p>
      </div>

      {/* SETUP FORM */}
      {!hasPlan && !loading && (
        <div className="bg-dark-800 p-5 lg:p-6 rounded-xl border border-dark-700 shadow-xl">
          <h2 className="text-lg font-semibold text-brand-400 mb-5 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Configurar Semana
          </h2>
          
          <div className="space-y-5">
             {/* Gender */}
             <div>
               <label className="block text-sm text-gray-400 mb-2">Você é?</label>
               <div className="bg-dark-900/50 p-1 rounded-xl grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setGender('masculino')}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${gender === 'masculino' ? 'bg-brand-600 text-white shadow' : 'text-gray-500'}`}
                  >
                    Homem
                  </button>
                  <button
                    onClick={() => setGender('feminino')}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${gender === 'feminino' ? 'bg-brand-600 text-white shadow' : 'text-gray-500'}`}
                  >
                    Mulher
                  </button>
               </div>
             </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Objetivo Principal</label>
              <div className="relative">
                  <select 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-xl p-3.5 text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="emagrecer">🔥 Emagrecer (Perda de gordura)</option>
                    <option value="hipertrofia">💪 Hipertrofia (Ganho de massa)</option>
                    <option value="condicionamento">⚡ Condicionamento Físico</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Local</label>
                <div className="relative">
                    <select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-xl p-3.5 text-white outline-none focus:border-brand-500"
                    >
                      <option value="casa">🏠 Em Casa</option>
                      <option value="academia">🏋️ Academia</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Seu Nível</label>
                <div className="relative">
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-xl p-3.5 text-white outline-none focus:border-brand-500"
                    >
                      <option value="iniciante">👶 Iniciante</option>
                      <option value="intermediario">🏃 Intermediário</option>
                      <option value="avancado">🦍 Avançado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateSchedule}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-brand-900/30 mt-2"
            >
              Criar Agenda Agora
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && !hasPlan && (
        <div className="h-[50vh] flex items-center justify-center">
            <LoadingSpinner />
        </div>
      )}

      {/* PLAN VIEW */}
      {hasPlan && (
        <div className="space-y-4">
           
           {/* Goal Switcher Tabs */}
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {goals.map((g) => {
               const Icon = g.icon;
               const isActive = goal === g.id;
               return (
                 <button
                   key={g.id}
                   onClick={() => handleGoalSwitch(g.id)}
                   disabled={loading}
                   className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                     ${isActive 
                       ? 'bg-brand-600 text-white shadow-md' 
                       : 'bg-dark-800 text-gray-400 hover:bg-dark-700 border border-dark-700'}
                     ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                   `}
                 >
                   <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                   {g.label}
                 </button>
               )
             })}
           </div>

           {loading ? (
             <div className="py-12 flex flex-col items-center">
               <LoadingSpinner />
               <p className="text-sm text-gray-400 mt-4 animate-pulse">Adaptando sua agenda...</p>
             </div>
           ) : (
             <div className="space-y-3 animate-fadeIn">
               <div className="flex justify-between items-center mb-2 px-1">
                 <h3 className="text-brand-300 text-xs font-bold uppercase tracking-wider">Semana Atual</h3>
                 <button onClick={() => { setHasPlan(false); setSchedule([]); }} className="text-xs text-gray-500 hover:text-brand-400 transition-colors underline">
                   Refazer Configuração
                 </button>
               </div>
               
               {schedule.map((day, idx) => {
                 const isExpanded = expandedDay === day.day;
                 const isRest = day.focus.toLowerCase().includes('descanso');
                 
                 return (
                   <div key={idx} className={`rounded-xl overflow-hidden border transition-all duration-200
                     ${isExpanded 
                       ? 'bg-dark-800 border-brand-500/50 shadow-lg' 
                       : 'bg-dark-800/50 border-dark-700'}`}>
                     
                     <button 
                      onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-colors
                        ${isExpanded ? 'bg-brand-900/10' : 'active:bg-dark-700'}`}
                     >
                       <div className="flex items-center gap-4">
                         {/* Indicator Bar */}
                         <div className={`w-1.5 h-10 rounded-full shrink-0
                           ${isRest ? 'bg-gray-600' : 'bg-gradient-to-b from-brand-400 to-brand-600'}`}>
                         </div>
                         
                         <div>
                           <p className={`font-bold text-sm uppercase tracking-wide ${isExpanded ? 'text-white' : 'text-gray-200'}`}>
                             {day.day}
                           </p>
                           <p className={`text-xs line-clamp-1 ${isRest ? 'text-gray-500' : 'text-brand-400'}`}>
                             {day.focus}
                           </p>
                         </div>
                       </div>
                       
                       <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-dark-700 rotate-180' : ''}`}>
                          <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-brand-400' : 'text-gray-600'}`} />
                       </div>
                     </button>
                     
                     {isExpanded && (
                       <div className="p-4 pt-0 border-t border-dark-700/0">
                         <div className="flex gap-3 text-sm text-gray-300 leading-relaxed bg-dark-900/50 p-4 rounded-xl mb-4 mt-3 border border-dark-700/50">
                           <Calendar className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                           <p>{day.details}</p>
                         </div>

                         {!isRest && onGenerateWorkout && (
                           <button 
                             onClick={() => onGenerateWorkout({
                               goal: goal as any,
                               level: level as any,
                               location: location as any,
                               gender: gender as any,
                               customFocus: day.focus
                             })}
                             className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                           >
                             Ver Treino Detalhado
                             <ArrowRight className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
           )}
        </div>
      )}
    </div>
  );
};
