import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, Trash2, UserPlus, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const callAdmin = async (action: string, method: string = "GET", body?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const fetchUsers = async () => {
    try {
      const data = await callAdmin("list-users", "GET");
      setUsers(data.users);
      setIsAdmin(true);
    } catch (err: any) {
      if (err.message?.includes("অ্যাডমিন অনুমতি")) {
        setIsAdmin(false);
        toast({ title: "অ্যাক্সেস নেই", description: "শুধুমাত্র অ্যাডমিনরা এই পেজ দেখতে পারেন", variant: "destructive" });
      } else {
        toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const assignRole = async (userId: string, role: string) => {
    try {
      await callAdmin("assign-role", "POST", { user_id: userId, role });
      toast({ title: "সফল", description: `রোল "${role}" অ্যাসাইন হয়েছে` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      await callAdmin("remove-role", "POST", { user_id: userId, role });
      toast({ title: "সফল", description: `রোল "${role}" সরানো হয়েছে` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await callAdmin("delete-user", "POST", { user_id: userId });
      toast({ title: "সফল", description: "ইউজার মুছে ফেলা হয়েছে" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-destructive text-destructive-foreground"><Crown className="mr-1 h-3 w-3" />অ্যাডমিন</Badge>;
      case "moderator": return <Badge className="bg-warning text-foreground"><ShieldCheck className="mr-1 h-3 w-3" />মডারেটর</Badge>;
      case "user": return <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />ইউজার</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">লোড হচ্ছে...</div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">অ্যাক্সেস নিষিদ্ধ</h2>
          <p className="text-muted-foreground">শুধুমাত্র অ্যাডমিনরা এই পেজ দেখতে পারেন।</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>ড্যাশবোর্ডে ফিরে যান</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">অ্যাডমিন প্যানেল</h1>
            <p className="text-sm text-muted-foreground">সব ইউজার ম্যানেজ করুন এবং রোল অ্যাসাইন করুন</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Shield className="mr-1 h-4 w-4" />
            মোট ইউজার: {users.length}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              ইউজার তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইমেইল</TableHead>
                  <TableHead>রোল</TableHead>
                  <TableHead>রেজিস্ট্রেশন</TableHead>
                  <TableHead>সর্বশেষ লগইন</TableHead>
                  <TableHead>রোল অ্যাসাইন</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length > 0 ? (
                          u.roles.map((role) => (
                            <button
                              key={role}
                              onClick={() => removeRole(u.id, role)}
                              title="ক্লিক করে রোল সরান"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                            >
                              {getRoleBadge(role)}
                            </button>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">কোনো রোল নেই</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("bn-BD")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("bn-BD") : "কখনো না"}
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(role) => assignRole(u.id, role)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="রোল দিন" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">অ্যাডমিন</SelectItem>
                          <SelectItem value="moderator">মডারেটর</SelectItem>
                          <SelectItem value="user">ইউজার</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {u.id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ইউজার মুছে ফেলবেন?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {u.email} — এই ইউজারকে স্থায়ীভাবে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                মুছে ফেলুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}