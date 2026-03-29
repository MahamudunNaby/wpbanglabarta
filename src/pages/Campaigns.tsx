import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Clock } from "lucide-react";

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [targetTags, setTargetTags] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState("5");
  const [batchLimit, setBatchLimit] = useState("50");

  const saveCampaign = async (status: "sending" | "scheduled") => {
    if (!user || !name || !message) {
      toast({ title: "ত্রুটি", description: "ক্যাম্পেইনের নাম ও মেসেজ আবশ্যক", variant: "destructive" });
      return;
    }
    const tagArr = targetTags ? targetTags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name,
      message_body: message,
      target_tags: tagArr,
      delay_seconds: parseInt(delay) || 5,
      batch_limit: parseInt(batchLimit) || 50,
      status,
      scheduled_at: status === "scheduled" ? new Date().toISOString() : null,
    });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সফল", description: status === "sending" ? "ক্যাম্পেইন শুরু হয়েছে" : "ক্যাম্পেইন শিডিউল হয়েছে" });
    setName(""); setTargetTags(""); setMessage(""); setDelay("5"); setBatchLimit("50");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">মেসেজ ক্যাম্পেইন</h1>

        <Card>
          <CardHeader>
            <CardTitle>নতুন ক্যাম্পেইন তৈরি করুন</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>ক্যাম্পেইনের নাম</Label>
              <Input placeholder="যেমন: ঈদ অফার ২০২৬" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>টার্গেট অডিয়েন্স নির্বাচন করুন (ট্যাগ)</Label>
              <Input placeholder="গ্রাহক, VIP (কমা দিয়ে আলাদা করুন)" value={targetTags} onChange={(e) => setTargetTags(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>মেসেজ লিখুন</Label>
              <Textarea
                placeholder="আপনার মেসেজ এখানে লিখুন..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Spintax সাপোর্ট করে, যেমন: {"{Hi|Hello}"} — প্রতিটি মেসেজে এলোমেলোভাবে একটি বেছে নেওয়া হবে।
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <h3 className="text-sm font-semibold">অ্যাডভান্সড সেটিংস</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>মেসেজ পাঠানোর মাঝে বিরতি (সেকেন্ড)</Label>
                  <Input type="number" min="1" value={delay} onChange={(e) => setDelay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ব্যাচ লিমিট</Label>
                  <Input type="number" min="1" value={batchLimit} onChange={(e) => setBatchLimit(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => saveCampaign("sending")} className="flex-1">
                <Send className="mr-2 h-4 w-4" />এখনই পাঠান
              </Button>
              <Button onClick={() => saveCampaign("scheduled")} variant="outline" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />শিডিউল করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}