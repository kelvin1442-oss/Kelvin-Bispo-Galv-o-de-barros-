
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage, generateSpeech } from '../services/geminiService';
import { Send, User, Bot, Sparkles, Volume2, Square, Loader2 } from 'lucide-react';

// Helper: Decode base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Decode raw PCM audio data
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const PersonalTrainerChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Eu sou seu Personal Trainer virtual. 💪\nPosso ajudar com dúvidas sobre execução, dieta, dores musculares ou montar um treino rápido. Como posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setPlayingMsgIndex(null);
  };

  const handlePlayAudio = async (index: number, text: string, existingAudio?: string) => {
    if (playingMsgIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();

    try {
      setLoadingAudioIndex(index);
      
      let audioBase64 = existingAudio;

      if (!audioBase64) {
        audioBase64 = await generateSpeech(text);
        setMessages(prev => prev.map((msg, i) => 
          i === index ? { ...msg, audioBase64 } : msg
        ));
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBytes = decode(audioBase64!);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingMsgIndex(null);
      
      sourceNodeRef.current = source;
      source.start();
      setPlayingMsgIndex(index);

    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setLoadingAudioIndex(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

      generateSpeech(responseText).then(audioBase64 => {
        setMessages(current => 
          current.map(msg => 
            (msg.role === 'model' && msg.text === responseText && !msg.audioBase64)
            ? { ...msg, audioBase64 }
            : msg
          )
        );
      }).catch(err => {
        console.log("Background audio generation deferred:", err);
      });

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Como executar Agachamento?",
    "Dica de dieta pós-treino",
    "Alongamento para costas",
    "Treino rápido de 5 min"
  ];

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-80px)] relative">
      <div className="text-center mb-2 flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
          <Bot className="text-brand-500" /> Coach Virtual
        </h1>
        <p className="text-gray-400 text-xs">Seu personal trainer de bolso</p>
      </div>

      {/* Chat Area - Grows to fill available space */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-2 scrollbar-thin scrollbar-track-dark-900 scrollbar-thumb-dark-700">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
              ${msg.role === 'user' ? 'bg-brand-600' : 'bg-dark-700'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-brand-400" />}
            </div>
            
            <div className={`relative p-3 rounded-2xl max-w-[85%] shadow-sm group
              ${msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-tr-none' 
                : 'bg-dark-800 border border-dark-700 text-gray-200 rounded-tl-none'}
              ${msg.isError ? 'border-red-500/50 bg-red-900/20 text-red-200' : ''}
            `}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-1">
                {msg.text}
              </div>

              {msg.role === 'model' && !msg.isError && (
                <button 
                  onClick={() => handlePlayAudio(idx, msg.text, msg.audioBase64)}
                  disabled={loadingAudioIndex === idx}
                  className={`mt-2 p-1.5 pr-3 rounded-full transition-colors flex items-center gap-2 text-xs font-medium
                    ${playingMsgIndex === idx 
                      ? 'bg-brand-900/50 text-brand-400 border border-brand-500/30' 
                      : 'bg-dark-900/50 text-gray-400 hover:text-brand-400 hover:bg-dark-900'}
                  `}
                >
                  {loadingAudioIndex === idx ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : playingMsgIndex === idx ? (
                    <>
                      <Square className="w-3 h-3 fill-current ml-1" /> 
                      <span>Parar</span>
                      <div className="flex gap-0.5 h-3 items-end ml-1">
                         <div className="w-0.5 bg-brand-500 animate-[bounce_1s_infinite] h-2"></div>
                         <div className="w-0.5 bg-brand-500 animate-[bounce_1.2s_infinite] h-3"></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 ml-1" />
                      <span>Ouvir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4 text-brand-400" />
             </div>
             <div className="bg-dark-800 border border-dark-700 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
               <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
               <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
               <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom of chat container */}
      <div className="flex-shrink-0 pt-2">
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-3 px-1 scrollbar-hide mask-linear-fade">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="whitespace-nowrap px-3 py-2 bg-dark-800 border border-dark-700 rounded-full text-xs text-brand-300 hover:border-brand-500/50 transition-colors flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                {action}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida..."
            className="w-full bg-dark-800 border border-dark-600 text-white rounded-full pl-4 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-lg"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-600 disabled:text-gray-500 text-white rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
