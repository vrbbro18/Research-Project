import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from "recharts";

// API Response Interface
interface ApiResponse {
  status: "Drowsy" | "Awake" | string;
  emotion: string;
  emotion_raw?: string;
  emotion_reason?: string;
  risk_level: string;
  action: string;
  message: string;
  minute_analysis?: MinuteAnalysis[];
  current_minute_prediction?: CurrentMinutePrediction[];
  current_minute_metrics?: MinuteAnalysis["metrics"];
  future_predictions?: FuturePrediction[];
  rolling_window?: any[];
  predictive_trend?: any;
  insights?: string[];
  frontend_ear?: number;
  frontend_mar?: number;
  hybrid_decision?: {
    status: string;
    risk_level: string;
    risk_prob: number;
    uncertain: boolean;
    disagreement: number;
    source_weights: { live: number; snapshot: number };
    source_probs: { live: number | null; snapshot: number | null };
    reason: string;
  };
  structured_analysis?: {
    drowsiness: { status: string; description: string };
    risk: { status: string; description: string };
    trend: { status: string; description: string };
  };
}

interface MinuteAnalysis {
  minute: number;
  x: number;
  label: string;
  metrics: {
    riskScore: number;
    microSleeps: number;
    maxConsecutiveFatigue: number;
    avgPerclos: number;
    avgYawn: number;
  };
}

interface FuturePrediction {
  minute: number;
  x: number;
  label: string;
  predictedRisk: number;
}

interface CurrentMinutePrediction {
  label: string;
  x: number;
  cPct: number;
}

interface LiveAnalyticsPoint {
  ts: number;
  label: string;
  risk_prob: number;
  status: string;
  uncertain: boolean;
  disagreement: number;
  source_probs: { live: number | null; snapshot: number | null };
  ear: number;
  mar: number;
  yawn: boolean;
  emotion_raw: string;
  emotion_display: string;
  emotion_reason: string;
}

interface LiveAnalyticsResponse {
  point: LiveAnalyticsPoint;
  live_points: LiveAnalyticsPoint[];
  current_minute_prediction?: CurrentMinutePrediction[];
  future_predictions?: FuturePrediction[];
  hybrid_decision?: ApiResponse["hybrid_decision"];
}

interface HistoryEntry extends ApiResponse {
  timestamp: Date;
}

