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




export default App;
