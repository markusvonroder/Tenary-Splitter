import React, { useState, useRef } from 'react';

const s = 600;
const h = s * Math.sqrt(3) / 2;
const By = 500 + h / 3;

function getBarycentric(x: number, y: number) {
  const a = (By - y) / h;
  const dx = x - 500;
  const c = (1 - a + 2 * dx / s) / 2;
  const b = (1 - a - 2 * dx / s) / 2;
  return [a, b, c];
}

function getCartesian(a: number, b: number, c: number) {
  const y = By - a * h;
  const dx = (c - b) * s / 2;
  const x = 500 + dx;
  return [x, y];
}

function projectToSimplex(v: number[]) {
  const sorted = [...v].sort((x, y) => y - x);
  let rho = 0;
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += sorted[i];
    if (sorted[i] + (1 - sum) / (i + 1) > 0) {
      rho = i;
    }
  }
  sum = 0;
  for (let i = 0; i <= rho; i++) {
    sum += sorted[i];
  }
  const lambda = (1 - sum) / (rho + 1);
  return v.map(x => Math.max(x + lambda, 0));
}

const gridLines: number[][][] = [];
for (let i = 1; i <= 4; i++) {
  const v = i * 0.2;
  gridLines.push([getCartesian(v, 1-v, 0), getCartesian(v, 0, 1-v)]);
  gridLines.push([getCartesian(1-v, v, 0), getCartesian(0, v, 1-v)]);
  gridLines.push([getCartesian(1-v, 0, v), getCartesian(0, 1-v, v)]);
}

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [factors, setFactors] = useState([1/3, 1/3, 1/3]);
  const [names, setNames] = useState(["Factor A", "Factor B", "Factor C"]);
  const [tooltip, setTooltip] = useState<{x: number, y: number} | null>(null);

  const handlePctEnter = (e: React.PointerEvent | React.MouseEvent) => {
    setTooltip({ x: e.clientX, y: e.clientY });
  };
  const handlePctMove = (e: React.PointerEvent | React.MouseEvent) => {
    setTooltip({ x: e.clientX, y: e.clientY });
  };
  const handlePctLeave = () => {
    setTooltip(null);
  };

  const updatePosition = (e: React.PointerEvent<SVGSVGElement | SVGCircleElement>) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    
    const [a, b, c] = getBarycentric(svgP.x, svgP.y);
    const projected = projectToSimplex([a, b, c]);
    setFactors(projected);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement | SVGCircleElement>) => {
    setIsDragging(true);
    updatePosition(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement | SVGCircleElement>) => {
    if (isDragging) {
      updatePosition(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement | SVGCircleElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const formatPct = (val: number) => (val * 100).toFixed(1) + "%";

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/4 min-w-[320px] max-w-[400px] bg-white border-r border-slate-200 p-8 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
         <div className="mb-10">
           <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ternary Splitter</h1>
           <p className="text-sm text-slate-500 mt-2">Balance 100% across three factors.</p>
         </div>
         
         <div className="space-y-8">
           {/* Factor A */}
           <div className="space-y-3 relative">
             <div className="absolute -left-4 top-2 w-1 h-10 bg-rose-500 rounded-r-full"></div>
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Factor</label>
             <input 
               type="text" 
               value={names[0]} 
               onChange={(e) => setNames([e.target.value, names[1], names[2]])}
               className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700"
               placeholder="Name Factor A"
             />
             <div 
               className="text-4xl font-light text-rose-600 tracking-tight w-max cursor-help"
               onPointerEnter={handlePctEnter}
               onPointerMove={handlePctMove}
               onPointerLeave={handlePctLeave}
             >
               {formatPct(factors[0])}
             </div>
           </div>
           
           {/* Factor B */}
           <div className="space-y-3 relative">
             <div className="absolute -left-4 top-2 w-1 h-10 bg-emerald-500 rounded-r-full"></div>
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bottom Left Factor</label>
             <input 
               type="text" 
               value={names[1]} 
               onChange={(e) => setNames([names[0], e.target.value, names[2]])}
               className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
               placeholder="Name Factor B"
             />
             <div 
               className="text-4xl font-light text-emerald-600 tracking-tight w-max cursor-help"
               onPointerEnter={handlePctEnter}
               onPointerMove={handlePctMove}
               onPointerLeave={handlePctLeave}
             >
               {formatPct(factors[1])}
             </div>
           </div>
           
           {/* Factor C */}
           <div className="space-y-3 relative">
             <div className="absolute -left-4 top-2 w-1 h-10 bg-sky-500 rounded-r-full"></div>
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bottom Right Factor</label>
             <input 
               type="text" 
               value={names[2]} 
               onChange={(e) => setNames([names[0], names[1], e.target.value])}
               className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700"
               placeholder="Name Factor C"
             />
             <div 
               className="text-4xl font-light text-sky-600 tracking-tight w-max cursor-help"
               onPointerEnter={handlePctEnter}
               onPointerMove={handlePctMove}
               onPointerLeave={handlePctLeave}
             >
               {formatPct(factors[2])}
             </div>
           </div>
         </div>
         
         <div className="mt-auto pt-8">
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
             <p className="text-sm text-slate-500 leading-relaxed">
               Drag the dot on the triangle to adjust the balance. The closer the dot is to a corner, the higher the percentage for that factor.
             </p>
           </div>
         </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 relative flex items-center justify-center p-12">
        <svg 
          ref={svgRef}
          viewBox="0 0 1000 1000" 
          className="w-full h-full max-w-[900px] max-h-[900px] touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="24" floodOpacity="0.06" />
            </filter>
            <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Triangle Background */}
          <polygon 
            points={`${getCartesian(1,0,0).join(',')} ${getCartesian(0,1,0).join(',')} ${getCartesian(0,0,1).join(',')}`}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinejoin="round"
            filter="url(#shadow)"
          />
          
          {/* Grid Lines */}
          {gridLines.map((line, i) => (
            <line 
              key={i}
              x1={line[0][0]} y1={line[0][1]}
              x2={line[1][0]} y2={line[1][1]}
              stroke="#f1f5f9"
              strokeWidth="2"
            />
          ))}
          
          {/* Dynamic Color Layer */}
          <polygon 
            points={`${getCartesian(1,0,0).join(',')} ${getCartesian(0,1,0).join(',')} ${getCartesian(0,0,1).join(',')}`}
            fill={`rgb(${Math.round(factors[0] * 255)}, ${Math.round(factors[1] * 255)}, ${Math.round(factors[2] * 255)})`}
            opacity="0.3"
            className="pointer-events-none transition-colors duration-75"
          />
          
          {/* Center Point Reference */}
          <circle cx="500" cy={By - h/3} r="4" fill="#cbd5e1" />
          
          {/* Tip Labels */}
          {/* Top */}
          <g transform={`translate(${getCartesian(1,0,0)[0]}, ${getCartesian(1,0,0)[1] - 40})`}>
            <text textAnchor="middle" className="text-2xl font-semibold fill-rose-600 tracking-tight">{names[0]}</text>
            <text 
              y="32" 
              textAnchor="middle" 
              className="text-xl font-medium fill-slate-500 cursor-help"
              onPointerEnter={handlePctEnter}
              onPointerMove={handlePctMove}
              onPointerLeave={handlePctLeave}
            >
              {formatPct(factors[0])}
            </text>
          </g>
          
          {/* Bottom Left */}
          <g transform={`translate(${getCartesian(0,1,0)[0] - 40}, ${getCartesian(0,1,0)[1] + 30})`}>
            <text textAnchor="end" className="text-2xl font-semibold fill-emerald-600 tracking-tight">{names[1]}</text>
            <text 
              y="32" 
              textAnchor="end" 
              className="text-xl font-medium fill-slate-500 cursor-help"
              onPointerEnter={handlePctEnter}
              onPointerMove={handlePctMove}
              onPointerLeave={handlePctLeave}
            >
              {formatPct(factors[1])}
            </text>
          </g>
          
          {/* Bottom Right */}
          <g transform={`translate(${getCartesian(0,0,1)[0] + 40}, ${getCartesian(0,0,1)[1] + 30})`}>
            <text textAnchor="start" className="text-2xl font-semibold fill-sky-600 tracking-tight">{names[2]}</text>
            <text 
              y="32" 
              textAnchor="start" 
              className="text-xl font-medium fill-slate-500 cursor-help"
              onPointerEnter={handlePctEnter}
              onPointerMove={handlePctMove}
              onPointerLeave={handlePctLeave}
            >
              {formatPct(factors[2])}
            </text>
          </g>
          
          {/* Draggable Dot */}
          <g transform={`translate(${getCartesian(factors[0], factors[1], factors[2])[0]}, ${getCartesian(factors[0], factors[1], factors[2])[1]})`}>
            <g className={`transition-transform duration-75 ${isDragging ? 'scale-110' : 'hover:scale-105'}`}>
              {/* Invisible larger hit area */}
              <circle r="40" fill="transparent" className="cursor-grab active:cursor-grabbing" />
              <circle r="16" fill="white" filter="url(#dot-shadow)" className="pointer-events-none" />
              <circle r="16" fill="transparent" stroke="#0f172a" strokeWidth="4" className="pointer-events-none" />
              <circle r="5" fill="#0f172a" className="pointer-events-none" />
            </g>
          </g>
        </svg>
      </div>
      
      {/* Tooltip Overlay */}
      {tooltip && (
        <div 
          className="fixed z-50 bg-slate-800 text-white text-sm p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          This percentage is determined by the dot's proximity to the corresponding triangle tip, relative to the center and other tips.
        </div>
      )}
    </div>
  );
}
