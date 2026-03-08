import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AnalysisInsights from "./AnalysisInsights";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// API Response Interface
interface ApiResponse {
  status: "Drowsy" | "Awake" | string;
  emotion: string;
  risk_level: string;
  action: string;
  message: string;
  minute_analysis?: MinuteAnalysis[];
  current_minute_prediction?: CurrentMinutePrediction[];
  current_minute_metrics?: MinuteAnalysis["metrics"];
  future_predictions?: FuturePrediction[];
  insights?: string[];
  frontend_ear?: number;
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
    drowsyPercentage: number;
    microSleeps: number;
    maxConsecutiveDrowsy: number;
  };
}

interface FuturePrediction {
  minute: number;
  x: number;
  label: string;
  predictedDrowsiness: number;
}

interface CurrentMinutePrediction {
  label: string;
  x: number;
  cPct: number;
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

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const continuousAlarmRef = useRef<number | null>(null);
  const lastVoiceWarningRef = useRef<number>(0);
  const lastPlayedRef = useRef<{ [key: string]: number }>({});
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const initializeLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.x/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
        console.log("MediaPipe Dual-Way Vision loaded!");
      } catch (e) {
        console.error("Failed to load FaceLandmarker", e);
      }
    };
    initializeLandmarker();
  }, []);

  const API_URL = "http://127.0.0.1:5000/analyze";

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
    const anomalyStreak = responseData.current_minute_metrics?.maxConsecutiveDrowsy || 0;
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
            infoText = "⚠️ PATTERN WARNING: Drowsiness streak rising. Smoothly scaling volume UP (80%)...";
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

  // Capture from webcam
  const captureFromWebcam = useCallback(() => {
    if (webcamRef.current) {
      let frontendEar: number | null = null;

      // Dual-way local vision check
      if (faceLandmarker && webcamRef.current.video && webcamRef.current.video.readyState >= 2) {
        try {
          const results = faceLandmarker.detectForVideo(webcamRef.current.video, performance.now());
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const pt = (idx: number) => landmarks[idx];
            const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const calcEAR = (eye: number[]) => {
              const v1 = dist(pt(eye[1]), pt(eye[5]));
              const v2 = dist(pt(eye[2]), pt(eye[4]));
              const h = dist(pt(eye[0]), pt(eye[3]));
              return (v1 + v2) / (2.0 * h);
            };
            const leftEar = calcEAR([362, 385, 387, 263, 373, 380]);
            const rightEar = calcEAR([33, 160, 158, 133, 153, 144]);
            frontendEar = (leftEar + rightEar) / 2.0;
          }
        } catch (e) {
          console.error("Dual-way vision failed:", e);
        }
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to blob
        fetch(imageSrc)
          .then((res) => res.blob())
          .then((blob) => {
            analyzeImage(blob, frontendEar);
          })
          .catch((err: Error) => {
            console.error("Failed to capture image:", err);
            setError("Failed to capture image from webcam");
            setTherapyStatus(`Failed to capture image: ${err.message}`);
          });
      }
    }
  }, [analyzeImage, faceLandmarker]);

  useEffect(() => {
    if (mode === "webcam") {
      intervalRef.current = window.setInterval(() => {
        captureFromWebcam();
      }, 3000);
      setTherapyStatus("Webcam mode active. Auto-capturing every 3 seconds.");
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTherapyStatus("Upload mode active. Awaiting image upload.");
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, captureFromWebcam]);

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

  // Get latest metrics (Completed minute OR Current live minute)
  const currentMetrics = responseData?.current_minute_metrics || responseData?.minute_analysis?.[responseData.minute_analysis.length - 1]?.metrics;

  // Format data for Recharts - actual trends + Live point
  const chartData = useMemo(() => {
    if (!responseData) return [];

    // Existing completed minutes
    const data = (responseData.minute_analysis || []).map(m => ({
      name: m.label,
      Drowsiness: m.metrics.drowsyPercentage,
      MicroSleeps: m.metrics.microSleeps,
      MaxStreak: m.metrics.maxConsecutiveDrowsy,
    }));

    // Add Live point for the current partial minute
    if (responseData.current_minute_metrics) {
      const curMin = (responseData.minute_analysis && responseData.minute_analysis.length > 0)
        ? responseData.minute_analysis[responseData.minute_analysis.length - 1].minute + 1
        : 1;

      data.push({
        name: `Min ${curMin} (Live)`,
        Drowsiness: responseData.current_minute_metrics.drowsyPercentage,
        MicroSleeps: responseData.current_minute_metrics.microSleeps,
        MaxStreak: responseData.current_minute_metrics.maxConsecutiveDrowsy,
      });
    }

    return data;
  }, [responseData]);

  // Build combined prediction chart dataset using NUMERIC x axis
  // actual/future → integer x (1,2,3...), current-minute → fractional x (2.05, 2.15...)
  // This ensures the orange section is always visually distinct between two whole minutes.
  const predictionChartData = useMemo(() => {
    const actualMins = responseData?.minute_analysis || [];
    const currentPreds = (responseData?.current_minute_prediction || []) as CurrentMinutePrediction[];
    const futurePreds = (responseData?.future_predictions || []) as FuturePrediction[];

    if (actualMins.length === 0 && currentPreds.length === 0) return [];

    type Point = { x: number; label: string; actual: number | null; current: number | null; future: number | null };
    const map = new Map<number, Point>();

    const upsert = (x: number, label: string, patch: Partial<Omit<Point, 'x' | 'label'>>) => {
      const key = Math.round(x * 1000) / 1000; // avoid 1.10000000000001 != 1.1
      const existing = map.get(key) ?? { x: key, label, actual: null, current: null, future: null };
      map.set(key, { ...existing, ...patch });
    };

    // Section 1 – completed actual minutes (integer x)
    actualMins.forEach(m => upsert(m.x ?? m.minute, m.label, { actual: m.metrics.drowsyPercentage }));

    // Section 2 – current-minute live prediction (fractional x for intermediate, integer for overlap/end)
    currentPreds.forEach(p => upsert(p.x, p.label, { current: p.cPct }));

    // Bridge: last actual point also carries 'current' so the orange line starts from there
    if (actualMins.length > 0 && currentPreds.length > 0) {
      const lastActualX = actualMins[actualMins.length - 1].x ?? actualMins[actualMins.length - 1].minute;
      const pt = map.get(lastActualX);
      if (pt && pt.current === null) pt.current = pt.actual;
    }

    // Section 3 – future minutes (integer x)
    futurePreds.forEach((p, i) => {
      // Bridge first future point from last current or actual
      if (i === 0) {
        const allPts = Array.from(map.values()).sort((a, b) => a.x - b.x);
        const lastPt = allPts[allPts.length - 1];
        if (lastPt && lastPt.x !== p.x) {
          lastPt.future = lastPt.current ?? lastPt.actual;
          map.set(lastPt.x, lastPt);
        }
      }
      upsert(p.x, p.label, { future: p.predictedDrowsiness });
    });

    return Array.from(map.values()).sort((a, b) => a.x - b.x);
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
                      <span className="fs-3" style={{ opacity: 0.5 }}>🔈</span>
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
                        {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
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
                      <span className="me-2">⏭</span> Upcoming Queue
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
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-100 rounded"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user",
                      }}
                    />
                    <div className="mt-2">
                      <span className="badge bg-info" style={{ fontSize: '0.7rem' }}>
                        Auto-capturing every 3s
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

          {/* 5 Minute Analysis Trends Chart Card (Right Side) */}
          <div className={`${isCameraMinimized ? 'col-lg-12' : 'col-lg-8'} mb-3`}>
            <div className="card shadow-sm h-100">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0">Research Analysis (Backend Powered)</h6>
                <span className="badge bg-light text-dark" style={{ fontSize: '0.65rem' }}>5-Min Trends</span>
              </div>
              <div className="card-body p-3">
                {!responseData ? (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px' }}>
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="text-muted text-center">Waiting for first analysis result...</p>
                  </div>
                ) : (
                  <>
                    {/* Current Minute Metrics Summary */}
                    {currentMetrics && (
                      <div className="row mb-4 bg-light p-3 rounded mx-0 shadow-sm">
                        <div className="col-4 text-center border-end">
                          <h6 className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                            Latest Drowsiness (Min {responseData?.minute_analysis?.[responseData.minute_analysis.length - 1]?.minute ?? '?'})
                          </h6>
                          <h3 className={currentMetrics.drowsyPercentage > 20 ? "text-danger" : "text-success"}>
                            {currentMetrics.drowsyPercentage.toFixed(1)}%
                          </h3>
                        </div>
                        <div className="col-4 text-center border-end">
                          <h6 className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                            Latest Micro-sleeps (Min {responseData?.minute_analysis?.[responseData.minute_analysis.length - 1]?.minute ?? '?'})
                          </h6>
                          <h3 className={currentMetrics.microSleeps > 0 ? "text-warning" : "text-success"}>
                            {currentMetrics.microSleeps}
                          </h3>
                        </div>
                        <div className="col-4 text-center">
                          <h6 className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                            Latest Max Streak (Min {responseData?.minute_analysis?.[responseData.minute_analysis.length - 1]?.minute ?? '?'})
                          </h6>
                          <h3 className={currentMetrics.maxConsecutiveDrowsy >= 3 ? "text-danger" : "text-success"}>
                            {currentMetrics.maxConsecutiveDrowsy}
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Trends Charts using Recharts */}
                    <div className="row">
                      <div className="col-12 col-lg-6 mb-4">
                        <h6 className="text-center fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Drowsiness Percentage Trend</h6>
                        <div style={{ width: '100%', height: 200 }}>
                          <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                formatter={(value: any) => {
                                  const val = Number(value || 0);
                                  const status = val > 50 ? "🚨 Dangerous" : val > 20 ? "⚠️ Warning" : "✅ Normal";
                                  return [`${val}% (${status})`, "Drowsiness"];
                                }}
                              />
                              <Line type="monotone" dataKey="Drowsiness" stroke="#dc3545" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6 mb-4">
                        <h6 className="text-center fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Risk Indicators Trend</h6>
                        <div style={{ width: '100%', height: 200 }}>
                          <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                              <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                formatter={(value: any, name: any) => {
                                  const val = Number(value || 0);
                                  if (name === "Micro Sleeps") {
                                    return [val, `${name} (Short unintentional sleep)`];
                                  }
                                  return [val, `${name} (Max consecutive drowsy records)`];
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px" }} />
                              <Line type="monotone" name="Micro Sleeps" dataKey="MicroSleeps" stroke="#ffc107" strokeWidth={2} />
                              <Line type="stepAfter" name="Max Drowsy Streak" dataKey="MaxStreak" stroke="#fd7e14" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Prediction Chart - Full Width, 3 Sections */}
                    {predictionChartData.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-center fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>
                          Drowsiness Prediction &nbsp;
                          <span className="badge me-1" style={{ background: '#dc3545', fontSize: '0.65rem' }}>Actual</span>
                          <span className="badge me-1" style={{ background: '#fd7e14', fontSize: '0.65rem' }}>Live (Current Min)</span>
                          <span className="badge" style={{ background: '#6f42c1', fontSize: '0.65rem' }}>Forecast ···</span>
                        </h6>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <LineChart data={predictionChartData} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="x"
                                type="number"
                                scale="linear"
                                domain={['dataMin', (dataMax: number) => Math.max(5, dataMax)]}
                                tickFormatter={(v: number) => Number.isInteger(v) ? `Min ${v}` : ''}
                                tick={{ fontSize: 10 }}
                                allowDecimals
                                padding={{ left: 10, right: 10 }}
                              />
                              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                              <Tooltip
                                labelFormatter={(v) => {
                                  const pt = predictionChartData.find(p => p.x === v);
                                  return pt?.label ?? `x=${v}`;
                                }}
                                formatter={(value, name) => {
                                  const label = name === 'actual' ? '🔴 Actual' : name === 'current' ? '🟠 Live Pred.' : '🟣 Forecast';
                                  return [`${value ?? '-'}%`, label];
                                }}
                              />
                              <Legend
                                content={() => (
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '10px', marginTop: '2px' }}>
                                    <span><span style={{ display: 'inline-block', width: 12, height: 3, background: '#dc3545', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>Actual</span>
                                    <span><span style={{ display: 'inline-block', width: 12, height: 3, background: '#fd7e14', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>Live (current min)</span>
                                    <span><span style={{ display: 'inline-block', width: 12, height: 3, background: '#6f42c1', borderRadius: 2, marginRight: 4, verticalAlign: 'middle', borderTop: '2px dashed #6f42c1' }}></span>Future Forecast</span>
                                  </div>
                                )}
                              />
                              {/* Section 1: Actual completed-minute data */}
                              <Line type="monotone" dataKey="actual" name="actual"
                                stroke="#dc3545" strokeWidth={2.5}
                                dot={{ r: 4 }} activeDot={{ r: 6 }}
                                connectNulls={false} />
                              {/* Section 2: Current-minute live prediction */}
                              <Line type="monotone" dataKey="current" name="current"
                                stroke="#fd7e14" strokeWidth={2.5}
                                dot={{ r: 3, fill: '#fd7e14' }} activeDot={{ r: 5 }}
                                connectNulls={false} />
                              {/* Section 3: Future-minutes forecast */}
                              <Line type="monotone" dataKey="future" name="future"
                                stroke="#6f42c1" strokeWidth={2.5}
                                strokeDasharray="7 4"
                                dot={{ r: 3, fill: '#6f42c1' }} activeDot={{ r: 5 }}
                                connectNulls={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {/* Human Friendly Insights Section */}
                    <AnalysisInsights
                      insights={responseData?.insights || []}
                      structured={responseData?.structured_analysis}
                      frontendEar={responseData?.frontend_ear}
                    />
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
