import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Sparkles, 
  Trophy, 
  BookOpen, 
  MessageCircle, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Rocket,
  Lightbulb,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// -------------------------------------------------------------------
// 音效资源
// -------------------------------------------------------------------
const SOUND_URLS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  magic: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
};

// -------------------------------------------------------------------
// 数据定义
// -------------------------------------------------------------------

const COLORS = [
  'bg-pink-400', 'bg-orange-400', 'bg-yellow-400', 
  'bg-green-400', 'bg-teal-400', 'bg-blue-400', 
  'bg-indigo-400', 'bg-purple-400', 'bg-rose-400'
];

// -------------------------------------------------------------------
// 组件
// -------------------------------------------------------------------

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [view, setView] = useState<'home' | 'study' | 'quiz' | 'ai'>('home');
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // 预加载音效对象
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // 初始化并预加载所有音效
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });
  }, []);

  const playSound = (type: keyof typeof SOUND_URLS) => {
    if (isMuted || !hasStarted) return;
    const audio = audioRefs.current[type];
    if (audio) {
      // 重置播放位置以允许连续点击
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn(`音频播放失败 (${type}):`, err);
      });
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    // 在用户点击时立即播放一个静音/极短的声音来“解锁”浏览器的音频策略
    playSound('click');
  };

  const handleNavigate = (newView: typeof view, num?: number) => {
    playSound('click');
    setView(newView);
    if (num !== undefined) setSelectedNum(num);
  };

  // 如果还没开始，显示启动页
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-blue-500 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-white/20 p-8 rounded-full mb-8 animate-bounce">
          <Rocket size={100} className="text-yellow-300" />
        </div>
        <h1 className="text-5xl font-kuaile mb-4">欢迎来到乘法小宇宙</h1>
        <p className="text-xl mb-12 opacity-90">准备好开启你的数字冒险了吗？</p>
        <button 
          onClick={handleStart}
          className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 text-2xl font-bold px-12 py-6 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center gap-4"
        >
          <Play size={32} fill="currentColor" />
          点击进入
        </button>
        <p className="mt-8 text-sm opacity-60">点击进入后将自动开启声音效果</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => handleNavigate('home')}
        >
          <div className="bg-yellow-400 p-2 rounded-xl shadow-lg">
            <Rocket className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-kuaile text-blue-600 tracking-wider">乘法小宇宙</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) playSound('click'); // 取消静音时给个反馈
            }}
            className="p-2 rounded-full bg-white shadow-md text-blue-500 hover:bg-blue-50 transition-colors"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <div className="bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 border-2 border-yellow-200">
            <Trophy className="text-yellow-500 w-5 h-5" />
            <span className="font-bold text-blue-500 text-lg">{stars}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[60vh]">
        {view === 'home' && <HomeView onSelect={(n) => handleNavigate('study', n)} />}
        {view === 'study' && selectedNum && (
          <StudyView 
            num={selectedNum} 
            onBack={() => handleNavigate('home')} 
            onQuiz={() => handleNavigate('quiz')} 
          />
        )}
        {view === 'quiz' && selectedNum && (
          <QuizView 
            num={selectedNum} 
            playSound={playSound}
            onBack={() => handleNavigate('study')} 
            onWin={(s) => { 
              playSound('win');
              setStars(prev => prev + s); 
              setView('home'); 
            }} 
          />
        )}
        {view === 'ai' && <AIView playSound={playSound} onBack={() => handleNavigate('home')} />}
      </main>

      {/* Floating AI Button */}
      {view !== 'ai' && (
        <button 
          onClick={() => handleNavigate('ai')}
          className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center gap-2"
        >
          <MessageCircle size={28} />
          <span className="hidden md:inline font-bold">数学小精灵</span>
        </button>
      )}
    </div>
  );
};

// --- 首页视图 ---
const HomeView = ({ onSelect }: { onSelect: (n: number) => void }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bounce-in">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
      <button
        key={num}
        onClick={() => onSelect(num)}
        className={`${COLORS[i]} hover:brightness-105 transition-all p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-white border-b-8 border-black/20`}
      >
        <span className="text-6xl font-kuaile mb-2">{num}</span>
        <span className="text-xl font-bold opacity-80">{num} 的口诀</span>
      </button>
    ))}
  </div>
);