function App() {
  const [mode, setMode] = useState<"webcam" | "upload">("webcam");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualEmotion, setManualEmotion] = useState<string>("Detect Automatically");
  const [manualDrowsiness, setManualDrowsiness] = useState<string>("Detect Automatically");
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(50);
  const [targetVolume, setTargetVolume] = useState<number>(50);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");
  const [upcomingTracks, setUpcomingTracks] = useState<{ id: string, title: string }[]>([]);
  const [manualStop, setManualStop] = useState<boolean>(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState<boolean>(false);
  const [therapyStatus, setTherapyStatus] = useState<string>("Analyzing driver state...");
  const [liveStatus, setLiveStatus] = useState<{
    ear: number; mar: number; model_status: string; model_conf: number;
    emotion: string; emotion_conf?: number; alert: boolean; ear_alert: boolean; model_alert: boolean;
    yawn: boolean; face_detected: boolean;
  } | null>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalyticsResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const continuousAlarmRef = useRef<number | null>(null);
  const lastVoiceWarningRef = useRef<number>(0);
  const lastPlayedRef = useRef<{ [key: string]: number }>({});;
  const liveStatusRef = useRef<{
    ear: number; mar: number; model_status: string; model_conf: number;
    emotion: string; emotion_conf?: number; alert: boolean; ear_alert: boolean; model_alert: boolean;
    yawn: boolean; face_detected: boolean;
  } | null>(null);



  const API_URL = "http://127.0.0.1:5000/analyze";
  const SNAPSHOT_PROBE_URL = "http://127.0.0.1:5000/snapshot_probe";
  const LIVE_ANALYTICS_URL = "http://127.0.0.1:5000/live_analytics";

  // Professional Music Therapy Library
  // Scientifically categorized by therapeutic effect
  const musicLibrary = {
    // DROWSY STATES - High Priority Alert Music
    PLAY_ALARM: [
      "dQw4w9WgXcQ", // High-energy alert 1
      "fJ9rUzIMcZQ", // Emergency alert tone
      "2HQaBWziYvY", // Attention-grabbing sound
      "9bZkp7q19f0", // Energetic alert
    ],

    // Drowsy + Sad: Fast, Happy, Energetic
    PLAY_FAST_HAPPY: [
      "ZbZSe6N_BXs", // Happy - Pharrell
      "y6Sxv-sUYtM", // Uplifting energetic
      "ru0K8uYEZWw", // Feel Good Inc (upbeat)
      "2Vv-BfVoq4g", // High-energy positive
      "CevxZvSJLk8", // Energizing music
    ],

    // Drowsy + Angry: Moderate alert with calming elements
    PLAY_MODERATE_ALERT: [
      "kJQP7kiw5Fk", // Moderately energetic, less aggressive
      "60ItHLz5WEA", // Balanced energy
      "hT_nvWreIhg", // Alert but not stressful
      "Qb_Vu4RFx9c", // Engaging but calming
    ],

    // Drowsy + Anxious: Gentle alert with reassurance
    PLAY_GENTLE_ALERT: [
      "L_jWHffIx5E", // Gentle but engaging
      "lP26UCnoH9s", // Soft energizing
      "bQtmM0pM7NI", // Reassuring alert
    ],

    // AWAKE STATES
    // Awake + Sad: Upbeat joyful music (prevent accidents from depression)
    PLAY_UPBEAT_MUSIC: [
      "ZbZSe6N_BXs", // Happy - major key, positive
      "y6Sxv-sUYtM", // Mood-lifting
      "CevxZvSJLk8", // Joyful energy
      "2Vv-BfVoq4g", // Optimistic beats
      "kJQP7kiw5Fk", // Feel-good music
    ],

    // Awake + Angry: Calming music (reduce road rage)
    PLAY_CALM_MUSIC: [
      "lP26UCnoH9s", // Peaceful, slow tempo
      "1ZYbU82GVz4", // Stress-reducing
      "bQtmM0pM7NI", // Tranquil sounds
      "CySNhHf-E4E", // Calming piano
      "L_jWHffIx5E", // Soothing instrumental
    ],

    // Awake + Anxious/Fear: Reassuring confidence-building
    PLAY_REASSURING_MUSIC: [
      "hT_nvWreIhg", // Confidence-building
      "Qb_Vu4RFx9c", // Reassuring rhythm
      "60ItHLz5WEA", // Stable, grounding
      "L_jWHffIx5E", // Supportive tones
    ],

    // Awake + Disgust: Pleasant mood-shifter
    PLAY_NEUTRAL_PLEASANT: [
      "y6Sxv-sUYtM", // Pleasant, neutral positive
      "kJQP7kiw5Fk", // Light uplifting
      "60ItHLz5WEA", // Agreeable music
      "hT_nvWreIhg", // Mood-neutral pleasant
    ],
  };

  // Initialize YouTube IFrame API
  useEffect(() => {
    const initializeYouTubePlayer = () => {
      const playerElement = document.getElementById("youtube-player");
      if (!playerElement) {
        setTimeout(initializeYouTubePlayer, 100);
        return;
      }

      if (youtubePlayerRef.current) return;

      try {
        youtubePlayerRef.current = new (window as any).YT.Player(
          "youtube-player",
          {
            height: "0",
            width: "0",
            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: () => {
                console.log("YouTube player ready");
                setPlayerReady(true);
              },
              onStateChange: (event: any) => {
                // If song ended (state = 0)
                if (event.data === 0) {
                  console.log("Song finished playing.");
                  setIsPlaying(false);
                  setCurrentAction("");
                  setCurrentVideoTitle("");
                }
              },
              onError: (event: any) => {
                console.error("YouTube player error:", event.data);
              },
            },
          }
        );
      } catch (error) {
        console.error("Error creating YouTube player:", error);
      }
    };

    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initializeYouTubePlayer();
      return;
    }

    // Check if script already exists
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // Create and load the YouTube IFrame API script
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    // Set up callback for when API is ready
    (window as any).onYouTubeIframeAPIReady = initializeYouTubePlayer;

    return () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        try {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        } catch (e) {
          console.error("Error destroying player:", e);
        }
      }
    };
  }, []);

  const enableAudio = () => {
    setAudioEnabled(true);
    console.log("Audio/Video enabled by user");
  };

  // Pause/Resume music
  const togglePause = () => {
    if (!youtubePlayerRef.current) return;

    if (isPaused) {
      youtubePlayerRef.current.playVideo();
      setIsPaused(false);
      console.log("Music resumed");
    } else {
      youtubePlayerRef.current.pauseVideo();
      setIsPaused(true);
      console.log("Music paused");
    }
  };

  // Stop music
  const stopMusic = () => {
    if (!youtubePlayerRef.current) return;

    youtubePlayerRef.current.stopVideo();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentAction("");
    setManualStop(true);
    console.log("Music stopped manually");
  };

  const handleResetSession = async () => {
    if (window.confirm("Are you sure you want to clear all analysis history?")) {
      try {
        const resetUrl = API_URL.replace("/analyze", "/reset");
        await axios.post(resetUrl);
        setResponseData(null);
        setHistory([]);
        alert("Session history cleared successfully.");
      } catch (error) {
        console.error("Reset failed:", error);
        alert("Failed to reset session.");
      }
    }
  };

  // Change volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(newVolume);
    }
  };

  // Get random video ID from library
  const getRandomVideo = (action: string): string | null => {
    const videos = musicLibrary[action as keyof typeof musicLibrary];
    if (!videos || videos.length === 0) return null;

    if (videos.length === 1) return videos[0];

    const lastIndex = lastPlayedRef.current[action] ?? -1;

    const availableVideos = videos.filter((_, index) => index !== lastIndex);

    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const selectedVideo = availableVideos[randomIndex];

    const actualIndex = videos.indexOf(selectedVideo);
    lastPlayedRef.current[action] = actualIndex;

    return selectedVideo;
  };

  const playAudio = useCallback(
    (action: string) => {
      if (!audioEnabled) {
        console.warn("Audio not enabled. User interaction required.");
        return;
      }

      if (!playerReady || !youtubePlayerRef.current) {
        console.error("YouTube player not ready yet. Please wait...");
        return;
      }

      console.log(`Playing: ${action}`);

      const videoId = getRandomVideo(action);
      if (videoId) {
        youtubePlayerRef.current.loadVideoById(videoId);
        youtubePlayerRef.current.setVolume(volume);
        youtubePlayerRef.current.playVideo();
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentAction(action);
        setCurrentVideoTitle("Loading track details...");
        setManualStop(false);

        // Fetch current song title safely
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.title) {
              setCurrentVideoTitle(data.title);
            } else {
              // Fallback to iframe internal data if noembed fails to find it
              try {
                const fallback = youtubePlayerRef.current?.getVideoData();
                if (fallback?.title) setCurrentVideoTitle(fallback.title);
                else setCurrentVideoTitle("Therapy Track Playing");
              } catch (e) { setCurrentVideoTitle("Therapy Track Playing"); }
            }
          })
          .catch(() => {
            try {
              const fallback = youtubePlayerRef.current?.getVideoData();
              if (fallback?.title) setCurrentVideoTitle(fallback.title);
              else setCurrentVideoTitle("Therapy Track Playing");
            } catch (e) { setCurrentVideoTitle("Therapy Track Playing"); }
          });

        // Build upcoming queue (3 future tracks)
        const libraryList = musicLibrary[action as keyof typeof musicLibrary] || [];
        const possibleFutures = libraryList.filter(id => id !== videoId);

        // Pick 3 random
        const chosenFutures: string[] = [];
        const copy = [...possibleFutures];
        for (let i = 0; i < 3; i++) {
          if (copy.length === 0) break;
          const rIdx = Math.floor(Math.random() * copy.length);
          chosenFutures.push(copy[rIdx]);
          copy.splice(rIdx, 1);
        }

        // Fetch their titles asynchronously
        setUpcomingTracks(chosenFutures.map(id => ({ id, title: "Loading..." })));

        Promise.all(chosenFutures.map(id =>
          fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
            .then(res => res.json())
            .then(data => ({ id, title: data?.title || "Upcoming Therapy Track" }))
            .catch(() => ({ id, title: "Upcoming Therapy Track" }))
        )).then(results => {
          setUpcomingTracks(results);
        });

      } else {
        console.error(`No video found for action: ${action}`);
      }
    },
    [audioEnabled, playerReady]
  );

  // Get Severity of the action
  const getSeverity = useCallback((actionStr: string | null) => {
    if (!actionStr || actionStr === "NO_ACTION") return 0;
    if (actionStr === "PLAY_ALARM") return 3;
    if (["PLAY_FAST_HAPPY", "PLAY_MODERATE_ALERT", "PLAY_GENTLE_ALERT"].includes(actionStr)) return 2;
    return 1; // Mild actions
  }, []);

  const playAlarmBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number, volStart: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(volStart, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      // Dissonant aggressive siren chord
      playTone(1200, "square", now, 0.4, 0.5);
      playTone(1500, "square", now + 0.1, 0.4, 0.5);
      playTone(2000, "sawtooth", now + 0.2, 0.5, 0.4);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const playVoiceWarning = useCallback(() => {
    const now = Date.now();
    // Only speak once every 15 seconds to avoid spam
    if (now - lastVoiceWarningRef.current > 15000) {
      lastVoiceWarningRef.current = now;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance("Driver, please be aware.");
        msg.rate = 0.95;
        msg.pitch = 1.0;
        window.speechSynthesis.speak(msg);
      }
    }
  }, []);

  // Advanced Continuous Alarm Control
  const startContinuousAlarm = useCallback(() => {
    if (!continuousAlarmRef.current) {
      playAlarmBeep(); // play immediately
      continuousAlarmRef.current = window.setInterval(() => {
        playAlarmBeep();
      }, 700); // Repeat every 700ms for fast urgency siren loop
    }
  }, [playAlarmBeep]);

  const stopContinuousAlarm = useCallback(() => {
    if (continuousAlarmRef.current) {
      clearInterval(continuousAlarmRef.current);
      continuousAlarmRef.current = null;
    }
  }, []);

  // Smooth Volume Controller Engine (Runs constantly)
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      setVolume((prev) => {
        if (prev === targetVolume) return prev;
        const step = prev < targetVolume ? 4 : -4;
        const nextVol = Math.max(0, Math.min(100, prev + step));
        if (youtubePlayerRef.current && isPlaying && !manualStop) {
          try { youtubePlayerRef.current.setVolume(nextVol); } catch (e) { }
        }
        return nextVol;
      });
    }, 350); // Small adjustments multiple times a second for organic "podda podda" fades

    return () => clearInterval(fadeInterval);
  }, [targetVolume, isPlaying, manualStop]);

  // Advanced Music Therapy Decision Algorithm
  useEffect(() => {
    if (!responseData?.action) return;

    const newAction = responseData.action;
    const patternLevel = responseData.structured_analysis?.drowsiness?.status; // CRITICAL, WARNING, GOOD
    const riskLevel = responseData.structured_analysis?.risk?.status; // DANGER, CAUTION, MINIMAL

    let infoText = "Analyzing patterns...";

    // Determine absolute severity (0: stable, 1: warning, 2: critical danger)
    let theThreat = 0;
    const anomalyStreak = responseData.current_minute_metrics?.maxConsecutiveFatigue || 0;
    const isCurrentlyDrowsy = responseData.status === "Drowsy";

    // Siren (Level 2) MUST ONLY sound if the user is CURRENTLY drowsy in this exact frame, 
    // PLUS they meet the extreme pattern bounds (Critical Trend + Danger Risk OR >=4 Streak)
    if (isCurrentlyDrowsy && ((patternLevel === "CRITICAL" && riskLevel === "DANGER") || anomalyStreak >= 4)) {
      theThreat = 2;
    } else if (isCurrentlyDrowsy && (patternLevel === "WARNING" || patternLevel === "CRITICAL" || riskLevel === "CAUTION" || riskLevel === "DANGER" || newAction === "PLAY_ALARM" || anomalyStreak >= 2)) {
      theThreat = 1;
    } else if (!isCurrentlyDrowsy && (patternLevel === "CRITICAL" || riskLevel === "DANGER" || anomalyStreak >= 4)) {
      // Driver just explicitly woke up from a Critical state -> Stop Siren, maintain Warning (Volume 80%) as a cooldown
      theThreat = 1;
    } else {
      // Driver is awake and patterns are normal
      theThreat = 0;
    }

    if (newAction !== "NO_ACTION") {
      if (!manualStop) {

        // 1) Handle CRITICAL Threat
        if (theThreat === 2) {
          infoText = "🚨 CRITICAL OVERRIDE: Danger Level Reached! Activating continuous siren!";
          startContinuousAlarm();

          if (!isPlaying) {
            setTargetVolume(100);
            playAudio("PLAY_ALARM");
          } else if (currentAction !== "PLAY_ALARM") {
            // Dynamic Cross-fade Logic (fade wela ikmnta wena type)
            infoText = "🚨 CRITICAL OVERRIDE: Fading out track, swapping to Emergency Music!";
            setTargetVolume(15); // Drop volume rapidly
            // Prevent multiple timeouts jumping around
            if (!(window as any).isSwappingToAlarm) {
              (window as any).isSwappingToAlarm = true;
              setTimeout(() => {
                playAudio("PLAY_ALARM");
                setTargetVolume(100); // Spike back up after swap
                setTimeout(() => { (window as any).isSwappingToAlarm = false; }, 2000);
              }, 1400);
            }
          } else {
            setTargetVolume(100);
          }

          // 2) Handle WARNING Threat
        } else if (theThreat === 1) {
          stopContinuousAlarm();
          playVoiceWarning(); // Play "Please be aware" voice over audio track

          if (!isPlaying || currentAction === "PLAY_ALARM") { // If from alarm or not playing
            infoText = "⚠️ PATTERN WARNING: Initiating therapy track & voice alert...";
            setTargetVolume(70);
            playAudio(newAction);
          } else {
            infoText = "⚠️ PATTERN WARNING: Fatigue streak rising. Scaling volume UP (80%)...";
            setTargetVolume(80);
          }

          // 3) Handle NORMAL Threat
        } else {
          stopContinuousAlarm();
          if (!isPlaying || currentAction === "PLAY_ALARM") { // If from alarm or not playing
            infoText = "✅ Pattern stable. Initiating baseline therapy track...";
            setTargetVolume(50);
            playAudio(newAction);
          } else {
            infoText = "✅ Driver stable. Smoothly scaling volume DOWN (50%)...";
            setTargetVolume(50);
          }
        }

      } else {
        stopContinuousAlarm();
        infoText = "Therapy manually stopped by user. Audio and alarms disabled.";
      }
    } else {
      // NO_ACTION Logic (Driver is fully awake)
      stopContinuousAlarm();
      if (isPlaying) {
        infoText = "Driver completely alert. Auto-fading background therapy out (Volume 20%)...";
        setTargetVolume(20);
      } else {
        infoText = "Awaiting triggers...";
      }
    }

    setTherapyStatus(infoText);
  }, [responseData, playAudio, isPlaying, manualStop, currentAction, startContinuousAlarm, stopContinuousAlarm, playVoiceWarning]);

  // Send image to backend with manual emotion
  const analyzeImage = useCallback(
    async (imageBlob: Blob, frontendEar: number | null = null) => {
      setLoading(true);
      setError(null);
      setTherapyStatus("Analyzing image for driver state...");

      try {
        const formData = new FormData();
        formData.append("file", imageBlob, "image.jpg");
        formData.append("manual_emotion", manualEmotion);
        formData.append("manual_drowsiness", manualDrowsiness);
        if (frontendEar !== null) {
          formData.append("frontend_ear", String(frontendEar.toFixed(3)));
        }

        const response = await axios.post<ApiResponse>(API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setResponseData(response.data);
        setTherapyStatus(`Analysis complete. Detected: ${response.data.status}, ${response.data.emotion}.`);

        setHistory((prev) => {
          const newHistory = [...prev, { ...response.data, timestamp: new Date() }];
          // Keep only the last 20 entries (represents ~1 min if polling every 3s)
          return newHistory.slice(-20);
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || "Failed to analyze image");
          setTherapyStatus(`Analysis failed: ${err.response?.data?.error || "Unknown error"}`);
        } else {
          setError("An unexpected error occurred");
          setTherapyStatus(`Analysis failed: An unexpected error occurred.`);
        }
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [manualEmotion, manualDrowsiness]
  );


  // Poll /status every 500ms for real-time EAR/MAR/alert metrics
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/status");
        if (res.ok) setLiveStatus(await res.json());
      } catch { /* backend not ready yet */ }
    }, 500);
    return () => clearInterval(poll);
  }, []);

  // Keep latest live status in a ref so the snapshot interval does not
  // need to recreate every 500 ms.
  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

  // Trigger a backend snapshot probe every 3 seconds in webcam mode.
  // This keeps the legacy snapshot-model path active in parallel with live mode.
  useEffect(() => {
    if (mode !== "webcam") return;

    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;

      try {
        const ls = liveStatusRef.current;
        await fetch(SNAPSHOT_PROBE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manual_emotion: manualEmotion,
            manual_drowsiness: manualDrowsiness,
            frontend_ear: ls?.ear ?? null,
            frontend_mar: ls?.mar ?? null,
            frontend_yawn: ls?.yawn ?? false,
          }),
        });
      } catch {
        // Backend may be unavailable during startup; keep loop alive.
      } finally {
        busy = false;
      }
    };

    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [mode, manualEmotion, manualDrowsiness, SNAPSHOT_PROBE_URL]);

  // Poll /live_analytics every 1s for high-resolution charting and
  // emotion stabilization visibility.
  useEffect(() => {
    if (mode !== "webcam") return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(LIVE_ANALYTICS_URL);
        if (res.ok) {
          const data = await res.json() as LiveAnalyticsResponse;
          setLiveAnalytics(data);
        }
      } catch {
        // Backend may be unavailable during startup; keep loop alive.
      }
    }, 1000);

    return () => clearInterval(poll);
  }, [mode, LIVE_ANALYTICS_URL]);

  // Poll /research every 5s — sets responseData so ALL charts,
  // music-therapy logic, and dashboard cards keep working unchanged.
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/research");
        if (res.ok) {
          const data = await res.json();
          setResponseData(data);
          setHistory(prev => [...prev, { ...data, timestamp: new Date() }].slice(-20));
          setTherapyStatus(`Analysis updated: ${data.status}, ${data.emotion}.`);
        }
      } catch { /* backend not ready yet */ }
    }, 5000);
    setTherapyStatus("Live stream mode active. Python backend is driving the camera.");
    return () => clearInterval(poll);
  }, []);

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setTherapyStatus(`Image selected: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle analyze button for upload mode
  const handleAnalyzeUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      analyzeImage(file);
    }
  };

  // Toggle mode handler - Do NOT reset history/responseData so charts persist
  const handleModeToggle = () => {
    setMode((prev: "webcam" | "upload") =>
      prev === "webcam" ? "upload" : "webcam"
    );
    setSelectedImage(null);
    setError(null);
    // Note: responseData and history are intentionally preserved
  };

  // Get risk level color
  const getRiskColor = (riskLevel: string): string => {
    if (riskLevel.includes("HIGH")) return "danger";
    if (riskLevel.includes("MEDIUM")) return "warning";
    return "success";
  };


  // Format data for Recharts — all hybrid metrics per minute
  const chartData = useMemo(() => {
    type MinuteChartRow = {
      name: string;
      "Risk Score": number;
      "Fused Risk %": number | null;
      "PERCLOS %": number;
      "Yawn %": number;
      "Micro-sleeps": number;
      "Fatigue Streak": number;
    };

    if (!responseData) return [];

    const data: MinuteChartRow[] = (responseData.minute_analysis || []).map(m => ({
      name: m.label,
      "Risk Score":  m.metrics.riskScore,
      "Fused Risk %": null,
      "PERCLOS %":   m.metrics.avgPerclos ?? 0,
      "Yawn %":      m.metrics.avgYawn    ?? 0,
      "Micro-sleeps": m.metrics.microSleeps,
      "Fatigue Streak": m.metrics.maxConsecutiveFatigue,
    }));

    if (responseData.current_minute_metrics) {
      const curMin = (responseData.minute_analysis && responseData.minute_analysis.length > 0)
        ? responseData.minute_analysis[responseData.minute_analysis.length - 1].minute + 1
        : 1;
      data.push({
        name: `Min ${curMin} (Live)`,
        "Risk Score":     responseData.current_minute_metrics.riskScore,
        "Fused Risk %":   responseData.hybrid_decision
          ? Number((responseData.hybrid_decision.risk_prob * 100).toFixed(1))
          : responseData.current_minute_metrics.riskScore,
        "PERCLOS %":      (responseData.current_minute_metrics as any).avgPerclos ?? 0,
        "Yawn %":         (responseData.current_minute_metrics as any).avgYawn    ?? 0,
        "Micro-sleeps":   responseData.current_minute_metrics.microSleeps,
        "Fatigue Streak": responseData.current_minute_metrics.maxConsecutiveFatigue,
      });
    }

    return data;
  }, [responseData]);

  const liveRiskChartData = useMemo(() => {
    type LiveRiskRow = {
      name: string;
      "Live Fused Risk": number | null;
      "Predicted Risk": number | null;
      "Uncertain": number | null;
      "Disagreement %": number | null;
    };

    const points = liveAnalytics?.live_points || [];
    if (points.length === 0) return [];

    const data: LiveRiskRow[] = points.map((p) => {
      const risk = Number((p.risk_prob * 100).toFixed(1));
      const confHalf = Math.max(4, Math.min(22, 5 + (p.disagreement * 20) + (p.uncertain ? 8 : 0)));
      const confLow = Math.max(0, Number((risk - confHalf).toFixed(1)));
      const confHigh = Math.min(100, Number((risk + confHalf).toFixed(1)));
      return {
        name: p.label,
        "Live Fused Risk": risk,
        "Predicted Risk": null as number | null,
        "Uncertain": p.uncertain ? 1 : 0,
        "Disagreement %": Number((p.disagreement * 100).toFixed(1)),
        "Confidence Base": confLow,
        "Confidence Range": Number((confHigh - confLow).toFixed(1)),
        "Uncertain Marker": p.uncertain ? risk : null,
      } as LiveRiskRow & {
        "Confidence Base": number;
        "Confidence Range": number;
        "Uncertain Marker": number | null;
      };
    });

    const curPred = liveAnalytics?.current_minute_prediction || [];
    if (curPred.length > 0) {
      data.push(...curPred.map((pt, idx) => ({
        name: idx === curPred.length - 1 ? `${pt.label} (Now*)` : `${pt.label} (Est)`,
        "Live Fused Risk": null,
        "Predicted Risk": Number(pt.cPct.toFixed(1)),
        "Uncertain": null,
        "Disagreement %": null,
        "Confidence Base": null,
        "Confidence Range": null,
        "Uncertain Marker": null,
      })));
    }

    const fut = liveAnalytics?.future_predictions || [];
    if (fut.length > 0) {
      data.push(...fut.map((pt) => ({
        name: `${pt.label} (Forecast)`,
        "Live Fused Risk": null,
        "Predicted Risk": Number(pt.predictedRisk.toFixed(1)),
        "Uncertain": null,
        "Disagreement %": null,
        "Confidence Base": null,
        "Confidence Range": null,
        "Uncertain Marker": null,
      })));
    }

    return data;
  }, [liveAnalytics]);

  const liveSignalChartData = useMemo(() => {
    const points = liveAnalytics?.live_points || [];
    return points.map((p) => ({
      name: p.label,
      EAR: Number(p.ear.toFixed(3)),
      MAR: Number(p.mar.toFixed(3)),
      "Disagreement %": Number((p.disagreement * 100).toFixed(1)),
    }));
  }, [liveAnalytics]);

  const liveExplanations = useMemo(() => {
    const points = liveAnalytics?.live_points || [];
    const fused = responseData?.hybrid_decision;
    const explanations: string[] = [];

    if (points.length === 0) {
      return ["Collecting live analytics. Explanations will appear once enough data is available."];
    }

    const latest = points[points.length - 1];
    const lookback = points[Math.max(0, points.length - 8)];
    const riskNow = latest.risk_prob * 100;
    const riskPrev = lookback.risk_prob * 100;
    const slope = riskNow - riskPrev;

    if (slope > 8) {
      explanations.push(`Risk is rising quickly (+${slope.toFixed(1)} points over recent seconds). Driver fatigue may be increasing now.`);
    } else if (slope < -8) {
      explanations.push(`Risk is recovering (${slope.toFixed(1)} points over recent seconds). Alertness appears to be improving.`);
    } else {
      explanations.push(`Risk trend is relatively stable (${slope >= 0 ? '+' : ''}${slope.toFixed(1)} points over recent seconds).`);
    }

    const maxPred = Math.max(
      ...(liveAnalytics?.future_predictions || []).map((p) => p.predictedRisk),
      Number.NEGATIVE_INFINITY
    );
    if (Number.isFinite(maxPred)) {
      if (maxPred > 60) {
        explanations.push(`Prediction warns of future danger (forecast peak ${maxPred.toFixed(1)}). This can escalate system actions.`);
      } else {
        explanations.push(`Prediction remains below danger threshold (forecast peak ${maxPred.toFixed(1)}).`);
      }
    }

    if (latest.uncertain) {
      explanations.push(`Model disagreement is high (${(latest.disagreement * 100).toFixed(1)}%). System enters uncertainty-safe behavior to avoid false alarms.`);
    } else {
      explanations.push(`Live and snapshot agreement is acceptable (${(latest.disagreement * 100).toFixed(1)}% disagreement).`);
    }

    explanations.push(`Emotion shown is '${(latest.emotion_display || responseData?.emotion || 'neutral')}'. Reason: ${(latest.emotion_reason || responseData?.emotion_reason || 'raw')}.`);

    if (fused) {
      explanations.push(`Current fused decision: ${fused.status} (${(fused.risk_prob * 100).toFixed(1)}% risk probability).`);
    }

    return explanations.slice(0, 5);
  }, [liveAnalytics, responseData]);

  const exportLiveCsv = useCallback(() => {
    const points = liveAnalytics?.live_points || [];
    if (points.length === 0) return;

    const headers = [
      "timestamp",
      "label",
      "risk_prob",
      "status",
      "uncertain",
      "disagreement",
      "source_prob_live",
      "source_prob_snapshot",
      "ear",
      "mar",
      "yawn",
      "emotion_raw",
      "emotion_display",
      "emotion_reason",
    ];

    const rows = points.map((p) => [
      p.ts,
      p.label,
      p.risk_prob,
      p.status,
      p.uncertain,
      p.disagreement,
      p.source_probs?.live ?? "",
      p.source_probs?.snapshot ?? "",
      p.ear,
      p.mar,
      p.yawn,
      p.emotion_raw,
      p.emotion_display,
      p.emotion_reason,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `${v}`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `live_analytics_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [liveAnalytics]);

  const experimentSummary = useMemo(() => {
    const points = liveAnalytics?.live_points || [];
    if (points.length < 2) return null;

    const start = points[0].ts;
    const end = points[points.length - 1].ts;
    const durationSec = Math.max(1, end - start);
    const durationHours = durationSec / 3600.0;

    const highRiskCount = points.filter((p) => p.risk_prob >= 0.68).length;
    const uncertainCount = points.filter((p) => p.uncertain).length;
    const avgRisk = points.reduce((s, p) => s + p.risk_prob, 0) / points.length;

    let drowsyTransitions = 0;
    for (let i = 1; i < points.length; i += 1) {
      if (points[i - 1].status !== "Drowsy" && points[i].status === "Drowsy") {
        drowsyTransitions += 1;
      }
    }

    return {
      durationSec,
      avgRiskPct: avgRisk * 100,
      highRiskPerHour: highRiskCount / durationHours,
      uncertainPct: (uncertainCount / points.length) * 100,
      drowsyTransitions,
    };
  }, [liveAnalytics]);

  const predictionIsDrivingDecision = useMemo(() => {
    const preds = responseData?.future_predictions || [];
    return preds.some((p) => p.predictedRisk > 60);
  }, [responseData]);


  return (
    <div className="container-fluid min-vh-100 bg-light py-4">
      {/* Hidden YouTube Player - Must be at top level */}
      <div
        id="youtube-player"
        style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
      ></div>

      <div className="container">
        <h1 className="text-center mb-4 fw-bold">
          Driver Monitoring and Safety System
        </h1>
        <p className="text-center text-muted mb-4">
          Real-time Drowsiness Detection and Emotion Recognition
        </p>

        {/* Audio Enable Banner */}
        {!audioEnabled && (
          <div
            className="alert alert-warning alert-dismissible fade show mb-4"
            role="alert"
          >
            <strong>Music Therapy Disabled</strong>
            <p className="mb-2">
              Click the button below to enable therapeutic music playback for
              driver safety.
            </p>
            <button
              className="btn btn-warning btn-sm"
              onClick={enableAudio}
              disabled={!playerReady}
            >
              {playerReady ? "Enable Music System" : "Loading Music Player..."}
            </button>
          </div>
        )}

        {/* Premium Action & Therapy Controls Section */}
        {audioEnabled && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%)', color: 'white' }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                {/* Left Column: Therapy Details */}
                <div className="col-12 col-md-4 d-flex align-items-center mb-3 mb-md-0 border-end border-secondary border-opacity-25 pe-md-3">
                  <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center shadow" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                    {isPlaying ? (
                      <span className="fs-3">🎵</span>
                    ) : (
                      <span className="fs-3" style={{ opacity: 0.5 }}>🔇</span>
                    )}
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-0 fw-bold text-uppercase d-flex align-items-center" style={{ letterSpacing: '1px', fontSize: '0.75rem', color: '#a0a0b8' }}>
                      <span className="me-2 rounded-circle bg-success" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                      Smart Therapy Audio Active
                    </h6>
                    <h4 className="mb-0 fw-bold mt-1" style={{ fontSize: '0.85rem', color: '#ffffff', wordWrap: 'break-word', maxWidth: '300px' }}>
                      {isPlaying ? (currentVideoTitle || currentAction.replace("PLAY_", "").replace(/_/g, " ")) : "Standing By..."}
                    </h4>
                    {isPlaying ? (
                      <span className="badge bg-success bg-opacity-25 text-success mt-2" style={{ fontSize: '0.65rem' }}>Playing until end</span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-25 text-secondary mt-2" style={{ fontSize: '0.65rem' }}>Awaiting triggers</span>
                    )}
                  </div>
                </div>

                {/* Right Column: Interactive Controls */}
                <div className="col-12 col-md-5 ps-md-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    {/* Control Buttons */}
                    <div className="btn-group shadow-sm w-100">
                      <button className="btn btn-primary fw-bold d-flex align-items-center justify-content-center flex-grow-1"
                        onClick={togglePause} disabled={!isPlaying} style={{ fontSize: '0.85rem' }}>
                        {isPaused ? "▶️ RESUME" : "⏸️ PAUSE"}
                      </button>
                      <button className="btn btn-outline-light d-flex align-items-center justify-content-center"
                        onClick={stopMusic} disabled={!isPlaying} style={{ fontSize: '0.85rem', maxWidth: '30%' }}>
                        STOP
                      </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="d-flex align-items-center bg-dark bg-opacity-50 px-3 py-2 rounded-pill w-100">
                      <svg width="18" height="18" fill="white" viewBox="0 0 16 16" className="me-2"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.023 8c0 2.072-.84 3.946-2.197 5.303l.71.707z" /><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89l.706.706z" /><path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" /></svg>
                      <input type="range" className="form-range flex-grow-1 mx-2" min="0" max="100" value={volume} onChange={handleVolumeChange} style={{ height: '4px' }} />
                      <span style={{ fontSize: '0.75rem', color: '#a0a0b8', minWidth: '35px' }}>{volume}%</span>
                    </div>

                    {/* Reset Analysis Button */}
                    <button
                      className="btn btn-sm btn-outline-secondary mt-2 mt-md-0 d-sm-none d-lg-block w-100"
                      onClick={handleResetSession}
                      style={{ fontSize: "0.7rem", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
                    >
                      Reset Analysis Memory
                    </button>
                    <div style={{ display: 'none' }}>{getSeverity(currentAction)}</div>
                  </div>

                  {/* Live System Log */}
                  <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderLeft: '3px solid #6c757d' }}>
                    <div className="d-flex align-items-center" style={{ fontSize: '0.7rem', color: '#c2c2d6' }}>
                      <span className="me-2 text-warning">sys&gt;</span>
                      <span className={therapyStatus.includes('CRITICAL') ? "text-danger fw-bold" : ""}>{therapyStatus}</span>
                    </div>
                  </div>
                </div>

                {/* 3rd Column: Live Track Queue */}
                {isPlaying && upcomingTracks.length > 0 && (
                  <div className="col-12 col-md-3 mt-3 mt-md-0 border-start border-secondary ps-md-3">
                    <h6 className="fw-bold mb-2 text-uppercase d-flex align-items-center" style={{ fontSize: '0.7rem', color: '#a0a0b8', letterSpacing: '1px' }}>
                      <span className="me-2">⭐</span> Upcoming Queue
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {upcomingTracks.map((track, idx) => (
                        <div key={idx} className="d-flex align-items-center bg-dark bg-opacity-25 rounded p-1">
                          <img src={`https://img.youtube.com/vi/${track.id}/default.jpg`} alt="thumb" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px', opacity: 0.6 }} />
                          <div className="ms-2 text-truncate" style={{ fontSize: '0.65rem', color: '#c2c2d6' }}>
                            {track.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="modeSwitch"
                checked={mode === "upload"}
                onChange={handleModeToggle}
              />
              <label className="form-check-label" htmlFor="modeSwitch">
                <strong>
                  {mode === "webcam" ? "Live Webcam Mode" : "Upload Image Mode"}
                </strong>
              </label>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Side - Camera/Upload */}
          <div className={`${isCameraMinimized ? 'col-lg-3 col-md-4' : 'col-lg-7 col-md-6'} mb-3 transition-all`}>
            <div className="card shadow-sm h-100">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0">
                  {mode === "webcam" ? "Live Feed" : "Upload Image"}
                </h6>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setIsCameraMinimized(!isCameraMinimized)}
                  title={isCameraMinimized ? "Maximize Camera" : "Minimize Camera"}
                  style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}
                >
                  {isCameraMinimized ? "Expand" : "Collapse"}
                </button>
              </div>
              <div className="card-body text-center p-2">
                {mode === "webcam" ? (
                  <div>
                    {/* Python-powered MJPEG stream */}
                    <img
                      src="http://127.0.0.1:5000/video_feed"
                      className="w-100 rounded"
                      style={{ objectFit: "cover", background: "#111", minHeight: "240px" }}
                      alt="Live Driver Feed"
                    />
                    {/* Real-time metric badges from /status poll */}
                    {liveStatus && (
                      <div className="d-flex gap-2 mt-2 flex-wrap justify-content-center">
                        <span className={`badge ${liveStatus.ear < 0.22 ? 'bg-danger' : 'bg-success'}`}
                          title="Eye Aspect Ratio">
                          EAR: {liveStatus.ear.toFixed(3)}
                        </span>
                        <span className={`badge ${liveStatus.yawn ? 'bg-warning text-dark' : 'bg-secondary'}`}
                          title="Mouth Aspect Ratio">
                          MAR: {liveStatus.mar.toFixed(3)}{liveStatus.yawn ? ' 💤 Yawning' : ''}
                        </span>
                        <span className={`badge ${liveStatus.alert ? 'bg-danger' : liveStatus.model_status === 'Awake' ? 'bg-success' : 'bg-secondary'}`}>
                          {liveStatus.model_status}
                        </span>
                        <span className="badge bg-info text-dark">
                          {liveStatus.emotion}
                        </span>
                        {!liveStatus.face_detected && (
                          <span className="badge bg-warning text-dark">No Face</span>
                        )}
                      </div>
                    )}
                    <div className="mt-1">
                      <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>
                        Python-powered live stream
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>Select an image for analysis (testing mode)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="form-control form-control-sm mb-2"
                    />
                    {selectedImage && (
                      <div className="mb-2 position-relative">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="img-fluid rounded w-100"
                          style={{ maxHeight: isCameraMinimized ? "120px" : "280px", objectFit: "cover" }}
                        />
                        {loading && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center rounded" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}>
                            <div className="spinner-border text-light mb-2" role="status" style={{ width: '2rem', height: '2rem' }}></div>
                            <small className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>Analyzing...</small>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      className="btn btn-sm btn-primary w-100"
                      onClick={handleAnalyzeUpload}
                      disabled={!selectedImage || loading}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {loading ? "Analyzing..." : "Analyze Image"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard */}
          <div className={`${isCameraMinimized ? 'col-lg-5 col-md-8' : 'col-lg-5 col-md-6'} mb-3 transition-all`}>
            <div className="card shadow-sm h-100 position-relative">
              <div className="card-header bg-primary text-white py-2">
                <h6 className="mb-0">Analysis Dashboard</h6>
              </div>
              <div className="card-body p-3">
                {/* Override Controls Row */}
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label fw-bold mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#6c757d' }}>Emotion Override</label>
                    <select
                      className="form-select form-select-sm"
                      value={manualEmotion}
                      onChange={(e) => setManualEmotion(e.target.value)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <option value="Detect Automatically">Auto Detect</option>
                      <option value="angry">Angry</option>
                      <option value="disgust">Disgust</option>
                      <option value="fear">Fear</option>
                      <option value="happy">Happy</option>
                      <option value="sad">Sad</option>
                      <option value="surprise">Surprise</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#6c757d' }}>Drowsiness Override</label>
                    <select
                      className="form-select form-select-sm"
                      value={manualDrowsiness}
                      onChange={(e) => setManualDrowsiness(e.target.value)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <option value="Detect Automatically">Auto Detect</option>
                      <option value="Drowsy">Drowsy</option>
                      <option value="Awake">Awake</option>
                    </select>
                  </div>
                </div>

                {/* Full-card loading overlay */}
                {loading && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{
                      background: 'rgba(255,255,255,0.82)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 20,
                      borderRadius: 'inherit'
                    }}
                  >
                    <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
                    <span className="fw-semibold text-primary" style={{ fontSize: '0.9rem' }}>Analyzing...</span>
                    <small className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Processing frame via AI models</small>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {responseData ? (
                  <div className="row g-2 mt-2">
                    {/* Status & Risk (Col 1) */}
                    <div className="col-6">
                      <div className="mb-2">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Driver Status:</label>
                        <div className={`alert ${responseData.status === "Drowsy" ? "alert-danger" : "alert-success"} mb-0 p-2 text-center`}>
                          <h6 className="mb-0 fw-bold">{responseData.status}</h6>
                        </div>
                      </div>
                      <div className="mb-1">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Risk Level:</label>
                        <div className={`alert alert-${getRiskColor(responseData.risk_level)} mb-0 p-2 text-center`}>
                          <h6 className="mb-0 fw-bold">{responseData.risk_level}</h6>
                        </div>
                      </div>
                    </div>

                    {/* Emotion & Action (Col 2) */}
                    <div className="col-6">
                      <div className="mb-2">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Detected Emotion:</label>
                        <div className="alert alert-info mb-0 p-2 text-center">
                          <h6 className="mb-0 fw-bold">
                            {responseData.emotion.charAt(0).toUpperCase() + responseData.emotion.slice(1)}
                          </h6>
                        </div>
                      </div>
                      <div className="mb-1">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Recommended Action:</label>
                        <div className={`alert ${responseData.action === "NO_ACTION" ? "alert-secondary" : "alert-warning"} mb-0 p-2 text-center`}>
                          <small className="mb-0 fw-bold d-block" style={{ fontSize: '0.7rem' }}>
                            {responseData.action === "NO_ACTION" ? "No Action Needed" : responseData.action.replace(/_/g, " ")}
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="col-12 mt-1">
                      <div className="alert alert-light border p-2 mb-0 text-center">
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {responseData.message}
                        </small>
                      </div>
                    </div>

                    {responseData.hybrid_decision && (
                      <div className="col-12 mt-1">
                        <div className="alert alert-info border p-2 mb-0">
                          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <small className="fw-bold" style={{ fontSize: '0.72rem' }}>
                              Hybrid Fusion: {responseData.hybrid_decision.status}
                            </small>
                            <small style={{ fontSize: '0.70rem' }}>
                              Risk Prob: {(responseData.hybrid_decision.risk_prob * 100).toFixed(1)}%
                            </small>
                            <small style={{ fontSize: '0.70rem' }}>
                              Disagreement: {(responseData.hybrid_decision.disagreement * 100).toFixed(1)}%
                            </small>
                            <small style={{ fontSize: '0.70rem' }}>
                              Uncertain: {responseData.hybrid_decision.uncertain ? 'Yes' : 'No'}
                            </small>
                          </div>
                          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-1">
                            <small style={{ fontSize: '0.68rem' }}>
                              Emotion Display: {(responseData.emotion || 'neutral').toUpperCase()}
                            </small>
                            <small style={{ fontSize: '0.68rem' }}>
                              Emotion Raw: {(responseData.emotion_raw || responseData.emotion || 'neutral').toUpperCase()}
                            </small>
                            <small style={{ fontSize: '0.68rem' }}>
                              Reason: {responseData.emotion_reason || responseData.hybrid_decision.reason || 'raw'}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !loading && (
                    <div className="text-center text-muted py-4">
                      <p style={{ fontSize: '0.85rem' }}>
                        {mode === "webcam"
                          ? "Waiting for analysis..."
                          : "Upload an image to begin"}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* If minimzed, Timeline moves up to the same row */}
          {isCameraMinimized && (
            <div className="col-lg-4 col-md-12 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                  <h6 className="mb-0">Recent Timeline</h6>
                  <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>Last 1 Min</span>
                </div>
                <div className="card-body p-2">
                  {history.length === 0 ? (
                    <p className="text-muted text-center" style={{ fontSize: '0.8rem' }}>No history data yet.</p>
                  ) : (
                    <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                      <div className="list-group list-group-flush border-start border-primary border-2 ms-1">
                        {[...history].reverse().map((entry, index) => (
                          <div key={index} className="list-group-item list-group-item-action py-1 px-2">
                            <div className="d-flex w-100 justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.8rem' }}>
                                  <span className={`badge bg-${entry.status === 'Drowsy' ? 'danger' : 'success'} me-1`} style={{ fontSize: '0.65rem' }}>
                                    {entry.status}
                                  </span>
                                  {entry.emotion.charAt(0).toUpperCase() + entry.emotion.slice(1)}
                                </h6>
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {entry.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </small>
                            </div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                              {entry.action !== 'NO_ACTION' ? `Action: ${entry.action.replace(/_/g, " ")}` : "No Action"}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts & Bottom Sections row */}
        <div className="row">

          {/* If NOT minimized, Timeline is down here */}
          {!isCameraMinimized && (
            <div className="col-lg-4 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                  <h6 className="mb-0">Recent Timeline</h6>
                  <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>Last 1 Min</span>
                </div>
                <div className="card-body p-2">
                  {history.length === 0 ? (
                    <p className="text-muted text-center">No history data yet.</p>
                  ) : (
                    <div style={{ maxHeight: "350px", overflowY: "auto" }} className="px-2">
                      <div className="list-group list-group-flush border-start border-primary border-3 ms-2">
                        {[...history].reverse().map((entry, index) => (
                          <div key={index} className="list-group-item list-group-item-action py-1 px-2">
                            <div className="d-flex w-100 justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.8rem' }}>
                                  <span className={`badge bg-${entry.status === 'Drowsy' ? 'danger' : 'success'} me-1`} style={{ fontSize: '0.65rem' }}>
                                    {entry.status}
                                  </span>
                                  {entry.emotion.charAt(0).toUpperCase() + entry.emotion.slice(1)}
                                </h6>
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {entry.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </small>
                            </div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                              {entry.action !== 'NO_ACTION' ? `Action: ${entry.action.replace(/_/g, " ")}` : "No Action"}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ADAS Hybrid Physical Signals Chart */}
          <div className={`${isCameraMinimized ? 'col-lg-12' : 'col-lg-8'} mb-3`}>
            <div className="card shadow-sm h-100">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0">ADAS Hybrid Analytics (Live + Historical)</h6>
                <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>70% Physics · 30% Keras</span>
              </div>
              <div className="card-body p-3">
                <div className="alert alert-light border mb-3" role="alert">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <strong style={{ fontSize: '0.78rem' }}>Live AI Explanations</strong>
                    <div className="d-flex gap-2">
                      <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>
                        70% Physics · 30% Keras
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}
                        onClick={exportLiveCsv}
                        disabled={(liveAnalytics?.live_points?.length || 0) === 0}
                        title="Export current live analytics trace as CSV"
                      >
                        Export Live CSV
                      </button>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    {liveExplanations.map((msg, idx) => (
                      <small key={idx} className="d-block" style={{ fontSize: '0.72rem' }}>
                        {idx + 1}. {msg}
                      </small>
                    ))}
                    <small className="d-block mt-1" style={{ fontSize: '0.70rem' }}>
                      Prediction affects decisions: {predictionIsDrivingDecision ? 'Yes (future-risk trigger active now).' : 'Yes (logic active; no current danger forecast).'}
                    </small>
                  </div>
                </div>

                {experimentSummary && (
                  <div className="alert alert-secondary border mb-3 py-2" role="alert">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <small style={{ fontSize: '0.70rem' }}><strong>Live Experiment Window:</strong> {Math.round(experimentSummary.durationSec)}s</small>
                      <small style={{ fontSize: '0.70rem' }}><strong>Avg Risk:</strong> {experimentSummary.avgRiskPct.toFixed(1)}%</small>
                      <small style={{ fontSize: '0.70rem' }}><strong>High-Risk Windows/hour:</strong> {experimentSummary.highRiskPerHour.toFixed(1)}</small>
                      <small style={{ fontSize: '0.70rem' }}><strong>Uncertain %:</strong> {experimentSummary.uncertainPct.toFixed(1)}%</small>
                      <small style={{ fontSize: '0.70rem' }}><strong>Drowsy Transitions:</strong> {experimentSummary.drowsyTransitions}</small>
                    </div>
                  </div>
                )}

                <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Fused Risk (1s) + Prediction Overlay</h6>
                <div style={{ width: '100%', height: 210 }} className="mb-3">
                  {liveRiskChartData.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 rounded border" style={{ borderStyle: 'dashed' }}>
                      <small className="text-muted">Waiting for 1-second live analytics stream...</small>
                    </div>
                  ) : (
                    <ResponsiveContainer>
                      <ComposedChart data={liveRiskChartData} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area type="monotone" dataKey="Confidence Base" stackId="conf" stroke="none" fillOpacity={0} connectNulls />
                        <Area type="monotone" dataKey="Confidence Range" stackId="conf" stroke="none" fill="#0d6efd" fillOpacity={0.12} connectNulls name="Confidence Envelope" />
                        <Line type="monotone" dataKey="Live Fused Risk" stroke="#0d6efd" strokeWidth={2.5} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey="Predicted Risk" stroke="#6610f2" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
                        <Line type="monotone" dataKey="Uncertain Marker" stroke="none" dot={{ r: 5, fill: '#dc3545', strokeWidth: 0 }} isAnimationActive={false} connectNulls={false} name="Uncertain Points" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Physical Signals (1s): EAR · MAR · Disagreement</h6>
                <div style={{ width: '100%', height: 180 }} className="mb-3">
                  {liveSignalChartData.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 rounded border" style={{ borderStyle: 'dashed' }}>
                      <small className="text-muted">Waiting for live EAR/MAR signal buffer...</small>
                    </div>
                  ) : (
                    <ResponsiveContainer>
                      <LineChart data={liveSignalChartData} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="EAR" stroke="#198754" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="MAR" stroke="#fd7e14" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Disagreement %" stroke="#6c757d" strokeDasharray="4 4" strokeWidth={1.8} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <small className="text-muted d-block mb-2" style={{ fontSize: '0.70rem' }}>
                  Live Fused Risk = observed hybrid risk now. Predicted Risk = backend projection for current/future minutes. EAR lower and MAR higher generally indicate rising drowsiness.
                </small>

                <hr className="my-3" />
                <h6 className="fw-semibold text-secondary mb-2" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Historical Summary (Per Minute)</h6>

                {!responseData || chartData.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px' }}>
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="text-muted text-center">Waiting for first complete minute of data...</p>
                    <small className="text-muted">Charts populate after ~{Math.round(60 / (60 / 20))}s of monitoring</small>
                  </div>
                ) : (
                  <>
                    {/* Chart 1: Hybrid Risk Score Area */}
                    <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hybrid Risk Score (0–100)</h6>
                    <div style={{ width: '100%', height: 180 }} className="mb-3">
                      <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
                          <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc3545" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#dc3545" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="" />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '12px' }}
                            formatter={(value: any) => {
                              const v = Number(value || 0);
                              const badge = v > 60 ? '🚨 CRITICAL' : v > 35 ? '⚠️ WARNING' : '✅ NORMAL';
                              return [`${v.toFixed(1)} / 100  ${badge}`, 'Hybrid Risk Score'];
                            }}
                          />
                          <Area type="monotone" dataKey="Risk Score" stroke="#dc3545" strokeWidth={2.5} fill="url(#riskGrad)" dot={{ r: 4, fill: '#dc3545' }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Fused Risk %" stroke="#212529" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} connectNulls />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 2: PERCLOS + Yawn % combined */}
                    <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PERCLOS (Eye Closure %) &amp; Yawn % per Minute</h6>
                    <div style={{ width: '100%', height: 185 }} className="mb-3">
                      <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
                          <defs>
                            <linearGradient id="perclosGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#0d6efd" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="yawnGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#fd7e14" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 50]} tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '12px' }}
                            formatter={(value: any, name: any) => {
                              const v = Number(value || 0);
                              if (name === 'PERCLOS %') return [`${v.toFixed(1)}%  ${v >= 15 ? '🚨 Microsleep zone' : v >= 8 ? '⚠️ Elevated' : '✅ Normal'}`, 'PERCLOS (Eye Closure)'];
                              return [`${v.toFixed(1)}%  ${v >= 25 ? '🥱 Heavy yawning' : '✅ Normal'}`, 'Yawn %'];
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Area type="monotone" dataKey="PERCLOS %" stroke="#0d6efd" strokeWidth={2} fill="url(#perclosGrad)" dot={{ r: 3 }} />
                          <Area type="monotone" dataKey="Yawn %" stroke="#fd7e14" strokeWidth={2} fill="url(#yawnGrad)" dot={{ r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 3: Microsleeps + Fatigue Streak event bars */}
                    <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Micro-sleep Events &amp; Max Fatigue Streak</h6>
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '11px' }}
                            formatter={(value: any, name: any) => {
                              if (name === 'Micro-sleeps') return [value, 'Micro-sleeps (PERCLOS ≥15%%)'];
                              return [value, 'Max Consecutive Fatigue Records'];
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="Micro-sleeps" stroke="#dc3545" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="stepAfter" dataKey="Fatigue Streak" stroke="#fd7e14" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
