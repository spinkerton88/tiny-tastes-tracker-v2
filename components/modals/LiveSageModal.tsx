
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Icon from '../ui/Icon';

interface LiveSageModalProps {
  onClose: () => void;
  babyName?: string;
  mode: string;
}

export const LiveSageModal: React.FC<LiveSageModalProps> = ({ onClose, babyName = 'Baby', mode }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const initLiveSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        audioContextRef.current = outputAudioContext;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('listening');
              setIsActive(true);
              
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                setStatus('speaking');
                const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Data), outputAudioContext, 24000, 1);
                
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('listening');
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('listening');
              }
              
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).trim());
              }
            },
            onerror: (e) => {
              console.error('Live API Error:', e);
              setStatus('error');
            },
            onclose: () => {
              setIsActive(false);
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: `You are Sage, a helpful parenting assistant. You are talking to a parent currently in ${mode} mode. Their baby's name is ${babyName}. Keep responses brief, encouraging, and helpful for a parent who might have their hands full. Focus on feeding safety, development, and quick tips.`,
            outputAudioTranscription: {}
          }
        });

        sessionRef.current = await sessionPromise;

      } catch (err) {
        console.error('Init failure:', err);
        setStatus('error');
      }
    };

    initLiveSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      sourcesRef.current.forEach(s => s.stop());
    };
  }, [babyName, mode]);

  // Audio utility functions
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  return (
    <div className="fixed inset-0 bg-violet-900/90 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-8 text-white">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        <Icon name="x" className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="relative mb-12">
          {/* Animated Aura */}
          <div className={`absolute inset-0 bg-violet-400 rounded-full blur-2xl opacity-20 transition-all duration-700 ${status === 'speaking' ? 'scale-150' : 'scale-100'}`} />
          
          <div className={`relative w-32 h-32 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl border-4 border-white/20 ${status === 'speaking' ? 'animate-pulse' : ''}`}>
            <Icon name={status === 'speaking' ? "volume-2" : "mic"} className="w-12 h-12 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2 tracking-tight">Sage Live</h2>
        <p className={`text-sm font-bold uppercase tracking-widest mb-8 ${status === 'connecting' ? 'animate-pulse text-violet-300' : 'text-violet-200'}`}>
          {status === 'connecting' && 'Establishing Link...'}
          {status === 'listening' && 'Listening to you...'}
          {status === 'speaking' && 'Sage is speaking...'}
          {status === 'error' && 'Connection Lost'}
        </p>

        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 min-h-[120px] flex items-center justify-center italic text-violet-100">
           {transcription ? (
             <p className="text-lg leading-relaxed line-clamp-3">"{transcription}"</p>
           ) : (
             <p className="text-sm opacity-60">"Sage, is peanut butter safe for a 6-month-old?"</p>
           )}
        </div>

        <div className="mt-12">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-white text-violet-900 font-black rounded-full shadow-xl hover:bg-violet-50 active:scale-95 transition-all"
          >
            End Conversation
          </button>
        </div>
      </div>
      
      <p className="absolute bottom-8 text-[10px] uppercase font-bold text-white/30 tracking-[0.2em]">Powered by Gemini Live API</p>
    </div>
  );
};
