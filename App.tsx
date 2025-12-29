
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grade, TeachingMode, Unit, TeacherScript } from './types';
import { CURRICULUM } from './constants';
import { TeacherAvatar } from './components/TeacherAvatar';
import { UnitSelection } from './components/UnitSelection';
import { generateLessonScript, generateSpeech } from './services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// Audio Utilities for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const App: React.FC = () => {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [teachingMode, setTeachingMode] = useState<TeachingMode | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [script, setScript] = useState<TeacherScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [appStarted, setAppStarted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Live Chat States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);

  const steps = [
    { key: 'warmUp', label: 'Warm Up', icon: 'fa-sun' },
    { key: 'vocabulary', label: 'Words', icon: 'fa-book-open' },
    { key: 'pronunciation', label: 'Speak', icon: 'fa-comment' },
    { key: 'phonics', label: 'Sounds', icon: 'fa-music' },
    { key: 'song', label: 'Song', icon: 'fa-microphone' },
    { key: 'activity', label: 'Play', icon: 'fa-gamepad' },
    { key: 'revision', label: 'Done', icon: 'fa-check-double' }
  ];

  const stopAllAudio = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  };

  const playAudio = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      source.start();
      audioSourcesRef.current.add(source);
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsSpeaking(false);
    }
  };

  const handleSpeak = async (textOverride?: string) => {
    if (isLiveActive) return; 
    const textToSpeak = textOverride || (script as any)?.[steps[step].key];
    if (!textToSpeak) return;

    try {
      setIsSpeaking(true);
      const audioData = await generateSpeech(textToSpeak, teachingMode || TeachingMode.ARABIC_BILINGUAL);
      await playAudio(audioData);
    } catch (error) {
      console.error("Speech Generation Error:", error);
      setIsSpeaking(false);
    }
  };

  const toggleLiveChat = async () => {
    if (isLiveActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLiveActive(false);
      stopAllAudio();
      return;
    }

    try {
      setIsLiveActive(true);
      stopAllAudio();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = teachingMode === TeachingMode.ENGLISH_ONLY 
        ? "You are Miss Smart, a cheerful and intelligent English teacher for KG children in a language school. You speak ENTIRELY in simple, clear, and encouraging English. Use phrases like 'Wonderful job!', 'You are my little star!', and explain curriculum words and concepts clearly for children. Respond with fun and warmth."
        : "أنت ميس سمارت، معلمة مصرية مرحة جداً وذكية للأطفال في حضانة. تتحدثين بلهجة مصرية محببة وتستخدمين كلمات تشجيعية (يا سكرة، يا بطل ميس سمارت). تشرحين بساطة وتجيبين على أسئلة الأطفال عن الكلمات والأرقام والألوان الموجودة في منهج كي جي بالعربي والإنجليزي. إذا سألك الطفل عن أي شيء، أجيبي برقة ومرح.";

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              stopAllAudio();
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: (e) => {
            console.error("Live session error", e);
            setIsLiveActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: systemInstruction
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start live session", err);
      setIsLiveActive(false);
    }
  };

  const startApp = () => {
    setAppStarted(true);
    handleSpeak("أهلاً يا روحي! ميس سمارت وصلت.. يلا نتعلم ونلعب مع بعض يا بطل!");
  };

  const handleUnitSelect = async (unit: Unit) => {
    setSelectedUnit(unit);
    setLoading(true);
    setStep(0);
    setShowCelebration(false);
    try {
      const result = await generateLessonScript(grade!, unit, teachingMode!);
      setScript(result);
    } catch (error) {
      alert("معلش يا قمر، الشبكة وحشة، حاولي تاني!");
      setSelectedUnit(null);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      setShowCelebration(true);
      const msg = teachingMode === TeachingMode.ENGLISH_ONLY 
        ? "Excellent! You are the smartest champion! Miss Smart is so proud of you!"
        : "برافو برافو برافو! أنت أشطر بطل شفته في حياتي! ميس سمارت فخورة بيك جداً!";
      handleSpeak(msg);
      setTimeout(() => {
        setSelectedUnit(null);
        setShowCelebration(false);
      }, 6000);
    }
  };

  useEffect(() => {
    if (script && !loading && appStarted && !showCelebration && !isLiveActive) {
      const timer = setTimeout(() => handleSpeak(), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, script, loading, appStarted, isLiveActive]);

  if (!appStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-pink-100 to-yellow-100 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce"><i className="fas fa-apple-whole text-red-400"></i></div>
          <div className="absolute bottom-20 right-20 text-6xl opacity-20 animate-spin-slow"><i className="fas fa-gear text-blue-400"></i></div>
        </div>
        <TeacherAvatar />
        <h1 className="text-8xl font-black text-purple-900 mt-12 mb-4 drop-shadow-2xl font-fredoka">Miss Smart</h1>
        <p className="text-4xl font-bold text-pink-600 mb-12 animate-pulse">Your Magical English Teacher ✨</p>
        <button 
          onClick={startApp}
          className="px-28 py-12 bg-pink-500 text-white text-5xl font-black rounded-[60px] shadow-[0_20px_0_#be185d] hover:translate-y-2 hover:shadow-[0_10px_0_#be185d] transition-all active:translate-y-6 active:shadow-none transform active:scale-95"
        >
          يلا نفتح الدرس! 🪄
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col items-center selection:bg-pink-200 overflow-x-hidden">
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm animate-fadeIn"></div>
          <div className="relative text-center animate-bounce">
            <h2 className="text-9xl font-black text-pink-600 drop-shadow-2xl">برافو! 🏆</h2>
            <div className="flex gap-6 mt-8 justify-center text-7xl">
              <i className="fas fa-star text-yellow-400 animate-spin"></i>
              <i className="fas fa-heart text-red-500 animate-ping"></i>
              <i className="fas fa-certificate text-blue-500 animate-spin"></i>
            </div>
          </div>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute animate-fall" style={{ 
              left: `${Math.random() * 100}%`, 
              top: `-10%`, 
              animationDelay: `${Math.random() * 3}s`,
              color: ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF'][Math.floor(Math.random() * 7)]
            }}>
              <i className={`fas ${['fa-star', 'fa-circle', 'fa-heart', 'fa-music'][Math.floor(Math.random() * 4)]} text-2xl`}></i>
            </div>
          ))}
        </div>
      )}

      <header className={`w-full py-14 px-4 text-center text-white transition-all shadow-2xl relative overflow-hidden ${grade === Grade.KG2 ? 'bg-pink-600' : 'bg-purple-600'}`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none flex flex-wrap gap-20 p-10">
          <i className="fas fa-pencil-alt text-6xl"></i>
          <i className="fas fa-book text-6xl"></i>
          <i className="fas fa-palette text-6xl"></i>
        </div>
        <h1 className="text-7xl md:text-9xl font-black drop-shadow-2xl font-fredoka">Miss Smart</h1>
        <p className="text-2xl font-bold mt-4 tracking-[0.2em] uppercase opacity-90">Official Egyptian KG Curriculum ❤️</p>
      </header>

      <main className="max-w-7xl w-full px-4 md:px-8 mt-12 flex-grow flex flex-col items-center pb-20 overflow-hidden">
        {!grade ? (
          <div className="flex flex-col items-center gap-14 animate-fadeIn py-10 w-full">
            <TeacherAvatar />
            <h2 className="text-6xl font-black text-purple-900 text-center leading-tight">يا أهلاً يا سكرة!<br/>أنت في KG كام؟</h2>
            <div className="flex flex-wrap justify-center gap-12">
              <button onClick={() => setGrade(Grade.KG1)} className="group bg-purple-600 text-white p-16 rounded-[70px] text-7xl font-black border-b-[20px] border-purple-900 shadow-2xl hover:scale-110 active:translate-y-4 transition-all relative overflow-hidden">
                <span className="relative z-10">KG 1</span>
                <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500"></div>
              </button>
              <button onClick={() => setGrade(Grade.KG2)} className="group bg-pink-600 text-white p-16 rounded-[70px] text-7xl font-black border-b-[20px] border-pink-900 shadow-2xl hover:scale-110 active:translate-y-4 transition-all relative overflow-hidden">
                <span className="relative z-10">KG 2</span>
                <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500"></div>
              </button>
            </div>
          </div>
        ) : !teachingMode ? (
          <div className="flex flex-col items-center gap-14 animate-fadeIn py-10 w-full">
            <TeacherAvatar />
            <h2 className="text-6xl font-black text-purple-900 text-center leading-tight">بتدرس في مدرسة إيه؟</h2>
            <div className="flex flex-wrap justify-center gap-12">
              <button onClick={() => setTeachingMode(TeachingMode.ARABIC_BILINGUAL)} className="group bg-blue-500 text-white p-12 rounded-[60px] text-5xl font-black border-b-[15px] border-blue-800 shadow-2xl hover:scale-110 active:translate-y-4 transition-all">
                <div className="flex flex-col items-center gap-4">
                  <i className="fas fa-flag text-white/50 text-4xl"></i>
                  <span>مدرسة عربي</span>
                  <span className="text-2xl opacity-80">(شرح بالعربي)</span>
                </div>
              </button>
              <button onClick={() => setTeachingMode(TeachingMode.ENGLISH_ONLY)} className="group bg-indigo-500 text-white p-12 rounded-[60px] text-5xl font-black border-b-[15px] border-indigo-800 shadow-2xl hover:scale-110 active:translate-y-4 transition-all">
                <div className="flex flex-col items-center gap-4">
                  <i className="fas fa-globe-americas text-white/50 text-4xl"></i>
                  <span>Language School</span>
                  <span className="text-2xl opacity-80">(English Only)</span>
                </div>
              </button>
            </div>
            <button onClick={() => setGrade(null)} className="text-2xl font-bold text-gray-500 hover:text-pink-500 transition-colors mt-8">
              <i className="fas fa-arrow-left"></i> نغير السنة؟
            </button>
          </div>
        ) : !selectedUnit && !loading ? (
          <div className="w-full animate-fadeIn">
            <button onClick={() => setTeachingMode(null)} className="mb-10 text-3xl font-black text-pink-600 flex items-center gap-4 hover:scale-105 transition-transform bg-white/80 px-8 py-3 rounded-full shadow-sm">
              <i className="fas fa-arrow-left"></i> نغير نظام المدرسة؟
            </button>
            <h2 className="text-5xl font-black text-center mb-14 text-purple-900 bg-white py-10 rounded-[50px] shadow-2xl border-t-[12px] border-pink-400">يلا يا بطل.. اختار درس تحبه:</h2>
            <UnitSelection units={CURRICULUM[grade]} onSelect={handleUnitSelect} />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-24 w-full">
            <TeacherAvatar isLoading={true} />
            <p className="text-5xl font-black text-purple-900 mt-14 animate-bounce">ميس سمارت بتحضر العصا السحرية... 🪄</p>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row gap-10 items-center lg:items-start animate-fadeIn max-w-full">
            <div className="flex flex-col items-center gap-8 min-w-[320px] md:min-w-[380px] max-w-full">
              <div className="relative">
                <TeacherAvatar isTalking={isSpeaking} />
                {!isLiveActive && (
                  <div className="absolute -top-10 -right-16 bg-white p-4 rounded-3xl shadow-xl border-4 border-pink-200 animate-bounce max-w-[140px] text-center z-10">
                    <p className="font-bold text-pink-600 text-lg md:text-xl">{teachingMode === TeachingMode.ENGLISH_ONLY ? "Talk to me!" : "كلمني هنا يا سكرة!"} 👇</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-6 items-center bg-white/50 p-4 rounded-[40px] shadow-inner border-4 border-white w-full justify-center">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={toggleLiveChat}
                    title="كلم ميس سمارت"
                    className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 relative ${isLiveActive ? 'bg-red-500 animate-pulse ring-[10px] ring-red-100' : 'bg-pink-500 hover:scale-110 hover:shadow-pink-200'}`}
                  >
                    <i className={`fas ${isLiveActive ? 'fa-microphone' : 'fa-microphone-lines'} text-4xl md:text-5xl`}></i>
                    {!isLiveActive && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>}
                  </button>
                  <span className="font-black text-pink-600 text-lg font-cairo text-center leading-tight">{teachingMode === TeachingMode.ENGLISH_ONLY ? "Live Chat" : "الميكروفون السحري"}</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => handleSpeak()} 
                    title="اسمع ميس سمارت"
                    className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 ${isSpeaking && !isLiveActive ? 'bg-pink-500 animate-pulse' : 'bg-purple-600 hover:scale-110 hover:shadow-purple-200'}`}
                  >
                    <i className={`fas ${isSpeaking && !isLiveActive ? 'fa-waveform-lines' : 'fa-play'} text-4xl md:text-5xl`}></i>
                  </button>
                  <span className="font-black text-purple-600 text-lg font-cairo text-center leading-tight">{teachingMode === TeachingMode.ENGLISH_ONLY ? "Listen" : "اسمع الشرح"}</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[50px] shadow-2xl border-[8px] border-pink-50 w-full text-center relative overflow-hidden group">
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  #{selectedUnit.id}
                </div>
                <img src={selectedUnit.thematicImage} alt={selectedUnit.title} className="w-full h-60 rounded-[40px] object-cover mb-6 shadow-inner border-2 border-white transition-transform group-hover:scale-105" />
                <p className="font-black text-3xl text-purple-900 font-cairo">{selectedUnit.title}</p>
              </div>
            </div>

            <div className={`flex-grow w-full md:w-auto p-8 md:p-14 lg:p-16 rounded-[60px] md:rounded-[100px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border-[12px] md:border-[20px] min-h-[550px] md:min-h-[650px] flex flex-col relative group transition-colors duration-1000 ${isLiveActive ? 'bg-pink-50 border-pink-100' : 'bg-white border-white'} overflow-hidden`}>
              {isLiveActive && (
                <div className="absolute top-0 left-0 w-full h-full bg-pink-500/5 rounded-[70px] pointer-events-none animate-pulse"></div>
              )}
              
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide no-scrollbar max-w-full">
                {steps.map((s, idx) => (
                  <button key={s.key} onClick={() => setStep(idx)} className={`px-8 py-4 rounded-full font-black text-xl whitespace-nowrap transition-all flex items-center gap-3 ${step === idx ? 'bg-pink-500 text-white shadow-2xl scale-105 -rotate-1' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                    <i className={`fas ${s.icon}`}></i> {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 md:gap-6 mb-6 text-pink-500 animate-fadeIn">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-sm">
                  <i className={`fas ${isLiveActive ? 'fa-microphone-lines' : steps[step].icon}`}></i>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight font-fredoka break-words">
                  {isLiveActive ? (teachingMode === TeachingMode.ENGLISH_ONLY ? "Call Miss Smart" : "مكالمة ميس سمارت") : steps[step].label}
                </h2>
              </div>

              <div className={`text-4xl md:text-5xl lg:text-6xl font-black leading-[1.4] text-gray-800 flex-grow py-4 px-2 md:px-6 transition-all break-words ${teachingMode === TeachingMode.ARABIC_BILINGUAL && (isLiveActive || /[\u0600-\u06FF]/.test((script as any)[steps[step].key])) ? 'text-right font-cairo' : 'text-left font-fredoka'}`}>
                {isLiveActive ? (
                  <div className="space-y-6">
                    <p className="text-pink-600 animate-pulse">{teachingMode === TeachingMode.ENGLISH_ONLY ? "I'm listening, sweetie!" : "أنا سامعاك يا روحي.. قولي أي حاجة!"}</p>
                    <p className="text-2xl md:text-3xl text-gray-400 font-normal">{teachingMode === TeachingMode.ENGLISH_ONLY ? "Ask me anything about the lesson or just talk!" : "يمكنك الآن سؤال ميس سمارت عن الدرس أو التحدث معها بحرية."}</p>
                  </div>
                ) : (script as any)[steps[step].key]}
              </div>

              <div className="mt-10 flex gap-6 md:gap-10">
                <button disabled={step === 0} onClick={() => setStep(s => s - 1)} className={`flex-1 py-6 md:py-8 rounded-[40px] font-black text-2xl md:text-3xl border-b-8 border-black/10 active:border-b-0 transition-all ${step === 0 ? 'bg-gray-50 text-gray-200' : 'bg-gray-200 text-gray-700 shadow-xl active:translate-y-2'}`}>
                  {teachingMode === TeachingMode.ENGLISH_ONLY ? "Back" : "رجوع"}
                </button>
                <button onClick={nextStep} className="flex-[2] py-6 md:py-8 rounded-[40px] font-black text-3xl md:text-4xl lg:text-5xl bg-pink-500 text-white shadow-[0_12px_0_#be185d] border-b-4 border-pink-700 active:border-b-0 active:translate-y-4 hover:brightness-110 transition-all">
                  {step < steps.length - 1 ? (teachingMode === TeachingMode.ENGLISH_ONLY ? 'Next! ➔' : 'اللي بعده! ➔') : (teachingMode === TeachingMode.ENGLISH_ONLY ? "Finish! 🏁" : 'خلصنا! 🏁')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-16 md:py-24 bg-white/40 border-t-8 border-pink-50 relative">
        <div className="flex justify-center gap-10 text-5xl text-purple-200 mb-8">
          <i className="fas fa-rocket animate-bounce delay-100"></i>
          <i className="fas fa-cloud animate-pulse delay-500"></i>
          <i className="fas fa-rainbow animate-bounce delay-1000"></i>
        </div>
        <p className="text-3xl md:text-4xl font-black text-pink-400 font-fredoka">Made for Champions ❤️ Egypt</p>
      </footer>
    </div>
  );
};

export default App;
