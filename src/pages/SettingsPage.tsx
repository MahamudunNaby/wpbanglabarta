import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Bot } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBusinessName(data.business_name ?? "");
        setAiPrompt(data.ai_global_prompt ?? "");
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      business_name: businessName,
      ai_global_prompt: aiPrompt,
    }).eq("user_id", user.id);
    if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    else toast({ title: "সফল", description: "সেটিংস সেভ হয়েছে" });
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">সেটিংস</h1>

        <Card>
          <CardHeader><CardTitle>প্রোফাইল তথ্য</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>নাম</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="আপনার নাম" />
            </div>
            <div className="space-y-2">
              <Label>ব্যবসার নাম</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="আপনার ব্যবসার নাম" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI কনফিগারেশন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>গ্লোবাল AI নির্দেশনা</Label>
              <Textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="সব AI রিপ্লাইতে যে তথ্য ব্যবহার হবে (যেমন: ব্যবসার নাম, পণ্য তালিকা, দাম ইত্যাদি)"
              />
              <p className="text-xs text-muted-foreground">
                এই নির্দেশনা সব AI অটো-রিপ্লাইতে কমন context হিসেবে ব্যবহার হবে।
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />{loading ? "সেভ হচ্ছে..." : "সেটিংস সেভ করুন"}
        </Button>
      </div>
    </AppLayout>
  );
}