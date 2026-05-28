import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';

interface QRCodeDisplayProps {
  baseUrl: string;
  rouletteCodes: string[];
  activeCode: string;
  onSelectCode: (code: string) => void;
  onCreateCode: (code: string) => void;
  onDeleteCode: (code: string) => void;
}

export function QRCodeDisplay({
  baseUrl,
  rouletteCodes,
  activeCode,
  onSelectCode,
  onCreateCode,
  onDeleteCode,
}: QRCodeDisplayProps) {
  const [newCode, setNewCode] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const activeUrl = activeCode === 'general' ? baseUrl : `${baseUrl}?r=${encodeURIComponent(activeCode)}`;
  const fileSafeCode = activeCode.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const submitCreateCode = () => {
    if (!newCode.trim()) return;
    onCreateCode(newCode);
    setNewCode('');
  };

  const handleDeleteActiveCode = () => {
    if (activeCode === 'general') return;
    setConfirmDeleteOpen(true);
  };

  const getQrCanvas = () => {
    return qrWrapRef.current?.querySelector('canvas') ?? null;
  };

  const downloadQrAsPdf = () => {
    const canvas = getQrCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const qrSize = 260;
    const x = (pageWidth - qrSize) / 2;
    let y = 72;

    pdf.setFontSize(14);
    pdf.text(`QR de ruleta: ${activeCode === 'general' ? 'General' : activeCode}`, pageWidth / 2, y, { align: 'center' });
    y += 24;
    pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);
    y += qrSize + 24;
    pdf.setFontSize(10);
    pdf.text(activeUrl, pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - 48 });
    pdf.save(`qr-${fileSafeCode}.pdf`);
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
      <CardHeader>
        <CardTitle>Ruletas por código QR</CardTitle>
        <CardDescription>
          Al crear un nuevo QR se creará una nueva ruleta, solo quienes tengan ese QR entrarán a esa ruleta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre de QR"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCreateCode()}
            />
            <Button onClick={submitCreateCode} className="bg-[#23c8b6] hover:bg-[#1fb7a7] text-white">
              Crear
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {rouletteCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onSelectCode(code)}
                className={`h-10 min-w-[110px] px-3 rounded-lg border text-xs font-bold transition-colors ${
                  code === activeCode
                    ? 'bg-[#edf7ff] border-[#b8cff7] text-[#1f3f77]'
                    : 'bg-white border-[#dbe2f0] text-[#4e5879] hover:bg-[#f8faff]'
                }`}
              >
                {code === 'general' ? 'General' : code}
              </button>
            ))}
          </div>
        </div>

        <div ref={qrWrapRef} className="p-4 bg-white rounded-lg">
          <QRCodeCanvas value={activeUrl} size={256} level="H" includeMargin />
        </div>
        <div className="w-full">
          <Button className="w-full bg-[#23c8b6] hover:bg-[#1fb7a7] text-white font-bold" onClick={downloadQrAsPdf}>
            Descargar PDF
          </Button>
        </div>
        {activeCode !== 'general' && (
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold"
              onClick={handleDeleteActiveCode}
            >
              Eliminar esta ruleta y QR
            </Button>
          </div>
        )}
        <p className="text-sm text-center text-gray-600">
          Escanea este QR para registrarte solo en la ruleta <strong>{activeCode}</strong>
        </p>
        <div className="w-full p-3 bg-gray-100 rounded text-center break-all text-sm">
          {activeUrl}
        </div>
      </CardContent>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 font-black">Eliminar ruleta y QR</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] leading-relaxed text-center">
              Se eliminará la ruleta <strong>{activeCode}</strong>, su código QR y todos sus datos asociados
              (participantes, baneados y ganadores recientes).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onDeleteCode(activeCode)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
