import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QRCodeCanvas from 'react-qrcode-logo';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function MyQRCode() {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${profile?.student_id || 'code'}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  if (!profile?.qr_token) {
    return <p className="text-muted-foreground">No QR code available.</p>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">My QR Code</h1>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="glass">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Your Unique QR Code
            </CardTitle>
            <p className="text-sm text-muted-foreground">Show this to the admin to mark your attendance</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div ref={canvasRef} className="p-6 bg-card rounded-2xl shadow-inner border border-border">
              <QRCodeCanvas
                value={profile.qr_token}
                size={240}
                bgColor="white"
                fgColor="#0d9488"
                qrStyle="dots"
                eyeRadius={8}
              />
            </div>

            <div className="text-center">
              <p className="font-semibold text-foreground">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.student_id} · {profile.course}</p>
            </div>

            <Button onClick={downloadQR} className="gradient-primary text-primary-foreground">
              <Download className="w-4 h-4 mr-2" /> Download QR Code
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
