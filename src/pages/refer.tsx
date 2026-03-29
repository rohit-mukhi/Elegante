"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useMediaPipePose } from "@/hooks/useMediaPipePose";
import { DressOverlay } from "@/components/DressOverlay";

export default function TryOnPage() {
  const user = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { isLoading: poseLoading, measurements, startDetection, stopDetection } = useMediaPipePose(videoRef);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);

  const dresses = [
    { name: "Tropical Shirt", path: "/models/tropical-shirt.glb" },
    { name: "Frock", path: "/models/frock.glb" },
    { name: "Overcoat", path: "/models/overcoat.glb" }
  ];

  useEffect(() => {
    if (!user) {
      router.push("/signin");
    }
  }, [user, router]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            console.log("Starting detection with canvas:", canvasRef.current.width, canvasRef.current.height);
            startDetection(canvasRef.current);
          }
        };
      }
      
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    stopDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-linear-to-b from-[#050316] via-[#090029] to-[#110018] text-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="relative flex items-center justify-between border-b border-violet-900/50 pb-6">
          <Link href="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-[#f9e6b3] via-[#d6b36d] to-[#7b4bff]" />
            <span className="text-sm font-medium tracking-[0.3em] text-violet-50">ELEGANTE</span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-500/70 bg-black/20 text-violet-50 transition hover:border-[#f9e6b3] hover:text-[#f9e6b3]"
          >
            <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-violet-900/70 bg-black/90 p-4 shadow-lg backdrop-blur-md">
              <p className="mb-3 text-sm text-violet-50/80">Welcome, {user.displayName || "Stylist"}</p>
              <button
                onClick={() => user.signOut()}
                className="w-full rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-violet-50 transition hover:border-[#f9e6b3] hover:text-[#f9e6b3]"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px]">
          {/* Camera/Preview Area */}
          <div className="rounded-2xl border border-violet-900/50 bg-black/35 p-4 backdrop-blur-md sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-violet-50 sm:mb-4 sm:text-xl">Virtual Try-On</h2>
            <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-linear-to-b from-[#26165a] via-[#090029] to-[#16031b]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                  }
                }}
                style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <canvas
                ref={canvasRef}
                style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {cameraActive && selectedDress && measurements && (
                <DressOverlay videoRef={videoRef} measurements={measurements} modelPath={selectedDress} />
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#f9e6b3]/20 to-[#8b5bff]/20">
                    <span className="text-4xl">📷</span>
                  </div>
                  <p className="text-lg text-violet-50">Start your camera to try on outfits</p>
                  <button
                    onClick={startCamera}
                    className="rounded-full bg-linear-to-r from-[#f9e6b3] via-[#d6b36d] to-[#8b5bff] px-6 py-3 text-sm font-medium text-[#180820] transition hover:brightness-110"
                  >
                    Activate Camera
                  </button>
                </div>
              )}
            </div>
            {cameraActive && (
              <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                <button className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-[#f9e6b3] hover:text-[#f9e6b3] sm:px-4 sm:text-sm">
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 rounded-full border border-violet-500/70 bg-black/20 px-3 py-2 text-xs font-medium text-violet-50 transition hover:border-red-500 hover:text-red-400 sm:px-4 sm:text-sm"
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Body Measurements Card */}
            <div className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-violet-50">Body Measurements</h3>
              <p className="mb-2 text-xs text-violet-50/40">Camera: {cameraActive ? 'ON' : 'OFF'} | Loading: {poseLoading ? 'YES' : 'NO'} | Data: {measurements ? 'YES' : 'NO'}</p>
              {!cameraActive && (
                <p className="text-sm text-violet-50/50">Activate camera to detect measurements</p>
              )}
              {cameraActive && poseLoading && (
                <p className="text-sm text-violet-50/50">Loading pose detection...</p>
              )}
              {cameraActive && !poseLoading && !measurements && (
                <p className="text-sm text-violet-50/50">Stand in front of camera</p>
              )}
              {cameraActive && measurements && (
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Shoulder Width</span>
                    <span className="text-sm font-medium text-[#f9e6b3]">{(measurements.shoulderWidth * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Hip Width</span>
                    <span className="text-sm font-medium text-[#f9e6b3]">{(measurements.hipWidth * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/30 p-3">
                    <span className="text-sm text-violet-50/70">Torso Length</span>
                    <span className="text-sm font-medium text-[#f9e6b3]">{(measurements.torsoLength * 100).toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 text-xs text-violet-50/40">Debug: {JSON.stringify(measurements).substring(0, 50)}</p>
                </div>
              )}
            </div>
            
            {/* Product Selection */}
            <div className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-violet-50">Select Outfit</h3>
              <div className="space-y-3">
                {dresses.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedDress(item.path)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedDress === item.path
                        ? 'border-[#f9e6b3] bg-[#f9e6b3]/10'
                        : 'border-violet-900/50 bg-black/20 hover:border-[#f9e6b3]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-lg bg-linear-to-br from-[#26165a] to-[#16031b]" />
                      <div>
                        <p className="font-medium text-violet-50">{item.name}</p>
                        <p className="text-xs text-violet-50/60">
                          {selectedDress === item.path ? 'Active' : 'Tap to try on'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-900/50 bg-black/35 p-6 backdrop-blur-md">
              <h3 className="mb-3 text-lg font-semibold text-violet-50">Cast to TV</h3>
              <p className="mb-4 text-sm text-violet-50/70">View on your smart TV for a full mirror experience</p>
              <button className="w-full rounded-full border border-violet-500/70 bg-black/20 px-4 py-2 text-sm font-medium text-violet-50 transition hover:border-[#f9e6b3] hover:text-[#f9e6b3]">
                🖥️ Connect to TV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
