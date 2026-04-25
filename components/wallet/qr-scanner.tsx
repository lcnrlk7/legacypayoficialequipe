'use client';

import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { validatePixKey } from '@/lib/pix-validator';

interface QRScannerProps {
  onScan: (pixKey: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export function QRScanner({ onScan, onError, isLoading }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start camera on mount
  useEffect(() => {
    if (!scanning) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [scanning]);

  // Main scanning loop
  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data and scan for QR code
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log('[v0] QR Code detected:', code.data);
        
        // Validate the scanned data as a PIX key
        const validation = validatePixKey(code.data);

        if (validation.isValid) {
          console.log('[v0] Valid PIX key found:', validation.formattedKey);
          setScanning(false);
          onScan(validation.formattedKey || code.data);
          stopCamera();
          return;
        } else {
          console.log('[v0] Scanned QR is not a valid PIX key:', validation.error);
          // Continue scanning if QR is not a valid PIX key
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scanning, onScan]);

  const startCamera = async () => {
    try {
      setPermissionDenied(false);

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error: any) {
      console.error('[v0] Camera error:', error);
      setPermissionDenied(true);
      onError?.(error.name === 'NotAllowedError' ? 'Permissão de câmera negada' : 'Erro ao acessar câmera');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleScanning = () => {
    setScanning(!scanning);
  };

  return (
    <div className="w-full space-y-4">
      {/* Video element for camera */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            {/* Scan overlay */}
            <div className="absolute inset-0 border-4 border-green-500/50 m-8 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-green-500 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* Corner animations */}
            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-green-500" />
            <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-green-500" />
            <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-green-500" />
            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-green-500" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {permissionDenied ? (
                <div className="text-white space-y-2">
                  <svg
                    className="w-12 h-12 mx-auto text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.343 3.665c1.519-1.159 4.794-1.159 6.313 0l.906.689c1.519 1.159 4.794 1.159 6.313 0l3.234-2.467m0 0l-3.234 2.467a6.007 6.007 0 01-6.313 0l-.906-.689a6.007 6.007 0 00-6.313 0l-3.234-2.467m17.646 14.468l-3.234 2.467a6.007 6.007 0 01-6.313 0l-.906-.689a6.007 6.007 0 00-6.313 0l-3.234-2.467" />
                  </svg>
                  <p className="text-sm">Câmera não disponível</p>
                </div>
              ) : (
                <div className="text-white space-y-2">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  <p className="text-sm">Clique para iniciar câmera</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={toggleScanning}
          disabled={isLoading || permissionDenied}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all"
        >
          {scanning ? 'Parar leitura' : 'Iniciar câmera'}
        </button>

        {permissionDenied && (
          <p className="text-sm text-red-600 mt-2">Permita o acesso à câmera nas configurações do seu dispositivo</p>
        )}
      </div>
    </div>
  );
}
