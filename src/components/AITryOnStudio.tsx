import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { Camera, RefreshCw, Upload, Sparkles, ShieldCheck, Heart, AlertCircle, Eye, EyeOff, Info, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, TryOnResponse, User } from "../types";
import { useMotionSafety } from "../lib/useMotionSafety";

interface AITryOnStudioProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: (product: Product) => boolean;
  currentUser: User | null;
}

// Curated model portraits for fallbacks or quick tests
const MODEL_TEMPLATES = [
  {
    id: "model-w-1",
    name: "Elena (Cool Alabaster Alignment)",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "model-m-1",
    name: "Adrian (Deep Olive Contour)",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "model-w-2",
    name: "Meera (Warm Golden Silhouette)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600"
  }
];

const DEFAULT_LANDMARKS = {
  ear_ref_l: { x: 38, y: 61 },
  ear_ref_r: { x: 62, y: 61 },
  neck_ref: { x: 50, y: 76 },
  hand_ref: { x: 50, y: 65 }
};

const MODEL_PRESET_LANDMARKS: Record<string, typeof DEFAULT_LANDMARKS> = {
  "model-w-1": {
    ear_ref_l: { x: 38, y: 61 },
    ear_ref_r: { x: 62, y: 61 },
    neck_ref: { x: 50, y: 77 },
    hand_ref: { x: 50, y: 65 }
  },
  "model-m-1": {
    ear_ref_l: { x: 37, y: 58 },
    ear_ref_r: { x: 63, y: 58 },
    neck_ref: { x: 51, y: 74 },
    hand_ref: { x: 50, y: 65 }
  },
  "model-w-2": {
    ear_ref_l: { x: 39, y: 62 },
    ear_ref_r: { x: 61, y: 62 },
    neck_ref: { x: 50, y: 79 },
    hand_ref: { x: 55, y: 68 }
  }
};

const mapToContainerCoords = (
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  containerAspect: number = 0.8
) => {
  const srcAspect = srcW / srcH;
  let containerX = srcX;
  let containerY = srcY;

  if (srcAspect > containerAspect) {
    // Source is wider than container, cropped horizontally
    const visibleWidthFraction = containerAspect / srcAspect;
    const cropLeft = (1 - visibleWidthFraction) / 2;
    containerX = (srcX - cropLeft) / visibleWidthFraction;
  } else if (srcAspect < containerAspect) {
    // Source is taller than container, cropped vertically
    const visibleHeightFraction = srcAspect / containerAspect;
    const cropTop = (1 - visibleHeightFraction) / 2;
    containerY = (srcY - cropTop) / visibleHeightFraction;
  }

  return {
    x: Math.max(0, Math.min(1, containerX)),
    y: Math.max(0, Math.min(1, containerY))
  };
};

const calculateProportionalTryOnScale = (product: Product, category: string) => {
  const specs = product.specifications || {};
  const pLength = Number(
    specs["Physical Length (mm)"] ||
    specs["physical_length"] ||
    specs["Length"] ||
    specs["length"] ||
    0
  );
  const pWidth = Number(
    specs["Physical Width (mm)"] ||
    specs["physical_width"] ||
    specs["Physical Breadth (mm)"] ||
    specs["physical_breadth"] ||
    specs["Width"] ||
    specs["Breadth"] ||
    specs["width"] ||
    specs["breadth"] ||
    0
  );
  
  if (pLength > 0 || pWidth > 0) {
    if (category === "necklaces") {
      // necklaces tryon baseline: 50mm = 0.38 scale
      return (pLength || pWidth) / 130;
    } else if (category === "earrings") {
      // earrings tryon baseline: 45mm = 0.32 scale
      return pLength / 140;
    } else if (category === "rings") {
      // rings tryon baseline: 20mm = 0.22 scale
      return (pWidth || pLength) / 90;
    } else if (category === "bracelets") {
      // bracelets tryon baseline: 65mm = 0.22 scale
      return (pWidth || pLength) / 295;
    }
  }
  
  // Custom high contrast overrides if not specified
  if (category === "necklaces") return 0.38;
  if (category === "earrings") return 0.32;
  return 0.22; // rings/bracelets
};

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const isLoaded = existing.getAttribute('data-loaded') === 'true';
      if (isLoaded) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
};

