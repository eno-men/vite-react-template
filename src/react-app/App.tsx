// src/App.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Mic,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Skull,
  Stethoscope,
  Music,
  RefreshCw,
  Zap,
  Star,
  BarChart2,
  VolumeX,
  Home,
  Play,
  Heart,
  Search,
  Sun,
  Moon,
  Timer,
  List,
  Award,
  Flame,
  Target,
  X,
  ArrowLeft,
  ArrowRight,
  Wind,
  Repeat2,
} from "lucide-react";
import { TEKERLEMELER_DATA } from "@/data/tekerlemeler";

type Screen = "menu" | "game" | "summary" | "stats" | "browse" | "timed-summary";
type GameMode = "mistakes" | "category" | "all" | "favorites" | "timed" | "hardest";

interface Stats {
  totalCorrect: number;
  totalWrong: number;
  bestStreak: number;
  sessionsPlayed: number;
  timedBestScore: number;
}

const STORAGE_KEYS = {
  mistakes: "diksiyon_mistakes",
  completed: "diksiyon_completed",
  stats: "diksiyon_stats",
  favorites: "diksiyon_favorites",
  theme: "diksiyon_theme",
  attemptStats: "diksiyon_attempt_stats",
};

interface AttemptEntry { attempts: number; mistakes: number; }
type AttemptStats = Record<number, AttemptEntry>;

/** Returns a 0–1 personal difficulty score. Higher = harder for this user.
 *  Items with no attempts return -1 (unknown). */
function getPersonalScore(id: number, as: AttemptStats): number {
  const s = as[id];
  if (!s || s.attempts === 0) return -1;
  const rate = s.mistakes / s.attempts;
  const confidence = Math.min(1, s.attempts / 3); // ramps up over 3 attempts
  return rate * confidence;
}

