
import React, { useState } from 'react';
import { Dumbbell, Calendar, MessageCircle, Trophy } from 'lucide-react';
import { WorkoutGenerator } from './components/WorkoutGenerator';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { PersonalTrainerChat } from './components/PersonalTrainerChat';
import { UserPreferences } from './types';

type View = 'workout' | 'weekly' | 'chat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('workout');
  
  // State to pass parameters from Weekly Planner to Workout Generator
  const [pendingWorkoutParams, setPendingWorkoutParams] = useState<Partial<UserPreferences> | null>(null);

  const handleGenerateFromPlan = (params: Partial<UserPreferences>) => {
    setPendingWorkoutParams(params);
    setCurrentView('workout');
  };

  const renderView = () => {
    switch (currentView) {
      case 'workout':
        return (
          <WorkoutGenerator 
            initialParams={pendingWorkoutParams} 
            onParamsConsumed={() => setPendingWorkoutParams(null)} 
          />
        );
      case 'weekly':
        return <WeeklyPlanner onGenerateWorkout={handleGenerateFromPlan} />;
      case 'chat':
        return <PersonalTrainerChat />;
      default:
        return <WorkoutGenerator />;
    }
  };

  const navItems = [
    { id: 'workout', label: 'Treino', icon: Dumbbell },
    { id: 'weekly', label: 'Agenda', icon: Calendar },
    { id: 'chat', label: 'Coach', icon: MessageCircle },
  ];

  return (
    <div className="h-[100dvh] bg-dark-900 text-gray-100 font-sans selection:bg-brand-500 selection:text-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <header className="flex-none bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 p-4 flex justify-between items-center lg:hidden z-20">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Treino Fácil IA</span>
        </div>
        {/* Simple indicator for view */}
         <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wider px-3 py-1 bg-brand-900/20 rounded-full border border-brand-500/20">
           {navItems.find(n => n.id === currentView)?.label}
         </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col h-full bg-dark-800 border-r border-dark-700 p-6 z-10">
         <div className="flex items-center gap-3 mb-10 px-2">
           <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2.5 rounded-xl shadow-lg shadow-brand-500/20">
             <Trophy className="w-6 h-6 text-white" />
           </div>
           <div>
              <h1 className="font-bold text-xl leading-none">Treino Fácil</h1>
              <span className="text-xs text-brand-400 font-medium">Inteligência Artificial</span>
           </div>
         </div>

         <nav className="space-y-2 flex-1">
           {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = currentView === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => setCurrentView(item.id as View)}
                 className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium
                   ${isActive 
                     ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                     : 'text-gray-400 hover:bg-dark-700 hover:text-white'}`}
               >
                 <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                 {item.label}
               </button>
             );
           })}
         </nav>

         <div className="p-4 bg-dark-900 rounded-xl border border-dark-700">
           <p className="text-xs text-gray-400 mb-2">Dica do Dia</p>
           <p className="text-sm text-gray-200 italic">"A constância é mais importante que a intensidade."</p>
         </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto scroll-smooth relative w-full" id="main-scroll">
        <div className="p-4 pb-32 lg:p-8 lg:pb-12 max-w-5xl mx-auto min-h-full">
          {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="flex-none lg:hidden bg-dark-800/95 backdrop-blur-xl border-t border-dark-700 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full active:scale-95
                  ${isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-brand-900/50 translate-y-[-2px]' : 'bg-transparent'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                </div>
                <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
};

export default App;
