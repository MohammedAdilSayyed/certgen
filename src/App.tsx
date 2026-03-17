import React, { useRef, useState, useEffect } from 'react';
import { CertificateCanvas } from '@/components/CertificateCanvas';
import { DEFAULT_CERTIFICATE_DATA } from '@/types/certificate';
import type { CertificateData, Signature } from '@/types/certificate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import {
  Download, Plus, Trash2, Save, QrCode, FileUp,
  GalleryHorizontalEnd, PaintBucket, Settings2, Upload
} from 'lucide-react';

/* ─────────── ScaledCertPreview: auto-scale cert canvas to fit ────── */
const CERT_W = 1122;
const CERT_H = 793;

const ScaledCertPreview = ({
  canvasRef, data
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  data: CertificateData;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / CERT_W, height / CERT_H));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
      <div
        className="shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-lg overflow-hidden"
        style={{ width: CERT_W * scale, height: CERT_H * scale }}
      >
        <div
          ref={canvasRef}
          style={{
            width: CERT_W,
            height: CERT_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="relative bg-white"
        >
          <CertificateCanvas data={data} />
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── tiny helpers ─────────────────────────── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={[
      'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900',
      'shadow-sm outline-none transition',
      'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
      'placeholder:text-gray-400',
      props.className ?? ''
    ].join(' ')}
  />
);

const StyledTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={[
      'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900',
      'shadow-sm outline-none transition resize-none min-h-[90px]',
      'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
      'placeholder:text-gray-400',
      props.className ?? ''
    ].join(' ')}
  />
);

