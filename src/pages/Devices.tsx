import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, Plus, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Tables<"devices">[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fetchDevices = async () => {
    if (!user) return;
    const { data } = await supabase.from("devices").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setDevices(data ?? []);
  };

  useEffect(() => { fetchDevices(); }, [user]);

  const addDevice = async () => {
    if (!user || !name) return;
    const { error } = await supabase.from("devices").insert({ user_id: user.id, name, phone_number: phone || null });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সফল", description: "নতুন ডিভাইস যুক্ত হয়েছে" });
    setName(""); setPhone(""); setOpen(false);
    fetchDevices();
  };

  const deleteDevice = async (id: string) => {
    await supabase.from("devices").delete().eq("id", id);
    fetchDevices();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ডিভাইস ম্যানেজমেন্ট</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />নতুন ডিভাইস যুক্ত করুন</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন ডিভাইস যুক্ত করুন</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 bg-muted/30">
                  <QRCodeSVG
                    value={`wa-link://${user?.id?.slice(0, 8) ?? "demo"}-${Date.now()}`}
                    size={200}
                    level="M"
                    bgColor="transparent"
                    fgColor="hsl(145, 63%, 25%)"
                  />
                  <p className="mt-3 text-sm font-medium">WhatsApp ওপেন করে QR স্ক্যান করুন</p>
                  <p className="text-xs text-muted-foreground mt-1">Linked Devices → Link a Device</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(true)}>
                    <RefreshCw className="mr-1 h-3 w-3" />রিফ্রেশ করুন
                  </Button>
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
                <Badge variant={device.status === "connected" ? "default" : "destructive"}>
                  {device.status === "connected" ? "সংযুক্ত" : "বিচ্ছিন্ন"}
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