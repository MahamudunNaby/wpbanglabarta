import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase.from("contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setContacts(data ?? []);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const addContact = async () => {
    if (!user || !name || !phone) return;
    const tagArr = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("contacts").insert({ user_id: user.id, name, phone_number: phone, tags: tagArr });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সফল", description: "নতুন কন্ট্যাক্ট যোগ হয়েছে" });
    setName(""); setPhone(""); setTags(""); setOpen(false);
    fetchContacts();
  };

  const deleteContact = async (id: string) => {
    await supabase.from("contacts").delete().eq("id", id);
    fetchContacts();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    const rows = lines.filter(Boolean).map((line) => {
      const [n, p, t] = line.split(",").map((s) => s.trim());
      return { user_id: user.id, name: n || "Unknown", phone_number: p || "", tags: t ? t.split(";").map((s) => s.trim()) : [] };
    }).filter((r) => r.phone_number);

    if (rows.length) {
      const { error } = await supabase.from("contacts").insert(rows);
      if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); }
      else { toast({ title: "সফল", description: `${rows.length}টি কন্ট্যাক্ট আমদানি হয়েছে` }); fetchContacts(); }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">কন্ট্যাক্ট লিস্ট</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />CSV আপলোড করুন
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </label>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />নতুন কন্ট্যাক্ট যোগ করুন</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>নতুন কন্ট্যাক্ট যোগ করুন</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>নাম</Label>
                    <Input placeholder="কন্ট্যাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>হোয়াটসঅ্যাপ নাম্বার</Label>
                    <Input placeholder="+8801XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>ট্যাগ (কমা দিয়ে আলাদা করুন)</Label>
                    <Input placeholder="গ্রাহক, VIP" value={tags} onChange={(e) => setTags(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addContact} disabled={!name || !phone}>যোগ করুন</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>হোয়াটসঅ্যাপ নাম্বার</TableHead>
                <TableHead>ট্যাগ</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone_number}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(c.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteContact(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    কোনো কন্ট্যাক্ট নেই
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}