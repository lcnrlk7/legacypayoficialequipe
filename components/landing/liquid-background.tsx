'use client';

import React, { useEffect, useRef } from 'react';

export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Liquid rendering function with morphing shapes
    const renderLiquid = (time: number) => {
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple morphing blobs with Wave function
      const blobCount = 4;
      for (let i = 0; i < blobCount; i++) {
        const angle = (time * 0.0002 + (i / blobCount) * Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.15;
        
        const blobX = canvas.width / 2 + Math.cos(angle) * radius * 1.5;
        const blobY = canvas.height / 2 + Math.sin(angle) * radius * 1.5;

        // Influence from mouse
        const dx = mouseRef.current.x - blobX;
        const dy = mouseRef.current.y - blobY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 400);

        const finalX = blobX + dx * influence * 0.1;
        const finalY = blobY + dy * influence * 0.1;

        // Draw morphing blob using sine wave
        ctx.beginPath();
        const segments = 60;
        for (let j = 0; j < segments; j++) {
          const segAngle = (j / segments) * Math.PI * 2;
          const waveAmount = Math.sin(time * 0.001 + j * 0.3) * 30;
          const blobRadius = 80 + waveAmount;
          
          const x = finalX + Math.cos(segAngle) * blobRadius;
          const y = finalY + Math.sin(segAngle) * blobRadius;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Gradient fill for each blob
        const blobGradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, 120);
        blobGradient.addColorStop(0, `hsla(${200 + i * 40}, 100%, 60%, 0.3)`);
        blobGradient.addColorStop(1, `hsla(${200 + i * 40}, 100%, 40%, 0.1)`);
        ctx.fillStyle = blobGradient;
        ctx.fill();

        // Blob outline
        ctx.strokeStyle = `hsla(${200 + i * 40}, 100%, 50%, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw connecting lines between blobs
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < blobCount; i++) {
        const angle1 = (time * 0.0002 + (i / blobCount) * Math.PI * 2);
        const angle2 = (time * 0.0002 + ((i + 1) / blobCount) * Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.15;

        const x1 = canvas.width / 2 + Math.cos(angle1) * radius * 1.5;
        const y1 = canvas.height / 2 + Math.sin(angle1) * radius * 1.5;
        const x2 = canvas.width / 2 + Math.cos(angle2) * radius * 1.5;
        const y2 = canvas.height / 2 + Math.sin(angle2) * radius * 1.5;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw scrolling particles
      for (let i = 0; i < 20; i++) {
        const x = (time * 0.05 + i * 50) % canvas.width;
        const y = canvas.height * 0.3 + Math.sin(x * 0.01) * 100;
        
        ctx.fillStyle = `rgba(100, 200, 255, ${0.3 - (x / canvas.width) * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 16; // 60fps
      renderLiquid(timeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#0a0a0a' }}
    />
  );
}
