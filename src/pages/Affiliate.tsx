import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Affiliate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = `https://wamarketing.app/ref/${user?.id?.slice(0, 8) ?? "demo"}`;
  const currentSales = 8500;
  const targetSales = 15000;
  const progress = Math.min((currentSales / targetSales) * 100, 100);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "কপি হয়েছে!", description: "রেফারেল লিংক কপি করা হয়েছে" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">অ্যাফিলিয়েট প্যানেল</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              রেফারেল লিংক
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              এই লিংক শেয়ার করুন এবং প্রতিটি সফল রেফারেলে কমিশন অর্জন করুন।
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>সেলস প্রগ্রেস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">বর্তমান সেল</span>
              <span className="font-bold text-lg">৳{currentSales.toLocaleString("bn-BD")}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">লক্ষ্য</span>
              <span className="font-medium">৳{targetSales.toLocaleString("bn-BD")}</span>
            </div>

            <div className="mt-4 rounded-lg border bg-accent p-4">
              <p className="text-sm font-medium text-accent-foreground">
                ১৫০০০ টাকা সেল সম্পন্ন করলে প্রো (Pro) টায়ারে ৭% কমিশন আনলক হবে।
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}