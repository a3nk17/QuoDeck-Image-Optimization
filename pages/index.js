import { useState, useRef, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function fmt(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / k**i).toFixed(1) + ' ' + s[i];
}

function savingColor(pct) {
  if (pct >= 60) return 'var(--accent)';
  if (pct >= 30) return 'var(--accent2)';
  if (pct > 0)  return 'var(--accent4)';
  return 'var(--danger)';
}

const sticky = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

function AnimatedBackground() {
  const { theme } = useTheme();
  return (
    <div className="orb-container" key={theme}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="noise-overlay" />
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return <div style={{ width: 40, height: 40 }} />;
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      animate={{ rotate: theme === 'light' ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, position: 'relative',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      aria-label="Toggle theme"
    >
      <motion.span
        key={theme}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  );
}

function GlassCard({ children, style, hoverGlow, onClick }) {
  const [h, sH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => sH(true)}
      onMouseLeave={() => sH(false)}
      style={{
        position: 'relative',
        background: h ? 'var(--card-bg-hover)' : 'var(--card-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${h ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 16,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
        boxShadow: hoverGlow && h ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        ...style,
      }}
    >
      {h && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(110,231,183,0.03), transparent 50%)',
          pointerEvents: 'none', transition: 'opacity 0.3s',
        }} />
      )}
      {children}
    </div>
  );
}

function Stat({ value, label, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0, duration: 0.4, ease: [0.25,0.1,0.25,1] }}
      style={{ flex: 1, minWidth: 100 }}
    >
      <GlassCard style={{ padding: '14px 18px' }}>
        <div style={{
          fontSize: 22, fontWeight: 800,
          color: color || 'var(--text)',
          fontFamily: "'JetBrains Mono'",
          letterSpacing: '-0.5px',
          textShadow: color ? `0 0 24px ${color}44` : 'none',
          transition: 'color 0.3s',
        }}>{value}</div>
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
          textTransform: 'uppercase', letterSpacing: '1.5px',
          fontWeight: 600, transition: 'color 0.3s',
        }}>{label}</div>
      </GlassCard>
    </motion.div>
  );
}

