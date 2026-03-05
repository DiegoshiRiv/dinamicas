import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Código QR de Registro</CardTitle>
        <CardDescription>Escanea para registrarte en el evento</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG 
            value={url} 
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-sm text-center text-gray-600">
          Escanea este código QR con tu teléfono para acceder al formulario de registro
        </p>
        <div className="w-full p-3 bg-gray-100 rounded text-center break-all text-sm">
          {url}
        </div>
      </CardContent>
    </Card>
  );
}
