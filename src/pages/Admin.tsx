import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  MapPin,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [visitsCount, setVisitsCount] = useState<number | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  // Services state and helpers
  type Service = {
    id: string;
    created_at: string;
    title: string;
    short_description: string;
    detailed_description: string;
    category: string;
    images: string[];
    videos: string[];
    hidden: boolean;
  };
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showHidden, setShowHidden] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    detailed_description: "",
    category: "",
    images: "",
    videos: "",
    hidden: false,
  });
  const csvToArray = (csv: string) => csv.split(",").map((s) => s.trim()).filter(Boolean);

  // Membership controls state and handlers
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [membershipSettings, setMembershipSettings] = useState({
    membershipButtonsVisible: true,
    venueButtonsVisible: true,
    loginVisible: true,
  });

  const loadMembershipSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("group_name,key,value_bool")
        .in("key", [
          "auth.login.visible",
          "features.membership.buttons.visible",
          "features.venue.buttons.visible",
        ]);
      if (error) return;
      const map = new Map<string, boolean>(
        (data as any[]).map((d: any) => [d.key, !!d.value_bool])
      );
      setMembershipSettings({
        loginVisible: !!map.get("auth.login.visible"),
        membershipButtonsVisible: !!map.get("features.membership.buttons.visible"),
        venueButtonsVisible: !!map.get("features.venue.buttons.visible"),
      });
    } catch {}
  };

  const saveMembershipSettings = async () => {
    try {
      const rows = [
        { group_name: "auth", key: "login.visible", value_bool: membershipSettings.loginVisible },
        { group_name: "features", key: "membership.buttons.visible", value_bool: membershipSettings.membershipButtonsVisible },
        { group_name: "features", key: "venue.buttons.visible", value_bool: membershipSettings.venueButtonsVisible },
      ];
      const { error } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "group_name,key" } as any);
      if (error) {
        toast({
          title: "Error saving settings",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Settings saved", description: "Visibility updated" });
        setMembershipDialogOpen(false);
      }
    } catch (e: any) {
      toast({
        title: "Error saving settings",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (activeTab === "membership") {
      loadMembershipSettings();
    }
  }, [activeTab]);
  
  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const res = await supabase
        .from("services")
        .select("id, created_at, title, short_description, detailed_description, category, images, videos, hidden")
        .order("created_at", { ascending: false })
        .limit(100);
      const data = Array.isArray(res.data) ? (res.data as Service[]) : [];
      setServices(data);
    } catch {
      // ignore
    } finally {
      setLoadingServices(false);
    }
  };
  
  const resetForm = (s?: Service) => {
    if (s) {
      setForm({
        title: s.title,
        short_description: s.short_description,
        detailed_description: s.detailed_description,
        category: s.category,
        images: (s.images ?? []).join(", "),
        videos: (s.videos ?? []).join(", "),
        hidden: !!s.hidden,
      });
    } else {
      setForm({ title: "", short_description: "", detailed_description: "", category: "", images: "", videos: "", hidden: false });
    }
  };
  
  const openCreateService = () => {
    setEditingService(null);
    resetForm();
    setServiceDialogOpen(true);
  };
  const openEditService = (s: Service) => {
    setEditingService(s);
    resetForm(s);
    setServiceDialogOpen(true);
  };
  
  const handleSaveService = async () => {
    if (!form.title || !form.short_description || !form.detailed_description || !form.category) {
      toast({ title: "Missing required fields", description: "Please fill in Title, Category, Short and Detailed descriptions." });
      return;
    }
    const payload = {
      title: form.title,
      short_description: form.short_description,
      detailed_description: form.detailed_description,
      category: form.category,
      images: csvToArray(form.images),
      videos: csvToArray(form.videos),
      hidden: form.hidden,
    };
    try {
      if (editingService) {
        const res = await supabase.from("services").update(payload).eq("id", editingService.id);
        if (res.error) {
          setServices((prev) => prev.map((s) => (s.id === editingService.id ? { ...s, ...payload } : s)));
          toast({ title: "Updated (preview)", description: "Supabase not configured; changes not persisted." });
        } else {
          toast({ title: "Service updated", description: "Changes saved successfully" });
          await loadServices();
        }
      } else {
        const res = await supabase.from("services").insert(payload);
        if (res.error) {
          const localId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : String(Date.now());
          const localService: Service = { id: localId, created_at: new Date().toISOString(), ...payload } as Service;
          setServices((prev) => [localService, ...prev]);
          toast({ title: "Created (preview)", description: "Supabase not configured; changes not persisted." });
        } else {
          toast({ title: "Service created", description: "New service added" });
          await loadServices();
        }
      }
    } catch {
      toast({ title: "Unexpected error", description: "Please try again" });
    } finally {
      setServiceDialogOpen(false);
    }
  };
  
  const handleDeleteService = async (id: string) => {
    try {
      const res = await supabase.from("services").delete().eq("id", id);
      if (res.error) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        toast({ title: "Deleted (preview)", description: "Supabase not configured; changes not persisted." });
      } else {
        toast({ title: "Service deleted" });
        await loadServices();
      }
    } catch {
      toast({ title: "Unexpected error", description: "Please try again" });
    }
  };
  
  const toggleHidden = async (s: Service) => {
    try {
      const res = await supabase.from("services").update({ hidden: !s.hidden }).eq("id", s.id);
      if (res.error) {
        setServices((prev) => prev.map((it) => (it.id === s.id ? { ...it, hidden: !s.hidden } : it)));
        toast({ title: "Visibility toggled (preview)", description: "Supabase not configured; changes not persisted." });
      } else {
        await loadServices();
      }
    } catch {
      // ignore
    }
  };
  
  useEffect(() => {
    if (activeTab === "services") {
      loadServices();
    }
  }, [activeTab]);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Counts
        const visitsRes = await supabase
          .from("website_visits")
          .select("id", { count: "exact", head: true });
        const servicesRes = await supabase
          .from("services")
          .select("id", { count: "exact", head: true });
        const usersRes = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        // Account balance sum
        const accountsRes = await supabase
          .from("accounts")
          .select("balance");
        const balanceSum = Array.isArray(accountsRes.data)
          ? (accountsRes.data as { balance: number }[]).reduce((acc, cur) => acc + (Number(cur.balance) || 0), 0)
          : 0;

        // Lists
        const contactsRes = await supabase
          .from("contact_submissions")
          .select("id, created_at, name, email, phone, subject, message, status")
          .order("created_at", { ascending: false })
          .limit(10);
        const bookingsRes = await supabase
          .from("concierge_requests")
          .select("id, created_at, name, email, phone, service, message, status")
          .order("created_at", { ascending: false })
          .limit(10);
        const adminsRes = await supabase
          .from("profiles")
          .select("id, created_at, email, full_name, role")
          .eq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(10);

        if (isMounted) {
          setVisitsCount(visitsRes.count ?? 0);
          setServicesCount(servicesRes.count ?? 0);
          setUsersCount(usersRes.count ?? 0);
          setAccountBalance(balanceSum);
          setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
          setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
          setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
        }
      } catch {
        // ignore errors; UI will show defaults
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "venues", label: "Featured Venues", icon: MapPin },
    { id: "membership", label: "Membership", icon: Users },
    { id: "blogs", label: "Blogs", icon: BookOpen },
    { id: "website", label: "Website UI", icon: Settings },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "others", label: "Others", icon: MoreHorizontal },
  ];

  const formatCurrency = (val: number | null) => {
    if (val == null) return "-";
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val);
    } catch {
      return `₦${val.toLocaleString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b-0 bg-gradient-to-r from-[hsl(var(--brand-blue))] to-black text-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white/80 hover:bg-white/10">
              <Menu />
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">Admin User</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-1">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Total Visits</CardDescription>
                      <CardTitle className="text-3xl">{visitsCount ?? "-"}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl" onClick={() => setActiveTab("services")}>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Total Services</CardDescription>
                      <CardTitle className="text-3xl">{servicesCount ?? "-"}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl" onClick={() => setActiveTab("membership")}>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Total Users</CardDescription>
                      <CardTitle className="text-3xl">{usersCount ?? "-"}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Account Balance</CardDescription>
                      <CardTitle className="text-3xl">{formatCurrency(accountBalance)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>Recent contact form submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contacts.length === 0 ? (
                      <p className="text-muted-foreground">No contact submissions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((c) => (
                          <div key={c.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <div className="font-medium">{c.name ?? c.email}</div>
                              <div className="text-sm text-muted-foreground">{c.subject}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Latest Bookings</CardTitle>
                    <CardDescription>Recent concierge service requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <p className="text-muted-foreground">No concierge requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((b) => (
                          <div key={b.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <div className="font-medium">{b.name ?? b.email}</div>
                              <div className="text-sm text-muted-foreground">{b.service} • {b.status}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Admin Team</CardTitle>
                    <CardDescription>List of administrators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {admins.length === 0 ? (
                      <p className="text-muted-foreground">No admins found.</p>
                    ) : (
                      <div className="space-y-2">
                        {admins.map((a) => (
                          <div key={a.id} className="flex items-center justify-between border-b pb-2">
                            <div className="font-medium">{a.full_name ?? a.email}</div>
                            <div className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-3xl font-bold text-primary">Services</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Input
                      placeholder="Search services..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full sm:w-64"
                    />
                    <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {Array.from(new Set(services.map((s) => s.category))).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch checked={showHidden} onCheckedChange={setShowHidden} id="hidden-switch" />
                      <Label htmlFor="hidden-switch">Show hidden</Label>
                    </div>
                    <Button onClick={openCreateService} className="bg-primary text-primary-foreground hover:bg-primary/90">Add Service</Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {loadingServices ? (
                      <p className="text-muted-foreground">Loading services...</p>
                    ) : services.length === 0 ? (
                      <p className="text-muted-foreground">No services found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services
                          .filter((s) => (categoryFilter === "all" || s.category === categoryFilter))
                          .filter((s) => (showHidden ? true : !s.hidden))
                          .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.short_description.toLowerCase().includes(search.toLowerCase()))
                          .map((s) => (
                            <div key={s.id} className="relative group overflow-hidden rounded-xl ring-1 ring-border">
                              <div className="aspect-[16/9] bg-muted">
                                {s.images?.[0] ? (
                                  <img src={s.images[0]} alt={s.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
                                )}
                              </div>
                            
                              {/* overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                              {/* badge */}
                              {s.hidden ? (
                                <span className="absolute top-3 left-3 rounded-full bg-yellow-600/90 text-white text-xs px-2 py-0.5">Hidden</span>
                              ) : (
                                <span className="absolute top-3 left-3 rounded-full bg-green-600/90 text-white text-xs px-2 py-0.5">Shown</span>
                              )}
                            
                              {/* bottom bar */}
                              <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between">
                                <div>
                                  <div className="text-white font-semibold drop-shadow-md">{s.title}</div>
                                  <div className="text-white/80 text-xs">{s.category}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => openEditService(s)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => toggleHidden(s)}>
                                    {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-red-300 hover:bg-red-500/20">
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete service?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently remove the service.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteService(s.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="svc-title">Title</Label>
                        <Input id="svc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="svc-category">Category</Label>
                        <Input id="svc-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="svc-short">Short Description</Label>
                        <Textarea id="svc-short" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="svc-detail">Detailed Description</Label>
                        <Textarea id="svc-detail" value={form.detailed_description} onChange={(e) => setForm({ ...form, detailed_description: e.target.value })} rows={6} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="svc-images">Images (comma-separated URLs)</Label>
                        <Textarea id="svc-images" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="svc-videos">Videos (comma-separated URLs)</Label>
                        <Textarea id="svc-videos" value={form.videos} onChange={(e) => setForm({ ...form, videos: e.target.value })} rows={3} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="svc-hidden" checked={form.hidden} onCheckedChange={(v) => setForm({ ...form, hidden: v })} />
                        <Label htmlFor="svc-hidden">Hidden</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveService}>{editingService ? "Save changes" : "Create service"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {activeTab === "venues" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-primary">Featured Venues</h2>
                  <Button>Add Venue</Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">Venues management interface will be here...</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "membership" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-primary">Membership</h2>
                  <Button variant="outline" onClick={() => setMembershipDialogOpen(true)}>Membership Navigation</Button>
                </div>
              
                <Tabs defaultValue="members">
                  <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="users">All Users</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="members">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">Members list will appear here...</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="admins">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">Admins list will appear here...</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="users">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">All users list will appear here...</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="bookings">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">Bookings from service requests will appear here...</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              
                <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Membership Navigation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ms-login">Login portal visible</Label>
                        <Switch id="ms-login" checked={membershipSettings.loginVisible} onCheckedChange={(v) => setMembershipSettings({ ...membershipSettings, loginVisible: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ms-mb">Membership buttons visible</Label>
                        <Switch id="ms-mb" checked={membershipSettings.membershipButtonsVisible} onCheckedChange={(v) => setMembershipSettings({ ...membershipSettings, membershipButtonsVisible: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ms-vb">Venue buttons visible</Label>
                        <Switch id="ms-vb" checked={membershipSettings.venueButtonsVisible} onCheckedChange={(v) => setMembershipSettings({ ...membershipSettings, venueButtonsVisible: v })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setMembershipDialogOpen(false)}>Cancel</Button>
                      <Button onClick={saveMembershipSettings} className="bg-primary text-primary-foreground hover:bg-primary/90">Save changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {["blogs", "website", "subscription", "media", "others"].includes(activeTab) && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-primary capitalize">{activeTab}</h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management interface will be here...
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