const StyledSelect = ({
  value, onChange, children
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
  >
    {children}
  </select>
);

const FileUploadBtn = ({
  label, accept, onChange, preview
}: {
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  preview?: string | null;
}) => (
  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-indigo-200 rounded-xl p-4 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition group">
    {preview
      ? <img src={preview} className="h-12 object-contain mb-2 rounded" alt="preview" />
      : <Upload className="w-6 h-6 text-indigo-400 mb-1 group-hover:text-indigo-600 transition" />
    }
    <span className="text-xs font-medium text-indigo-600">{label}</span>
    <input type="file" accept={accept} className="hidden" onChange={onChange} />
  </label>
);

const ColorPickerField = ({ label, value, defaultColor, onChange }: { label: string; value: string; defaultColor: string; onChange: (v: string) => void }) => (
  <Field label={label}>
    <div className="flex gap-3 items-center">
      <input type="color" value={value || defaultColor}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent shrink-0 shadow-sm" />
      <StyledInput value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={defaultColor} />
    </div>
  </Field>
);

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

const TabBtn = ({
  active, onClick, icon, label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={[
      'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex-1',
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-gray-500 hover:bg-gray-100'
    ].join(' ')}
  >
    {icon}
    {label}
  </button>
);

/* ─────────────────────────── main app ───────────────────────────── */
export default function App() {
  const [data, setData] = useState<CertificateData>(DEFAULT_CERTIFICATE_DATA);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'layout' | 'bulk'>('content');
  const [savedTemplates, setSavedTemplates] = useState<CertificateData[]>([]);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cert_templates');
    if (saved) setSavedTemplates(JSON.parse(saved));
  }, []);

  const set = (field: keyof CertificateData, value: any) =>
    setData(prev => ({ ...prev, [field]: value }));
  const setStyle = (field: keyof CertificateData['styles'], value: any) =>
    setData(prev => ({ ...prev, styles: { ...prev.styles, [field]: value } }));

  const readFile = (file: File): Promise<string> =>
    new Promise(res => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(file);
    });

  const onLogoUpload = async (side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) set(side === 'left' ? 'leftLogo' : 'rightLogo', await readFile(file));
  };

  const onSigImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await readFile(file);
    set('signatures', data.signatures.map(s => s.id === id ? { ...s, image: img } : s));
  };

  const addSig = () =>
    set('signatures', [...data.signatures, {
      id: Date.now().toString(), name: '', designation: '', image: null
    } satisfies Signature]);

  const removeSig = (id: string) =>
    set('signatures', data.signatures.filter(s => s.id !== id));

  const updateSig = (idx: number, field: keyof Signature, value: string) => {
    const newSigs = [...data.signatures];
    (newSigs[idx] as any)[field] = value;
    set('signatures', newSigs);
  };

  const getSafeFileName = (ext: string) => {
    // Remove all non-alphanumeric except spaces, then trim and replace spaces with hyphens
    const name = (data.recipientName || 'Certificate')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${name || 'document'}.${ext}`;
  };

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const el = canvasRef.current;
      const parent = el.parentElement;
      
      // Save original styles
      const originalTransform = el.style.transform;
      const originalWidth = parent?.style.width;
      const originalHeight = parent?.style.height;
      
      // Reset for capture
      el.style.transform = 'scale(1)';
      if (parent) {
        parent.style.width = '1122px';
        parent.style.height = '793px';
      }
      
      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        width: 1122,
        height: 793,
        logging: false
      });
      
      // Restore styles
      el.style.transform = originalTransform;
      if (parent) {
        parent.style.width = originalWidth || '';
        parent.style.height = originalHeight || '';
      }
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      
      const fileName = getSafeFileName('pdf');
      console.log('Downloading PDF:', fileName);
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF Export failed:", e);
      alert("PDF Export failed. Please check the console.");
    } finally {
      setExporting(false);
    }
  };

  const exportPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const el = canvasRef.current;
      const parent = el.parentElement;
      
      const originalTransform = el.style.transform;
      const originalWidth = parent?.style.width;
      const originalHeight = parent?.style.height;
      
      el.style.transform = 'scale(1)';
      if (parent) {
        parent.style.width = '1122px';
        parent.style.height = '793px';
      }
      
      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 1122,
        height: 793,
        logging: false
      });
      
      el.style.transform = originalTransform;
      if (parent) {
        parent.style.width = originalWidth || '';
        parent.style.height = originalHeight || '';
      }
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = getSafeFileName('png');
        console.log('Downloading PNG:', fileName);
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Slightly longer delay for slower systems
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setExporting(false);
        }, 1000);
      }, 'image/png', 1.0);
    } catch (e) {
      console.error("PNG Export failed:", e);
      alert("PNG Export failed.");
      setExporting(false);
    }
  };

  const saveTemplate = () => {
    const updated = [...savedTemplates, { ...data } as any];
    setSavedTemplates(updated);
    localStorage.setItem('cert_templates', JSON.stringify(updated));
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        const rows = results.data as any[];
        for (const row of rows) {
          if (row.name) {
            setData(prev => ({
              ...prev,
              recipientName: row.name,
              uniqueId: row.id ?? Math.random().toString(36).slice(2, 9).toUpperCase(),
              qrCodeValue: row.qr ?? `CERT-${row.id ?? 'VALID'}`
            }));
          }
        }
      }
    });
  };

  const templates = [
    { id: 'classic', label: 'Classic Formal', emoji: '🏛️', desc: 'Serif · Double border' },
    { id: 'modern', label: 'Modern Clean', emoji: '⚡', desc: 'Sans · Blue accent' },
    { id: 'premium', label: 'Elegant Premium', emoji: '✨', desc: 'Gold · Luxury feel' },
    { id: 'custom', label: 'Custom BG', emoji: '🖼️', desc: 'Upload your own' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <GalleryHorizontalEnd className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-none">CertiGen PRO</h1>
            <p className="text-[11px] text-gray-400">Professional Certificate Generator</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            <Save className="w-4 h-4" /> Save Template
          </button>
          <button
            onClick={exportPNG}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition"
          >
            <Download className="w-4 h-4" /> PNG
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
          >
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <aside className="w-[380px] min-w-[340px] bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-xl">
          {/* Tab bar */}
          <div className="flex gap-1.5 p-3 bg-gray-50 border-b border-gray-200">
            <TabBtn active={activeTab === 'content'} onClick={() => setActiveTab('content')}
              icon={<Settings2 className="w-4 h-4" />} label="Content" />
            <TabBtn active={activeTab === 'style'} onClick={() => setActiveTab('style')}
              icon={<PaintBucket className="w-4 h-4" />} label="Style" />
            <TabBtn active={activeTab === 'layout'} onClick={() => setActiveTab('layout')}
              icon={<GalleryHorizontalEnd className="w-4 h-4" />} label="Layout" />
            <TabBtn active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')}
              icon={<FileUp className="w-4 h-4" />} label="Bulk" />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── CONTENT tab ── */}
            {activeTab === 'content' && (
              <>
                <Field label="Certificate Title">
                  <StyledInput value={data.title} onChange={e => set('title', e.target.value)}
                    placeholder="CERTIFICATE OF ACHIEVEMENT" />
                </Field>

                <Field label="Recipient Name">
                  <StyledInput value={data.recipientName}
                    onChange={e => set('recipientName', e.target.value)}
                    placeholder="Full Name" />
                </Field>

                <Field label="Event / Program Name">
                  <StyledInput value={data.eventName}
                    onChange={e => set('eventName', e.target.value)}
                    placeholder="Annual Leadership Summit" />
                </Field>

                <Field label="Completion Text">
                  <StyledInput value={data.completionText || ''}
                    onChange={e => set('completionText', e.target.value)}
                    placeholder="in recognition of successful completion of" />
                </Field>

                <Field label="Certificate ID">
                  <StyledInput value={data.uniqueId ?? ''} onChange={e => set('uniqueId', e.target.value)}
                    placeholder="CERT-001" />
                </Field>

                <Field label="Body Text / Description">
                  <StyledTextarea value={data.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="In recognition of outstanding achievement…"
                  />
                </Field>

                <SectionDivider title="Logos" />

                <div className="grid grid-cols-2 gap-3">
                  <FileUploadBtn label="Left Logo" accept="image/*"
                    onChange={e => onLogoUpload('left', e)} preview={data.leftLogo} />
                  <FileUploadBtn label="Right Logo" accept="image/*"
                    onChange={e => onLogoUpload('right', e)} preview={data.rightLogo} />
                </div>

                <SectionDivider title="Signatures" />

                {data.signatures.map((sig, idx) => (
                  <div key={sig.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative group">
                    <button
                      onClick={() => removeSig(sig.id)}
                      className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Field label="Signatory Name">
                      <StyledInput placeholder="Dr. John Smith"
                        value={sig.name} onChange={e => updateSig(idx, 'name', e.target.value)} />
                    </Field>
                    <Field label="Designation">
                      <StyledInput placeholder="Director / Principal"
                        value={sig.designation} onChange={e => updateSig(idx, 'designation', e.target.value)} />
                    </Field>
                    <Field label="Signature Image">
                      <FileUploadBtn label="Upload signature image" accept="image/*"
                        onChange={e => onSigImageUpload(sig.id, e)} preview={sig.image} />
                    </Field>
                  </div>
                ))}

                <button
                  onClick={addSig}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition"
                >
                  <Plus className="w-4 h-4" /> Add Signature
                </button>
              </>
            )}

            {/* ── STYLE tab ── */}
            {activeTab === 'style' && (
              <>
                <Field label="Font Family">
                  <StyledSelect value={data.styles.fontFamily} onChange={v => setStyle('fontFamily', v)}>
                    <option value="serif">Classic Serif — Playfair Display</option>
                    <option value="sans">Modern Sans — System UI</option>
                    <option value="cursive">Elegant Script — Dancing Script</option>
                    <option value="monospace">Formal Mono</option>
                  </StyledSelect>
                </Field>

                <Field label={`Body Font Size — ${data.styles.fontSize}px`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">12</span>
                    <input type="range" min={12} max={28} step={1} value={data.styles.fontSize}
                      onChange={e => setStyle('fontSize', +e.target.value)}
                      className="flex-1 accent-indigo-600" />
                    <span className="text-xs text-gray-400">28</span>
                  </div>
                </Field>

                <Field label="Text Alignment">
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a}
                        onClick={() => setStyle('textAlign', a)}
                        className={[
                          'flex-1 py-2.5 rounded-lg border text-sm font-semibold capitalize transition',
                          data.styles.textAlign === a
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        ].join(' ')}
                      >{a}</button>
                    ))}
                  </div>
                </Field>

                <Field label={`Letter Spacing — ${data.styles.spacing}px`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">0</span>
                    <input type="range" min={0} max={8} step={0.5} value={data.styles.spacing}
                      onChange={e => setStyle('spacing', +e.target.value)}
                      className="flex-1 accent-indigo-600" />
                    <span className="text-xs text-gray-400">8</span>
                  </div>
                </Field>

                <SectionDivider title="Text Colors" />
                <ColorPickerField label="Title Color" value={data.styles.titleColor || ''} defaultColor="#000000" onChange={v => setStyle('titleColor', v)} />
                <ColorPickerField label="Recipient Name Color" value={data.styles.recipientColor || ''} defaultColor="#000000" onChange={v => setStyle('recipientColor', v)} />
                <ColorPickerField label="Event Name Color" value={data.styles.eventColor || ''} defaultColor="#000000" onChange={v => setStyle('eventColor', v)} />
                <ColorPickerField label="Completion Text Color" value={data.styles.completionTextColor || ''} defaultColor="#5a4a2a" onChange={v => setStyle('completionTextColor', v)} />
                <ColorPickerField label="Description Color" value={data.styles.descriptionColor || ''} defaultColor="#000000" onChange={v => setStyle('descriptionColor', v)} />
                <ColorPickerField label="ID Color" value={data.styles.idColor || ''} defaultColor="#000000" onChange={v => setStyle('idColor', v)} />

                <SectionDivider title="QR Code" />

                <Field label="Verification URL / Hash">
                  <div className="flex gap-2">
                    <QrCode className="mt-3 w-5 h-5 text-indigo-400 shrink-0" />
                    <StyledInput
                      value={data.qrCodeValue ?? ''}
                      onChange={e => set('qrCodeValue', e.target.value)}
                      placeholder="https://verify.example.com/cert-id" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Leave blank to hide QR code</p>
                </Field>
              </>
            )}

            {/* ── LAYOUT/TEMPLATES tab ── */}
            {activeTab === 'layout' && (
              <>
                <p className="text-sm text-gray-500">Select a template style for your certificate</p>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map(t => (
                    <button key={t.id}
                      onClick={() => set('templateId', t.id as any)}
                      className={[
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-center',
                        data.templateId === t.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      ].join(' ')}
                    >
                      <span className="text-3xl">{t.emoji}</span>
                      <span className={[
                        'text-sm font-bold',
                        data.templateId === t.id ? 'text-indigo-700' : 'text-gray-800'
                      ].join(' ')}>{t.label}</span>
                      <span className="text-[11px] text-gray-400">{t.desc}</span>
                    </button>
                  ))}
                </div>

                {data.templateId === 'custom' && (
                  <div className="space-y-2 mt-2">
                    <SectionDivider title="Background Image" />
                    <FileUploadBtn
                      label="Upload certificate background (A4 landscape)"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) set('backgroundImage', await readFile(file));
                      }}
                      preview={data.backgroundImage}
                    />
                  </div>
                )}

                {savedTemplates.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <SectionDivider title="Saved Templates" />
                    <div className="flex flex-wrap gap-2">
                      {savedTemplates.map((t: any, i) => (
                        <button key={i} onClick={() => setData(t)}
                          className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition">
                          Template {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── BULK tab ── */}
            {activeTab === 'bulk' && (
              <>
                <div className="rounded-xl bg-indigo-50 border-2 border-dashed border-indigo-200 p-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FileUp className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Bulk CSV Upload</p>
                    <p className="text-sm text-gray-500 mt-1">CSV must have columns: <code className="bg-white px-1 rounded border">name</code>, <code className="bg-white px-1 rounded border">id</code>, <code className="bg-white px-1 rounded border">qr</code></p>
                  </div>
                  <label className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Choose CSV File
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>💡 How it works:</strong> Upload a .csv with recipient names. Each row updates the preview — you can then export individually or all at once.
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 font-mono">
                  <p className="font-bold text-gray-700 mb-1">Sample CSV format:</p>
                  <p>name,id,qr</p>
                  <p>Alice Johnson,CERT-001,https://verify/001</p>
                  <p>Bob Smith,CERT-002,https://verify/002</p>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── Right: Certificate Preview ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200">
          {/* Preview header bar */}
          <div className="bg-indigo-900 text-white px-6 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold tracking-widest uppercase">📄 Live Preview — A4 Landscape (1122×793px)</span>
            <span className="text-xs text-indigo-300">Export renders at 2× for print quality</span>
          </div>

          {/* Scaled preview stage */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-6">
            {/* Outer responsive wrapper — uses aspect ratio to reserve space */}
            <div className="w-full" style={{ maxWidth: '100%', aspectRatio: '1122/793' }}>
              <ScaledCertPreview canvasRef={canvasRef} data={data} />
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