function FileCard({ result, index, onDownload }) {
  const [hovered, setHovered] = useState(false);
  const color = savingColor(result.savings || 0);
  const saved = result.savings > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25,0.1,0.25,1] }}
    >
      <GlassCard hoverGlow style={{ padding: '18px 20px' }}>
        {result.success && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${color}99 40%, ${color} 60%, transparent 100%)`,
          }}/>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: result.success ? `${color}18` : 'rgba(248,113,113,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            border: `1px solid ${result.success ? color+'30' : 'rgba(248,113,113,0.2)'}`,
            transition: 'all 0.25s',
            boxShadow: result.success ? `0 0 20px ${color}22` : 'none',
          }}>
            {result.success ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            ) : '⚠️'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 500,
              color: 'var(--text-secondary)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              marginBottom: 6, transition: 'color 0.3s',
            }}>
              {result.original}
              {result.scaled && (
                <span style={{ color: 'var(--accent2)', marginLeft: 8, fontSize: 10 }}>
                  · scaled to {result.scalePct}%
                </span>
              )}
            </div>

            {result.success ? (
              <>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', transition: 'color 0.3s' }}>
                    <span style={{ color: '#666', fontFamily: "'JetBrains Mono'" }}>{fmt(result.originalSize)}</span>
                  </span>
                  <span style={{
                    fontSize: 10, color: 'var(--text-dim)',
                    fontFamily: "'JetBrains Mono'", fontWeight: 300,
                    transition: 'color 0.3s',
                  }}>→</span>
                  <span style={{ fontSize: 11 }}>
                    <span style={{ color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{fmt(result.optimizedSize)}</span>
                  </span>
                  <span style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono'", transition: 'color 0.3s',
                  }}>
                    {result.width}×{result.height}
                  </span>
                </div>

                <div style={{
                  marginTop: 10, height: 3,
                  background: 'var(--border)',
                  borderRadius: 99, overflow: 'hidden',
                  transition: 'background 0.3s',
                }}>
                  <div style={{
                    height: '100%', width: `${Math.max(0, Math.min(100, result.savings))}%`,
                    background: `linear-gradient(90deg, ${color}44, ${color})`,
                    borderRadius: 99,
                    boxShadow: `0 0 8px ${color}66`,
                    animation: 'fillBar 1s cubic-bezier(.4,0,.2,1) both',
                  }}/>
                </div>

                <div style={{
                  marginTop: 5, fontSize: 11, fontWeight: 700,
                  color, fontFamily: "'JetBrains Mono'",
                }}>
                  {saved ? `↓ ${result.savings}% smaller` : 'Already optimal'}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>
                {result.error}
              </div>
            )}
          </div>

          {result.success && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownload(result)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                padding: '9px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: hovered ? `${color}1a` : 'var(--glass-bg)',
                color: hovered ? color : 'var(--text-dim)',
                border: `1px solid ${hovered ? color+'44' : 'var(--border)'}`,
                cursor: 'pointer', flexShrink: 0,
                fontFamily: "'JetBrains Mono'",
                letterSpacing: '0.5px',
                transition: 'background 0.25s, color 0.25s, border-color 0.25s',
              }}
            >
              ↓ PNG
            </motion.button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function Home() {
  const [files, setFiles]       = useState([]);
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [quality, setQuality]   = useState(80);
  const [maxW, setMaxW]         = useState('');
  const [maxH, setMaxH]         = useState('');
  const [targetSize, setTargetSize] = useState(150);
  const [targetEnabled, setTargetEnabled] = useState(true);
  const fileRef = useRef();
  const progRef = useRef();
  const { theme, mounted } = useTheme();

  useEffect(() => {
    if (loading) {
      let p = 5;
      progRef.current = setInterval(() => {
        p = Math.min(p + Math.random() * 6, 88);
        setProgress(p);
      }, 180);
    } else {
      clearInterval(progRef.current);
      if (results.length) setProgress(100);
    }
    return () => clearInterval(progRef.current);
  }, [loading]);

  const addFiles = useCallback((incoming) => {
    const valid = [...incoming].filter(f =>
      ['image/png','image/jpeg','image/webp','image/gif','image/bmp','image/tiff'].includes(f.type)
    );
    setFiles(prev => {
      const seen = new Set(prev.map(f => f.name+'|'+f.size));
      return [...prev, ...valid.filter(f => !seen.has(f.name+'|'+f.size))];
    });
    setResults([]);
    setProgress(0);
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = i => {
    setFiles(f => f.filter((_,idx) => idx !== i));
    setResults([]); setProgress(0);
  };

  const optimize = async () => {
    if (!files.length || loading) return;
    setLoading(true); setResults([]); setProgress(5);

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('quality', quality);
    fd.append('maxWidth', maxW || '0');
    fd.append('maxHeight', maxH || '0');
    fd.append('targetSize', targetEnabled ? (targetSize * 1024).toString() : '0');

    try {
      const res = await fetch('/api/optimize', { method:'POST', body:fd });
      const data = await res.json();
      setResults(data.results || []);
    } catch(e) {
      alert('Optimization failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadOne = (result) => {
    const byteStr = atob(result.base64);
    const ab = new ArrayBuffer(byteStr.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    const blob = new Blob([ab], { type:'image/png' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.original.replace(/\.[^.]+$/, '') + '_optimized.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    results.filter(r => r.success).forEach((r, i) => {
      setTimeout(() => downloadOne(r), i * 120);
    });
  };

  const successes    = results.filter(r => r.success);
  const totalOrig    = successes.reduce((s,r) => s + r.originalSize, 0);
  const totalOpt     = successes.reduce((s,r) => s + r.optimizedSize, 0);
  const totalSavings = totalOrig ? ((totalOrig - totalOpt) / totalOrig * 100).toFixed(1) : '0';
  const totalSaved   = totalOrig - totalOpt;

  const targetMin = Math.round(targetSize * 0.8);
  const targetMax = Math.round(targetSize * 1.2);

  const outColor = savingColor(parseFloat(totalSavings));

  return (
    <>
      <Head>
        <title>Quodeck — Image Optimization</title>
        <meta name="description" content="Compress images to target file sizes with intelligent optimization"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>"/>
      </Head>

      <AnimatedBackground key={theme} />

      <div style={{ position:'relative', zIndex:2, maxWidth:880, margin:'0 auto', padding:'0 24px 80px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25,0.1,0.25,1] }}
          style={{ paddingTop: 48, paddingBottom: 36 }}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                style={{
                  width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f472b6, #a78bfa, #6ee7b7)',
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 4s ease infinite',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, position: 'relative',
                  boxShadow: '0 0 50px rgba(167,139,250,0.3), 0 0 80px rgba(244,114,182,0.15)',
                }}
              >
                <span style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }}>✦</span>
                <div style={{
                  position: 'absolute', inset: -2, borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(244,114,182,0.3), rgba(167,139,250,0.3), rgba(110,231,183,0.3))',
                  filter: 'blur(12px)', zIndex: -1,
                  animation: 'ping 3s ease-in-out infinite',
                }}/>
              </motion.div>
              <div>
                <h1 style={{
                  fontSize: 36, fontWeight: 800,
                  letterSpacing: '-2px', lineHeight: 1,
                  background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 40%, #6ee7b7 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 5s ease infinite',
                }}>Quodeck</h1>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  letterSpacing: '3px', textTransform: 'uppercase', marginTop: 4,
                  fontWeight: 600, transition: 'color 0.3s',
                }}>
                  Image Optimization
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <p style={{
            fontSize: 15, color: 'var(--text-tertiary)', maxWidth: 520,
            lineHeight: 1.8, transition: 'color 0.3s',
          }}>
            Intelligent image compression with adaptive quality targeting. Drop any format,
            get back optimized PNGs at your exact file size target — all processed locally.
          </p>

          <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginTop: 20 }}>
            {['PNG · JPG · WebP · GIF', 'Up to 50 files', 'Adaptive quality', 'Bulk download'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                style={{
                  fontSize: 11, color: 'var(--text-tertiary)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 99, padding: '5px 14px',
                  letterSpacing: '0.5px', fontWeight: 500,
                  transition: 'color 0.3s, background 0.3s, border-color 0.3s',
                }}
              >{tag}</motion.span>
            ))}
          </div>
        </motion.header>

        {/* ── Target Size ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.25,0.1,0.25,1] }}
          style={{ marginBottom: 16 }}
        >
          <GlassCard style={{ padding: '20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1.5px',
                  transition: 'color 0.3s',
                }}>
                  Target File Size
                </span>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)',
                  fontWeight: 500, transition: 'color 0.3s',
                }}>
                  <input
                    type="checkbox"
                    checked={targetEnabled}
                    onChange={e => setTargetEnabled(e.target.checked)}
                    style={{
                      width: 14, height: 14, accentColor: 'var(--accent4)',
                      cursor: 'pointer',
                    }}
                  />
                  Auto-optimize
                </label>
              </div>
              {targetEnabled && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  style={{
                    fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700,
                    color: 'var(--accent4)',
                    textShadow: '0 0 20px rgba(167,139,250,0.3)',
                    letterSpacing: '-1px',
                  }}
                >
                  {targetSize} KB
                </motion.div>
              )}
            </div>

            {targetEnabled && (
              <>
                <input
                  type="range" min={30} max={500} step={5}
                  value={targetSize}
                  onChange={e => setTargetSize(+e.target.value)}
                  style={{ width: '100%' }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 8,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'color 0.3s' }}>30 KB</span>
                  <div style={{ display:'flex', gap: 12, alignItems:'center' }}>
                    <span style={{
                      fontSize: 10, color: 'var(--accent)',
                      fontFamily: "'JetBrains Mono'", fontWeight: 500,
                      background: 'rgba(110,231,183,0.08)',
                      padding: '2px 10px', borderRadius: 99,
                      border: '1px solid rgba(110,231,183,0.15)',
                    }}>
                      target: {targetMin}–{targetMax} KB
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'color 0.3s' }}>500 KB</span>
                </div>
              </>
            )}

            {!targetEnabled && (
              <div style={{
                fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic',
                transition: 'color 0.3s',
              }}>
                Manual quality control enabled below
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ── Drop Zone ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25,0.1,0.25,1] }}
        >
          <GlassCard
            hoverGlow
            style={{
              padding: files.length ? '20px' : '56px 24px',
              textAlign: files.length ? 'left' : 'center',
              cursor: files.length ? 'default' : 'pointer',
              border: `2px dashed ${dragging ? 'var(--accent)' : files.length ? 'var(--dropzone-border)' : 'var(--dropzone-border)'}`,
              animation: dragging ? 'borderPulse 1.5s ease-in-out infinite' : 'none',
              boxShadow: dragging ? '0 0 0 4px rgba(110,231,183,0.08) inset' : 'none',
              transition: 'all 0.3s ease, border-color 0.3s',
            }}
            onClick={() => files.length === 0 && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {files.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    fontSize: 56, marginBottom: 24,
                    filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.2))',
                    transition: 'filter 0.3s',
                  }}
                >
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </motion.div>
                <div style={{
                  fontSize: 22, fontWeight: 700, marginBottom: 8,
                  letterSpacing: '-0.5px', color: 'var(--text)',
                  transition: 'color 0.3s',
                }}>
                  Drop images here
                </div>
                <div style={{
                  fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 28,
                  transition: 'color 0.3s',
                }}>
                  PNG, JPEG, WebP, GIF, BMP, TIFF — up to 50 files
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
                  style={{
                    padding: '13px 36px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: 'linear-gradient(135deg, #f472b6, #a78bfa, #6ee7b7)',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 4s ease infinite',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    boxShadow: 'var(--btn-glow)',
                    letterSpacing: '0.3px', position: 'relative', overflow: 'hidden',
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  Browse Files
                </motion.button>
              </motion.div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap: 8, alignItems:'center' }}>
                {files.map((f,i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      display:'flex', alignItems:'center', gap: 8,
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding:'6px 10px',
                      maxWidth: 200, transition: 'background 0.3s, border-color 0.3s',
                    }}
                  >
                    <span style={{
                      fontSize: 11, color: 'var(--text-tertiary)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      flex: 1, fontFamily:"'JetBrains Mono'", maxWidth: 140,
                      transition: 'color 0.3s',
                    }}>{f.name}</span>
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(i); }}
                      style={{
                        background:'none', border:'none', color:'var(--text-muted)',
                        cursor:'pointer', fontSize: 16, padding: 0, lineHeight: 1,
                        flexShrink: 0, transition:'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
                    >×</button>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ borderColor: 'var(--accent4)', color: 'var(--accent4)' }}
                  onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
                  style={{
                    display:'flex', alignItems:'center', gap: 6,
                    background:'var(--glass-bg)',
                    border:'1px dashed var(--border-hover)',
                    borderRadius: 8, padding:'6px 12px',
                    color:'var(--text-muted)', cursor:'pointer',
                    fontSize: 12, fontWeight: 600, transition:'all 0.2s',
                  }}
                >
                  + More
                </motion.button>
              </div>
            )}
            <input
              ref={fileRef} type="file" multiple
              accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff"
              style={{ display:'none' }}
              onChange={e => addFiles(e.target.files)}
            />
          </GlassCard>
        </motion.div>

        {/* ── Settings ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.25,0.1,0.25,1] }}
          style={{
            display: 'grid', gridTemplateColumns: targetEnabled ? '1fr 1fr' : '2fr 1fr 1fr',
            gap: 14, marginTop: 16,
          }}
        >
          {!targetEnabled && (
            <GlassCard style={{ padding: '18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 16, alignItems:'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color:'var(--text-muted)',
                  textTransform:'uppercase', letterSpacing:'1px',
                  transition: 'color 0.3s',
                }}>
                  Compression Quality
                </span>
                <span style={{
                  fontFamily:"'JetBrains Mono'", fontSize: 18, fontWeight: 600,
                  color:'var(--accent4)', textShadow:'0 0 16px rgba(167,139,250,0.5)',
                }}>{quality}%</span>
              </div>
              <input type="range" min={10} max={100} step={5} value={quality}
                onChange={e => setQuality(+e.target.value)} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 10, color:'var(--text-dim)', transition: 'color 0.3s' }}>Max compression</span>
                <span style={{ fontSize: 10, color:'var(--text-dim)', transition: 'color 0.3s' }}>Best quality</span>
              </div>
            </GlassCard>
          )}

          <GlassCard style={{ padding: '18px 20px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color:'var(--text-muted)',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom: 14,
              transition: 'color 0.3s',
            }}>
              Max Width
            </div>
            <input type="number" placeholder="e.g. 1920" value={maxW} onChange={e=>setMaxW(e.target.value)}/>
            <div style={{ fontSize: 10, color:'var(--text-dim)', marginTop: 8, transition: 'color 0.3s' }}>px — leave blank to keep</div>
          </GlassCard>

          <GlassCard style={{ padding: '18px 20px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color:'var(--text-muted)',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom: 14,
              transition: 'color 0.3s',
            }}>
              Max Height
            </div>
            <input type="number" placeholder="e.g. 1080" value={maxH} onChange={e=>setMaxH(e.target.value)}/>
            <div style={{ fontSize: 10, color:'var(--text-dim)', marginTop: 8, transition: 'color 0.3s' }}>px — aspect ratio kept</div>
          </GlassCard>
        </motion.div>

        {/* ── Optimize Button ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.25,0.1,0.25,1] }}
          style={{ marginTop: 16 }}
        >
          <motion.button
            whileHover={files.length && !loading ? { scale: 1.01, y: -2 } : {}}
            whileTap={files.length && !loading ? { scale: 0.99 } : {}}
            onClick={optimize}
            disabled={!files.length || loading}
            style={{
              width:'100%', padding:'20px 24px',
              borderRadius: 14, fontSize: 16, fontWeight: 800,
              background: files.length && !loading
                ? 'linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #6ee7b7 100%)'
                : 'var(--glass-bg)',
              backgroundSize: files.length && !loading ? '200% 200%' : '',
              animation: files.length && !loading ? 'shimmer 4s ease infinite, glowPulse 3s ease-in-out infinite' : 'none',
              color: files.length && !loading ? '#fff' : 'var(--text-dim)',
              border: 'none',
              cursor: files.length && !loading ? 'pointer' : 'not-allowed',
              boxShadow: files.length && !loading ? 'var(--btn-glow)' : 'none',
              letterSpacing:'-0.3px',
              display:'flex', alignItems:'center', justifyContent:'center', gap: 12,
              position:'relative', overflow:'hidden',
              transition: 'background 0.3s, box-shadow 0.3s, color 0.3s',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 20, height: 20,
                  border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'spinRing 0.7s linear infinite',
                }}/>
                Optimizing {files.length} image{files.length !== 1 ? 's' : ''}…
              </>
            ) : (
              <>✦&ensp;Optimize {files.length > 0 ? `${files.length} ` : ''}Image{files.length !== 1 ? 's' : ''}</>
            )}
          </motion.button>

          <AnimatePresence>
            {(loading || (results.length > 0 && progress > 0)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 10 }}
              >
                <div style={{
                  height: 3, background:'var(--border)',
                  borderRadius: 99, overflow:'hidden',
                  transition: 'background 0.3s',
                }}>
                  <motion.div
                    style={{
                      height:'100%',
                      background:'linear-gradient(90deg, var(--accent3), var(--accent4), var(--accent))',
                      borderRadius: 99,
                      boxShadow:'0 0 10px rgba(167,139,250,0.5)',
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{ marginTop: 36 }}
            >
              <motion.div
                variants={sticky}
                initial="hidden"
                animate="show"
                style={{ display:'flex', gap: 10, marginBottom: 20, flexWrap:'wrap' }}
              >
                <Stat value={`${successes.length}/${files.length}`} label="Processed" delay={0} />
                <Stat value={fmt(totalOrig)}    label="Original size" color="var(--text-dim)" delay={0.04} />
                <Stat value={fmt(totalOpt)}     label="Optimized"    color="var(--accent2)" delay={0.08} />
                <Stat value={`${totalSavings}%`} label="Size saved"   color={outColor} delay={0.12} />
                {totalSaved > 0 && <Stat value={fmt(totalSaved)} label="Bytes freed" color="var(--accent4)" delay={0.16}/>}
              </motion.div>

              {successes.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ background: 'rgba(110,231,183,0.13)', borderColor: 'rgba(110,231,183,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadAll}
                  style={{
                    width:'100%', padding:'14px 24px', borderRadius: 12,
                    fontSize: 13, fontWeight: 700, letterSpacing:'0.3px',
                    background:'rgba(110,231,183,0.07)',
                    color:'var(--accent)',
                    border:'1px solid rgba(110,231,183,0.2)',
                    cursor:'pointer', marginBottom: 16,
                    display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
                    transition:'all 0.2s, background 0.3s, border-color 0.3s',
                  }}
                >
                  ↓&ensp;Download All ({successes.length} PNGs)
                </motion.button>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
                {results.map((r,i) => (
                  <FileCard key={i} result={r} index={i} onDownload={downloadOne}/>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ color:'var(--text-tertiary)', borderColor:'var(--border-hover)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setFiles([]); setResults([]); setProgress(0); }}
                style={{
                  marginTop: 20, width:'100%', padding:'13px 24px',
                  borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background:'transparent', color:'var(--text-muted)',
                  border:'1px solid var(--border)',
                  cursor:'pointer', transition:'all 0.2s, color 0.3s, border-color 0.3s',
                  letterSpacing:'0.3px',
                }}
              >
                ↺&ensp;Start Over
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            marginTop: 56, paddingTop: 24,
            borderTop:'1px solid var(--border)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap: 8,
            transition: 'border-color 0.3s',
          }}
        >
          <span style={{ fontSize: 11, color:'var(--text-muted)', transition: 'color 0.3s' }}>
            ✦ Quodeck — powered by{' '}
            <span style={{ color:'var(--accent4)' }}>Sharp</span> &{' '}
            <span style={{ color:'var(--accent)' }}>Next.js</span>
          </span>
          <span style={{ fontSize: 11, color:'var(--text-muted)', transition: 'color 0.3s' }}>
            All processing happens on your server · No data sent anywhere
          </span>
        </motion.footer>
      </div>
    </>
  );
}
