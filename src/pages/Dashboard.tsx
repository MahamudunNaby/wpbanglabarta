import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Smartphone, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockChartData = [
  { date: "সোম", sent: 120 },
  { date: "মঙ্গল", sent: 200 },
  { date: "বুধ", sent: 150 },
  { date: "বৃহস্পতি", sent: 300 },
  { date: "শুক্র", sent: 250 },
  { date: "শনি", sent: 180 },
  { date: "রবি", sent: 90 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [totalSent, setTotalSent] = useState(0);
  const [activeDevices, setActiveDevices] = useState(0);
  const [failedMessages, setFailedMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [logsRes, devicesRes, failedRes] = await Promise.all([
        supabase.from("message_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("devices").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "connected"),
        supabase.from("message_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "failed"),
      ]);
      setTotalSent(logsRes.count ?? 0);
      setActiveDevices(devicesRes.count ?? 0);
      setFailedMessages(failedRes.count ?? 0);
    };

    fetchStats();
  }, [user]);

  const stats = [
    { title: "মোট মেসেজ পাঠানো হয়েছে", value: totalSent, icon: Send, color: "text-primary" },
    { title: "অ্যাক্টিভ ডিভাইস", value: activeDevices, icon: Smartphone, color: "text-primary" },
    { title: "ফেইলড মেসেজ", value: failedMessages, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString("bn-BD")}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>দৈনিক মেসেজ অ্যাক্টিভিটি</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="hsl(145, 63%, 49%)"
                  fill="hsl(145, 63%, 49%)"
                  fillOpacity={0.15}
                  name="মেসেজ পাঠানো"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}