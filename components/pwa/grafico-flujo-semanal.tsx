"use client";

import { useEffect, useRef } from "react";
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from "chart.js";
import type { FlujoDia } from "@/lib/consultas";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function GraficoFlujoSemanal({ datos }: { datos: FlujoDia[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: datos.map((d) => d.dia),
        datasets: [
          {
            label: " Ingresos",
            data: datos.map((d) => d.ingresos),
            backgroundColor: "#50c878",
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
          {
            label: " Egresos",
            data: datos.map((d) => d.egresos),
            backgroundColor: "#FFA2A2",
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
              padding: 12,
              font: { size: 10, family: "Manrope" },
            },
          },
          tooltip: {
            backgroundColor: "#31312b",
            cornerRadius: 8,
            padding: 10,
            titleFont: { size: 11 },
            bodyFont: { size: 11, family: "JetBrains Mono" },
            callbacks: {
              label(context) {
                return `${context.dataset.label}: S/ ${context.parsed.y.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 9, family: "Manrope" } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1eee6", borderDash: [5, 5] },
            ticks: {
              callback: (value) => `S/ ${value}`,
              font: { size: 9, family: "JetBrains Mono" },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [datos]);

  return (
    <div className="relative h-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
