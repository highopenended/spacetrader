import React from 'react';
import './DumpsterVisionOverlay.css';
import { useAnchorsStore } from '../../../stores';
import { Anchor } from '../../../stores/anchorsStore';
import { VisualOverlayProps, ANIMATION_DURATIONS } from '../types';

const DumpsterVisionOverlay: React.FC<VisualOverlayProps> = ({ isExiting, animationState }) => {
  // Get anchors from Zustand store with selective subscription
  const anchors = useAnchorsStore(state => state.anchors);
  
  const [animateLabels, setAnimateLabels] = React.useState<boolean>(false);
  const labelRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const smoothMapRef = React.useRef<Map<string, Anchor>>(new Map());

  // Trigger a one-shot intro animation for labels once booting completes
  React.useEffect(() => {
    if (animationState !== 'idle') return;
    setAnimateLabels(true);
    const t = window.setTimeout(() => setAnimateLabels(false), ANIMATION_DURATIONS.LABEL_INTRO);
    return () => window.clearTimeout(t);
  }, [animationState]);

  // Optimized dead-zone smoothing using useMemo (prevents unnecessary recalculations)
  const smoothedAnchors = React.useMemo(() => {
    const vwToPx = window.innerWidth / 100;
    const vhToPx = window.innerHeight / 100;
    const DEAD_PX = 2.5; // slightly larger dead-zone for micro jiggles
    const LERP = 0.15; // softer easing when above dead-zone

    const next: Anchor[] = anchors.map(a => {
      const prev = smoothMapRef.current.get(a.id);
      if (!prev) {
        return a;
      }
      let xVw = a.xVw;
      let bottomVh = a.bottomVh;
      const dxPx = (a.xVw - prev.xVw) * vwToPx;
      const dyPx = (a.bottomVh - prev.bottomVh) * vhToPx;
      if (Math.abs(dxPx) < DEAD_PX) xVw = prev.xVw; else xVw = prev.xVw + (a.xVw - prev.xVw) * LERP;
      if (Math.abs(dyPx) < DEAD_PX) bottomVh = prev.bottomVh; else bottomVh = prev.bottomVh + (a.bottomVh - prev.bottomVh) * LERP;

      // Do NOT smooth the scrap center so the connector stays glued during fast motion
      const cxVw = a.cxVw;
      const cyVh = a.cyVh;

      return { ...a, xVw, bottomVh, cxVw, cyVh } as Anchor;
    });

    // Update ref map and remove stale ids
    const nextIds = new Set(anchors.map(a => a.id));
    for (const id of Array.from(smoothMapRef.current.keys())) {
      if (!nextIds.has(id)) smoothMapRef.current.delete(id);
    }
    next.forEach(a => smoothMapRef.current.set(a.id, a));
    
    return next;
  }, [anchors]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    >
      {/* Base CRT layer: scanlines + vignette + subtle green tint */}
      <div className={`dv-crt ${animationState === 'booting' ? 'dv-booting' : isExiting ? 'dv-shutdown' : 'dv-active'}`} aria-hidden />

      {/* Boot overlays (shown only during startup) */}
      {animationState === 'booting' && (
        <>
          <div className="dv-boot-flash" aria-hidden />
          <div className="dv-boot-beam" aria-hidden />
          <div className="dv-boot-text" aria-hidden>SYSTEM ONLINE</div>
          <div className="dv-boot-loader" aria-hidden>
            <div className="dv-boot-loader-bar" />
          </div>
          <div className="dv-boot-welcome" aria-hidden>
            WELCOME TO DUMPSTER VISION
          </div>
        </>
      )}
      {animationState === 'idle' && !isExiting && smoothedAnchors.map((a, idx) => (
        <div
          key={a.id}
          ref={(el) => {
            const map = labelRefs.current;
            if (!el) { map.delete(a.id); return; }
            map.set(a.id, el);
          }}
          style={{
            position: 'absolute',
            left: `${a.xVw}vw`,
            bottom: `${a.bottomVh}vh`,
            transform: 'perspective(400px) rotateX(12deg)',
            color: '#9f9',
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
            fontSize: 12,
            textShadow: '0 0 4px rgba(144,255,144,0.8)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(144,255,144,0.22)',
            boxShadow: '0 0 8px rgba(144,255,144,0.15), inset 0 0 0 1px rgba(144,255,144,0.08)',
            borderRadius: 2,
            padding: '3px 6px',
            lineHeight: 1.25,
            display: 'inline-flex',
            flexDirection: 'column',
            animation: animateLabels ? `dv-label-in 300ms ease-out ${(idx % 5) * 30}ms both` : undefined,
          }}
          aria-hidden
        >
          {(a.label.split('\n')).map((line: string, idx: number, arr: string[]) => {
            const isHeader = idx === 0;
            const isFirstMutator = idx === 1 && arr.length > 1;
            const style: React.CSSProperties | undefined = isHeader
              ? {
                  fontWeight: 700,
                  width: '100%',
                  textAlign: 'center' as const,
                  borderBottom: '1px solid rgba(144,255,144,0.35)'
                }
              : isFirstMutator
                ? { marginTop: 4 }
                : undefined;
            return (
              <div key={idx} style={style}>
                {line}
              </div>
            );
          })}
        </div>
      ))}

      {/* Dynamic connector lines from scrap center to nearest label edge */}
      {animationState === 'idle' && !isExiting && smoothedAnchors.map((a) => {
        if (a.cxVw == null || a.cyVh == null) return null;
        return (
          <ConnectorLine key={`${a.id}-line`} anchor={a} getLabelEl={() => labelRefs.current.get(a.id) || null} />
        );
      })}
    </div>
  );
};

export default DumpsterVisionOverlay;

// Helper: draw a connector line between scrap center and nearest label edge
const ConnectorLine: React.FC<{ anchor: Anchor; getLabelEl: () => HTMLDivElement | null }> = ({ anchor, getLabelEl }) => {
  const [style, setStyle] = React.useState<React.CSSProperties | null>(null);

  const compute = React.useCallback(() => {
    const labelEl = getLabelEl();
    if (!labelEl) { setStyle(null); return; }
    const rect = labelEl.getBoundingClientRect();
    const startX = (anchor.cxVw ?? 0) * (window.innerWidth / 100);
    const startY = window.innerHeight - (anchor.cyVh ?? 0) * (window.innerHeight / 100);
    // Use actual on-screen label rect (accounts for transforms) for nearest point
    const labelLeftPx = rect.left;
    const labelRightPx = rect.right;
    const labelTopPx = rect.top;
    const labelBottomPxFromTop = rect.bottom;
    // Find nearest point on label rect to start
    const nearestX = Math.max(labelLeftPx, Math.min(startX, labelRightPx));
    const nearestY = Math.max(labelTopPx, Math.min(startY, labelBottomPxFromTop));
    const dx = nearestX - startX;
    const dy = nearestY - startY;
    const length = Math.max(0, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    setStyle({
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${Math.max(0, length + 1)}px`,
      height: '0px',
      borderBottom: '1px solid rgba(144,255,144,0.45)',
      boxShadow: '0 0 6px rgba(144,255,144,0.35)',
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 50%'
    });
  }, [anchor, getLabelEl]);

  React.useLayoutEffect(() => {
    compute();
  }, [compute]);

  React.useEffect(() => {
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [compute]);

  if (!style) return null;
  return <div style={style} aria-hidden />;
};