function getPersonalScoreLabel(score: number): { label: string; cls: string } {
  if (score < 0) return { label: "Yeni", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  if (score < 0.2) return { label: "Kolay benim için", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" };
  if (score < 0.5) return { label: "Orta benim için", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" };
  if (score < 0.75) return { label: "Zor benim için", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" };
  return { label: "Çok zor benim için", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-bold" };
}

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

function speakText(text: string, onEnd?: () => void) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function getCategoryIcon(cat: string, className = "w-4 h-4") {
  if (cat.includes("Tıbbi")) return <Stethoscope className={className} />;
  if (cat.includes("Vurgu")) return <Music className={className} />;
  if (cat.includes("Efsanevi")) return <Skull className={className} />;
  if (cat.includes("Dil Kıran")) return <Zap className={className} />;
  if (cat.includes("Radyocu")) return <Mic className={className} />;
  if (cat.includes("Dudak")) return <Wind className={className} />;
  if (cat.includes("Islıklı")) return <Sparkles className={className} />;
  if (cat.includes("Ucu") || cat.includes("Gırtlak")) return <Target className={className} />;
  return <BookOpen className={className} />;
}

function getCategoryColor(cat: string) {
  if (cat.includes("Tıbbi")) return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", bar: "from-emerald-400 to-emerald-600", accent: "border-l-emerald-400" };
  if (cat.includes("Vurgu")) return { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", bar: "from-pink-400 to-pink-600", accent: "border-l-pink-400" };
  if (cat.includes("Efsanevi")) return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", bar: "from-red-400 to-red-600", accent: "border-l-red-400" };
  if (cat.includes("Dil Kıran")) return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", bar: "from-orange-400 to-orange-600", accent: "border-l-orange-400" };
  if (cat.includes("Radyocu")) return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", bar: "from-indigo-400 to-indigo-600", accent: "border-l-indigo-400" };
  if (cat.includes("Dudak")) return { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", bar: "from-violet-400 to-violet-600", accent: "border-l-violet-400" };
  if (cat.includes("Islıklı")) return { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", bar: "from-sky-400 to-sky-600", accent: "border-l-sky-400" };
  return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", bar: "from-slate-400 to-slate-600", accent: "border-l-slate-400" };
}

function getDifficultyBadge(diff: string) {
  const map: Record<string, string> = {
    Kolay: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    Orta: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    Zor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    "Çok Zor": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    İmkansız: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 animate-pulse",
    "Dil Kıran": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    Anatomi: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
    Klinik: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    Fizyoloji: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
    Farmakoloji: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
    Patoloji: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
    Duygu: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
    Edebi: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  };
  return map[diff] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

const ACHIEVEMENTS = [
  { id: "first_correct", label: "İlk Adım", desc: "İlk doğru okumayı yaptın", icon: <Star className="w-5 h-5" />, color: "text-yellow-500", check: (s: Stats) => s.totalCorrect >= 1 },
  { id: "streak_5", label: "Ateşli", desc: "5 ardışık doğru okuma", icon: <Flame className="w-5 h-5" />, color: "text-orange-500", check: (s: Stats) => s.bestStreak >= 5 },
  { id: "streak_10", label: "Durdurulamaz", desc: "10 ardışık doğru okuma", icon: <Zap className="w-5 h-5" />, color: "text-yellow-500", check: (s: Stats) => s.bestStreak >= 10 },
  { id: "sessions_5", label: "Düzenli", desc: "5 seans tamamladın", icon: <Trophy className="w-5 h-5" />, color: "text-indigo-500", check: (s: Stats) => s.sessionsPlayed >= 5 },
  { id: "correct_50", label: "Elli Ustası", desc: "50 doğru okuma", icon: <Award className="w-5 h-5" />, color: "text-blue-500", check: (s: Stats) => s.totalCorrect >= 50 },
  { id: "correct_100", label: "Yüz Ustası", desc: "100 doğru okuma", icon: <Trophy className="w-5 h-5" />, color: "text-purple-500", check: (s: Stats) => s.totalCorrect >= 100 },
  { id: "timed_10", label: "Hızlı Dil", desc: "Zamanlı modda 10 puan", icon: <Timer className="w-5 h-5" />, color: "text-green-500", check: (s: Stats) => s.timedBestScore >= 10 },
  { id: "timed_20", label: "Şimşek Dil", desc: "Zamanlı modda 20 puan", icon: <Zap className="w-5 h-5" />, color: "text-cyan-500", check: (s: Stats) => s.timedBestScore >= 20 },
];

const TIMED_SECONDS = 60;

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [mistakes, setMistakes] = useLocalStorage<number[]>(STORAGE_KEYS.mistakes, []);
  const [completed, setCompleted] = useLocalStorage<number[]>(STORAGE_KEYS.completed, []);
  const [favorites, setFavorites] = useLocalStorage<number[]>(STORAGE_KEYS.favorites, []);
  const [stats, setStats] = useLocalStorage<Stats>(STORAGE_KEYS.stats, {
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
    sessionsPlayed: 0,
    timedBestScore: 0,
  });
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(STORAGE_KEYS.theme, false);
  const [attemptStats, setAttemptStats] = useLocalStorage<AttemptStats>(STORAGE_KEYS.attemptStats, {});

  const [queue, setQueue] = useState<typeof TEKERLEMELER_DATA>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeCategoryName, setActiveCategoryName] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fontLarge, setFontLarge] = useState(false);

  // Timed mode state
  const [timedTimeLeft, setTimedTimeLeft] = useState(TIMED_SECONDS);
  const [timedScore, setTimedScore] = useState(0);
  const [timedRunning, setTimedRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Waveform visualizer
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(28).fill(0));

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const categories = useMemo(() => {
    const cats: Record<string, typeof TEKERLEMELER_DATA> = {};
    TEKERLEMELER_DATA.forEach((t) => {
      if (!cats[t.category]) cats[t.category] = [];
      cats[t.category].push(t);
    });
    return cats;
  }, []);

  const totalItems = TEKERLEMELER_DATA.length;
  const progressPercent = Math.round((completed.length / totalItems) * 100);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, [setFavorites]);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    analyserRef.current = null;
    setWaveformBars(Array(28).fill(0));
  }, []);

  const clearRecording = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    stopWaveform();
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlayingBack(false);
    setRecordingDuration(0);
  }, [stopWaveform]);

  const startGame = useCallback((mode: GameMode, category?: string) => {
    let newQueue: typeof TEKERLEMELER_DATA = [];
    stopSpeaking();
    setIsSpeaking(false);

    if (mode === "mistakes") {
      newQueue = mistakes.map((id) => TEKERLEMELER_DATA.find((t) => t.id === id)).filter(Boolean) as typeof TEKERLEMELER_DATA;
      setActiveCategoryName("Hata Tekrarı");
    } else if (mode === "category" && category) {
      const pool = TEKERLEMELER_DATA.filter((t) => t.category === category);
      newQueue = pool.filter((t) => !completed.includes(t.id));
      setActiveCategoryName(category);
    } else if (mode === "favorites") {
      newQueue = favorites.map((id) => TEKERLEMELER_DATA.find((t) => t.id === id)).filter(Boolean) as typeof TEKERLEMELER_DATA;
      setActiveCategoryName("Favorilerim");
    } else if (mode === "hardest") {
      // Sort by personal difficulty desc — items with score ≥ 0 first (hardest first),
      // then unknown items, skip ones scored 0 and completed unless the pool is tiny.
      const scored = TEKERLEMELER_DATA
        .map((t) => ({ t, score: getPersonalScore(t.id, attemptStats) }))
        .filter(({ score }) => score > 0) // only items the user has struggled with
        .sort((a, b) => b.score - a.score)
        .map(({ t }) => t);
      // Fill up to 30 with unscored items if needed
      const unseen = TEKERLEMELER_DATA.filter((t) => getPersonalScore(t.id, attemptStats) < 0)
        .sort(() => Math.random() - 0.5);
      newQueue = [...scored, ...unseen].slice(0, 30);
      setActiveCategoryName("Kişisel En Zor");
    } else if (mode === "timed") {
      newQueue = [...TEKERLEMELER_DATA].sort(() => Math.random() - 0.5);
      setActiveCategoryName("Zamanlı Meydan Okuma");
      setTimedTimeLeft(TIMED_SECONDS);
      setTimedScore(0);
      setTimedRunning(false);
    } else {
      // Karma: interleave hard personal items with unseen ones
      const hardUnseen = TEKERLEMELER_DATA
        .filter((t) => !completed.includes(t.id))
        .map((t) => ({ t, score: getPersonalScore(t.id, attemptStats) }))
        .sort((a, b) => {
          // Unknown items (-1) treated as medium (0.3) so they mix in naturally
          const sa = a.score < 0 ? 0.3 : a.score;
          const sb = b.score < 0 ? 0.3 : b.score;
          return sb - sa + (Math.random() - 0.5) * 0.15; // sort by score + small shuffle
        })
        .map(({ t }) => t)
        .slice(0, 30);
      newQueue = hardUnseen;
      setActiveCategoryName("Karma Egzersiz");
    }

    if (newQueue.length === 0) return;

    setQueue(newQueue);
    setCurrentIndex(0);
    setFeedback(null);
    setSessionCorrect(0);
    setSessionWrong(0);
    setStreak(0);
    setGameMode(mode);
    clearRecording();
    setScreen("game");
  }, [mistakes, completed, favorites, clearRecording]);

  // Timed mode countdown
  useEffect(() => {
    if (gameMode === "timed" && timedRunning) {
      timerRef.current = setInterval(() => {
        setTimedTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setTimedRunning(false);
            setStats((prev) => ({
              ...prev,
              timedBestScore: Math.max(prev.timedBestScore, timedScore + (feedback === "correct" ? 0 : 0)),
              sessionsPlayed: prev.sessionsPlayed + 1,
            }));
            setScreen("timed-summary");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timedRunning, gameMode]);

  const startTimedCountdown = useCallback(() => {
    setTimedRunning(true);
  }, []);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (feedback) return;
    const item = queue[currentIndex];
    setFeedback(isCorrect ? "correct" : "wrong");
    stopSpeaking();
    setIsSpeaking(false);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);

    // Always track attempt stats for every answer in any mode
    setAttemptStats((prev) => {
      const cur = prev[item.id] || { attempts: 0, mistakes: 0 };
      return { ...prev, [item.id]: { attempts: cur.attempts + 1, mistakes: isCorrect ? cur.mistakes : cur.mistakes + 1 } };
    });

    if (gameMode === "timed") {
      if (isCorrect) setTimedScore((s) => s + 1);
      setStats((prev) => ({
        ...prev,
        totalCorrect: isCorrect ? prev.totalCorrect + 1 : prev.totalCorrect,
        totalWrong: isCorrect ? prev.totalWrong : prev.totalWrong + 1,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        timedBestScore: prev.timedBestScore,
      }));
      setTimeout(() => {
        if (currentIndex < queue.length - 1) {
          setCurrentIndex((p) => p + 1);
          setFeedback(null);
          clearRecording();
        }
      }, 400);
      return;
    }

    if (isCorrect) {
      setSessionCorrect((p) => p + 1);
      setCompleted((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      setMistakes((prev) => prev.filter((id) => id !== item.id));
    } else {
      setSessionWrong((p) => p + 1);
      setMistakes((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    }

    setStats((prev) => ({
      ...prev,
      totalCorrect: isCorrect ? prev.totalCorrect + 1 : prev.totalCorrect,
      totalWrong: isCorrect ? prev.totalWrong : prev.totalWrong + 1,
      bestStreak: Math.max(prev.bestStreak, newStreak),
    }));

    setTimeout(() => {
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((p) => p + 1);
        setFeedback(null);
        clearRecording();
      } else {
        setStats((prev) => ({ ...prev, sessionsPlayed: prev.sessionsPlayed + 1 }));
        setScreen("summary");
      }
    }, 500);
  }, [feedback, queue, currentIndex, streak, gameMode, clearRecording, setCompleted, setMistakes, setStats]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
      setFeedback(null);
      stopSpeaking();
      setIsSpeaking(false);
      clearRecording();
    }
  }, [currentIndex, clearRecording]);

  const handleSpeak = useCallback((text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, () => setIsSpeaking(false));
    }
  }, [isSpeaking]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);

      // Wire up Web Audio analyser for live waveform
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount; // 32
        const dataArray = new Uint8Array(bufferLength);
        const BAR_COUNT = 28;
        const drawLoop = () => {
          analyser.getByteFrequencyData(dataArray);
          const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
            const idx = Math.floor((i / BAR_COUNT) * bufferLength * 0.8); // use lower 80% of spectrum
            const raw = dataArray[idx] / 255;
            return Math.round(Math.max(0.04, raw) * 100);
          });
          setWaveformBars(bars);
          animFrameRef.current = requestAnimationFrame(drawLoop);
        };
        drawLoop();
      } catch {
        // Visualiser unavailable — recording still works
      }
    } catch {
      alert("Mikrofon erişimi reddedildi. Tarayıcı izinlerini kontrol edin.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      // Stop the animation loop but keep audioCtx open until clearRecording
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      setWaveformBars(Array(28).fill(0));
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (!audioUrl) return;
    if (isPlayingBack) {
      audioRef.current?.pause();
      setIsPlayingBack(false);
      return;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlayingBack(false);
    audio.play();
    setIsPlayingBack(true);
  }, [audioUrl, isPlayingBack]);

  const resetProgress = useCallback(() => {
    if (confirm("Tüm ilerlemeniz (doğrular, hatalar, kişisel zorluk verileri ve istatistikler) sıfırlanacak. Emin misiniz?")) {
      setCompleted([]);
      setMistakes([]);
      setAttemptStats({});
      setStats({ totalCorrect: 0, totalWrong: 0, bestStreak: 0, sessionsPlayed: 0, timedBestScore: 0 });
    }
  }, [setCompleted, setMistakes, setAttemptStats, setStats]);

  const filteredForBrowse = useMemo(() => {
    if (!searchQuery.trim()) return TEKERLEMELER_DATA;
    const q = searchQuery.toLowerCase();
    return TEKERLEMELER_DATA.filter(
      (t) => t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.difficulty.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ─── MENU SCREEN ──────────────────────────────────────────────────────────────
  const MenuScreen = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-indigo-700 px-5 pt-8 pb-6 text-white">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mic className="w-4 h-4 text-indigo-200" />
              <span className="text-indigo-200 text-[11px] font-semibold uppercase tracking-widest">Diksiyon Lab</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Tekerleme Ustası</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{totalItems} tekerleme · Akıllı tekrar sistemi</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button data-testid="btn-browse" onClick={() => setScreen("browse")} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Tümüne Bak">
              <List className="w-4 h-4" />
            </button>
            <button data-testid="btn-stats" onClick={() => setScreen("stats")} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="İstatistikler">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button data-testid="btn-darkmode" onClick={() => setDarkMode((d) => !d)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Karanlık Mod">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button data-testid="btn-reset" onClick={resetProgress} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Sıfırla">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-indigo-200 mb-1.5">
            <span>Genel İlerleme</span>
            <span>{completed.length} / {totalItems} tamamlandı</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div className="bg-white h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="text-right text-[11px] font-bold text-white/70 mt-1">%{progressPercent}</div>
        </div>
      </div>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-4 pb-2">
        <button data-testid="btn-smart-mix" onClick={() => startGame("all")} className="flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-md">
          <div className="p-1.5 bg-white/20 rounded-lg"><Sparkles className="w-4 h-4" /></div>
          <span className="font-bold text-sm">Karma Egzersiz</span>
          <span className="text-[11px] text-indigo-200">30 rastgele kart</span>
        </button>

        <button data-testid="btn-timed" onClick={() => startGame("timed")} className="flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all shadow-md">
          <div className="p-1.5 bg-white/20 rounded-lg"><Timer className="w-4 h-4" /></div>
          <span className="font-bold text-sm">60 Saniye</span>
          <span className="text-[11px] text-amber-100">Rekor: {stats.timedBestScore}</span>
        </button>

        <button data-testid="btn-mistakes" onClick={() => mistakes.length > 0 && startGame("mistakes")} disabled={mistakes.length === 0}
          className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl transition-all active:scale-95 shadow-md ${mistakes.length > 0 ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"}`}>
          <div className={`p-1.5 rounded-lg ${mistakes.length > 0 ? "bg-white/20" : "bg-border"}`}><RotateCcw className="w-4 h-4" /></div>
          <span className="font-bold text-sm">Hata Havuzu</span>
          <span className={`text-[11px] ${mistakes.length > 0 ? "text-rose-200" : ""}`}>{mistakes.length} tekerleme</span>
        </button>

        <button data-testid="btn-favorites" onClick={() => favorites.length > 0 && startGame("favorites")} disabled={favorites.length === 0}
          className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl transition-all active:scale-95 shadow-md ${favorites.length > 0 ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"}`}>
          <div className={`p-1.5 rounded-lg ${favorites.length > 0 ? "bg-white/20" : "bg-border"}`}><Heart className="w-4 h-4" /></div>
          <span className="font-bold text-sm">Favorilerim</span>
          <span className={`text-[11px] ${favorites.length > 0 ? "text-pink-200" : ""}`}>{favorites.length} tekerleme</span>
        </button>

        {/* Kişisel En Zor — full width row */}
        {(() => {
          const hardCount = Object.values(attemptStats).filter((e) => e.attempts > 0 && e.mistakes / e.attempts > 0.3).length;
          const hasData = hardCount > 0;
          return (
            <button
              data-testid="btn-hardest"
              onClick={() => hasData && startGame("hardest")}
              disabled={!hasData}
              className={`col-span-2 flex items-center justify-between gap-3 p-4 rounded-2xl transition-all active:scale-95 shadow-md ${hasData ? "bg-gradient-to-r from-red-600 to-purple-700 text-white hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${hasData ? "bg-white/15" : "bg-border"}`}>
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Kişisel En Zor</div>
                  <div className={`text-[11px] ${hasData ? "text-red-200" : ""}`}>
                    {hasData ? `${hardCount} zorlu tekerleme sıralandı` : "Önce biraz pratik yapın"}
                  </div>
                </div>
              </div>
              {hasData && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">
                  <Zap className="w-3 h-3" /> Akıllı sıralama
                </div>
              )}
            </button>
          );
        })()}
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6 space-y-2.5">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pt-3 pb-1">
          Kategoriler ({Object.keys(categories).length})
        </h2>
        {Object.keys(categories).map((cat) => {
          const totalInCat = categories[cat].length;
          const completedInCat = categories[cat].filter((t) => completed.includes(t.id)).length;
          const isFinished = totalInCat === completedInCat;
          const colors = getCategoryColor(cat);
          const pct = Math.round((completedInCat / totalInCat) * 100);
          return (
            <button key={cat} data-testid={`cat-${cat.replace(/[\s💀🔥]/g, "-")}`}
              onClick={() => !isFinished && startGame("category", cat)} disabled={isFinished}
              className={`w-full p-4 rounded-2xl border-l-4 text-left transition-all group ${isFinished ? "bg-muted/50 border-l-border opacity-60 cursor-default" : `bg-card border border-border hover:shadow-md hover:border-primary/30 ${colors.accent}`}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{getCategoryIcon(cat)}</div>
                  <div>
                    <span className={`block font-semibold text-sm ${isFinished ? "text-muted-foreground" : "text-foreground group-hover:text-primary transition-colors"}`}>{cat}</span>
                    <span className="text-[11px] text-muted-foreground">{isFinished ? "Tamamlandı" : `${totalInCat - completedInCat} kart kaldı`}</span>
                  </div>
                </div>
                {isFinished ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{completedInCat}/{totalInCat}</span>
                <span className="text-[10px] text-muted-foreground">%{pct}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── GAME SCREEN ──────────────────────────────────────────────────────────────
  const GameScreen = () => {
    const item = queue[currentIndex];
    if (!item) return null;
    const colors = getCategoryColor(item.category);
    const isFav = favorites.includes(item.id);
    const isTimedMode = gameMode === "timed";
    const timerPct = (timedTimeLeft / TIMED_SECONDS) * 100;
    const timerColor = timedTimeLeft > 20 ? "bg-emerald-500" : timedTimeLeft > 10 ? "bg-amber-500" : "bg-rose-500";

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button data-testid="btn-exit-game" onClick={() => { stopSpeaking(); if (timerRef.current) clearInterval(timerRef.current); setScreen("menu"); }}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Menü
          </button>
          <div className="text-center">
            <div className="text-[11px] font-semibold text-muted-foreground truncate max-w-[140px]">{activeCategoryName}</div>
            {isTimedMode ? (
              <div className={`text-lg font-black tabular-nums ${timedTimeLeft <= 10 ? "text-rose-500 animate-pulse" : "text-foreground"}`}>
                {timedTimeLeft}s
              </div>
            ) : (
              <div className="text-sm font-bold text-primary">{currentIndex + 1} / {queue.length}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {streak >= 3 && (
              <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[11px] font-bold">
                <Flame className="w-3 h-3" /> {streak}
              </div>
            )}
            {isTimedMode && !timedRunning && timedTimeLeft === TIMED_SECONDS && (
              <span className="text-[11px] text-muted-foreground">Başlamak için oyna</span>
            )}
          </div>
        </div>

        {/* Timer bar */}
        {isTimedMode && (
          <div className="h-2 bg-muted">
            <div className={`h-2 ${timerColor} transition-all duration-1000`} style={{ width: `${timerPct}%` }} />
          </div>
        )}
        {/* Progress bar (non-timed) */}
        {!isTimedMode && (
          <div className="h-1 bg-muted">
            <div className="h-1 bg-gradient-to-r from-primary to-indigo-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
          </div>
        )}

        {/* Timed score strip */}
        {isTimedMode && (
          <div className="flex items-center justify-between px-5 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Puan: <span className="text-lg font-black">{timedScore}</span></span>
            {!timedRunning && timedTimeLeft === TIMED_SECONDS && (
              <button onClick={startTimedCountdown} className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-amber-600 transition-colors">
                <Play className="w-3 h-3" /> Başlat
              </button>
            )}
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Rekor: {stats.timedBestScore}</span>
          </div>
        )}

        {/* Card area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Feedback overlay */}
          {feedback && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none ${feedback === "correct" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
              <div className={`flex flex-col items-center gap-2 p-6 rounded-3xl shadow-xl ${feedback === "correct" ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"}`}>
                {feedback === "correct" ? (
                  <><CheckCircle2 className="w-14 h-14" /><span className="font-bold text-lg">Harika!</span>{!isTimedMode && <span className="text-sm opacity-70">Arşive kaldırıldı</span>}</>
                ) : (
                  <><XCircle className="w-14 h-14" /><span className="font-bold text-lg">Tekrar et!</span>{!isTimedMode && <span className="text-sm opacity-70">Hata listesine eklendi</span>}</>
                )}
              </div>
            </div>
          )}

          {/* Card */}
          <div className="w-full max-w-xl bg-card rounded-3xl border border-border shadow-lg overflow-hidden flex flex-col">
            {/* Badges row */}
            {(() => {
              const pScore = getPersonalScore(item.id, attemptStats);
              const { label: pLabel, cls: pCls } = getPersonalScoreLabel(pScore);
              const aEntry = attemptStats[item.id];
              return (
                <div className="px-5 pt-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {getCategoryIcon(item.category)}
                      <span className="hidden sm:inline">{item.category}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getDifficultyBadge(item.difficulty)}`}>{item.difficulty}</span>
                      <button data-testid={`btn-fav-${item.id}`} onClick={() => toggleFavorite(item.id)}
                        className={`p-1.5 rounded-full transition-all ${isFav ? "text-pink-500 bg-pink-50 dark:bg-pink-900/30" : "text-muted-foreground hover:text-pink-500"}`}>
                        <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>
                  {/* Personal difficulty row */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pCls}`}>
                      <Target className="w-2.5 h-2.5" /> {pLabel}
                    </span>
                    {aEntry && aEntry.attempts > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {aEntry.attempts} deneme · {aEntry.mistakes} hata
                        {aEntry.attempts >= 3 && (
                          <span className="ml-1 font-semibold text-foreground">
                            ({Math.round((aEntry.mistakes / aEntry.attempts) * 100)}% hata oranı)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Text */}
            <div className="flex-1 flex items-center justify-center px-6 py-5 min-h-44">
              <p className={`text-center font-serif text-foreground leading-relaxed transition-all cursor-pointer ${fontLarge ? "text-2xl sm:text-3xl" : item.text.length > 250 ? "text-base sm:text-lg" : item.text.length > 120 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
                onClick={() => setFontLarge((f) => !f)}>
                &ldquo;{item.text}&rdquo;
              </p>
            </div>

            {/* Recording strip */}
            <div className="mx-5 mb-4 rounded-2xl border border-border bg-muted/30 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Mic className="w-3 h-3" /> Sesini Kaydet
                </span>
                {audioUrl && !isRecording && (
                  <button onClick={clearRecording} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                    <X className="w-3 h-3" /> Sil
                  </button>
                )}
              </div>

              {/* Controls row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Record / Stop button */}
                {!isRecording ? (
                  <button data-testid="btn-record" onClick={startRecording}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${audioUrl ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50" : "bg-rose-500 text-white hover:bg-rose-600 active:scale-95 shadow-sm"}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-current inline-block flex-shrink-0" />
                    {audioUrl ? "Yeniden Kaydet" : "Kaydı Başlat"}
                  </button>
                ) : (
                  <button data-testid="btn-stop-record" onClick={stopRecording}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:opacity-90 active:scale-95 shadow-sm transition-all animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-sm bg-current inline-block flex-shrink-0" />
                    Durdur {recordingDuration > 0 && `(${recordingDuration}s)`}
                  </button>
                )}

                {/* Live waveform visualizer */}
                {isRecording && (
                  <div className="flex items-end gap-[2px] h-8 flex-1 px-1">
                    {waveformBars.map((h, i) => {
                      const hPct = Math.max(4, h);
                      const opacity = 0.5 + (hPct / 100) * 0.5;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-full transition-all duration-75"
                          style={{
                            height: `${hPct}%`,
                            background: `rgba(239,68,68,${opacity})`,
                            minWidth: 2,
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Playback controls */}
                {audioUrl && !isRecording && (
                  <div className="flex items-center gap-2 flex-1">
                    <button data-testid="btn-play-recording" onClick={playRecording}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center ${isPlayingBack ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 shadow-sm"}`}>
                      {isPlayingBack ? <><span className="flex gap-0.5"><span className="w-1 h-3 bg-current rounded-sm" /><span className="w-1 h-3 bg-current rounded-sm" /></span> Durdur</> : <><Play className="w-3 h-3" /> Dinle</>}
                    </button>
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      TTS ile karşılaştır
                    </span>
                    <button onClick={() => handleSpeak(item.text)}
                      className={`p-2 rounded-xl border transition-all flex-shrink-0 ${isSpeaking ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary"}`}>
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Idle state: just show TTS */}
                {!audioUrl && !isRecording && (
                  <button data-testid="btn-speak" onClick={() => handleSpeak(item.text)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isSpeaking ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isSpeaking ? "Durdur" : "Modeli Dinle"}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="px-5 pb-5 flex items-center justify-between">
              <button data-testid="btn-prev" onClick={goToPrev} disabled={currentIndex === 0}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Geri
              </button>
              <div className="text-[11px] text-muted-foreground">
                {audioUrl ? "✓ Kaydınız hazır" : "Oku, kaydet, karşılaştır"}
              </div>
              <button data-testid="btn-font-size" onClick={() => setFontLarge((f) => !f)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                {fontLarge ? "Küçüt" : "Büyüt"} <Repeat2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-card border-t border-border">
          {isTimedMode && !timedRunning && timedTimeLeft === TIMED_SECONDS ? (
            <p className="text-center text-sm text-muted-foreground py-3 font-medium">Yukarıdaki "Başlat" butonuna bas ve tekerlemeleri okumaya başla!</p>
          ) : (
            <>
              <p className="text-center text-[11px] text-muted-foreground mb-3">{isTimedMode ? "Ne kadar hızlı okuyabiliyorsun?" : "Doğru okuyabildin mi? Dürüst değerlendir."}</p>
              <div className="grid grid-cols-2 gap-3">
                <button data-testid="btn-wrong" onClick={() => { if (!isTimedMode || timedRunning) handleAnswer(false); }}
                  disabled={!!feedback || (isTimedMode && !timedRunning)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  <XCircle className="w-5 h-5" /> Takıldım
                </button>
                <button data-testid="btn-correct" onClick={() => { if (!isTimedMode || timedRunning) handleAnswer(true); }}
                  disabled={!!feedback || (isTimedMode && !timedRunning)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  <CheckCircle2 className="w-5 h-5" /> Net Okudum
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── SUMMARY SCREEN ───────────────────────────────────────────────────────────
  const SummaryScreen = () => {
    const accuracy = sessionCorrect + sessionWrong > 0 ? Math.round((sessionCorrect / (sessionCorrect + sessionWrong)) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background">
        <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-7 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full shadow-lg ${accuracy >= 80 ? "bg-gradient-to-br from-yellow-400 to-orange-500" : accuracy >= 50 ? "bg-gradient-to-br from-blue-400 to-indigo-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-foreground">Seans Bitti!</h2>
              <p className="text-muted-foreground text-sm mt-0.5">{activeCategoryName}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Doğru", value: sessionCorrect, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Hatalı", value: sessionWrong, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
              { label: "Başarı", value: `%${accuracy}`, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            ].map((s) => (
              <div key={s.label} className={`flex flex-col items-center p-3 rounded-2xl ${s.bg}`}>
                <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
          {streak >= 3 && (
            <div className="flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">En iyi seri: {stats.bestStreak} ardışık</span>
            </div>
          )}
          <div className="space-y-2.5">
            {mistakes.length > 0 && (
              <button data-testid="btn-retry-mistakes" onClick={() => startGame("mistakes")}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 active:scale-95 transition-all">
                <RotateCcw className="w-4 h-4" /> Hataları Tekrarla ({mistakes.length})
              </button>
            )}
            <button data-testid="btn-new-session" onClick={() => startGame("all")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-95 transition-all">
              <Play className="w-4 h-4" /> Yeni Seans
            </button>
            <button data-testid="btn-menu-from-summary" onClick={() => setScreen("menu")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-muted active:scale-95 transition-all">
              <Home className="w-4 h-4" /> Menüye Dön
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── TIMED SUMMARY SCREEN ─────────────────────────────────────────────────────
  const TimedSummaryScreen = () => {
    const isNewRecord = timedScore > 0 && timedScore >= stats.timedBestScore;
    useEffect(() => {
      if (timedScore > stats.timedBestScore) {
        setStats((prev) => ({ ...prev, timedBestScore: timedScore }));
      }
    }, []);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background">
        <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-7 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg">
              <Timer className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-foreground">Süre Doldu!</h2>
              <p className="text-muted-foreground text-sm mt-0.5">60 Saniyelik Meydan Okuma</p>
            </div>
          </div>
          <div className="text-center py-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
            <div className="text-6xl font-black text-amber-600 dark:text-amber-400">{timedScore}</div>
            <div className="text-sm font-semibold text-amber-700/70 dark:text-amber-400/70 mt-1">tekerleme okundu</div>
            {isNewRecord && (
              <div className="mt-2 inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                <Star className="w-3 h-3 fill-current" /> Yeni Rekor!
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground bg-muted/50 rounded-2xl p-3">
            <span>Önceki rekor</span>
            <span className="font-bold text-foreground">{Math.min(stats.timedBestScore, timedScore > stats.timedBestScore ? timedScore - 1 : stats.timedBestScore)}</span>
          </div>
          <div className="space-y-2.5">
            <button onClick={() => startGame("timed")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 active:scale-95 transition-all">
              <Repeat2 className="w-4 h-4" /> Tekrar Dene
            </button>
            <button onClick={() => setScreen("menu")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-muted active:scale-95 transition-all">
              <Home className="w-4 h-4" /> Menüye Dön
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── BROWSE SCREEN ────────────────────────────────────────────────────────────
  const BrowseScreen = () => {
    const [browseCategory, setBrowseCategory] = useState<string>("all");
    const filtered = useMemo(() => {
      const byCat = browseCategory === "all" ? filteredForBrowse : filteredForBrowse.filter((t) => t.category === browseCategory);
      return byCat;
    }, [browseCategory]);

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card">
          <button onClick={() => { stopSpeaking(); setScreen("menu"); }} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input data-testid="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tekerleme ara..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-background text-sm outline-none transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-thin border-b border-border">
          <button onClick={() => setBrowseCategory("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${browseCategory === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-border"}`}>
            Tümü ({TEKERLEMELER_DATA.length})
          </button>
          {Object.keys(categories).map((cat) => {
            const colors = getCategoryColor(cat);
            return (
              <button key={cat} onClick={() => setBrowseCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${browseCategory === cat ? `${colors.bg} ${colors.text}` : "bg-muted text-muted-foreground hover:bg-border"}`}>
                {getCategoryIcon(cat, "w-3 h-3")} {cat.replace("💀 ", "").replace("🔥 ", "")}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="px-4 py-2 text-[11px] text-muted-foreground font-medium">
          {filtered.length} tekerleme
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6 space-y-2">
          {filtered.map((item) => {
            const colors = getCategoryColor(item.category);
            const isFav = favorites.includes(item.id);
            const isDone = completed.includes(item.id);
            return (
              <div key={item.id} data-testid={`browse-item-${item.id}`}
                className={`bg-card rounded-2xl border border-border p-4 space-y-2 ${isDone ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-sm text-foreground leading-relaxed flex-1">&ldquo;{item.text}&rdquo;</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {getCategoryIcon(item.category, "w-2.5 h-2.5")}
                      <span className="hidden sm:inline">{item.category.replace("💀 ", "").replace("🔥 ", "")}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyBadge(item.difficulty)}`}>{item.difficulty}</span>
                    {isDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Öğrenildi</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => speakText(item.text)} className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleFavorite(item.id)} className={`p-1.5 rounded-full transition-all ${isFav ? "text-pink-500 bg-pink-50 dark:bg-pink-900/30" : "text-muted-foreground hover:text-pink-500"}`}>
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sonuç bulunamadı</p>
              <p className="text-sm mt-1">Farklı bir kelime deneyin</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── STATS SCREEN ─────────────────────────────────────────────────────────────
  const StatsScreen = () => {
    const accuracy = stats.totalCorrect + stats.totalWrong > 0
      ? Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100) : 0;
    const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.check(stats));
    const lockedAchievements = ACHIEVEMENTS.filter((a) => !a.check(stats));

    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card">
          <button onClick={() => setScreen("menu")} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-foreground text-center">İstatistikler</h2>
            <p className="text-xs text-muted-foreground text-center">Tüm zamanlar</p>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Toplam Doğru", value: stats.totalCorrect, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: "Toplam Hatalı", value: stats.totalWrong, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", icon: <XCircle className="w-4 h-4" /> },
              { label: "En İyi Seri", value: stats.bestStreak, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", icon: <Flame className="w-4 h-4" /> },
              { label: "60s Rekor", value: stats.timedBestScore, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: <Timer className="w-4 h-4" /> },
              { label: "Favori", value: favorites.length, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20", icon: <Heart className="w-4 h-4" /> },
              { label: "Tamamlanan", value: completed.length, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: <Trophy className="w-4 h-4" /> },
            ].map((s) => (
              <div key={s.label} className={`flex flex-col items-center p-4 rounded-2xl ${s.bg}`}>
                <div className={`mb-1 ${s.color}`}>{s.icon}</div>
                <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 text-center">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Accuracy */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-foreground">Genel Başarı</span>
              <span className="text-2xl font-black text-primary">%{accuracy}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full bg-gradient-to-r from-primary to-indigo-600 transition-all" style={{ width: `${accuracy}%` }} />
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Rozetler</h3>
              <span className="text-xs text-muted-foreground">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <div className="space-y-2">
              {unlockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className={`p-1.5 rounded-lg bg-background ${a.color}`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{a.label}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
              {lockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl opacity-50">
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-muted-foreground">{a.label}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Personal hardest twisters */}
          {(() => {
            const ranked = TEKERLEMELER_DATA
              .map((t) => ({ t, score: getPersonalScore(t.id, attemptStats), entry: attemptStats[t.id] }))
              .filter(({ score }) => score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 7);
            if (ranked.length === 0) return null;
            return (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Benim İçin En Zor</h3>
                  <button onClick={() => startGame("hardest")}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                    <Play className="w-3 h-3" /> Bunları Çalış
                  </button>
                </div>
                <div className="space-y-2">
                  {ranked.map(({ t, score, entry }, i) => {
                    const pct = Math.round(score * 100);
                    const barColor = pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-orange-500" : "bg-yellow-500";
                    return (
                      <div key={t.id} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-muted-foreground w-4 flex-shrink-0">#{i + 1}</span>
                            <p className="text-xs text-foreground font-serif truncate">{t.text.slice(0, 55)}{t.text.length > 55 ? "…" : ""}</p>
                          </div>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 75 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : pct >= 50 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                            %{pct}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-5">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">{entry?.attempts ?? 0} deneme</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Category progress */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-bold text-foreground">Kategori İlerlemesi</h3>
            {Object.keys(categories).map((cat) => {
              const total = categories[cat].length;
              const done = categories[cat].filter((t) => completed.includes(t.id)).length;
              const pct = Math.round((done / total) * 100);
              const colors = getCategoryColor(cat);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-semibold flex items-center gap-1 ${colors.text}`}>{getCategoryIcon(cat, "w-3 h-3")}{cat.replace("💀 ", "").replace("🔥 ", "")}</span>
                    <span className="text-muted-foreground">{done}/{total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-8">
      <div className="w-full sm:max-w-md h-full sm:h-[780px] bg-background sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative sm:border border-border">
        {screen === "menu" && <MenuScreen />}
        {screen === "game" && <GameScreen />}
        {screen === "summary" && <SummaryScreen />}
        {screen === "timed-summary" && <TimedSummaryScreen />}
        {screen === "browse" && <BrowseScreen />}
        {screen === "stats" && <StatsScreen />}
      </div>
    </div>
  );
}





export default App;
