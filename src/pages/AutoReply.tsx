import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Bot, Zap, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function AutoReply() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<Tables<"auto_replies">[]>([]);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const fetchRules = async () => {
    if (!user) return;
    const { data } = await supabase.from("auto_replies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRules(data ?? []);
  };

  useEffect(() => { fetchRules(); }, [user]);

  const addRule = async () => {
    if (!user || !keyword) return;
    if (!useAi && !replyMessage) {
      toast({ title: "ত্রুটি", description: "রিপ্লাই মেসেজ অথবা AI সক্রিয় করুন", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("auto_replies").insert({
      user_id: user.id,
      keyword,
      reply_message: useAi ? null : replyMessage,
      use_ai: useAi,
      ai_prompt: useAi ? aiPrompt : null,
    });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সফল", description: "নতুন রুল তৈরি হয়েছে" });
    setKeyword(""); setReplyMessage(""); setUseAi(false); setAiPrompt(""); setOpen(false);
    fetchRules();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("auto_replies").update({ is_active: !current }).eq("id", id);
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    await supabase.from("auto_replies").delete().eq("id", id);
    fetchRules();
  };

  const testAiReply = async () => {
    if (!testMessage) return;
    setTestLoading(true);
    setTestResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-auto-reply", {
        body: { message: testMessage, ai_prompt: "গ্রাহককে বাংলায় সাহায্য করুন" },
      });
      if (error) throw error;
      setTestResult(data?.reply || "কোনো উত্তর পাওয়া যায়নি");
    } catch (err: any) {
      setTestResult("ত্রুটি: " + (err.message || "AI রিপ্লাই ব্যর্থ"));
    }
    setTestLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">অটো-রিপ্লাই</h1>
          <div className="flex gap-2">
            <Dialog open={testOpen} onOpenChange={setTestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><FlaskConical className="mr-2 h-4 w-4" />AI টেস্ট করুন</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>AI রিপ্লাই টেস্ট</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>টেস্ট মেসেজ</Label>
                    <Input placeholder="একটি স্যাম্পল মেসেজ লিখুন..." value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
                  </div>
                  <Button onClick={testAiReply} disabled={testLoading || !testMessage}>
                    {testLoading ? "জেনারেট হচ্ছে..." : "AI রিপ্লাই দেখুন"}
                  </Button>
                  {testResult && (
                    <div className="rounded-lg border bg-accent p-4">
                      <p className="text-sm font-medium mb-1">AI রিপ্লাই:</p>
                      <p className="text-sm">{testResult}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />নতুন রুল তৈরি করুন</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>নতুন অটো-রিপ্লাই রুল</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>কি-ওয়ার্ড</Label>
                    <Input placeholder="যেমন: দাম, হ্যালো, অর্ডার" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">AI রিপ্লাই ব্যবহার করুন</p>
                        <p className="text-xs text-muted-foreground">AI স্বয়ংক্রিয়ভাবে উত্তর তৈরি করবে</p>
                      </div>
                    </div>
                    <Switch checked={useAi} onCheckedChange={setUseAi} />
                  </div>

                  {useAi ? (
                    <div className="space-y-2">
                      <Label>AI নির্দেশনা</Label>
                      <Textarea
                        placeholder="যেমন: গ্রাহককে বাংলায় সাহায্য করুন, পণ্যের দাম জানান"
                        rows={3}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>অটো-রিপ্লাই মেসেজ</Label>
                      <Textarea
                        placeholder="রিপ্লাই মেসেজ লিখুন..."
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={addRule} disabled={!keyword}>রুল তৈরি করুন</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>কি-ওয়ার্ড</TableHead>
                <TableHead>অটো-রিপ্লাই মেসেজ</TableHead>
                <TableHead>টাইপ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.keyword}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {rule.use_ai ? (rule.ai_prompt || "AI ডিফল্ট") : rule.reply_message}
                  </TableCell>
                  <TableCell>
                    {rule.use_ai ? (
                      <Badge className="bg-accent text-accent-foreground"><Bot className="mr-1 h-3 w-3" />AI</Badge>
                    ) : (
                      <Badge variant="secondary"><Zap className="mr-1 h-3 w-3" />নির্ধারিত</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active ?? false}
                      onCheckedChange={() => toggleActive(rule.id, rule.is_active ?? false)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    কোনো অটো-রিপ্লাই রুল নেই
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}