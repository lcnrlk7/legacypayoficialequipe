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
      // Clear canvas with dark background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, '#0f0f0f');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 6 morphing blobs with LARANJA theme
      const blobCount = 6;
      for (let i = 0; i < blobCount; i++) {
        const angle = (time * 0.0001 + (i / blobCount) * Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.2;
        
        const blobX = canvas.width / 2 + Math.cos(angle) * radius * 1.8;
        const blobY = canvas.height / 2 + Math.sin(angle) * radius * 1.8;

        // Influence from mouse
        const dx = mouseRef.current.x - blobX;
        const dy = mouseRef.current.y - blobY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 500);

        const finalX = blobX + dx * influence * 0.15;
        const finalY = blobY + dy * influence * 0.15;

        // Draw morphing blob with enhanced wave
        ctx.beginPath();
        const segments = 80;
        for (let j = 0; j < segments; j++) {
          const segAngle = (j / segments) * Math.PI * 2;
          const waveAmount = Math.sin(time * 0.0015 + j * 0.2) * 40 + Math.cos(time * 0.001 + j * 0.15) * 20;
          const blobRadius = 100 + waveAmount;
          
          const x = finalX + Math.cos(segAngle) * blobRadius;
          const y = finalY + Math.sin(segAngle) * blobRadius;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Gradient fill - LARANJA PREDOMINANTE
        const blobGradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, 150);
        blobGradient.addColorStop(0, `rgba(255, 140, 0, ${0.25 + influence * 0.1})`);
        blobGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.12 + influence * 0.05})`);
        blobGradient.addColorStop(1, `rgba(255, 80, 0, 0)`);
        ctx.fillStyle = blobGradient;
        ctx.fill();

        // Enhanced blob glow outline
        ctx.strokeStyle = `rgba(255, 140, 0, ${0.3 + influence * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = `rgba(255, 160, 20, ${0.15 + influence * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw enhanced connecting lines between blobs with glow
      for (let i = 0; i < blobCount; i++) {
        const angle1 = (time * 0.0001 + (i / blobCount) * Math.PI * 2);
        const angle2 = (time * 0.0001 + ((i + 1) / blobCount) * Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.2;

        const x1 = canvas.width / 2 + Math.cos(angle1) * radius * 1.8;
        const y1 = canvas.height / 2 + Math.sin(angle1) * radius * 1.8;
        const x2 = canvas.width / 2 + Math.cos(angle2) * radius * 1.8;
        const y2 = canvas.height / 2 + Math.sin(angle2) * radius * 1.8;

        // Glow effect on lines
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.1)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Main line
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw enhanced scrolling particles with trails
      for (let i = 0; i < 30; i++) {
        const x = (time * 0.08 + i * 60) % (canvas.width + 100) - 50;
        const y = canvas.height * 0.35 + Math.sin(x * 0.008 + time * 0.0005) * 120;
        
        // Particle trail
        ctx.fillStyle = `rgba(255, 140, 0, ${Math.max(0, 0.2 - (Math.abs(x - canvas.width / 2) / canvas.width) * 0.2)})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Particle core glow
        ctx.fillStyle = `rgba(255, 160, 20, ${Math.max(0, 0.4 - (Math.abs(x - canvas.width / 2) / canvas.width) * 0.4)})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add subtle noise waves
      ctx.fillStyle = 'rgba(255, 140, 0, 0.02)';
      for (let i = 0; i < 3; i++) {
        const waveY = canvas.height * (0.25 + i * 0.25) + Math.sin(time * 0.0008) * 30;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 20) {
          const y = waveY + Math.sin((x + time * 0.05) * 0.02) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
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
