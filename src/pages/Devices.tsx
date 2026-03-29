import { useEffect, useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, Plus, Trash2, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function waProxy(path: string, method = "GET", body?: unknown) {
  const url = `${SUPABASE_URL}/functions/v1/wa-proxy?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error("Proxy error");
  return res.json();
}

type QrStatus = "loading" | "qr" | "connected" | "error";

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Tables<"devices">[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [qrData, setQrData] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<QrStatus>("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDevices = async () => {
    if (!user) return;
    const { data } = await supabase.from("devices").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setDevices(data ?? []);
  };

  useEffect(() => { fetchDevices(); }, [user]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    const fetchQr = async () => {
      try {
        const data = await waProxy("/api/qr");

        if (data.status === "connected") {
          setQrStatus("connected");
          setQrData(null);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "qr" && data.qr) {
          setQrStatus("qr");
          setQrData(data.qr);
        } else {
          setQrStatus("loading");
          setQrData(null);
        }
      } catch {
        setQrStatus("error");
        setQrData(null);
      }
    };

    fetchQr();
    pollRef.current = setInterval(fetchQr, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQrStatus("loading");
      setQrData(null);
      startPolling();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [open, startPolling, stopPolling]);

  const addDevice = async () => {
    if (!user || !name) return;
    const status = qrStatus === "connected" ? "connected" : "disconnected";
    const { error } = await supabase.from("devices").insert({ user_id: user.id, name, phone_number: phone || null, status });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সফল", description: "নতুন ডিভাইস যুক্ত হয়েছে" });
    setName(""); setPhone(""); setOpen(false);
    fetchDevices();
  };

  const deleteDevice = async (id: string) => {
    await supabase.from("devices").delete().eq("id", id);
    fetchDevices();
  };

  const [serverConnected, setServerConnected] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const data = await waProxy("/api/status");
        setServerConnected(data.connected === true);
      } catch {
        setServerConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">ডিভাইস ম্যানেজমেন্ট</h1>
            <Badge variant={serverConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {serverConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {serverConnected ? "সার্ভার অনলাইন" : "সার্ভার অফলাইন"}
            </Badge>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />নতুন ডিভাইস যুক্ত করুন</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন ডিভাইস যুক্ত করুন</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 bg-muted/30 min-h-[280px]">
                  {qrStatus === "loading" && (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">QR কোড লোড হচ্ছে...</p>
                    </div>
                  )}
                  {qrStatus === "qr" && qrData && (
                    <>
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="M"
                        bgColor="transparent"
                        fgColor="hsl(145, 63%, 25%)"
                      />
                      <p className="mt-3 text-sm font-medium">WhatsApp ওপেন করে QR স্ক্যান করুন</p>
                      <p className="text-xs text-muted-foreground mt-1">Linked Devices → Link a Device</p>
                    </>
                  )}
                  {qrStatus === "connected" && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Wifi className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-primary">✅ WhatsApp সংযুক্ত হয়েছে!</p>
                      <p className="text-xs text-muted-foreground">নিচে নাম দিয়ে ডিভাইস সেভ করুন</p>
                    </div>
                  )}
                  {qrStatus === "error" && (
                    <div className="flex flex-col items-center gap-3">
                      <WifiOff className="h-10 w-10 text-destructive" />
                      <p className="text-sm text-destructive">সার্ভারে সংযোগ করা যায়নি</p>
                      <Button variant="ghost" size="sm" onClick={startPolling}>
                        <RefreshCw className="mr-1 h-3 w-3" />আবার চেষ্টা করুন
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>ডিভাইসের নাম</Label>
                  <Input placeholder="যেমন: ব্যবসা ফোন ১" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ফোন নাম্বার (ঐচ্ছিক)</Label>
                  <Input placeholder="+8801XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addDevice} disabled={!name}>যুক্ত করুন</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Smartphone className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{device.name}</CardTitle>
                    {device.phone_number && <p className="text-xs text-muted-foreground">{device.phone_number}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDevice(device.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent>
                <Badge variant={serverConnected && device.status === "connected" ? "default" : "destructive"}>
                  {serverConnected && device.status === "connected" ? "সংযুক্ত" : "বিচ্ছিন্ন"}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {devices.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              কোনো ডিভাইস যুক্ত হয়নি। উপরের বাটনে ক্লিক করে নতুন ডিভাইস যোগ করুন।
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
