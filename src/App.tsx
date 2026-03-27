import React, { useRef, useState, useEffect } from 'react';
import { CertificateCanvas } from '@/components/CertificateCanvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { DEFAULT_CERTIFICATE_DATA } from '@/types/certificate';
import type { CertificateData, Signature } from '@/types/certificate';
import {
  Download, Plus, Trash2, Save, QrCode, FileUp,
  GalleryHorizontalEnd, PaintBucket, Settings2, Upload, Edit2, Check, X,
  Bold, MoveHorizontal, MoveVertical, Type, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─────────── ScaledCertPreview: auto-scale cert canvas to fit ────── */
const CERT_W = 1122;
const CERT_H = 793;

const ScaledCertPreview = ({
  canvasRef, data
}: {
  canvasRef?: React.Ref<HTMLDivElement>;
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
const removeImageBackground = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a === 0) continue;
        
        // Calculate brightness
        const brightness = (r + g + b) / 3;
        
        // Define points for blending
        const whitePoint = 210; 
        const blackPoint = 120; 
        
        if (brightness >= whitePoint) {
          data[i + 3] = 0; // Transparent
        } else if (brightness > blackPoint) {
          // Soft edge blending
          const factor = 1 - ((brightness - blackPoint) / (whitePoint - blackPoint));
          data[i + 3] = a * factor;
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

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

/* ── Per-field style controls (bold, font size, x/y offset) ── */
const FieldControls = ({
  fieldKey, fieldStyles, onChange
}: {
  fieldKey: string;
  fieldStyles: CertificateData['styles']['fieldStyles'];
  onChange: (key: string, patch: Record<string, any>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const fs = fieldStyles?.[fieldKey] ?? {};
  const fontSize = fs.fontSize ?? '';
  const x = fs.x ?? 0;
  const y = fs.y ?? 0;
  const hasOverrides = !!fs.fontSize || !!fs.x || !!fs.y;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={[
          'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition',
          hasOverrides
            ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
            : 'border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-300'
        ].join(' ')}
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Field Options {hasOverrides ? '●' : ''}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-3">
          {/* Bold hint */}
          <div className="flex items-center gap-2 px-1 py-1.5 rounded-lg bg-indigo-100/60 border border-indigo-200">
            <Bold className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] text-indigo-700 leading-snug">
              <strong>Select words</strong> in the field, then press <kbd className="bg-white border border-indigo-200 rounded px-1 text-[10px] font-mono">Ctrl+B</kbd> to bold them on the certificate.
            </span>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-600 w-20 shrink-0">Font size</span>
            <input
              type="number"
              min={8} max={120} step={1}
              value={fontSize}
              placeholder="auto"
              onChange={e => onChange(fieldKey, { fontSize: e.target.value ? +e.target.value : undefined })}
              className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
            />
            <span className="text-[10px] text-gray-400">px</span>
            {fs.fontSize && (
              <button
                type="button"
                onClick={() => onChange(fieldKey, { fontSize: undefined })}
                className="text-[10px] text-red-400 hover:text-red-600 ml-1"
              >reset</button>
            )}
          </div>

          {/* X offset */}
          <div className="flex items-center gap-2">
            <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-600 w-20 shrink-0">X offset</span>
            <input
              type="range" min={-200} max={200} step={1} value={x}
              onChange={e => onChange(fieldKey, { x: +e.target.value })}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-indigo-600 w-10 text-right">{x}px</span>
            {x !== 0 && (
              <button type="button" onClick={() => onChange(fieldKey, { x: 0 })} className="text-[10px] text-red-400 hover:text-red-600">↺</button>
            )}
          </div>

          {/* Y offset */}
          <div className="flex items-center gap-2">
            <MoveVertical className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-600 w-20 shrink-0">Y offset</span>
            <input
              type="range" min={-200} max={200} step={1} value={y}
              onChange={e => onChange(fieldKey, { y: +e.target.value })}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-indigo-600 w-10 text-right">{y}px</span>
            {y !== 0 && (
              <button type="button" onClick={() => onChange(fieldKey, { y: 0 })} className="text-[10px] text-red-400 hover:text-red-600">↺</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
      'flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all flex-1 min-w-[64px] sm:min-w-[70px]',
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
  const [bulkNames, setBulkNames] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [tempTemplateName, setTempTemplateName] = useState('');
  const canvasRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cert_templates');
    if (saved) setSavedTemplates(JSON.parse(saved));
  }, []);

  const set = (field: keyof CertificateData, value: any) =>
    setData(prev => ({ ...prev, [field]: value }));
  const setStyle = (field: keyof CertificateData['styles'], value: any) =>
    setData(prev => ({ ...prev, styles: { ...prev.styles, [field]: value } }));
  const setFieldStyle = (fieldKey: string, patch: Record<string, any>) =>
    setData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        fieldStyles: {
          ...prev.styles.fieldStyles,
          [fieldKey]: { ...(prev.styles.fieldStyles?.[fieldKey] ?? {}), ...patch },
        },
      },
    }));
  /** Ctrl+B: wraps the selected text in the input with **...** markers for inline bold */
  const handleCtrlB = (
    value: string,
    onChange: (v: string) => void
  ) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (start === end) return; // nothing selected
      const selected = value.slice(start, end);
      const before = value.slice(0, start);
      const after = value.slice(end);
      // Toggle: unwrap ** if already wrapped
      if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
        onChange(before + selected.slice(2, -2) + after);
      } else {
        onChange(before + '**' + selected + '**' + after);
      }
    }
  };

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
    const processedImg = await removeImageBackground(img);
    set('signatures', data.signatures.map(s => s.id === id ? { ...s, image: processedImg } : s));
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

  const captureCanvas = async (el: HTMLDivElement) => {
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

    return canvas;
  };

  const getValidRefs = () => {
    const refs = bulkNames.length > 0 
      ? canvasRefs.current.slice(0, bulkNames.length) 
      : [canvasRefs.current[0]];
    return refs.filter(Boolean) as HTMLDivElement[];
  };

  const doExportPDF = async (type: 'single' | 'multiple') => {
    setShowExportModal(false);
    setExporting(true);
    try {
      const els = getValidRefs();
      if (els.length === 0) throw new Error("No previews found.");

      const eventNameStr = (data.eventName || 'Certificates').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');

      if (type === 'single') {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        for (let i = 0; i < els.length; i++) {
          setExportProgress(`Generating PDF page ${i + 1} of ${els.length}...`);
          if (i > 0) pdf.addPage();
          const canvas = await captureCanvas(els[i]);
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
        }
        pdf.save(els.length > 1 ? `${eventNameStr}.pdf` : getSafeFileName('pdf'));
      } else {
        const zip = new JSZip();
        for (let i = 0; i < els.length; i++) {
          setExportProgress(`Generating PDF ${i + 1} of ${els.length}...`);
          const canvas = await captureCanvas(els[i]);
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
          pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
          
          const name = (bulkNames[i] || 'Document').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');
          zip.file(`${name}.pdf`, pdf.output('blob'));
        }
        setExportProgress("Zipping files... please wait.");
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${eventNameStr}_pdf.zip`);
      }
    } catch (e) {
      console.error("PDF Export failed:", e);
      alert("PDF Export failed.");
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const exportPDF = () => {
    if (bulkNames.length > 0) {
      setShowExportModal(true);
    } else {
      doExportPDF('single');
    }
  };

  const exportPNG = async () => {
    setExporting(true);
    try {
      const els = getValidRefs();
      if (els.length === 0) throw new Error("No previews found.");

      const eventNameStr = (data.eventName || 'Certificates').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');

      if (bulkNames.length > 0) {
        const zip = new JSZip();
        for (let i = 0; i < els.length; i++) {
          setExportProgress(`Generating PNG ${i + 1} of ${els.length}...`);
          const canvas = await captureCanvas(els[i]);
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png', 1.0));
          if (blob) {
            const name = (bulkNames[i] || 'Document').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');
            zip.file(`${name}.png`, blob);
          }
        }
        setExportProgress("Zipping files... please wait.");
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${eventNameStr}_png.zip`);
      } else {
        const canvas = await captureCanvas(els[0]);
        canvas.toBlob((blob) => {
          if (!blob) return;
          saveAs(blob, getSafeFileName('png'));
        }, 'image/png', 1.0);
      }
    } catch (e) {
      console.error("PNG Export failed:", e);
      alert("PNG Export failed.");
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const saveTemplate = () => {
    const defaultName = `Template ${savedTemplates.length + 1}`;
    const updated = [...savedTemplates, { ...data, templateName: defaultName } as any];
    setSavedTemplates(updated);
    localStorage.setItem('cert_templates', JSON.stringify(updated));
  };

  const deleteTemplate = (index: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updated = savedTemplates.filter((_, i) => i !== index);
      setSavedTemplates(updated);
      localStorage.setItem('cert_templates', JSON.stringify(updated));
    }
  };

  const startEditTemplate = (index: number, name: string) => {
    setEditingTemplateIndex(index);
    setTempTemplateName(name);
  };

  const saveTemplateName = (index: number) => {
    const updated = [...savedTemplates];
    updated[index] = { ...updated[index], templateName: tempTemplateName };
    setSavedTemplates(updated);
    localStorage.setItem('cert_templates', JSON.stringify(updated));
    setEditingTemplateIndex(null);
  };

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Parse to array of arrays
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const names: string[] = [];
    for (let i = 0; i < json.length; i++) {
        const row = json[i] as any[];
        if (row && row.length > 0 && typeof row[0] === 'string' && row[0].trim() !== '') {
            const val = row[0].trim();
            if (i === 0 && val.toLowerCase() === 'name') continue; // Skip header
            names.push(val);
        }
    }

    if (names.length > 0) {
      setBulkNames(names);
    }
  };

  const templates = [
    { id: 'classic', label: 'Classic Formal', emoji: '🏛️', desc: 'Serif · Double border' },
    { id: 'modern', label: 'Modern Clean', emoji: '⚡', desc: 'Sans · Blue accent' },
    { id: 'premium', label: 'Elegant Premium', emoji: '✨', desc: 'Gold · Luxury feel' },
    { id: 'custom', label: 'Custom BG', emoji: '🖼️', desc: 'Upload your own' },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shrink-0">
            <GalleryHorizontalEnd className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-gray-900 leading-none">CertiGen PRO</h1>
            <p className="text-[11px] text-gray-400 truncate">Professional Certificate Generator</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <button
            onClick={saveTemplate}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition flex-1 sm:flex-none whitespace-nowrap"
          >
            <Save className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Save Template</span><span className="sm:hidden">Save</span>
          </button>
          <button
            onClick={exportPNG}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-50 flex-1 sm:flex-none whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" /> PNG
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition disabled:opacity-50 flex-1 sm:flex-none whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" /> {exporting ? 'Generating…' : 'PDF'}
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* ── Left Panel ── */}
        <aside className="w-full lg:w-[380px] lg:min-w-[340px] max-h-[50vh] lg:max-h-none bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-xl z-10 transition-all">
          {/* Tab bar */}
          <div className="flex gap-1 p-2 sm:p-3 bg-gray-50 border-b border-gray-200 shrink-0 overflow-x-auto hide-scrollbar">
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
                <Field label="Department — Line 1">
                  <StyledInput
                    value={data.departmentName || ''}
                    onChange={e => set('departmentName', e.target.value)}
                    onKeyDown={handleCtrlB(data.departmentName || '', v => set('departmentName', v))}
                    placeholder="e.g. Department of Computer Science"
                  />
                  <FieldControls fieldKey="departmentName" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Department — Line 2">
                  <StyledInput
                    value={data.departmentName2 || ''}
                    onChange={e => set('departmentName2', e.target.value)}
                    onKeyDown={handleCtrlB(data.departmentName2 || '', v => set('departmentName2', v))}
                    placeholder="e.g. Faculty of Engineering"
                  />
                  <FieldControls fieldKey="departmentName2" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Certificate Title">
                  <StyledInput
                    value={data.title}
                    onChange={e => set('title', e.target.value)}
                    onKeyDown={handleCtrlB(data.title, v => set('title', v))}
                    placeholder="CERTIFICATE OF ACHIEVEMENT"
                  />
                  <FieldControls fieldKey="title" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Recipient Name">
                  <StyledInput
                    value={data.recipientName}
                    onChange={e => set('recipientName', e.target.value)}
                    onKeyDown={handleCtrlB(data.recipientName, v => set('recipientName', v))}
                    placeholder="Full Name"
                  />
                  <FieldControls fieldKey="recipientName" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Event / Program Name">
                  <StyledInput
                    value={data.eventName}
                    onChange={e => set('eventName', e.target.value)}
                    onKeyDown={handleCtrlB(data.eventName, v => set('eventName', v))}
                    placeholder="Annual Leadership Summit"
                  />
                  <FieldControls fieldKey="eventName" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Completion Text">
                  <StyledInput
                    value={data.completionText || ''}
                    onChange={e => set('completionText', e.target.value)}
                    onKeyDown={handleCtrlB(data.completionText || '', v => set('completionText', v))}
                    placeholder="in recognition of successful completion of"
                  />
                  <FieldControls fieldKey="completionText" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
                </Field>

                <Field label="Certificate ID">
                  <StyledInput value={data.uniqueId ?? ''} onChange={e => set('uniqueId', e.target.value)}
                    placeholder="CERT-001" />
                </Field>

                <Field label="Body Text / Description">
                  <StyledTextarea
                    value={data.description}
                    onChange={e => set('description', e.target.value)}
                    onKeyDown={handleCtrlB(data.description, v => set('description', v))}
                    placeholder="In recognition of outstanding achievement…"
                  />
                  <FieldControls fieldKey="description" fieldStyles={data.styles.fieldStyles} onChange={setFieldStyle} />
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
                    <div className="flex flex-col gap-2">
                      {savedTemplates.map((t: any, i) => (
                        editingTemplateIndex === i ? (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-300 bg-white">
                            <input
                              type="text"
                              value={tempTemplateName}
                              onChange={e => setTempTemplateName(e.target.value)}
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveTemplateName(i); if (e.key === 'Escape') setEditingTemplateIndex(null); }}
                              className="flex-1 text-sm outline-none text-indigo-900 bg-transparent min-w-0"
                            />
                            <button onClick={() => saveTemplateName(i)} className="p-1.5 hover:bg-green-100 rounded text-green-600 transition shadow-sm"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingTemplateIndex(null)} className="p-1.5 hover:bg-red-100 rounded text-red-500 transition shadow-sm"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div key={i} className="group relative w-full flex">
                            <button onClick={() => setData(t)}
                              className="flex-1 text-left px-4 py-2.5 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition min-h-[46px]">
                              {t.templateName || `Template ${i + 1}`}
                            </button>
                            <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={(e) => { e.stopPropagation(); startEditTemplate(i, t.templateName || `Template ${i + 1}`); }}
                                className="p-1.5 bg-white text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded shadow-sm border border-indigo-100 transition">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); deleteTemplate(i); }}
                                className="p-1.5 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 rounded shadow-sm border border-red-100 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
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
                    <p className="font-bold text-gray-800">Bulk Excel Upload</p>
                    <p className="text-sm text-gray-500 mt-1">Excel file must have one column for <code className="bg-white px-1 rounded border">name</code>.</p>
                  </div>
                  <label className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Choose Excel File
                    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcel} />
                  </label>
                  {bulkNames.length > 0 && (
                    <button onClick={() => setBulkNames([])} className="text-sm text-red-500 hover:text-red-700 font-semibold mt-2">
                      Clear Uploaded Names
                    </button>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>💡 How it works:</strong> Upload an Excel file containing recipient names. All generated certificates will be displayed vertically in the preview pane.
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 font-mono">
                  <p className="font-bold text-gray-700 mb-1">Sample Excel format:</p>
                  <p>A1: name</p>
                  <p>A2: Alice Johnson</p>
                  <p>A3: Bob Smith</p>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── Right: Certificate Preview ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 min-h-0">
          {/* Preview header bar */}
          <div className="bg-indigo-900 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-1 sm:gap-0 text-center sm:text-left">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">📄 Live Preview — A4 Landscape (1122×793px)</span>
            <span className="text-[10px] sm:text-xs text-indigo-300">Export renders at 2× for print quality</span>
          </div>

          {/* Scaled preview stage */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 sm:p-6 gap-6 sm:gap-8 min-h-0">
            {bulkNames.length > 0 ? (
              bulkNames.map((name, index) => (
                <div key={index} className="w-full shrink-0 shadow-lg" style={{ maxWidth: '100%', aspectRatio: '1122/793' }}>
                  <ScaledCertPreview canvasRef={(el) => { canvasRefs.current[index] = el }} data={{...data, recipientName: name}} />
                </div>
              ))
            ) : (
                <div className="w-full shrink-0 shadow-lg" style={{ maxWidth: '100%', aspectRatio: '1122/793' }}>
                  <ScaledCertPreview canvasRef={(el) => { canvasRefs.current[0] = el }} data={data} />
                </div>
            )}
          </div>
        </main>

      </div>

      {/* Export Progress Overlay */}
      {exportProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="font-semibold text-gray-800">{exportProgress}</p>
          </div>
        </div>
      )}

      {/* Bulk PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk PDF Export</h3>
            <p className="text-sm text-gray-500 mb-6">You have <strong>{bulkNames.length}</strong> certificates ready. How would you like to download them?</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => doExportPDF('single')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition">
                  <Download className="w-5 h-5 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Single PDF</div>
                  <div className="text-xs text-gray-500">All certificates in one long document</div>
                </div>
              </button>

              <button 
                onClick={() => doExportPDF('multiple')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition">
                  <FileUp className="w-5 h-5 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Multiple PDFs (ZIP)</div>
                  <div className="text-xs text-gray-500">Individual files grouped in a .zip archive</div>
                </div>
              </button>
            </div>
            
            <button 
              onClick={() => setShowExportModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