// --- 学习视图 ---
const StudyView = ({ num, onBack, onQuiz }: { num: number; onBack: () => void; onQuiz: () => void }) => {
  return (
    <div className="bounce-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
          <ArrowLeft size={20} /> 返回星系
        </button>
        <button 
          onClick={onQuiz}
          className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 flex items-center gap-2"
        >
          <Sparkles size={20} /> 开始挑战！
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-100">
        <h2 className="text-3xl font-kuaile text-center mb-8 text-blue-600 underline underline-offset-8 decoration-yellow-400">
          跟我读：{num} 的乘法表
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-blue-200 transition-colors group">
              <div className="text-2xl font-bold text-slate-700">
                <span className="text-blue-500">{num}</span> × {i} = <span className="text-orange-500">{num * i}</span>
              </div>
              <div className="flex flex-wrap max-w-[120px] justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                {Array.from({ length: i }).map((_, idx) => (
                  <span key={idx} className="text-lg">⭐</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 测试视图 ---
const QuizView = ({ num, onBack, onWin, playSound }: { num: number; onBack: () => void; onWin: (s: number) => void; playSound: (t: keyof typeof SOUND_URLS) => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [score, setScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer) return;

    const correct = parseInt(userAnswer) === num * currentStep;
    if (correct) {
      playSound('correct');
      setFeedback('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        if (currentStep < 9) {
          setCurrentStep(s => s + 1);
          setUserAnswer('');
          setFeedback('none');
        } else {
          onWin(score + 1);
        }
      }, 1000);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 1500);
    }
  };

  return (
    <div className="max-w-md mx-auto bounce-in">
      <div className="text-center mb-8">
        <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
          <div 
            className="bg-green-400 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${(currentStep / 9) * 100}%` }}
          ></div>
        </div>
        <p className="text-slate-500 font-bold">第 {currentStep} / 9 题</p>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-2xl text-center relative overflow-hidden">
        {feedback === 'correct' && (
          <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center text-white z-10 animate-pulse">
            <CheckCircle2 size={80} />
          </div>
        )}
        {feedback === 'wrong' && (
          <div className="absolute inset-0 bg-rose-500/90 flex items-center justify-center text-white z-10">
            <XCircle size={80} />
          </div>
        )}

        <h3 className="text-5xl font-kuaile mb-10 text-slate-700">
          {num} × {currentStep} = ?
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            autoFocus
            className="text-4xl text-center p-4 border-4 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="填入答案"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white py-4 rounded-2xl text-2xl font-bold shadow-lg hover:bg-blue-600 active:transform active:scale-95 transition-all"
          >
            检查一下
          </button>
        </form>
      </div>
      
      <button onClick={onBack} className="mt-8 text-slate-400 w-full hover:underline font-bold">
        我还要再练练，先退出
      </button>
    </div>
  );
};

// --- AI 助教视图 ---
const AIView = ({ onBack, playSound }: { onBack: () => void; playSound: (t: keyof typeof SOUND_URLS) => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '你好呀！我是乘法小精灵 ✨ 想知道关于乘法的什么小秘密吗？比如“为什么 2x3 等于 6”？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const askAI = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    playSound('click');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
          systemInstruction: "你是一个专门为6-10岁儿童设计的数学助教‘乘法小精灵’。你的回答要充满童趣，使用生动的比喻（比如用苹果、糖果、星星做例子）。解释要简单明了，字数控制在100字以内。要经常夸奖孩子。",
        }
      });
      playSound('magic');
      setMessages(prev => [...prev, { role: 'ai', text: response.text || '哎呀，小精灵刚才开小差了，再问我一次好吗？' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '网络星球有点拥挤，稍等一下再问我吧！' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-3xl shadow-2xl border-4 border-blue-100 overflow-hidden bounce-in">
      <div className="bg-blue-500 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-full"><Lightbulb size={20} /></div>
          <span className="font-bold text-lg">数学小精灵在线中...</span>
        </div>
        <button onClick={onBack} className="text-white/80 hover:text-white"><ArrowLeft size={24} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              m.role === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border p-4 rounded-2xl animate-pulse text-slate-400">小精灵正在思考中...</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && askAI()}
          placeholder="例如：3x4 怎么记？"
          className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
        />
        <button 
          onClick={askAI}
          disabled={loading}
          className="bg-blue-500 text-white px-6 rounded-xl font-bold disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
