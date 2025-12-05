"use client";

import { useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel?: string;
  icon: React.ReactNode;
  iconColor: string;
  graphColor: string;
  graphData: number[];
  chartType?: "line" | "bar";
}

// Hexagon shape component
function HexagonIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="absolute inset-0"
      >
        <path
          d="M28 4 L50 14 L50 42 L28 52 L6 42 L6 14 Z"
          fill={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-white">
        {children}
      </div>
    </div>
  );
}

// Create smooth curve path using cubic Bezier curves (Catmull-Rom like)
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  
  // Check if all points have the same Y (flat line)
  const allSameY = points.every(p => Math.abs(p.y - points[0].y) < 0.01);
  
  if (allSameY) {
    // For flat lines, use simple horizontal line
    return `M ${points[0].x} ${points[0].y} L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Calculate control points for smooth curve (Catmull-Rom spline)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return path;
}

export function KPICard({
  title,
  value,
  trend,
  icon,
  iconColor,
  graphColor,
  graphData,
  chartType = "line",
}: KPICardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const graphRef = useRef<HTMLDivElement>(null);
  
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0;

  // Calculate graph dimensions - normalize to show smooth curves
  const maxValue = Math.max(...graphData);
  const minValue = Math.min(...graphData);
  const rawRange = maxValue - minValue;
  
  // For flat lines, ensure we still show a visible line
  const range = rawRange > 0 ? rawRange : 1;

  // Create smooth curve points
  const points = graphData.map((value, index) => {
    const x = (index / (graphData.length - 1)) * 300;
    // For flat lines (range = 0), show line in middle of graph
    // For varying data, normalize based on range
    const normalizedY = rawRange > 0 
      ? ((value - minValue) / range) 
      : 0.5; // Center flat lines
    const y = 75 - normalizedY * 65;
    return { x, y, value };
  });

  const smoothPath = createSmoothPath(points);
  const areaPath = `${smoothPath} L 300 80 L 0 80 Z`;

  // Calculate bar chart dimensions
  const totalBars = graphData.length;
  const barWidth = 300 / totalBars;
  const barSpacing = barWidth * 0.15; // 15% spacing between bars
  const actualBarWidth = barWidth - barSpacing;

  // Handle mouse move to show tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, index: number) => {
    if (!graphRef.current) return;
    
    const rect = graphRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate tooltip position, ensuring it stays within bounds
    const tooltipX = Math.max(50, Math.min(x, rect.width - 50));
    const tooltipY = Math.max(10, Math.min(y - 10, rect.height - 60));
    
    setTooltipPosition({ x: tooltipX, y: tooltipY });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Format value based on title
  const formatTooltipValue = (val: number) => {
    if (title === "Total Income") {
      return `$${val.toLocaleString()}`;
    }
    return val.toLocaleString();
  };

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-800">
      <CardContent className="p-6 pb-0">
        {/* Top Section: Icon, Title, Value, Trend */}
        <div className="mb-4">
          <div className="mb-4">
            <HexagonIcon color={iconColor}>{icon}</HexagonIcon>
          </div>
          <div className="mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPositive && (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  {Math.abs(trend).toFixed(2)}%
                </span>
              </>
            )}
            {isNegative && (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">
                  {Math.abs(trend).toFixed(2)}%
                </span>
              </>
            )}
            {isNeutral && (
              <>
                <Minus className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-400">0.00%</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Graph at Bottom - Full Width with Smooth Curves or Bars */}
      <div className="h-20 relative -mb-6" ref={graphRef}>
        <svg 
          className="w-full h-full" 
          viewBox="0 0 300 80" 
          preserveAspectRatio="none"
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient 
              id={`gradient-${title.replace(/\s+/g, '-').toLowerCase()}`} 
              x1="0%" 
              y1="0%" 
              x2="0%" 
              y2="100%"
            >
              <stop offset="0%" stopColor={graphColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={graphColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {chartType === "bar" ? (
            // Bar chart
            <>
              {graphData.map((value, index) => {
                const normalizedY = rawRange > 0 
                  ? ((value - minValue) / range) 
                  : 0.3; // Minimum height for flat data
                const barHeight = normalizedY * 65; // Max height is 65
                const barY = 80 - barHeight;
                const barX = (index * barWidth) + (barSpacing / 2);
                return (
                  <g key={index}>
                    <rect
                      x={barX}
                      y={barY}
                      width={actualBarWidth}
                      height={barHeight}
                      fill={graphColor}
                      opacity={hoveredIndex === index ? 1 : 0.7}
                      rx={2}
                    />
                    {/* Invisible hover area */}
                    <rect
                      x={barX}
                      y={0}
                      width={actualBarWidth}
                      height={80}
                      fill="transparent"
                      onMouseMove={(e) => handleMouseMove(e, index)}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}
            </>
          ) : (
            // Line chart (default)
            <>
              {/* Area fill with smooth curve */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#gradient-${title.replace(/\s+/g, '-').toLowerCase()})`}
                />
              )}
              {/* Smooth curved line - always show even if flat */}
              {smoothPath && (
                <path
                  d={smoothPath}
                  fill="none"
                  stroke={graphColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Hover areas for line chart */}
              {points.map((point, index) => {
                const hoverWidth = 300 / graphData.length;
                return (
                  <g key={index}>
                    {/* Hover circle */}
                    {hoveredIndex === index && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill={graphColor}
                        stroke="white"
                        strokeWidth={2}
                      />
                    )}
                    {/* Invisible hover area */}
                    <rect
                      x={point.x - hoverWidth / 2}
                      y={0}
                      width={hoverWidth}
                      height={80}
                      fill="transparent"
                      onMouseMove={(e) => handleMouseMove(e, index)}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute pointer-events-none z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm whitespace-nowrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            <div className="text-gray-900 dark:text-gray-100 font-semibold">
              {formatTooltipValue(graphData[hoveredIndex])}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
