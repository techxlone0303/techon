import React, { useState } from "react";
import { analyzeMatchVOD, ScoutStrategyResponse } from "../lib/scoutAiApi";
import { useCoachSpeech } from "../hooks/useCoachSpeech";
import { useTypingAnimation } from "../hooks/useTypingAnimation";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Target,
  Clock,
  Mic,
  Radio,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export function CoachSimulationDashboard() {
  const [team, setTeam] = useState<string>("Sentinels");
  const [url, setUrl] = useState<string>(
    "https://www.youtube.com/watch?v=M7lc1UVf-VE"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<ScoutStrategyResponse | null>(null);

  // Web Speech Hook
  const {
    isSpeaking,
    isPaused,
    currentPointIndex,
    currentPointText,
    progress: speechProgress,
    voices,
    selectedVoice,
    start: startSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
    skipToPoint,
    setVoice,
  } = useCoachSpeech(strategy?.coachingPoints || [], {
    rate: 1.05,
    pitch: 0.95,
  });

  // Typing Animation Hook synced with speech
  const { displayedText, isTyping, completeImmediately } = useTypingAnimation(
    currentPointText,
    {
      speedMs: 25,
      isActive: isSpeaking && !isPaused,
    }
  );

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!team.trim() || !url.trim()) return;

    setIsLoading(true);
    setError(null);
    stopSpeech();

    try {
      const result = await analyzeMatchVOD({ team, url });
      setStrategy(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze VOD with local Qwen model.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest">
              <Radio className="w-4 h-4 animate-pulse text-indigo-400" />
              ScoutAI • Local Qwen Intelligence
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
              Esports AI Coaching & Narration Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Extracts public YouTube match telemetry and executes local Qwen reasoning via Ollama.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              Backend :3000 Ready
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              Ollama Qwen Active
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Team
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Sentinels, Fnatic, T1"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/80 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              YouTube VOD Link (Public oEmbed)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/80 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Reasoning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze VOD
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Analysis Display */}
      {strategy && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tactical Playbook (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Match Overview Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-2">
                <Target className="w-4 h-4" />
                Key 1: Match Overview & Meta Dynamics
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tactical Blueprint</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {strategy.matchOverview}
              </p>
              {strategy.meta?.video && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-sm">
                    VOD: {strategy.meta.video.title}
                  </span>
                  <span className="text-indigo-400 font-mono">
                    Model: {strategy.meta.model}
                  </span>
                </div>
              )}
            </div>

            {/* Opponent Analysis & Winning Strategy Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-5 backdrop-blur-sm">
                <div className="text-rose-400 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Key 2: Opponent Flaws
                </div>
                <h4 className="font-semibold text-white text-sm mb-2">Vulnerabilities</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {strategy.opponentAnalysis}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
                <div className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Key 3: Winning Strategy
                </div>
                <h4 className="font-semibold text-white text-sm mb-2">Execution Protocol</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {strategy.winningStrategy}
                </p>
              </div>
            </div>

            {/* Timeline Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
              <div className="text-indigo-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Key 4: Round Execution Timeline
              </div>
              <div className="space-y-2.5">
                {strategy.timeline.map((phase, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed">{phase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Audio Coaching Avatar HUD (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-b from-slate-900/90 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">
                    AI Coach Speech Avatar
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Sound Wave Animation */}
                  {isSpeaking && !isPaused ? (
                    <div className="flex items-end gap-1 h-5">
                      <span className="w-1 bg-indigo-400 h-3 animate-bounce rounded-full" />
                      <span className="w-1 bg-indigo-400 h-5 animate-bounce delay-75 rounded-full" />
                      <span className="w-1 bg-indigo-400 h-2 animate-bounce delay-150 rounded-full" />
                      <span className="w-1 bg-indigo-400 h-4 animate-bounce delay-100 rounded-full" />
                    </div>
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Spoken Text HUD with Typing Animation */}
              <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 min-h-[140px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 mb-2">
                    <span>
                      {currentPointIndex >= 0
                        ? `DIRECTIVE ${currentPointIndex + 1} OF ${strategy.coachingPoints.length}`
                        : "COACH ON STANDBY"}
                    </span>
                    {isTyping && (
                      <span className="text-amber-400 animate-pulse">Typing...</span>
                    )}
                  </div>
                  <p className="text-slate-100 text-sm font-medium leading-relaxed font-sans">
                    {currentPointIndex >= 0 ? (
                      <>
                        {displayedText}
                        {isTyping && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500 italic">
                        Click "Play Directives" to start speech narration with synchronized character typing.
                      </span>
                    )}
                  </p>
                </div>

                {isTyping && (
                  <button
                    onClick={completeImmediately}
                    className="self-end text-[11px] text-slate-400 hover:text-indigo-300 mt-2 underline cursor-pointer"
                  >
                    Reveal full text
                  </button>
                )}
              </div>

              {/* Playback Controls */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isSpeaking || isPaused ? (
                    <button
                      onClick={isPaused ? resumeSpeech : startSpeech}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isPaused ? "Resume" : "Play Directives"}
                    </button>
                  ) : (
                    <button
                      onClick={pauseSpeech}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      Pause
                    </button>
                  )}

                  <button
                    onClick={stopSpeech}
                    disabled={!isSpeaking && !isPaused}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition cursor-pointer"
                    title="Stop & Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice Selection */}
                {voices.length > 0 && (
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => {
                      const v = voices.find((item) => item.name === e.target.value);
                      if (v) setVoice(v);
                    }}
                    className="max-w-[150px] truncate text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${speechProgress}%` }}
                />
              </div>

              {/* Coaching Points Clickable List */}
              <div className="mt-6">
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
                  <span>Key 5: Coaching Points ({strategy.coachingPoints.length})</span>
                  <span className="text-[10px] text-slate-500">Click to jump</span>
                </h4>
                <div className="space-y-2">
                  {strategy.coachingPoints.map((point, idx) => {
                    const isActive = currentPointIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => skipToPoint(idx)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2 ${
                          isActive
                            ? "bg-indigo-500/20 border-indigo-500/60 text-white font-medium"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-900/60"
                        }`}
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isActive ? "text-indigo-400" : "text-slate-600"
                          }`}
                        />
                        <span className="leading-snug">{point}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