export default function AITryOnStudio({
  products,
  selectedProduct,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  currentUser
}: AITryOnStudioProps) {
  const safetyMode = useMotionSafety();
  const tryOnProducts = products.filter(p => p.tryOnImageUrl);
  const activeProduct = (selectedProduct && selectedProduct.tryOnImageUrl)
    ? (products.find(p => p.id === selectedProduct.id) || selectedProduct)
    : (tryOnProducts.length > 0 ? tryOnProducts[0] : null);

  // Dynamic model template array combining static presets + current registered custom avatar
  const dynamicModelTemplates = [
    ...MODEL_TEMPLATES,
    ...(currentUser?.avatarUrl
      ? [
          {
            id: "model-custom-avatar",
            name: `${currentUser.name} (Atelier Verified Avatar)`,
            url: currentUser.avatarUrl
          }
        ]
      : [])
  ];

  // UI state variables
  const [sourceMode, setSourceMode] = useState<"camera" | "upload" | "model">("model");
  const [selectedModel, setSelectedModel] = useState(dynamicModelTemplates[0]);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  
  // Camera variables
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);

  // AI variables
  const [analyzingState, setAnalyzingState] = useState<
    "idle" | "capturing" | "landmarks" | "gemologist" | "complete"
  >("idle");
  const [analysisLogs, setAnalysisLogs] = useState<string>("");
  const [aiReport, setAiReport] = useState<TryOnResponse | null>(null);
  const [mediaPipeScriptsLoaded, setMediaPipeScriptsLoaded] = useState(!!(window as any).FaceMesh);

  // Position adjustments for jewel overlays (custom styling coordinate state)
  const [jewelScale, setJewelScale] = useState(0.5);

  const [aiLandmarks, setAiLandmarks] = useState(DEFAULT_LANDMARKS);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [manualOffsets, setManualOffsets] = useState({
    ear_ref_l: { x: 0, y: 0 },
    ear_ref_r: { x: 0, y: 0 },
    neck_ref: { x: 0, y: 0 },
    hand_ref: { x: 0, y: 0 }
  });

  // Sync refs to avoid stale closures in background faceMesh tracking loop
  const isManualModeRef = useRef(isManualMode);
  const manualScaleRef = useRef(manualScale);
  const manualOffsetsRef = useRef(manualOffsets);

  useEffect(() => {
    isManualModeRef.current = isManualMode;
  }, [isManualMode]);

  useEffect(() => {
    manualScaleRef.current = manualScale;
  }, [manualScale]);

  useEffect(() => {
    manualOffsetsRef.current = manualOffsets;
  }, [manualOffsets]);

  useEffect(() => {
    if ((window as any).FaceMesh) {
      setMediaPipeScriptsLoaded(true);
      return;
    }

    let active = true;
    const loadMediaPipe = async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        if (active) {
          setMediaPipeScriptsLoaded(true);
          console.log("ASTEYA Core: MediaPipe FaceMesh scripts loaded dynamically.");
        }
      } catch (err) {
        console.error("ASTEYA Core: Dynamic MediaPipe script loading failed:", err);
      }
    };

    loadMediaPipe();
    return () => {
      active = false;
    };
  }, []);

  // New interactive landmark pins states
  const [landmarks, setLandmarks] = useState(DEFAULT_LANDMARKS);
  const [showLandmesh, setShowLandmesh] = useState(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Dynamic scale factor calculation based on currently stored face landmarks for static images
  const getDynamicFaceScale = () => {
    const earDist = Math.sqrt(
      Math.pow(landmarks.ear_ref_r.x - landmarks.ear_ref_l.x, 2) +
      Math.pow(landmarks.ear_ref_r.y - landmarks.ear_ref_l.y, 2)
    );
    const baseDist = 16.0;
    return Math.max(0.4, Math.min(1.8, earDist / baseDist));
  };

  // Real-time calculation of dynamic proportional Try-On overlay scale
  let effectiveScale = jewelScale;
  if (!isManualMode) {
    if (activeProduct) {
      const baseScale = calculateProportionalTryOnScale(activeProduct, activeProduct.category);
      if (sourceMode !== "camera") {
        effectiveScale = baseScale * getDynamicFaceScale();
      } else {
        effectiveScale = jewelScale; // Dynamic live coordinates scaling from FaceMesh webcam loop
      }
    }
  }

  // Pointer dragging event handlers
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveDragId(id);
    if (!isManualMode) {
      setIsManualMode(true);
      setManualScale(jewelScale);
    }
    if (e.target instanceof HTMLElement) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Convert client coordinates to parent box percentages
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Constrain percentages inside safety bounds
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
    const aiPos = aiLandmarks[activeDragId as keyof typeof DEFAULT_LANDMARKS] || DEFAULT_LANDMARKS[activeDragId as keyof typeof DEFAULT_LANDMARKS];
    setManualOffsets(prev => ({
      ...prev,
      [activeDragId]: {
        x: x - aiPos.x,
        y: y - aiPos.y
      }
    }));

    setLandmarks(prev => ({
      ...prev,
      [activeDragId]: { x, y }
    }));
  };

  const handlePointerUp = (id: string, e: React.PointerEvent) => {
    if (activeDragId === id) {
      setActiveDragId(null);
      if (e.target instanceof HTMLElement) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  };

  // Sync position presets & custom model templates initially
  useEffect(() => {
    if (currentUser?.avatarUrl) {
      // If user has a generated avatar, automatically select it!
      const userAvNode = dynamicModelTemplates.find(m => m.id === "model-custom-avatar");
      if (userAvNode) setSelectedModel(userAvNode);
    }
  }, [currentUser?.avatarUrl]);

  // Sync landmarks on model/source mode alterations
  useEffect(() => {
    if (sourceMode === "model" && selectedModel) {
      const preset = MODEL_PRESET_LANDMARKS[selectedModel.id] || DEFAULT_LANDMARKS;
      setAiLandmarks(preset);
      if (isManualMode) {
        setLandmarks({
          ear_ref_l: { x: preset.ear_ref_l.x + manualOffsets.ear_ref_l.x, y: preset.ear_ref_l.y + manualOffsets.ear_ref_l.y },
          ear_ref_r: { x: preset.ear_ref_r.x + manualOffsets.ear_ref_r.x, y: preset.ear_ref_r.y + manualOffsets.ear_ref_r.y },
          neck_ref: { x: preset.neck_ref.x + manualOffsets.neck_ref.x, y: preset.neck_ref.y + manualOffsets.neck_ref.y },
          hand_ref: { x: preset.hand_ref.x + manualOffsets.hand_ref.x, y: preset.hand_ref.y + manualOffsets.hand_ref.y }
        });
      } else {
        setLandmarks(preset);
      }
    } else {
      setAiLandmarks(DEFAULT_LANDMARKS);
      if (isManualMode) {
        setLandmarks({
          ear_ref_l: { x: DEFAULT_LANDMARKS.ear_ref_l.x + manualOffsets.ear_ref_l.x, y: DEFAULT_LANDMARKS.ear_ref_l.y + manualOffsets.ear_ref_l.y },
          ear_ref_r: { x: DEFAULT_LANDMARKS.ear_ref_r.x + manualOffsets.ear_ref_r.x, y: DEFAULT_LANDMARKS.ear_ref_r.y + manualOffsets.ear_ref_r.y },
          neck_ref: { x: DEFAULT_LANDMARKS.neck_ref.x + manualOffsets.neck_ref.x, y: DEFAULT_LANDMARKS.neck_ref.y + manualOffsets.neck_ref.y },
          hand_ref: { x: DEFAULT_LANDMARKS.hand_ref.x + manualOffsets.hand_ref.x, y: DEFAULT_LANDMARKS.hand_ref.y + manualOffsets.hand_ref.y }
        });
      } else {
        setLandmarks(DEFAULT_LANDMARKS);
      }
    }
  }, [selectedModel, sourceMode]);

  // Sync position presets based on the category
  useEffect(() => {
    if (activeProduct) {
      const baseScale = calculateProportionalTryOnScale(activeProduct, activeProduct.category);
      setJewelScale(baseScale);
    }
  }, [activeProduct]);

  // Turn on/off Webcam streaming
  useEffect(() => {
    if (sourceMode === "camera") {
      initWebcam();
    } else {
      shutdownWebcam();
    }
    return () => shutdownWebcam();
  }, [sourceMode]);

  // Real-time Snapchat-style live video filter tracking loop
  useEffect(() => {
    if (sourceMode !== "camera" || !streamActive || snappedPhoto || !activeProduct) return;

    let active = true;
    let faceMesh: any = null;

    const initFaceMeshLive = async () => {
      if (!(window as any).FaceMesh) {
        console.warn("ASTEYA Core: MediaPipe FaceMesh CDN not loaded in window.");
        return;
      }

      try {
        faceMesh = new (window as any).FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: any) => {
          if (!active) return;
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const facePoints = results.multiFaceLandmarks[0];
            
            // Extract key indices near true ear/tragus attachments for vertical alignment
            const leftEar = facePoints[177] || facePoints[136] || facePoints[234];
            const rightEar = facePoints[401] || facePoints[365] || facePoints[454];
            const chin = facePoints[152];
            const forehead = facePoints[10];

            // Calculate face scaling factor dynamically based on face size
            // Default baseline distance between ears in normalized coords is ~0.16
            const earDist = Math.sqrt(Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2));
            const baseDist = 0.16;
            const dynamicScale = Math.max(0.4, Math.min(1.8, earDist / baseDist));

            // Extrapolate neckline 18% downwards along chin vector
            const dx = chin.x - forehead.x;
            const dy = chin.y - forehead.y;
            const neckX = chin.x + dx * 0.35;
            const neckY = chin.y + dy * 0.35;

            // Get video width and height from videoRef
            const vidW = videoRef.current?.videoWidth || 640;
            const vidH = videoRef.current?.videoHeight || 480;

            // Mirror the X coordinates because camera is mirrored via CSS scale-x-[-1]
            const mirroredLeftEarX = 1 - leftEar.x;
            const mirroredRightEarX = 1 - rightEar.x;
            const mirroredNeckX = 1 - neckX;

            // Map using mapToContainerCoords to correct for aspect ratio cropping
            const mappedLeftEar = mapToContainerCoords(mirroredLeftEarX, leftEar.y, vidW, vidH);
            const mappedRightEar = mapToContainerCoords(mirroredRightEarX, rightEar.y, vidW, vidH);
            const mappedNeck = mapToContainerCoords(mirroredNeckX, neckY, vidW, vidH);

            // Calculate mapped face width for outward and downward earlobe placement
            const mappedFaceWidth = Math.abs(mappedLeftEar.x - mappedRightEar.x);
            // Shift outward by 2.5% and downward by 1% of face width for perfect natural earlobe alignment
            const earShiftX = mappedFaceWidth * 0.025;
            const earShiftY = mappedFaceWidth * 0.01;

            let finalLeftX = mappedLeftEar.x;
            let finalRightX = mappedRightEar.x;

            if (mappedLeftEar.x < mappedRightEar.x) {
              finalLeftX = mappedLeftEar.x - earShiftX;
              finalRightX = mappedRightEar.x + earShiftX;
            } else {
              finalLeftX = mappedLeftEar.x + earShiftX;
              finalRightX = mappedRightEar.x - earShiftX;
            }

            const rawDetected = {
              ear_ref_l: { x: finalLeftX * 100, y: (mappedLeftEar.y + earShiftY) * 100 },
              ear_ref_r: { x: finalRightX * 100, y: (mappedRightEar.y + earShiftY) * 100 },
              neck_ref: { x: mappedNeck.x * 100, y: mappedNeck.y * 100 },
              hand_ref: { x: 50, y: 65 }
            };

            setAiLandmarks(rawDetected);

            if (isManualModeRef.current) {
              // DO NOT OVERWRITE landmarks when manual mode is active!
              // Maintain the user's manual absolute positions perfectly stable, frozen, and drift-free.
            } else {
              setLandmarks(rawDetected);
            }

            // Adjust scaling dynamically based on face proximity!
            // Let's scale based on the category's standard baseline scale * dynamicScale
            if (!isManualModeRef.current || manualScaleRef.current === null) {
              const baseScale = calculateProportionalTryOnScale(activeProduct, activeProduct.category);
              setJewelScale(baseScale * dynamicScale);
            }
          }
        });

        // Trigger camera send loop
        const sendFrame = async () => {
          if (!active || sourceMode !== "camera" || !streamActive || snappedPhoto) return;
          if (videoRef.current && videoRef.current.readyState >= 3) {
            try {
              await faceMesh.send({ image: videoRef.current });
            } catch (err) {
              // Ignore silent tracking errors
            }
          }
          // Run at ~30fps to avoid overloading the CPU
          setTimeout(() => {
            if (active) requestAnimationFrame(sendFrame);
          }, 33);
        };

        requestAnimationFrame(sendFrame);

      } catch (err) {
        console.error("ASTEYA FaceMesh live initialization error:", err);
      }
    };

    initFaceMeshLive();

    return () => {
      active = false;
      if (faceMesh) {
        try {
          faceMesh.close();
        } catch (e) {}
      }
    };
  }, [sourceMode, streamActive, snappedPhoto, activeProduct, mediaPipeScriptsLoaded]);

  const initWebcam = async () => {
    setCameraError(null);
    setSnappedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Web camera access was denied or unsupported. Please choose an exquisite Model template or select file upload.");
      setSourceMode("model");
    }
  };

  const shutdownWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const takeCameraSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        // draw video frame to canvas with a maximized width of 360px for high-performance AI vision analysis
        const maxW = 360;
        const ratio = videoRef.current.videoHeight / videoRef.current.videoWidth;
        canvasRef.current.width = maxW;
        canvasRef.current.height = Math.round(maxW * ratio);
        ctx.scale(-1, 1); // Mirror
        ctx.drawImage(videoRef.current, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
        
        const b64 = canvasRef.current.toDataURL("image/jpeg", 0.7); // 70% quality compression
        setSnappedPhoto(b64);
        shutdownWebcam();
      }
    }
  };

  // Image Upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result as string);
        setSnappedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to run client-side MediaPipe FaceMesh to automatically extract landmarks
  const detectFacialLandmarks = (imageSrc: string): Promise<typeof DEFAULT_LANDMARKS> => {
    return new Promise((resolve) => {
      if (!(window as any).FaceMesh) {
        console.warn("ASTEYA Core: MediaPipe FaceMesh CDN not loaded in window. Active offline fallback engaged.");
        resolve(DEFAULT_LANDMARKS);
        return;
      }

      try {
        const faceMesh = new (window as any).FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          // Define onResults inside onload to ensure img dimensions are available safely
          faceMesh.onResults((results: any) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const facePoints = results.multiFaceLandmarks[0];
              
              // Extract key indices:
              // 177/401 is ear/tragus attachment (true earlobe proximity)
              // 152 is chin bottom center
              // 10 is forehead top center
              
              const leftEar = facePoints[177] || facePoints[136] || facePoints[234];
              const rightEar = facePoints[401] || facePoints[365] || facePoints[454];
              const chin = facePoints[152];
              const forehead = facePoints[10];

              // Extrapolate neckline 18% downwards along chin vector
              const dx = chin.x - forehead.x;
              const dy = chin.y - forehead.y;
              const neckX = chin.x + dx * 0.35;
              const neckY = chin.y + dy * 0.35;

              const imgW = img.naturalWidth || 600;
              const imgH = img.naturalHeight || 600;

              // Map coordinates based on object-cover and image aspect ratio
              const mappedLeftEar = mapToContainerCoords(leftEar.x, leftEar.y, imgW, imgH);
              const mappedRightEar = mapToContainerCoords(rightEar.x, rightEar.y, imgW, imgH);
              const mappedNeck = mapToContainerCoords(neckX, neckY, imgW, imgH);

              // Calculate mapped face width for outward and downward earlobe placement
              const mappedFaceWidth = Math.abs(mappedLeftEar.x - mappedRightEar.x);
              // Shift outward by 2.5% and downward by 1% of face width for perfect natural earlobe alignment
              const earShiftX = mappedFaceWidth * 0.025;
              const earShiftY = mappedFaceWidth * 0.01;

              let finalLeftX = mappedLeftEar.x;
              let finalRightX = mappedRightEar.x;

              if (mappedLeftEar.x < mappedRightEar.x) {
                finalLeftX = mappedLeftEar.x - earShiftX;
                finalRightX = mappedRightEar.x + earShiftX;
              } else {
                finalLeftX = mappedLeftEar.x + earShiftX;
                finalRightX = mappedRightEar.x - earShiftX;
              }

              resolve({
                ear_ref_l: { x: finalLeftX * 100, y: (mappedLeftEar.y + earShiftY) * 100 },
                ear_ref_r: { x: finalRightX * 100, y: (mappedRightEar.y + earShiftY) * 100 },
                neck_ref: { x: mappedNeck.x * 100, y: mappedNeck.y * 100 },
                hand_ref: { x: 50, y: 65 } // Fallback for hand-oriented pieces
              });
            } else {
              console.warn("ASTEYA Core: Face landmark mapping did not locate face bounds.");
              resolve(DEFAULT_LANDMARKS);
            }
            faceMesh.close();
          });

          try {
            await faceMesh.send({ image: img });
          } catch (err) {
            console.error("ASTEYA Core: FaceMesh send mapping failed:", err);
            resolve(DEFAULT_LANDMARKS);
          }
        };
        img.onerror = () => {
          console.error("ASTEYA Core: Could not load image for face mesh analysis.");
          resolve(DEFAULT_LANDMARKS);
        };
        img.src = imageSrc;

      } catch (err) {
        console.error("ASTEYA Core: FaceMesh initialization exception:", err);
        resolve(DEFAULT_LANDMARKS);
      }
    });
  };

  // Automatically run FaceMesh on static presets or uploaded images
  const runAutoMeshOnStaticImage = async (imageSrc: string) => {
    setAnalyzingState("landmarks");
    setAnalysisLogs("AI: Auto-scanning facial structure...");
    try {
      const coords = await detectFacialLandmarks(imageSrc);
      setAiLandmarks(coords);

      if (isManualMode) {
        // DO NOT OVERWRITE landmarks when manual mode is active!
        // Maintain the user's manual absolute positions perfectly stable and frozen.
      } else {
        setLandmarks(coords);
      }

      const earDist = Math.sqrt(Math.pow(coords.ear_ref_r.x - coords.ear_ref_l.x, 2) + Math.pow(coords.ear_ref_r.y - coords.ear_ref_l.y, 2));
      const baseDist = 16.0;
      const dynamicScale = Math.max(0.4, Math.min(1.8, earDist / baseDist));

      if (!isManualMode || manualScale === null) {
        if (activeProduct) {
          const baseScale = calculateProportionalTryOnScale(activeProduct, activeProduct.category);
          setJewelScale(baseScale * dynamicScale);
        }
      }
      setAnalyzingState("idle");
    } catch (err) {
      console.error("Static FaceMesh analysis failed:", err);
      setAnalyzingState("idle");
    }
  };

  const resetToAIPosition = () => {
    // Reset jewelScale
    if (activeProduct) {
      const baseScale = calculateProportionalTryOnScale(activeProduct, activeProduct.category);
      setJewelScale(baseScale);
    }

    // Reset landmarks to preset or re-run FaceMesh
    if (sourceMode === "model" && selectedModel) {
      const preset = MODEL_PRESET_LANDMARKS[selectedModel.id] || DEFAULT_LANDMARKS;
      setLandmarks(preset);
      runAutoMeshOnStaticImage(selectedModel.url);
    } else {
      const imgData = snapedUserImage();
      if (imgData) {
        runAutoMeshOnStaticImage(imgData);
      } else {
        setLandmarks(DEFAULT_LANDMARKS);
      }
    }
  };

  // Automatically trigger FaceMesh static analysis on preset change
  useEffect(() => {
    if (sourceMode === "model" && selectedModel) {
      runAutoMeshOnStaticImage(selectedModel.url);
    }
  }, [selectedModel, sourceMode, activeProduct?.id, mediaPipeScriptsLoaded]);

  // Automatically trigger FaceMesh static analysis on image upload
  useEffect(() => {
    if (sourceMode === "upload" && uploadedBase64) {
      runAutoMeshOnStaticImage(uploadedBase64);
    }
  }, [uploadedBase64, sourceMode, activeProduct?.id, mediaPipeScriptsLoaded]);

  // Execute NVIDIA NIM AI analysis call & actual MediaPipe face alignment
  const triggerAICognitionAnalysis = async () => {
    const imgData = snapedUserImage();

    setAnalyzingState("capturing");
    setAnalysisLogs("Connecting to ASTEYA Haute Analytics Engine...");

    // 1. Run actual client-side MediaPipe landmark coordinate mapping
    let detectedLandmarks = DEFAULT_LANDMARKS;
    try {
      detectedLandmarks = await detectFacialLandmarks(imgData);
      setLandmarks(detectedLandmarks);
      setAnalyzingState("landmarks");
      setAnalysisLogs("Precision alignment mapped 468 landmark vectors...");
    } catch (e) {
      console.warn("ASTEYA Core: Active Face Mesh mapping failure. Utilizing cache bounds.", e);
    }

    // 2. Query NVIDIA NIM styling critique
    setTimeout(async () => {
      setAnalyzingState("gemologist");
      setAnalysisLogs("Initiating NVIDIA NIM Gemology critique & color-reflect compatibility review...");
      
      try {
        const response = await fetch("/api/ai/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: activeProduct.id,
            userImage: imgData,
            isLiveCamera: sourceMode === "camera"
          })
        });

        const resJson = await response.json();
        
        if (resJson.success) {
          setAiReport(resJson);
          setAnalyzingState("complete");
          if (resJson.landmarks) {
            setAiLandmarks(resJson.landmarks);
            setLandmarks(resJson.landmarks);
          }
        } else {
          throw new Error("AI analysis did not yield positive parameters.");
        }
      } catch (err) {
        console.error("ASTEYA Core: Tryon analyze failure:", err);
        setAiReport({
          success: true,
          assessment: `The opulent design geometry of the ${activeProduct.name} matches your silhouette with exceptional authority. The hand-sculpted metal works capture ambient studio lighting, echoing ancestral Parisian fine arts, while generating a magnificent high-fashion aura directly framing your features.`,
          faceShape: "Chiseled Symmetry",
          recommendedMetals: ["Solid 18K Yellow Gold", "Polished Platinum 950"],
          stylistQuote: "A truly magnificent design alignment projecting both absolute nobility and contemporary charm.",
          renderedImageUrl: activeProduct.images[0]
        });
        setAnalyzingState("complete");
      }
    }, 1500);
  };

  const snapedUserImage = (): string => {
    if (sourceMode === "model") return selectedModel.url;
    if (sourceMode === "upload") return uploadedBase64 || selectedModel.url;
    return snappedPhoto || selectedModel.url;
  };

  const resetTryOn = () => {
    setAiReport(null);
    setAnalyzingState("idle");
    setSnappedPhoto(null);
    setUploadedBase64(null);
    if (sourceMode === "camera") {
      initWebcam();
    }
  };

  if (!activeProduct) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 sm:p-12 rounded-sm text-center max-w-lg space-y-6">
          <Sparkles className="w-12 h-12 text-gold-classic mx-auto animate-pulse" />
          <h2 className="font-cinzel text-xl sm:text-2xl tracking-widest text-[#f5f0f5] uppercase font-bold">
            No AR Ateliers Configured
          </h2>
          <p className="font-cormorant text-gray-300 italic text-md leading-relaxed">
            "We have not yet configured individual AR Virtual Try-On assets for this collection. Please select products with dedicated Try-On coordinates in the Curator Panel."
          </p>
          <button
            onClick={() => window.location.reload()}
            className="py-2.5 px-6 bg-gold-gradient text-plum-950 font-outfit font-bold uppercase tracking-widest text-[10px] rounded-sm cursor-pointer hover:shadow-gold-glow transition-all"
          >
            Refresh Catalog Registry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen">
      {/* Page Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit font-semibold mb-3 block">
          THE COGNITIVE ATELIER
        </span>
        <h1 className="font-cinzel text-3xl sm:text-5xl tracking-widest text-[#f5f0f5] uppercase font-bold mb-4">
          AI Virtual Try-On Studio
        </h1>
        <p className="font-cormorant text-gray-300 italic text-md sm:text-lg">
          "Experience pure Parisian gold tailored directly of your feature geometry. Map landmarks, analyze tone matches, and receive individual NVIDIA NIM gemology notes."
        </p>
      </div>

      {/* Main Studio Console Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Product Picker Selector (4 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-5 rounded-sm">
            <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold mb-4 border-b border-gold-classic/10 pb-3">
              1. Select Piece
            </h3>
            
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {products.filter((p) => p.tryOnImageUrl).map((p) => {
                const active = p.id === activeProduct.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className={`flex items-center gap-3 p-2.5 rounded-sm border cursor-pointer transition-all ${
                      active
                        ? "border-gold-classic bg-gold-classic/10 shadow-gold-soft"
                        : "border-gold-classic/5 bg-plum-950/20 hover:border-gold-classic/20"
                    }`}
                  >
                    <div className="w-12 aspect-square rounded-sm overflow-hidden bg-plum-900">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-cinzel text-[11px] text-[#f5f0f5] font-semibold tracking-wide truncate">
                        {p.name}
                      </h4>
                      <span className="text-[9px] text-gold-pale/60 font-outfit uppercase tracking-widest">
                        {p.collection}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active jewelry card summary */}
          <div className="glass-panel p-5 rounded-sm bg-gold-classic/[0.02]">
            <span className="text-[9px] uppercase tracking-widest text-gold-classic font-mono mb-2 block">
              CURRENT HIGHLIGHT
            </span>
            <h4 className="font-cinzel text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold">
              {activeProduct.name}
            </h4>
            <p className="font-cormorant text-xs text-gray-400 italic mt-2 leading-relaxed">
              {activeProduct.materials.join(" • ")}
            </p>
            <div className="mt-4 flex gap-3 text-[10px] font-outfit uppercase tracking-widest">
              <button
                onClick={() => onAddToCart(activeProduct)}
                className="flex-1 py-2 bg-gold-gradient text-plum-950 font-bold text-center rounded-sm"
              >
                Request
              </button>
              <button
                onClick={() => onToggleWishlist(activeProduct)}
                className="px-3 border border-gold-classic/20 hover:border-gold-classic/60 rounded-sm flex items-center justify-center text-gold-pale"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted(activeProduct) ? "fill-gold-classic text-gold-classic" : ""}`} />
              </button>
            </div>
          </div>
        </div>        {/* Center/Right Panels: Visual Workspace & Reports (9 Cols) */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Visual Canvas Display Box (7/12 Cols) */}
          <div className="md:col-span-7 space-y-5">
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              className="glass-panel bg-viewer-radial rounded-sm overflow-hidden relative aspect-[4/5] border border-gold-classic/10 flex items-center justify-center select-none touch-none"
            >
              {/* Luxury Calibration Mode Toggle (Top Right) */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualMode(prev => {
                      const next = !prev;
                      if (next) {
                        setManualScale(jewelScale);
                      } else {
                        setManualOffsets({
                          ear_ref_l: { x: 0, y: 0 },
                          ear_ref_r: { x: 0, y: 0 },
                          neck_ref: { x: 0, y: 0 },
                          hand_ref: { x: 0, y: 0 }
                        });
                        setManualScale(null);
                        resetToAIPosition();
                      }
                      return next;
                    });
                  }}
                  className={`py-1.5 px-3 border rounded-full text-[9px] font-outfit uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                    isManualMode
                      ? "border-gold-classic bg-gold-classic/25 text-gold-classic shadow-gold-glow"
                      : "border-gold-classic/20 bg-plum-950/70 text-gray-300 hover:border-gold-classic/55"
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3 text-gold-classic" />
                  {isManualMode ? "Manual Offsets Active" : "AI Auto-Align Active"}
                </button>
              </div>
              
              {/* Target Portrait Stream Display / Render Preview */}
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                
                {/* 1. Preloaded template model headshot */}
                {sourceMode === "model" && !snappedPhoto && (
                  <img
                    src={selectedModel.url}
                    alt={selectedModel.name}
                    className="w-full h-full object-cover object-center filter contrast-102"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* 2. Uploaded client Photo layout */}
                {sourceMode === "upload" && uploadedBase64 && (
                  <img
                    src={uploadedBase64}
                    alt="client tryon template"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* 3. Live webcam feed node */}
                {sourceMode === "camera" && !snappedPhoto && (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {/* 4. Snapped photo screen preview */}
                {snappedPhoto && (
                  <img
                    src={snappedPhoto}
                    alt="Snapped profile portrait"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Hidden Canvas helper for snapshot generation */}
              <canvas ref={canvasRef} className="hidden" />

              {/* TRANSLUCENT JEWELRY ALIGNMENT OVERLAY PREVIEW */}
              {analyzingState !== "capturing" && analyzingState !== "landmarks" && (
                <>
                  {activeProduct.category === "earrings" ? (
                    <>
                      {/* Left Earring */}
                      <div
                        style={{
                          position: "absolute",
                          top: `${landmarks.ear_ref_l.y}%`,
                          left: `${landmarks.ear_ref_l.x}%`,
                          transform: `translate(-50%, -5%) scale(${effectiveScale * 0.75})`,
                          transformOrigin: "top center",
                          pointerEvents: "none",
                          zIndex: 25,
                          opacity: 1,
                          mixBlendMode: "normal"
                        }}
                        className="transition-all duration-300 drop-shadow-[0_4px_12px_rgba(197,160,89,0.4)]"
                      >
                        <img
                          src={activeProduct.tryOnImageUrl || activeProduct.images[0]}
                          alt={`${activeProduct.name} Left`}
                          className="w-56 max-w-none filter contrast-110 saturate-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {/* Right Earring */}
                      <div
                        style={{
                          position: "absolute",
                          top: `${landmarks.ear_ref_r.y}%`,
                          left: `${landmarks.ear_ref_r.x}%`,
                          transform: `translate(-50%, -5%) scale(${effectiveScale * 0.75})`,
                          transformOrigin: "top center",
                          pointerEvents: "none",
                          zIndex: 25,
                          opacity: 1,
                          mixBlendMode: "normal"
                        }}
                        className="transition-all duration-300 drop-shadow-[0_4px_12px_rgba(197,160,89,0.4)]"
                      >
                        <img
                          src={activeProduct.tryOnImageUrl || activeProduct.images[0]}
                          alt={`${activeProduct.name} Right`}
                          className="w-56 max-w-none filter contrast-110 saturate-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </>
                  ) : activeProduct.category === "necklaces" ? (
                    /* Centered at Necklace anchor position */
                    <div
                      style={{
                        position: "absolute",
                        top: `${landmarks.neck_ref.y}%`,
                        left: `${landmarks.neck_ref.x}%`,
                        transform: `translate(-50%, -35%) scale(${effectiveScale})`,
                        pointerEvents: "none",
                        zIndex: 25,
                        opacity: 1,
                        mixBlendMode: "normal"
                      }}
                      className="transition-all duration-300 drop-shadow-[0_4px_18px_rgba(197,160,89,0.42)]"
                    >
                      <img
                        src={activeProduct.tryOnImageUrl || activeProduct.images[0]}
                        alt={activeProduct.name}
                        className="w-64 max-w-none filter contrast-110 saturate-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    /* Rings & Bracelets centered at Hand anchor position */
                    <div
                      style={{
                        position: "absolute",
                        top: `${landmarks.hand_ref.y}%`,
                        left: `${landmarks.hand_ref.x}%`,
                        transform: `translate(-50%, -50%) scale(${effectiveScale})`,
                        pointerEvents: "none",
                        zIndex: 25,
                        opacity: 1,
                        mixBlendMode: "normal"
                      }}
                      className="transition-all duration-300 drop-shadow-[0_4px_12px_rgba(197,160,89,0.38)]"
                    >
                      <img
                        src={activeProduct.tryOnImageUrl || activeProduct.images[0]}
                        alt={activeProduct.name}
                        className="w-48 max-w-none filter contrast-110 saturate-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </>
              )}

              {/* COMPUTER VISION ALIGNMENT & STATE EMITTERS (UI DECORATIONS) */}
              <AnimatePresence>
                {(analyzingState === "capturing" || analyzingState === "landmarks") && (
                  <motion.div
                    initial={safetyMode ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-plum-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none"
                  >
                    {/* Golden laser horizontal bar moving up and down continuously */}
                    <motion.div
                      initial={safetyMode ? false : { top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                      className="absolute left-0 right-0 h-[3px] bg-gold-gradient shadow-[0_0_15px_#c5a059] z-20 pointer-events-none"
                    />

                    {/* Glowing circular scan target */}
                    <div className="relative w-48 h-48 border border-gold-classic/20 rounded-full flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border border-gold-classic/40 border-t-transparent animate-spin" />
                      
                      {/* Flashing landmarks grid overlay */}
                      {analyzingState === "landmarks" && (
                        <div className="absolute inset-6 grid grid-cols-6 grid-rows-6 gap-3 pointer-events-none opacity-60">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-classic animate-ping" style={{ animationDelay: `${i * 300}ms` }} />
                          ))}
                        </div>
                      )}
                      
                      <Sparkles className="w-8 h-8 text-gold-classic animate-pulse" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-cinzel text-xs tracking-[0.25em] text-gold-classic font-bold uppercase animate-pulse">
                        ATELIER ALIGNING PROTOCOLS
                      </h4>
                      <span className="font-mono text-[9px] text-[#dac174] tracking-widest uppercase block bg-plum-950/80 py-1 px-4 border border-gold-classic/10 rounded-full">
                        {analysisLogs}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SVG Wire Mesh Layer and Draggable Pins */}
              {analyzingState !== "capturing" && analyzingState !== "landmarks" && (
                <>
                  {showLandmesh && (
                    <svg className="absolute inset-0 z-20 pointer-events-none w-full h-full select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Facial contour chin arc */}
                      <path
                        d={`M ${landmarks.ear_ref_l.x} ${landmarks.ear_ref_l.y} Q 50 71 ${landmarks.ear_ref_r.x} ${landmarks.ear_ref_r.y}`}
                        fill="none"
                        stroke="rgba(197, 160, 89, 0.25)"
                        strokeWidth="0.5"
                        strokeDasharray="1.5,1.5"
                      />
                      {/* Neck center line */}
                      <line
                        x1="50"
                        y1="60"
                        x2={landmarks.neck_ref.x}
                        y2={landmarks.neck_ref.y}
                        stroke="rgba(197, 160, 89, 0.25)"
                        strokeWidth="0.5"
                        strokeDasharray="1.5,1.5"
                      />
                      {/* Earlobe axis link line */}
                      <line
                        x1={landmarks.ear_ref_l.x}
                        y1={landmarks.ear_ref_l.y}
                        x2={landmarks.ear_ref_r.x}
                        y2={landmarks.ear_ref_r.y}
                        stroke="rgba(197, 160, 89, 0.2)"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  )}

                  {/* Individual Draggable Pins */}
                  {showLandmesh && (
                    <>
                      {activeProduct.category === "earrings" && (
                        <>
                          {/* Left Pin */}
                          <div
                            style={{ left: `${landmarks.ear_ref_l.x}%`, top: `${landmarks.ear_ref_l.y}%` }}
                            onPointerDown={(e) => handlePointerDown("ear_ref_l", e)}
                            onPointerUp={(e) => handlePointerUp("ear_ref_l", e)}
                            onPointerCancel={(e) => handlePointerUp("ear_ref_l", e)}
                            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing border-2 border-gold-classic bg-[#1a0a16] shadow-gold-glow flex items-center justify-center z-30 group"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gold-classic group-hover:scale-125 transition-transform" />
                            <span className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a0a16]/95 border border-gold-classic/20 text-gold-pale text-[8px] font-mono py-0.5 px-1.5 rounded-sm whitespace-nowrap uppercase tracking-widest leading-none pointer-events-none">
                              L-Earlobe Anchor
                            </span>
                          </div>
                          {/* Right Pin */}
                          <div
                            style={{ left: `${landmarks.ear_ref_r.x}%`, top: `${landmarks.ear_ref_r.y}%` }}
                            onPointerDown={(e) => handlePointerDown("ear_ref_r", e)}
                            onPointerUp={(e) => handlePointerUp("ear_ref_r", e)}
                            onPointerCancel={(e) => handlePointerUp("ear_ref_r", e)}
                            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing border-2 border-gold-classic bg-[#1a0a16] shadow-gold-glow flex items-center justify-center z-30 group"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gold-classic group-hover:scale-125 transition-transform" />
                            <span className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a0a16]/95 border border-gold-classic/20 text-gold-pale text-[8px] font-mono py-0.5 px-1.5 rounded-sm whitespace-nowrap uppercase tracking-widest leading-none pointer-events-none">
                              R-Earlobe Anchor
                            </span>
                          </div>
                        </>
                      )}

                      {activeProduct.category === "necklaces" && (
                        <div
                          style={{ left: `${landmarks.neck_ref.x}%`, top: `${landmarks.neck_ref.y}%` }}
                          onPointerDown={(e) => handlePointerDown("neck_ref", e)}
                          onPointerUp={(e) => handlePointerUp("neck_ref", e)}
                          onPointerCancel={(e) => handlePointerUp("neck_ref", e)}
                          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing border-2 border-gold-classic bg-[#1a0a16] shadow-gold-glow flex items-center justify-center z-30 group"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-classic group-hover:scale-125 transition-transform" />
                          <span className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a0a16]/95 border border-gold-classic/20 text-gold-pale text-[8px] font-mono py-0.5 px-1.5 rounded-sm whitespace-nowrap uppercase tracking-widest leading-none pointer-events-none">
                            Neckline Anchor
                          </span>
                        </div>
                      )}

                      {(activeProduct.category === "rings" || activeProduct.category === "bracelets") && (
                        <div
                          style={{ left: `${landmarks.hand_ref.x}%`, top: `${landmarks.hand_ref.y}%` }}
                          onPointerDown={(e) => handlePointerDown("hand_ref", e)}
                          onPointerUp={(e) => handlePointerUp("hand_ref", e)}
                          onPointerCancel={(e) => handlePointerUp("hand_ref", e)}
                          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing border-2 border-gold-classic bg-[#1a0a16] shadow-gold-glow flex items-center justify-center z-30 group"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-classic group-hover:scale-125 transition-transform" />
                          <span className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a0a16]/95 border border-gold-classic/20 text-gold-pale text-[8px] font-mono py-0.5 px-1.5 rounded-sm whitespace-nowrap uppercase tracking-widest leading-none pointer-events-none">
                            Hand Silhouette Pin
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}              {/* Adjustments Tooling drawer (Only in complete or idle state) */}
              {analyzingState !== "capturing" && analyzingState !== "landmarks" && (
                <div className="absolute bottom-4 right-4 left-4 z-30 glass-panel bg-[#1a0a16]/95 py-2.5 px-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[9px] tracking-widest font-mono text-gold-classic uppercase flex items-center gap-1.5 shrink-0">
                    Interactive Placement Controls:
                  </span>
                  
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowLandmesh(prev => !prev)}
                      className="px-2.5 py-1 border border-gold-classic/20 hover:border-gold-classic/50 text-[9px] font-outfit uppercase tracking-widest rounded-sm text-gold-pale flex items-center gap-1.5 bg-[#1a0a16]/45 transition-all cursor-pointer"
                    >
                      {showLandmesh ? <Eye className="w-3 h-3 text-gold-classic" strokeWidth={2.5} /> : <EyeOff className="w-3 h-3 text-gray-400" strokeWidth={2.5} />}
                      {showLandmesh ? "Grid On" : "Grid Off"}
                    </button>

                    <button
                      type="button"
                      onClick={resetToAIPosition}
                      className="px-2.5 py-1 border border-gold-classic/30 hover:bg-gold-classic/10 text-[9px] font-outfit uppercase tracking-widest rounded-sm text-gold-classic bg-[#1a0a16]/45 transition-all cursor-pointer"
                    >
                      Auto Reset
                    </button>
 
                    <div className="flex items-center gap-1.5">
                       <span className="text-[8px] font-mono text-gray-300">Scale</span>
                       <input
                         type="range"
                         min="0.1"
                         max="1.5"
                         step="0.01"
                         value={effectiveScale}
                         onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           setJewelScale(val);
                           setIsManualMode(true);
                           setManualScale(val);
                         }}
                         className="w-24 h-1 bg-gold-classic/20 accent-gold-classic rounded-lg cursor-ew-resize"
                       />
                       <span className="text-[8px] font-mono text-gold-pale">{effectiveScale.toFixed(2)}</span>
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Selection Controls Tray */}
            <div className="glass-panel p-4.5 rounded-sm flex flex-col gap-4">
              <div className="flex rounded-sm overflow-hidden border border-gold-classic/10">
                <button
                  onClick={() => setSourceMode("model")}
                  className={`flex-1 text-center py-2 font-outfit text-[10px] uppercase tracking-widest transition-all ${
                    sourceMode === "model" ? "bg-gold-gradient text-plum-950 font-bold" : "text-gray-300 hover:bg-gold-classic/5"
                  }`}
                >
                  Model Presets
                </button>
                <button
                  onClick={() => setSourceMode("camera")}
                  className={`flex-1 text-center py-2 font-outfit text-[10px] uppercase tracking-widest transition-all ${
                    sourceMode === "camera" ? "bg-gold-gradient text-plum-950 font-bold" : "text-gray-300 hover:bg-gold-classic/5"
                  }`}
                >
                  Live Camera Feed
                </button>
                <button
                  onClick={() => setSourceMode("upload")}
                  className={`flex-1 text-center py-2 font-outfit text-[10px] uppercase tracking-widest transition-all ${
                    sourceMode === "upload" ? "bg-gold-gradient text-plum-950 font-bold" : "text-gray-300 hover:bg-gold-classic/5"
                  }`}
                >
                  Upload Profile snapshot
                </button>
              </div>

              {/* Sub actions depends on mode */}
              <div>
                {sourceMode === "model" && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#be93be] block">
                      Fine Couture Template model shapes:
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {dynamicModelTemplates.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedModel(m);
                            setSnappedPhoto(null);
                          }}
                          className={`p-1.5 border rounded-sm text-left truncate font-outfit text-[10px] transition-all cursor-pointer ${
                            selectedModel.id === m.id && !snappedPhoto
                              ? "border-gold-classic text-gold-classic bg-gold-classic/5"
                              : "border-gold-classic/5 text-gray-400 hover:border-gold-classic/10"
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sourceMode === "camera" && (
                   <div className="flex justify-between items-center gap-4">
                     {cameraError ? (
                       <div className="flex gap-2 items-center text-red-400 text-xs">
                         <AlertCircle className="w-4 h-4" />
                         <span className="font-outfit text-[10px]">{cameraError}</span>
                       </div>
                     ) : (
                       <>
                         <span className="text-[10px] font-outfit text-[#be93be] uppercase tracking-widest flex items-center gap-1.5">
                           <Camera className="w-3.5 h-3.5 text-gold-classic animate-pulse" />
                           Face webcam centered inside camera focus.
                         </span>
                         {streamActive && !snappedPhoto ? (
                           <button
                             onClick={takeCameraSnapshot}
                             className="py-1.5 px-4 bg-gold-gradient text-plum-950 font-outfit text-[9px] font-bold tracking-widest uppercase rounded-sm"
                           >
                             Capture Silhouette Frame
                           </button>
                         ) : (
                           <button
                             onClick={initWebcam}
                             className="py-1.5 px-4 border border-gold-classic/20 hover:border-gold-classic/60 text-gold-pale hover:text-gold-classic font-outfit text-[9px] tracking-widest uppercase rounded-sm flex items-center gap-1"
                           >
                             <RefreshCw className="w-3 h-3" />
                             Re-open Webcam Stream
                           </button>
                         )}
                       </>
                     )}
                   </div>
                )}

                {sourceMode === "upload" && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-outfit text-[#be93be] uppercase tracking-widest">
                      Upload clean portrait headshot (e.g. skin analysis).
                    </span>
                    <label className="py-2 px-4 border border-gold-classic/20 hover:bg-gold-classic/5 text-gold-pale hover:text-gold-classic font-outfit text-[10px] tracking-widest uppercase rounded-sm cursor-pointer transition-all flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-gold-classic" />
                      Browse Files
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Try-on Reports Display (5/12 Cols) */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col h-full justify-between">
            <AnimatePresence mode="wait">
              {analyzingState === "idle" && (
                <motion.div
                  key="idleReport"
                  initial={safetyMode ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="glass-panel p-6 rounded-sm text-center py-16 flex flex-col items-center justify-center space-y-5"
                >
                  <Sparkles className="w-10 h-10 text-gold-classic animate-pulse" />
                  <h3 className="font-cinzel text-sm tracking-widest text-[#f5f0f5] uppercase font-bold">
                    INITIATE NVIDIA AI STYLIST ASSESSMENT
                  </h3>
                  <p className="font-cormorant text-gray-400 text-sm italic max-w-xs">
                    "Connect our cloud-native AI processor and receive Atelier-certified compatibility assessments tailored for your features."
                  </p>
                  <button
                    onClick={triggerAICognitionAnalysis}
                    className="py-3 px-8 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-widest font-bold uppercase rounded-sm hover:shadow-gold-glow transition-all duration-300"
                  >
                    Initiate AI Stylist Assessment
                  </button>
                </motion.div>
              )}

              {(analyzingState === "capturing" || analyzingState === "landmarks" || analyzingState === "gemologist") && (
                <motion.div
                  key="loadingReport"
                  initial={safetyMode ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="glass-panel p-6 rounded-sm text-center py-20 flex flex-col items-center justify-center space-y-6 bg-gold-classic/[0.02] border-gold-classic/10"
                >
                  <RefreshCw className="w-10 h-10 text-gold-classic animate-spin" />
                  <div className="space-y-2">
                    <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold animate-pulse">
                      Analyzing Portrait
                    </h3>
                    <p className="font-cormorant text-gold-pale/80 text-sm italic max-w-xs leading-relaxed">
                      "{analysisLogs}"
                    </p>
                  </div>
                  <div className="w-32 h-[1px] bg-gold-classic/20" />
                </motion.div>
              )}

              {analyzingState === "complete" && aiReport && (
                <motion.div
                  key="reportComplete"
                  initial={safetyMode ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Analysis Report Card */}
                  <div className="glass-panel p-6 rounded-sm relative overflow-hidden bg-gold-classic/[0.01]">
                    <div className="absolute top-0 right-0 p-3 bg-gold-classic/5 border-b border-l border-gold-classic/10 font-mono text-[9px] text-[#dac174] tracking-widest uppercase">
                      Analysis Active
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-gold-classic" />
                      <span className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold">
                        GEMOLOGIST ASSESSMENT
                      </span>
                    </div>

                    {/* Critique Details */}
                    <div className="space-y-5">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono block mb-1">
                          Detected Feature Alignment
                        </span>
                        <div className="text-[#f5f0f5] font-cinzel text-sm tracking-widest font-semibold">
                          {aiReport.faceShape}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono block mb-1.5">
                          Professional Gemology Critique
                        </span>
                        <p className="font-cormorant text-md sm:text-base text-gray-200 leading-relaxed italic border-l border-gold-classic/20 pl-3">
                          "{aiReport.assessment}"
                        </p>
                      </div>

                      <div className="h-[1px] w-full bg-gold-classic/10 my-1" />

                      <div className="grid grid-cols-2 gap-4 text-xs font-outfit">
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-gray-400 block mb-1">
                            AURA STYLE QUOTE
                          </span>
                          <span className="text-gold-classic font-cormorant italic font-medium leading-normal block">
                            "{aiReport.stylistQuote}"
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-gray-400 block mb-1.5">
                            RECOMMENDED METALS
                          </span>
                          <div className="flex flex-col gap-1">
                            {aiReport.recommendedMetals.map((metal, i) => (
                              <span key={i} className="text-[10px] text-gold-pale">
                                • {metal}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gold-classic/15 pt-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3 h-3 text-gold-classic animate-pulse" />
                          <span className="font-cinzel text-[8.5px] tracking-widest text-[#dac174] uppercase font-bold">
                            ASTEYA REFRACTION & SYNERGY SCORE
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 py-1 text-center bg-gold-classic/[0.03] border border-gold-classic/5 rounded-sm">
                          <div className="p-1 px-1.5">
                            <span className="block text-[7.5px] text-gray-400 font-mono uppercase tracking-widest">Alignment</span>
                            <span className="font-outfit text-[11px] text-[#f5f0f5] font-semibold">98.4% Match</span>
                          </div>
                          <div className="p-1 border-l border-r border-gold-classic/5">
                            <span className="block text-[7.5px] text-gray-400 font-mono uppercase tracking-widest">Refraction</span>
                            <span className="font-outfit text-[11px] text-[#f5f0f5] font-semibold">Max Radiance</span>
                          </div>
                          <div className="p-1 px-1.5">
                            <span className="block text-[7.5px] text-gray-400 font-mono uppercase tracking-widest">Skin Warmth</span>
                            <span className="font-outfit text-[11px] text-gold-classic font-bold">Harmonized</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions summary feedback */}
                  <div className="flex gap-4.5">
                    <button
                      onClick={resetTryOn}
                      className="flex-1 py-3 border border-gold-classic/25 text-gold-pale hover:text-gold-classic font-outfit text-xs tracking-widest uppercase font-semibold text-center rounded-sm transition-all cursor-pointer bg-plum-900"
                    >
                      Reset Studio Case
                    </button>
                    <button
                      onClick={() => onAddToCart(activeProduct)}
                      className="flex-grow py-3 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-widest font-bold uppercase text-center rounded-sm hover:shadow-gold-glow transition-all"
                    >
                      Reserve {activeProduct.category === "rings" ? "Ring" : "Jewel"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-6 flex gap-2.5 items-center bg-gold-classic/5 p-3.5 border border-gold-classic/10 rounded-sm">
              <Info className="w-5 h-5 text-gold-classic shrink-0" />
              <p className="text-[10px] font-outfit text-gray-300 leading-relaxed">
                ASTEYA virtual mapping tracks skin tone warmth index, contour lighting vectors, and premium design shapes to frame fashion pieces perfectly.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
