import React from 'react';
import type { CertificateData } from '@/types/certificate';
import { QRCodeSVG } from 'qrcode.react';

interface Props { data: CertificateData; }

/* ── helpers ── */
const font = (family: string) => {
  switch (family) {
    case 'serif':     return "'Playfair Display', Georgia, serif";
    case 'cursive':   return "'Dancing Script', cursive";
    case 'monospace': return "'Courier New', Courier, monospace";
    default:          return "system-ui, -apple-system, sans-serif";
  }
};

/* ══════════════════════════════════════════════════════════════
   CLASSIC FORMAL TEMPLATE
══════════════════════════════════════════════════════════════ */
const ClassicTemplate: React.FC<Props> = ({ data }) => {
  const bodyFont  = font(data.styles.fontFamily);
  const bodySize  = data.styles.fontSize;
  const spacing   = data.styles.spacing;
  const align     = data.styles.textAlign;

  return (
    <div
      className="w-full h-full relative flex flex-col"
      style={{ background: '#fdfaf5', fontFamily: bodyFont }}
    >
      {/* Outer decorative border */}
      <div className="absolute inset-0 border-[16px] border-double border-amber-800/30 pointer-events-none z-10" />
      <div className="absolute inset-[24px] border border-amber-800/20 pointer-events-none z-10" />
      {/* Corner ornaments */}
      {[['top-4 left-4','┌'], ['top-4 right-4','┐'], ['bottom-4 left-4','└'], ['bottom-4 right-4','┘']].map(([pos, char]) => (
        <span key={pos} className={`absolute ${pos} text-amber-700/40 text-3xl font-serif pointer-events-none z-10`}>{char}</span>
      ))}

      {/* Header */}
      <div className="flex items-center justify-between px-16 pt-12 pb-6">
        <LogoBox src={data.leftLogo} label="Left Logo" />
        <div className="text-center flex-1 px-6">
          <div className="text-xs tracking-[0.3em] text-amber-800/60 uppercase mb-2 font-sans">
            The Management Academy
          </div>
          <h1
            className="font-bold text-amber-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: `${bodySize * 2.2}px`, letterSpacing: `${spacing}px`, color: data.styles.titleColor || undefined }}
          >
            {data.title}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-20 bg-amber-800/40" />
            <span className="text-amber-700/60 text-xs">✦</span>
            <div className="h-px w-20 bg-amber-800/40" />
          </div>
        </div>
        <LogoBox src={data.rightLogo} label="Right Logo" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-16 text-center gap-4">
        <p style={{ fontFamily: bodyFont, fontSize: `${bodySize}px`, letterSpacing: `${spacing}px`, color: '#5a4a2a', textAlign: align }}>
          This certificate is proudly presented to
        </p>

        <div className="relative px-12 py-3">
          <h2
            style={{ fontFamily: "'Dancing Script', cursive", fontSize: `${bodySize * 3.5}px`, color: data.styles.recipientColor || '#7c3d0a', lineHeight: 1.1 }}
          >
            {data.recipientName}
          </h2>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-gradient-to-r from-transparent via-amber-800/40 to-transparent" />
        </div>

        <p style={{ fontFamily: bodyFont, fontSize: `${bodySize}px`, letterSpacing: `${spacing}px`, color: data.styles.completionTextColor || '#5a4a2a', textAlign: align }}>
          {data.completionText || 'in recognition of successful completion of'}
        </p>

        <p
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: `${bodySize * 1.6}px`, color: data.styles.eventColor || '#5a3a0a', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: align }}
        >
          {data.eventName}
        </p>

        <p
          style={{ fontFamily: bodyFont, fontSize: `${bodySize * 0.95}px`, color: data.styles.descriptionColor || '#7a6a4a', maxWidth: '700px', lineHeight: 1.7, textAlign: align, letterSpacing: `${spacing}px` }}
        >
          {data.description}
        </p>

        {data.uniqueId && (
          <p style={{ fontFamily: bodyFont, fontSize: `${bodySize * 0.9}px`, color: data.styles.idColor || '#7a6a4a', letterSpacing: '0.12em', marginTop: 4 }}>
            ID: <strong className="opacity-70">{data.uniqueId}</strong>
          </p>
        )}
      </div>

      {/* Footer — Signatures + QR */}
      <div className="px-16 pb-10 flex items-end justify-between gap-10 w-full">
        <div className="flex-1">
          <SignaturesLayout signatures={data.signatures} />
        </div>
        {data.qrCodeValue && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <QRCodeSVG value={data.qrCodeValue} size={72} bgColor="transparent" />
            <p className="text-[9px] text-amber-800/40 font-mono">Scan to verify</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MODERN CLEAN TEMPLATE
══════════════════════════════════════════════════════════════ */
const ModernTemplate: React.FC<Props> = ({ data }) => {
  const bodyFont = font(data.styles.fontFamily);
  const bodySize = data.styles.fontSize;
  const spacing  = data.styles.spacing;
  const align    = data.styles.textAlign;

  return (
    <div className="w-full h-full flex" style={{ background: '#fff', fontFamily: bodyFont }}>
      {/* Left accent bar */}
      <div className="w-3 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-800 shrink-0" />

      <div className="flex-1 flex flex-col px-14 py-10 gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <LogoBox src={data.leftLogo} label="Logo" small />
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.25em] text-gray-400 uppercase">Certificate of</span>
            <span className="text-xs font-bold tracking-[0.25em] text-indigo-600 uppercase">Achievement</span>
          </div>
          <LogoBox src={data.rightLogo} label="Logo" small />
        </div>

        {/* Accent line */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-400 to-transparent rounded-full" />

        {/* Title */}
        <div style={{ textAlign: align }}>
          <h1
            className="font-black text-gray-900 tracking-tight"
            style={{ fontSize: `${bodySize * 2.1}px`, letterSpacing: `${spacing}px`, fontFamily: 'system-ui, sans-serif', color: data.styles.titleColor || undefined }}
          >
            {data.title}
          </h1>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center gap-5" style={{ textAlign: align }}>
          <p style={{ fontSize: `${bodySize}px`, color: '#64748b', letterSpacing: `${spacing}px` }}>
            This is to proudly certify that
          </p>

          <div>
            <h2
              className={`font-black ${!data.styles.recipientColor ? 'bg-clip-text text-transparent' : ''}`}
              style={{
                fontFamily: data.styles.fontFamily === 'serif'
                  ? "'Playfair Display', Georgia, serif"
                  : data.styles.fontFamily === 'cursive'
                  ? "'Dancing Script', cursive"
                  : 'system-ui, sans-serif',
                fontSize: `${bodySize * 3.2}px`,
                backgroundImage: !data.styles.recipientColor ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : undefined,
                color: data.styles.recipientColor || undefined,
                lineHeight: 1.1,
                letterSpacing: `${spacing}px`
              }}
            >
              {data.recipientName}
            </h2>
            <div className="mt-2 h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto" style={{ marginLeft: align === 'left' ? 0 : align === 'right' ? 'auto' : 'auto', marginRight: align === 'right' ? 0 : 'auto' }} />
          </div>

          <div className="space-y-2">
            <p style={{ fontSize: `${bodySize}px`, color: data.styles.completionTextColor || '#64748b', letterSpacing: `${spacing}px` }}>
              {data.completionText || 'has successfully completed'}
            </p>
            <p style={{ fontSize: `${bodySize * 1.5}px`, fontWeight: 800, color: data.styles.eventColor || '#1e293b', letterSpacing: `${spacing}px` }}>
              {data.eventName}
            </p>
          </div>

          <p style={{ fontSize: `${bodySize * 0.95}px`, color: data.styles.descriptionColor || '#94a3b8', lineHeight: 1.7, maxWidth: 680, letterSpacing: `${spacing}px`, margin: align === 'center' ? '0 auto' : undefined }}>
            {data.description}
          </p>

          {data.uniqueId && (
            <div className="flex items-center gap-3" style={{ justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
              <div className="px-4 py-1.5 bg-gray-50 rounded-full">
                <span style={{ fontSize: `${bodySize * 0.85}px`, color: data.styles.idColor || '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>ID: {data.uniqueId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="flex items-end justify-between pt-1 gap-10 w-full">
          <div className="flex-1">
            <SignaturesLayout signatures={data.signatures} color="indigo" />
          </div>
          {data.qrCodeValue && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <QRCodeSVG value={data.qrCodeValue} size={68} fgColor="#4f46e5" bgColor="transparent" />
              <p className="text-[9px] text-indigo-400 font-mono">Scan to verify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PREMIUM ELEGANT TEMPLATE
══════════════════════════════════════════════════════════════ */
const PremiumTemplate: React.FC<Props> = ({ data }) => {
  const bodyFont = font(data.styles.fontFamily);
  const bodySize = data.styles.fontSize;
  const spacing  = data.styles.spacing;
  const align    = data.styles.textAlign;

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 40%, #1a0a00 100%)',
        fontFamily: bodyFont
      }}
    >
      {/* Gold border */}
      <div className="absolute inset-0 border-[8px] border-yellow-500/40 pointer-events-none z-10" />
      <div className="absolute inset-4 border border-yellow-400/20 pointer-events-none z-10" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.12) 0%, transparent 65%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-16 pt-12 pb-4">
        <LogoBox src={data.leftLogo} label="Logo" dark />
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-px w-10 bg-yellow-500/50" />
            <span className="text-yellow-400/80 text-[10px] tracking-[0.4em] font-sans uppercase">Est. 2025</span>
            <div className="h-px w-10 bg-yellow-500/50" />
          </div>
          <h1
            className={`font-bold leading-tight`}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: `${bodySize * 2.0}px`,
              letterSpacing: `${spacing * 0.5 + 3}px`,
              background: !data.styles.titleColor ? 'linear-gradient(to bottom, #f5d572, #c8963a)' : undefined,
              WebkitBackgroundClip: !data.styles.titleColor ? 'text' : undefined,
              WebkitTextFillColor: !data.styles.titleColor ? 'transparent' : undefined,
              color: data.styles.titleColor || undefined
            }}
          >
            {data.title}
          </h1>
        </div>
        <LogoBox src={data.rightLogo} label="Logo" dark />
      </div>

      {/* Gold separator line */}
      <div className="relative z-10 mx-16 flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        <span className="text-yellow-400/60 text-sm">⬥</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      </div>

      {/* Body */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 gap-5" style={{ textAlign: align }}>
        <p style={{ fontSize: `${bodySize}px`, color: 'rgba(245,213,114,0.7)', letterSpacing: '0.2em', fontStyle: 'italic' }}>
          This is to Certify that
        </p>

        <div className="relative px-8 py-2">
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: `${bodySize * 3.2}px`,
              background: !data.styles.recipientColor ? 'linear-gradient(135deg, #f5d572 0%, #e8b84b 50%, #f5d572 100%)' : undefined,
              WebkitBackgroundClip: !data.styles.recipientColor ? 'text' : undefined,
              WebkitTextFillColor: !data.styles.recipientColor ? 'transparent' : undefined,
              color: data.styles.recipientColor || undefined,
              lineHeight: 1.1,
              letterSpacing: `${spacing}px`
            }}
          >
            {data.recipientName}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-2/3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-600/40" />
          <span className="text-yellow-500/50">◆</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-600/40" />
        </div>

        <div className="space-y-3">
          <p style={{ fontSize: `${bodySize}px`, color: data.styles.completionTextColor || 'rgba(245,213,114,0.65)', letterSpacing: `${spacing * 0.5 + 1}px` }}>
            {data.completionText || 'has demonstrated excellence in'}
          </p>
          <p style={{
            fontSize: `${bodySize * 1.5}px`, fontWeight: 700,
            color: data.styles.eventColor || '#f0c040',
            letterSpacing: '0.1em',
            fontFamily: "'Playfair Display', Georgia, serif"
          }}>
            {data.eventName}
          </p>
        </div>

        <p style={{
          fontSize: `${bodySize * 0.9}px`,
          color: data.styles.descriptionColor || 'rgba(245,213,114,0.5)',
          lineHeight: 1.8,
          maxWidth: 680,
          letterSpacing: `${spacing}px`
        }}>
          {data.description}
        </p>

        {data.uniqueId && (
          <p style={{ fontSize: `${bodySize * 0.85}px`, color: data.styles.idColor || 'rgba(245,213,114,0.6)', letterSpacing: '0.15em' }}>
            ID: <strong style={{ color: data.styles.idColor ? undefined : '#f5d572' }}>#{data.uniqueId}</strong>
          </p>
        )}
      </div>

      {/* Gold separator */}
      <div className="relative z-10 mx-16 flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
        <span className="text-yellow-400/40 text-sm">⬥</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
      </div>

      {/* Footer */}
      <div className="relative z-10 px-16 pb-10 flex items-end justify-between gap-10 w-full">
        <div className="flex-1">
          <SignaturesLayout signatures={data.signatures} color="gold" />
        </div>
        {data.qrCodeValue && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <QRCodeSVG value={data.qrCodeValue} size={68} fgColor="#d4af37" bgColor="transparent" />
            <p className="text-[9px] font-mono" style={{ color: 'rgba(245,213,114,0.4)' }}>Scan to verify</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CUSTOM BACKGROUND TEMPLATE
══════════════════════════════════════════════════════════════ */
const CustomTemplate: React.FC<Props> = ({ data }) => {
  const bodyFont = font(data.styles.fontFamily);
  const bodySize = data.styles.fontSize;
  const spacing  = data.styles.spacing;
  const align    = data.styles.textAlign;

  return (
    <div className="w-full h-full relative flex flex-col">
      {data.backgroundImage
        ? <img src={data.backgroundImage} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
        : <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-sky-50 to-indigo-100" />
      }
      <div className="absolute inset-0 bg-white/10" />

      <div className="relative z-10 flex flex-col h-full px-16 py-10 gap-3" style={{ fontFamily: bodyFont }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <LogoBox src={data.leftLogo} label="Logo" />
          <h1
            className="text-center font-bold"
            style={{ fontSize: `${bodySize * 2}px`, letterSpacing: `${spacing}px`, color: data.styles.titleColor || '#1e293b' }}
          >
            {data.title}
          </h1>
          <LogoBox src={data.rightLogo} label="Logo" />
        </div>

        <hr className="border-gray-400/30" />

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ textAlign: align }}>
          <p style={{ fontSize: `${bodySize}px`, letterSpacing: `${spacing}px`, color: '#4b5563' }}>
            This is to certify that
          </p>
          <h2 style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: `${bodySize * 3.2}px`, color: data.styles.recipientColor || '#1e3a8a', lineHeight: 1
          }}>
            {data.recipientName}
          </h2>
          <p style={{ fontSize: `${bodySize}px`, color: data.styles.completionTextColor || '#6b7280', letterSpacing: `${spacing}px` }}>
            {data.completionText || 'has successfully completed'}
          </p>
          <p style={{ fontSize: `${bodySize * 1.5}px`, fontWeight: 700, color: data.styles.eventColor || '#1e293b', letterSpacing: `${spacing}px` }}>
            {data.eventName}
          </p>
          <p style={{ fontSize: `${bodySize * 0.9}px`, color: data.styles.descriptionColor || '#9ca3af', lineHeight: 1.7, maxWidth: 680, letterSpacing: `${spacing}px` }}>
            {data.description}
          </p>
          {data.uniqueId && (
            <p style={{ fontSize: `${bodySize * 0.85}px`, color: data.styles.idColor || '#6b7280' }}>
              ID: <strong className="font-mono opacity-70">{data.uniqueId}</strong>
            </p>
          )}
        </div>

        <hr className="border-gray-400/30" />

        {/* Footer */}
        <div className="flex items-end justify-between gap-10 w-full">
          <div className="flex-1">
            <SignaturesLayout signatures={data.signatures} />
          </div>
          {data.qrCodeValue && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <QRCodeSVG value={data.qrCodeValue} size={68} />
              <p className="text-[9px] text-gray-500 font-mono">Scan to verify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */
const LogoBox = ({
  src, label, small = false, dark = false
}: { src: string | null; label: string; small?: boolean; dark?: boolean }) => (
  <div
    className="flex items-center justify-center rounded-xl overflow-hidden"
    style={{ width: small ? 64 : 96, height: small ? 64 : 96 }}
  >
    {src
      ? <img src={src} className="w-full h-full object-contain" alt={label} />
      : <div className={[
          'w-full h-full flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed',
          dark ? 'border-yellow-500/20 text-yellow-500/20' : 'border-gray-300 text-gray-300'
        ].join(' ')}>
          <span className="text-xl">🏫</span>
          <span className="text-[9px] font-medium">{label}</span>
        </div>
    }
  </div>
);

const SignatureBlock = ({
  sig, color = 'default'
}: {
  sig: { id: string; name: string; designation: string; image: string | null };
  color?: 'default' | 'indigo' | 'gold';
}) => {
  const nameColor = color === 'gold' ? '#f5d572' : color === 'indigo' ? '#4f46e5' : '#1e293b';
  const desigColor = color === 'gold' ? 'rgba(245,213,114,0.5)' : color === 'indigo' ? '#94a3b8' : '#94a3b8';
  const lineColor = color === 'gold' ? 'rgba(245,213,114,0.3)' : color === 'indigo' ? '#e0e7ff' : '#e2e8f0';

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 110, maxWidth: 180 }}>
      <div className="h-14 flex items-end justify-center mb-2">
        {sig.image
          ? <img src={sig.image} className="max-h-full max-w-[120px] object-contain mix-blend-multiply" alt="sig" />
          : <div className="w-28 h-0.5" style={{ background: lineColor }} />
        }
      </div>
      <div className="w-full border-t pt-1.5 text-center" style={{ borderColor: lineColor }}>
        <p className="text-sm font-bold leading-tight" style={{ color: nameColor }}>
          {sig.name || '—'}
        </p>
        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: desigColor }}>
          {sig.designation || 'Signature'}
        </p>
      </div>
    </div>
  );
};

const SignaturesLayout = ({
  signatures,
  color = 'default'
}: {
  signatures: { id: string; name: string; designation: string; image: string | null }[];
  color?: 'default' | 'indigo' | 'gold';
}) => {
  if (signatures.length === 0) return null;

  if (signatures.length === 1) {
    return (
      <div className="flex">
        <SignatureBlock sig={signatures[0]} color={color} />
      </div>
    );
  }

  if (signatures.length === 2) {
    return (
      <div className="flex justify-between w-full gap-8">
        <SignatureBlock sig={signatures[0]} color={color} />
        <SignatureBlock sig={signatures[1]} color={color} />
      </div>
    );
  }

  if (signatures.length === 3) {
    return (
      <div className="flex justify-between w-full gap-8">
        <SignatureBlock sig={signatures[0]} color={color} />
        <SignatureBlock sig={signatures[2]} color={color} />
        <SignatureBlock sig={signatures[1]} color={color} />
      </div>
    );
  }

  return (
    <div className="flex justify-between w-full gap-4">
      {signatures.map((sig) => (
        <SignatureBlock key={sig.id} sig={sig} color={color} />
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export const CertificateCanvas: React.FC<Props> = ({ data }) => {
  switch (data.templateId) {
    case 'modern':  return <ModernTemplate data={data} />;
    case 'premium': return <PremiumTemplate data={data} />;
    case 'custom':  return <CustomTemplate data={data} />;
    default:        return <ClassicTemplate data={data} />;
  }
};
