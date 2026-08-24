"use client";

import { useRef } from "react";
import { Button } from "./ui/button";

export function SignaturePad({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  return (
    <div>
      <input type="hidden" name={name} id={name} />
      <canvas
        ref={canvasRef}
        width={420}
        height={140}
        className="w-full rounded-md border border-border bg-white touch-none"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvasRef.current!.getContext("2d")!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 2;
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          const data = canvasRef.current!.toDataURL("image/png");
          const input = document.getElementById(name) as HTMLInputElement;
          if (input) input.value = data;
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1"
        onClick={() => {
          const c = canvasRef.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          const input = document.getElementById(name) as HTMLInputElement;
          if (input) input.value = "";
        }}
      >
        Clear signature
      </Button>
    </div>
  );
}
