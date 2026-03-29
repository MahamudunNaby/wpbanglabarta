import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({
          title: "অ্যাকাউন্ট তৈরি হয়েছে",
          description: "আপনার ইমেইল যাচাই করুন।",
        });
      }
    } catch (error: any) {
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <MessageCircle className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? "লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "আপনার হোয়াটসঅ্যাপ মার্কেটিং প্ল্যাটফর্মে স্বাগতম"
              : "নতুন অ্যাকাউন্ট তৈরি করে শুরু করুন"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                placeholder="আপনার ইমেইল দিন"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                placeholder="আপনার পাসওয়ার্ড দিন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : isLogin ? "লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "অ্যাকাউন্ট নেই?" : "ইতিমধ্যে অ্যাকাউন্ট আছে?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "রেজিস্টার করুন" : "লগইন করুন"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}