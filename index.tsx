import React, { useState, useEffect, useRef } from 'react';
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
  Lightbulb
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const [view, setView] = useState<'home' | 'study' | 'quiz' | 'ai'>('home');
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [stars, setStars] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => { setView('home'); setSelectedNum(null); }}
        >
          <div className="bg-yellow-400 p-2 rounded-xl shadow-lg">
            <Rocket className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-kuaile text-blue-600 tracking-wider">乘法小宇宙</h1>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 border-2 border-yellow-200">
          <Trophy className="text-yellow-500 w-5 h-5" />
          <span className="font-bold text-blue-500 text-lg">{stars}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[60vh]">
        {view === 'home' && <HomeView onSelect={(n) => { setSelectedNum(n); setView('study'); }} />}
        {view === 'study' && selectedNum && (
          <StudyView 
            num={selectedNum} 
            onBack={() => setView('home')} 
            onQuiz={() => setView('quiz')} 
          />
        )}
        {view === 'quiz' && selectedNum && (
          <QuizView 
            num={selectedNum} 
            onBack={() => setView('study')} 
            onWin={(s) => { setStars(prev => prev + s); setView('home'); }} 
          />
        )}
        {view === 'ai' && <AIView onBack={() => setView('home')} />}
      </main>

      {/* Floating AI Button */}
      {view !== 'ai' && (
        <button 
          onClick={() => setView('ai')}
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
const QuizView = ({ num, onBack, onWin }: { num: number; onBack: () => void; onWin: (s: number) => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [score, setScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer) return;

    const correct = parseInt(userAnswer) === num * currentStep;
    if (correct) {
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
const AIView = ({ onBack }: { onBack: () => void }) => {
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