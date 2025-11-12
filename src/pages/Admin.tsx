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
  Pencil,
  Eye,
  EyeOff,
  Trash,
  Mail,
  Copy,
  Check,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const navigate = useNavigate();
  const { signOut, userId, email } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [visitsCount, setVisitsCount] = useState<number | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<any | null>(null);
  // New analytics/finance/membership state inside component
  const [visitsDialogOpen, setVisitsDialogOpen] = useState(false);
  const [visitsAggregated, setVisitsAggregated] = useState<any[]>([]);
  const [visitsStartDate, setVisitsStartDate] = useState<string>("");
  const [visitsEndDate, setVisitsEndDate] = useState<string>("");
  const [visitsPath, setVisitsPath] = useState<string>("");
  const [membershipTab, setMembershipTab] = useState<string>("members");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ from: "", to: "", amount: "", reason: "" });
  const [transferStatusFilter, setTransferStatusFilter] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  // Newsletter modal and filters
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [newsletterSubs, setNewsletterSubs] = useState<any[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState<boolean>(false);
  const [newsletterSearch, setNewsletterSearch] = useState("");
  const [selectedNewsletter, setSelectedNewsletter] = useState<Set<string>>(new Set());
  const [newsletterBulkEmailOpen, setNewsletterBulkEmailOpen] = useState(false);
  const [newsletterBulkSubject, setNewsletterBulkSubject] = useState("");
  const [newsletterBulkBody, setNewsletterBulkBody] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");
  const [contactsStatusFilter, setContactsStatusFilter] = useState<string>("all");
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);
  const [contactPreviewOpen, setContactPreviewOpen] = useState(false);
  const [contactPreviewItem, setContactPreviewItem] = useState<any | null>(null);
  // Bulk email for Users tab
  const [bulkUsersOpen, setBulkUsersOpen] = useState(false);
  const [bulkUsersSubject, setBulkUsersSubject] = useState("");
  const [bulkUsersBody, setBulkUsersBody] = useState("");
  // Single email dialog
  const [singleEmailOpen, setSingleEmailOpen] = useState(false);
  const [singleEmailRecipient, setSingleEmailRecipient] = useState<any | null>(null);
  const [singleEmailSubject, setSingleEmailSubject] = useState("");
  const [singleEmailBody, setSingleEmailBody] = useState("");
  // Delete user confirmation
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  // Bookings filters, selection, bulk email
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [bookingBulkEmailOpen, setBookingBulkEmailOpen] = useState(false);
  const [bulkBookingSubject, setBulkBookingSubject] = useState("");
  const [bulkBookingBody, setBulkBookingBody] = useState("");
  // Virtual Assistance filters and selection
  const [vaSearch, setVaSearch] = useState("");
  const [vaStatusFilter, setVaStatusFilter] = useState<string>("all");
  const [selectedVa, setSelectedVa] = useState<Set<string>>(new Set());
  // CSV export helper
  const exportToCsv = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      if (s.search(/([",\n])/g) >= 0) return `"${s}"`;
      return s;
    };
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Visits aggregation
  const loadVisitsAggregated = async () => {
    try {
      const { data } = await supabase
        .from("website_visits")
        .select("ip,country,region,city,created_at,path,referrer")
        .order("created_at", { ascending: false });
      const filtered = (data || []).filter((v: any) => {
        const d = new Date(v.created_at).getTime();
        const afterStart = visitsStartDate ? d >= new Date(visitsStartDate).getTime() : true;
        const beforeEnd = visitsEndDate ? d <= new Date(visitsEndDate).getTime() : true;
        const pathOk = visitsPath ? (v.path || "").includes(visitsPath) : true;
        return afterStart && beforeEnd && pathOk;
      });
      const map = new Map<string, any>();
      filtered.forEach((v: any) => {
        const key = v.ip || "unknown";
        const existing = map.get(key);
        const ts = new Date(v.created_at).getTime();
        if (!existing) {
          map.set(key, { ip: key, country: v.country || "", region: v.region || "", city: v.city || "", count: 1, first_visit: v.created_at, last_visit: v.created_at });
        } else {
          existing.count += 1;
          if (ts < new Date(existing.first_visit).getTime()) existing.first_visit = v.created_at;
          if (ts > new Date(existing.last_visit).getTime()) existing.last_visit = v.created_at;
        }
      });
      setVisitsAggregated(Array.from(map.values()));
    } catch {
      setVisitsAggregated([]);
    }
  };
  // Finance loaders
  const loadFinance = async () => {
    try {
      setFinanceLoading(true);
      const { data: acc } = await supabase.from("accounts").select("id,created_at,currency,balance,owner_id");
      const { data: trans } = await supabase
        .from("account_transfers")
        .select("id,created_at,from_account_id,to_account_id,amount,status,reason")
        .order("created_at", { descending: true })
        .limit(50);
      setAccounts(acc || []);
      setTransfers(trans || []);
    } catch {
      setAccounts([]);
      setTransfers([]);
    } finally {
      setFinanceLoading(false);
    }
  };
  const submitTransfer = async () => {
    if (!transferForm.from || !transferForm.to || !transferForm.amount) {
      toast({ title: "Missing fields", description: "Please fill in from, to and amount.", variant: "destructive" });
      return;
    }
    try {
      const amountNum = Number(transferForm.amount);
      await supabase.from("account_transfers").insert({
        from_account_id: transferForm.from,
        to_account_id: transferForm.to,
        amount: amountNum,
        status: "pending",
        reason: transferForm.reason || null,
      });
      toast({ title: "Transfer created", description: "Marked as pending." });
      setTransferDialogOpen(false);
      setTransferForm({ from: "", to: "", amount: "", reason: "" });
      await loadFinance();
    } catch (e: any) {
      toast({ title: "Transfer failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };
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

  // Upload helpers and file inputs
  const [serviceImageFiles, setServiceImageFiles] = useState<File[]>([]);
  const [venueImageFiles, setVenueImageFiles] = useState<File[]>([]);
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);

  const uploadFiles = async (files: File[], folder: string) => {
    try {
      // Ensure storage client exists
      if (!supabase?.storage || typeof supabase.storage.from !== "function") {
        throw new Error("Storage not configured");
      }
      const bucket = "media"; // configure this bucket in Supabase Storage
      const urls: string[] = [];
      for (const file of files) {
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
      return urls;
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message ?? "Storage error", variant: "destructive" });
      return [];
    }
  };

  // Website UI states
  const [websiteTab, setWebsiteTab] = useState<string>("testimonials");
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: "", content: "", image: "" });
  const [contactInfo, setContactInfo] = useState<{ address: string; emails: string[]; phones: string[] }>({ address: "", emails: ["",""], phones: ["","",""] });
  const [socialLinks, setSocialLinks] = useState<{ facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string }>({});

  // Subscription states
const [plans, setPlans] = useState<any[]>([]);
const [planUserCounts, setPlanUserCounts] = useState<Record<string, number>>({});
const [planUsersDialogOpen, setPlanUsersDialogOpen] = useState(false);
const [selectedPlanForUsers, setSelectedPlanForUsers] = useState<any | null>(null);
const [planUsers, setPlanUsers] = useState<any[]>([]);
const [assignDialogOpen, setAssignDialogOpen] = useState(false);
const [assignPlanId, setAssignPlanId] = useState<string | null>(null);
const [assignUserId, setAssignUserId] = useState<string | null>(null);
const [usersBasic, setUsersBasic] = useState<any[]>([]);
const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", duration: "", price: "", coverImage: "", benefits: "", showOnWebsite: true });

  // Media states
  const [assets, setAssets] = useState<any[]>([]);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ type: "image", page_slug: "", alt_text: "", file: null as File | null, url: "" });

  // Others states
  const [othersTab, setOthersTab] = useState<string>("faq");
  const [faqs, setFaqs] = useState<any[]>([]);
  const [vaRequests, setVaRequests] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [voucherForm, setVoucherForm] = useState({ code: "", description: "", type: "fixed", value: 0, currency: "USD", usage_limit: 1, valid_from: "", valid_to: "", is_active: true });

  // Profile edit
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });

  // Venues management state
  type Venue = {
    id: string;
    created_at: string;
    name: string;
    short_description: string;
    detailed_description: string;
    category: string;
    niche: string | null;
    address: string | null;
    weekday_hours: string | null;
    sunday_hours: string | null;
    map_url: string | null;
    images: string[];
    hidden: boolean;
  };
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: "",
    short_description: "",
    detailed_description: "",
    category: "",
    niche: "",
    address: "",
    weekday_hours: "",
    sunday_hours: "",
    map_url: "",
    images: "",
    hidden: false,
  });
  const loadVenues = async () => {
    setLoadingVenues(true);
    try {
      const { data } = await supabase
        .from("venues")
        .select("id,created_at,name,short_description,detailed_description,category,niche,address,weekday_hours,sunday_hours,map_url,images,hidden")
        .order("created_at", { ascending: false })
        .limit(100);
      setVenues((data as Venue[]) || []);
    } catch {}
    setLoadingVenues(false);
  };
  useEffect(() => { if (activeTab === "venues") loadVenues(); }, [activeTab]);
  const openCreateVenue = () => { setEditingVenue(null); setVenueForm({ name: "", short_description: "", detailed_description: "", category: "", niche: "", address: "", weekday_hours: "", sunday_hours: "", map_url: "", images: "", hidden: false }); setVenueDialogOpen(true); };
  const openEditVenue = (v: Venue) => { setEditingVenue(v); setVenueForm({ name: v.name, short_description: v.short_description, detailed_description: v.detailed_description, category: v.category, niche: v.niche || "", address: v.address || "", weekday_hours: v.weekday_hours || "", sunday_hours: v.sunday_hours || "", map_url: v.map_url || "", images: (v.images ?? []).join(", "), hidden: !!v.hidden }); setVenueDialogOpen(true); };
  const handleSaveVenue = async () => {
    if (!venueForm.name || !venueForm.short_description || !venueForm.detailed_description || !venueForm.category) { toast({ title: "Missing fields", description: "Fill in name, category, short & detailed description." }); return; }
    let venueImageUrls = csvToArray(venueForm.images);
    if (venueImageFiles.length > 0) {
      venueImageUrls = await uploadFiles(venueImageFiles, "venues");
    }
    const payload = { name: venueForm.name, short_description: venueForm.short_description, detailed_description: venueForm.detailed_description, category: venueForm.category, niche: venueForm.niche || null, address: venueForm.address || null, weekday_hours: venueForm.weekday_hours || null, sunday_hours: venueForm.sunday_hours || null, map_url: venueForm.map_url || null, images: venueImageUrls, hidden: venueForm.hidden };
    try { if (editingVenue) { await supabase.from("venues").update(payload).eq("id", editingVenue.id); toast({ title: "Venue updated" }); } else { await supabase.from("venues").insert(payload); toast({ title: "Venue created" }); } setVenueDialogOpen(false); await loadVenues(); } catch (e: any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
  };
  const toggleVenueHidden = async (v: Venue) => { try { await supabase.from("venues").update({ hidden: !v.hidden }).eq("id", v.id); await loadVenues(); } catch {} };
  const deleteVenue = async (id: string) => { try { await supabase.from("venues").delete().eq("id", id); toast({ title: "Venue deleted" }); await loadVenues(); } catch {} };

  // Blogs management state
  type Blog = { id: string; created_at: string; title: string; excerpt: string | null; content: string; author: string | null; date: string | null; image: string | null; category: string | null; };
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogSearch, setBlogSearch] = useState("");
  const [blogCategory, setBlogCategory] = useState<string>("all");
  const [blogForm, setBlogForm] = useState({ title: "", excerpt: "", content: "", author: "", date: "", image: "", category: "" });
  const loadBlogs = async () => { setLoadingBlogs(true); try { const { data } = await supabase.from("blogs").select("id,created_at,title,excerpt,content,author,date,image,category").order("created_at", { ascending: false }).limit(100); setBlogs((data as Blog[]) || []); } catch {} setLoadingBlogs(false); };
  useEffect(() => { if (activeTab === "blogs") loadBlogs(); }, [activeTab]);
  const openCreateBlog = () => { setEditingBlog(null); setBlogForm({ title: "", excerpt: "", content: "", author: "", date: "", image: "", category: "" }); setBlogDialogOpen(true); };
  const openEditBlog = (b: Blog) => { setEditingBlog(b); setBlogForm({ title: b.title, excerpt: b.excerpt || "", content: b.content, author: b.author || "", date: b.date || "", image: b.image || "", category: b.category || "" }); setBlogDialogOpen(true); };
  const handleSaveBlog = async () => { if (!blogForm.title || !blogForm.content) { toast({ title: "Missing fields", description: "Fill in title and content." }); return; } let imageUrl = blogForm.image || null;
    if (blogImageFile) {
      const urls = await uploadFiles([blogImageFile], "blogs");
      if (urls.length > 0) imageUrl = urls[0];
    }
    const payload = { title: blogForm.title, excerpt: blogForm.excerpt || null, content: blogForm.content, author: blogForm.author || null, date: blogForm.date || null, image: imageUrl, category: blogForm.category || null }; try { if (editingBlog) { await supabase.from("blogs").update(payload).eq("id", editingBlog.id); toast({ title: "Blog updated" }); } else { await supabase.from("blogs").insert(payload); toast({ title: "Blog created" }); } setBlogDialogOpen(false); await loadBlogs(); } catch (e: any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); } };
  const deleteBlog = async (id: string) => { try { await supabase.from("blogs").delete().eq("id", id); toast({ title: "Blog deleted" }); await loadBlogs(); } catch {} };

  // Membership users tab state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
  const [userCounts, setUserCounts] = useState<{ users: number; members: number; admins: number }>({ users: 0, members: 0, admins: 0 });
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: "", full_name: "", phone: "", role: "member" });
  const [bulkAudience, setBulkAudience] = useState<"all" | "members" | "admins">("all");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<{ full_name: string; phone: string; email: string }>({ full_name: "", phone: "", email: "" });
  const [userActivePlan, setUserActivePlan] = useState<Record<string, string>>({});
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [invitedLoading, setInvitedLoading] = useState(false);
  const [invitedSearch, setInvitedSearch] = useState("");
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [roleConfirmTarget, setRoleConfirmTarget] = useState<{ id: string; name: string; email: string; currentRole: string; nextRole: string } | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [bookingPreviewOpen, setBookingPreviewOpen] = useState(false);
  const [bookingPreviewItem, setBookingPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    if (currentAdminProfile) {
      setProfileEditForm({
        full_name: currentAdminProfile.full_name || "",
        phone: currentAdminProfile.phone || "",
        email: currentAdminProfile.email || "",
      });
    }
  }, [currentAdminProfile]);

  const loadUserPlans = async (userIds: string[]) => {
    try {
      if (userIds.length === 0) { setUserActivePlan({}); return; }
      const { data: memberships } = await supabase
        .from("user_memberships")
        .select("user_id, plan_id, active")
        .eq("active", true)
        .in("user_id", userIds);
      const planIds = Array.from(new Set((memberships || []).map((m: any) => m.plan_id).filter(Boolean)));
      let planMap: Record<string, string> = {};
      if (planIds.length > 0) {
        const { data: plans } = await supabase
          .from("membership_plans")
          .select("id,name")
          .in("id", planIds);
        (plans || []).forEach((p: any) => { planMap[p.id] = p.name; });
      }
      const result: Record<string, string> = {};
      (memberships || []).forEach((m: any) => {
        if (m.active && m.user_id) {
          result[m.user_id] = planMap[m.plan_id] || "-";
        }
      });
      setUserActivePlan(result);
    } catch (e) {
      // ignore errors
    }
  };
  useEffect(() => { const loadUsers = async () => { if (activeTab !== "membership") return; setUsersLoading(true); try { const { data } = await supabase.from("profiles").select("id,created_at,email,full_name,phone,role").order("created_at", { ascending: false }).limit(200); const rows = data || []; setUsers(rows); setUserCounts({ users: rows.length, members: rows.filter((u: any) => u.role === "member").length, admins: rows.filter((u: any) => u.role === "admin").length }); } catch {} setUsersLoading(false); }; loadUsers(); }, [activeTab]);
  useEffect(() => { if (users.length > 0) { loadUserPlans(users.map((u:any) => u.id).filter(Boolean)); } else { setUserActivePlan({}); } }, [users]);

  const loadInvitedUsers = async () => {
    setInvitedLoading(true);
    try {
      const { data } = await supabase
        .from("admin_added_users")
        .select("id,created_at,email,full_name,phone,temp_password,pending_role,invited_by,status,profile_id")
        .order("created_at", { ascending: false })
        .limit(200);
      setInvitedUsers(data || []);
    } catch {
      // ignore
    }
    setInvitedLoading(false);
  };
  useEffect(() => { if (activeTab === "membership" && membershipTab === "invited") { loadInvitedUsers(); } }, [activeTab, membershipTab]);

  const markPasswordUpdated = async (id: string) => {
    try { await supabase.from("admin_added_users").update({ status: "password_updated" }).eq("id", id); toast({ title: "Marked as password updated" }); await loadInvitedUsers(); } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
  };
  const activateInvitedUser = async (invite: any) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .insert({ email: invite.email || null, full_name: invite.full_name || null, phone: invite.phone || null, role: invite.pending_role })
        .select("id")
        .maybeSingle();
      // Seed default membership if a plan exists (cheapest by price)
      try {
        const { data: defaultPlan } = await supabase
          .from("membership_plans")
          .select("id,price")
          .order("price", { ascending: true })
          .limit(1);
        const plan = defaultPlan && defaultPlan[0];
        if (plan && prof?.id) {
          await supabase
            .from("user_memberships")
            .insert({ user_id: prof.id, plan_id: plan.id, active: true });
        }
      } catch {}
      await supabase
        .from("admin_added_users")
        .update({ status: "activated", profile_id: prof?.id || null })
        .eq("id", invite.id);
      toast({ title: "User activated", description: `Role set to ${invite.pending_role}` });
      await loadInvitedUsers();
      // refresh users list if on All Users
      if (membershipTab === "users") {
        const { data } = await supabase.from("profiles").select("id,created_at,email,full_name,phone,role").order("created_at", { ascending: false }).limit(200);
        const rows = data || [];
        setUsers(rows);
        setUserCounts({ users: rows.length, members: rows.filter((u: any) => u.role === "member").length, admins: rows.filter((u: any) => u.role === "admin").length });
        await loadUserPlans(rows.map((u:any) => u.id).filter(Boolean));
      }
    } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
  };

  const openRoleChangeConfirm = (u: any, nextRole: string) => {
    setRoleConfirmTarget({ id: u.id, name: u.full_name || "-", email: u.email || "-", currentRole: u.role, nextRole });
    setRoleConfirmOpen(true);
  };
  const updateUserRole = async (id: string, role: string) => { try { await supabase.from("profiles").update({ role }).eq("id", id); toast({ title: "Role updated" }); const next = users.map(u => (u.id === id ? { ...u, role } : u)); setUsers(next); } catch {} };

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
    let imageUrls = csvToArray(form.images);
    if (serviceImageFiles.length > 0) {
      imageUrls = await uploadFiles(serviceImageFiles, "services");
    }
    const payload = {
      title: form.title,
      short_description: form.short_description,
      detailed_description: form.detailed_description,
      category: form.category,
      images: imageUrls,
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

  // Loaders for Website UI
  const loadTestimonials = async () => {
    try {
      const { data } = await supabase
        .from("testimonials")
        .select("id,name,content,image,created_at")
        .order("created_at", { ascending: false });
      setTestimonials(data || []);
    } catch {}
  };
  const loadContactInfoData = async () => {
    try {
      const { data } = await supabase
        .from("contact_info")
        .select("address,emails,phones")
        .limit(1);
      const row = (data && data[0]) || null;
      setContactInfo({
        address: row?.address || "",
        emails: Array.isArray(row?.emails) && row!.emails.length > 0 ? row!.emails : ["",""],
        phones: Array.isArray(row?.phones) && row!.phones.length > 0 ? row!.phones : ["","",""]
      });
    } catch {}
  };
  const loadSocialLinksData = async () => {
    try {
      const { data } = await supabase
        .from("social_links")
        .select("facebook,instagram,twitter,linkedin,youtube")
        .limit(1);
      const row = (data && data[0]) || {};
      setSocialLinks(row || {});
    } catch {}
  };

  // Loaders for Subscription
  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from("membership_plans")
        .select("id,name,duration,price,currency,cover_image,benefits,show_on_website,created_at")
        .order("created_at", { ascending: false });
      setPlans(data || []);
    } catch {}
  };

  const loadPlanUserCounts = async () => {
    try {
      const { data } = await supabase
        .from("user_memberships")
        .select("plan_id,user_id,active")
        .eq("active", true)
        .limit(5000);
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.plan_id] = (counts[row.plan_id] || 0) + 1;
      });
      setPlanUserCounts(counts);
    } catch {}
  };

  const openPlanUsers = async (plan: any) => {
    try {
      setSelectedPlanForUsers(plan);
      setPlanUsers([]);
      setPlanUsersDialogOpen(true);
      const { data } = await supabase
        .from("user_memberships")
        .select("user_id,active")
        .eq("plan_id", plan.id)
        .eq("active", true)
        .limit(500);
      const ids = (data || []).map((r: any) => r.user_id);
      if (ids.length === 0) {
        setPlanUsers([]);
        return;
      }
      const profilesRes = await supabase
        .from("profiles")
        .select("id,created_at,email,full_name,phone,role")
        .in("id", ids)
        .order("created_at", { ascending: false });
      setPlanUsers(profilesRes.data || []);
    } catch (e:any) {
      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const revokeMembership = async (userId: string, planId: string) => {
    try {
      const { error } = await supabase
        .from("user_memberships")
        .update({ active: false, revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("plan_id", planId)
        .eq("active", true);
      if (error) throw new Error(error.message);
      toast({ title: "Revoked", description: "Membership revoked" });
      await openPlanUsers({ id: planId });
      await loadPlanUserCounts();
    } catch (e:any) {
      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const openAssignPlanDialog = async (planId: string) => {
    try {
      setAssignPlanId(planId);
      setAssignUserId(null);
      const { data } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .order("created_at", { ascending: false })
        .limit(200);
      setUsersBasic(data || []);
      setAssignDialogOpen(true);
    } catch {}
  };

  const assignPlanToUser = async () => {
    if (!assignPlanId || !assignUserId) return;
    try {
      const existing = await supabase
        .from("user_memberships")
        .select("id")
        .eq("user_id", assignUserId)
        .eq("active", true)
        .limit(1);
      if (existing.data && existing.data.length > 0) {
        await supabase
          .from("user_memberships")
          .update({ active: false, revoked_at: new Date().toISOString() })
          .eq("id", existing.data[0].id);
      }
      const { error } = await supabase
        .from("user_memberships")
        .insert({ user_id: assignUserId, plan_id: assignPlanId, active: true });
      if (error) throw new Error(error.message);
      toast({ title: "Assigned", description: "Plan assigned to user" });
      setAssignDialogOpen(false);
      await loadPlanUserCounts();
      if (selectedPlanForUsers && selectedPlanForUsers.id === assignPlanId) {
        await openPlanUsers(selectedPlanForUsers);
      }
    } catch (e:any) {
      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  // Loaders for Media
  const loadAssets = async () => {
    try {
      const { data } = await supabase
        .from("media_assets")
        .select("id,type,url,page_slug,alt_text,created_at")
        .order("created_at", { ascending: false });
      setAssets(data || []);
    } catch {}
  };

  // Loaders for Others
  const loadFaqs = async () => {
    try {
      const { data } = await supabase
        .from("faqs")
        .select("id,question,answer,created_at")
        .order("created_at", { ascending: false });
      setFaqs(data || []);
    } catch {}
  };
  const loadVaRequests = async () => {
    try {
      const { data } = await supabase
        .from("virtual_assistance_requests")
        .select("id,created_at,name,email,phone,topic,details,status")
        .order("created_at", { ascending: false });
      setVaRequests(data || []);
    } catch {}
  };
  const loadVouchers = async () => {
    try {
      const { data } = await supabase
        .from("vouchers")
        .select("id,code,type,value,currency,is_active,usage_count,usage_limit,valid_to,created_at")
        .order("created_at", { ascending: false });
      setVouchers(data || []);
    } catch {}
  };
  const loadPagesList = async () => {
    try {
      const { data } = await supabase
        .from("pages")
        .select("id,title,slug,path,is_visible,is_main,hero_title,hero_subtitle,hero_background_image,created_at")
        .order("created_at", { ascending: false });
      setPagesList(data || []);
    } catch {}
  };

  // CRUD helpers: Testimonials
  const openAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({ name: "", content: "", image: "" });
    setTestimonialDialogOpen(true);
  };
  const openEditTestimonial = (t: any) => {
    setEditingTestimonial(t);
    setTestimonialForm({ name: t.name || "", content: t.content || "", image: t.image || "" });
    setTestimonialDialogOpen(true);
  };
  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw new Error(error.message);
      toast({ title: "Deleted", description: "Testimonial deleted" });
      await loadTestimonials();
    } catch (e: any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
  };
  const saveTestimonial = async () => {
    try {
      let imgUrl = testimonialForm.image;
      if (blogImageFile) {
        const u = await uploadFiles([blogImageFile], "testimonials");
        if (u.length) imgUrl = u[0];
      }
      if (editingTestimonial) {
        const { error } = await supabase
          .from("testimonials")
          .update({ name: testimonialForm.name, content: testimonialForm.content, image: imgUrl })
          .eq("id", editingTestimonial.id);
        if (error) throw new Error(error.message);
        toast({ title: "Updated", description: "Testimonial updated" });
      } else {
        const { error } = await supabase
          .from("testimonials")
          .insert({ name: testimonialForm.name, content: testimonialForm.content, image: imgUrl });
        if (error) throw new Error(error.message);
        toast({ title: "Added", description: "Testimonial added" });
      }
      setTestimonialDialogOpen(false);
      setEditingTestimonial(null);
      setTestimonialForm({ name: "", content: "", image: "" });
      await loadTestimonials();
    } catch (e: any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
  };

  // CRUD helpers: FAQs
  const openAddFaq = () => { setEditingFaq(null); setFaqForm({ question: "", answer: "" }); setFaqDialogOpen(true); };
  const openEditFaq = (f: any) => { setEditingFaq(f); setFaqForm({ question: f.question || "", answer: f.answer || "" }); setFaqDialogOpen(true); };
  const deleteFaq = async (id: string) => { try { const { error } = await supabase.from("faqs").delete().eq("id", id); if (error) throw new Error(error.message); toast({ title: "Deleted", description: "FAQ deleted" }); await loadFaqs(); } catch (e:any){ toast({ title:"Error", description:e?.message ?? "Unknown error", variant:"destructive" }); } };
  const saveFaq = async () => { try { if (editingFaq) { const { error } = await supabase.from("faqs").update({ question: faqForm.question, answer: faqForm.answer }).eq("id", editingFaq.id); if (error) throw new Error(error.message); toast({ title: "Updated", description: "FAQ updated" }); } else { const { error } = await supabase.from("faqs").insert({ question: faqForm.question, answer: faqForm.answer }); if (error) throw new Error(error.message); toast({ title: "Added", description: "FAQ added" }); } setFaqDialogOpen(false); setEditingFaq(null); setFaqForm({ question: "", answer: "" }); await loadFaqs(); } catch(e:any){ toast({ title:"Error", description:e?.message ?? "Unknown error", variant:"destructive" }); } };

  // CRUD helpers: Vouchers
  const openAddVoucher = () => { setEditingVoucher(null); setVoucherForm({ code: "", description: "", type: "fixed", value: 0, currency: "USD", usage_limit: 1, valid_from: "", valid_to: "", is_active: true }); setVoucherDialogOpen(true); };
  const openEditVoucher = (v: any) => { setEditingVoucher(v); setVoucherForm({ code: v.code || "", description: v.description || "", type: v.type || "fixed", value: Number(v.value) || 0, currency: v.currency || "USD", usage_limit: v.usage_limit || 1, valid_from: v.valid_from || "", valid_to: v.valid_to || "", is_active: !!v.is_active }); setVoucherDialogOpen(true); };
  const deleteVoucher = async (id: string) => { try { const { error } = await supabase.from("vouchers").delete().eq("id", id); if (error) throw new Error(error.message); toast({ title: "Deleted", description: "Voucher deleted" }); await loadVouchers(); } catch(e:any){ toast({ title:"Error", description:e?.message ?? "Unknown error", variant:"destructive" }); } };
  const saveVoucher = async () => { try { const payload: any = { code: voucherForm.code, description: voucherForm.description, type: voucherForm.type, value: Number(voucherForm.value), currency: voucherForm.currency, usage_limit: voucherForm.usage_limit, valid_from: voucherForm.valid_from || null, valid_to: voucherForm.valid_to || null, is_active: voucherForm.is_active }; if (editingVoucher) { const { error } = await supabase.from("vouchers").update(payload).eq("id", editingVoucher.id); if (error) throw new Error(error.message); toast({ title: "Updated", description: "Voucher updated" }); } else { const { error } = await supabase.from("vouchers").insert(payload); if (error) throw new Error(error.message); toast({ title: "Added", description: "Voucher added" }); } setVoucherDialogOpen(false); setEditingVoucher(null); await loadVouchers(); } catch(e:any){ toast({ title:"Error", description:e?.message ?? "Unknown error", variant:"destructive" }); } };

  // Trigger tab-specific loaders
  useEffect(() => { if (activeTab === "website") { loadTestimonials(); loadContactInfoData(); loadSocialLinksData(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "subscription") { loadPlans(); loadPlanUserCounts(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "media") { loadAssets(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "others") { loadFaqs(); if (othersTab === "vouchers") loadVouchers(); if (othersTab === "pages") loadPagesList(); } }, [activeTab, othersTab]);
  // Load Virtual Assistance when shown under Membership
  useEffect(() => { if (activeTab === "membership" && membershipTab === "va") { loadVaRequests(); } }, [activeTab, membershipTab]);
  // Load Bookings when shown under Membership
  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const { data } = await supabase
        .from("concierge_requests")
        .select("id, created_at, name, email, phone, service, message, status")
        .order("created_at", { ascending: false })
        .limit(200);
      setBookings(data || []);
      setBookingsLoading(false);
    } catch {}
  };
  useEffect(() => { if (activeTab === "membership" && membershipTab === "bookings") { loadBookings(); } }, [activeTab, membershipTab]);
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
        setContactsLoading(true);
        setNewsletterLoading(true);
        // Contacts list now sourced from newsletter_subscriptions
        const contactsRes = await supabase
          .from("newsletter_subscriptions")
          .select("id, created_at, email, source, path, referrer, user_agent, status")
          .order("created_at", { ascending: false })
          .limit(10);
        const bookingsRes = await supabase
          .from("concierge_requests")
          .select("id, created_at, name, email, phone, service, message, status")
          .order("created_at", { ascending: false })
          .limit(10);
        const newsletterRes = await supabase
          .from("newsletter_subscriptions")
          .select("id, created_at, email, source, path, referrer, user_agent, status")
          .order("created_at", { ascending: false })
          .limit(10);
        const adminsRes = await supabase
          .from("profiles")
          .select("id, created_at, email, full_name, role")
          .eq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(10);

        // Load current admin profile for header and edit modal
        let meProfile: any = null;
        if (userId) {
          const { data: me } = await supabase
            .from("profiles")
            .select("id, created_at, email, full_name, phone, role")
            .eq("id", userId)
            .maybeSingle();
          meProfile = me || null;
        }

        if (isMounted) {
          setVisitsCount(visitsRes.count ?? 0);
          setServicesCount(servicesRes.count ?? 0);
          setUsersCount(usersRes.count ?? 0);
          setAccountBalance(balanceSum);
          setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
          setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
          setNewsletterSubs(Array.isArray(newsletterRes.data) ? newsletterRes.data : []);
          setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
          setCurrentAdminProfile(meProfile);
          setContactsLoading(false);
          setNewsletterLoading(false);
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
    { id: "contacts", label: "Contacts", icon: Mail },
    { id: "blogs", label: "Blogs", icon: BookOpen },
    { id: "website", label: "Website UI", icon: Settings },
    { id: "finance", label: "Finance", icon: CreditCard },
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
            <Button
              variant="ghost"
              className="text-white/80 hover:bg-white/10 h-8 px-2"
              onClick={async () => { 
                try {
                  if (userId) {
                    const { data: me } = await supabase
                      .from("profiles")
                      .select("id, created_at, email, full_name, phone, role")
                      .eq("id", userId)
                      .maybeSingle();
                    setCurrentAdminProfile(me || null);
                  }
                } catch {}
                setProfileEditOpen(true);
              }}
            >
              Admin User
            </Button>
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
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl" onClick={() => { setVisitsDialogOpen(true); loadVisitsAggregated(); }}>
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
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl" onClick={() => { setActiveTab("membership"); setMembershipTab("users"); }}>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Total Users</CardDescription>
                      <CardTitle className="text-3xl">{usersCount ?? "-"}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl" onClick={() => { setActiveTab("finance"); loadFinance(); }}>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Account Balance</CardDescription>
                      <CardTitle className="text-3xl">{formatCurrency(accountBalance)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Contact List</CardTitle>
                      <CardDescription>Latest newsletter signups</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setNewsletterModalOpen(true)} aria-label="See more">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {newsletterLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between border-b pb-2">
                            <div className="space-y-2">
                              <div className="h-4 w-40 bg-muted rounded" />
                              <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                            <div className="h-3 w-24 bg-muted rounded" />
                          </div>
                        ))}
                      </div>
                    ) : newsletterSubs.length === 0 ? (
                      <p className="text-muted-foreground">No newsletter subscriptions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {newsletterSubs.slice(0,5).map((n) => (
                          <div key={n.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <div className="font-medium">{n.name ?? n.email}</div>
                              <div className="text-sm text-muted-foreground">{n.source ?? "website"}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
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
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                              <Button variant="ghost" size="icon" onClick={() => { setBookingPreviewItem(b); setBookingPreviewOpen(true); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
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
                    {/* Transparent 'Me' card to signify current logged-in admin */}
                    {currentAdminProfile ? (
                      <div className="flex items-center justify-between rounded border border-dashed bg-transparent p-2 mb-3">
                        <div className="font-medium">
                          {currentAdminProfile.full_name ?? currentAdminProfile.email ?? email ?? "Me"}
                          <Badge variant="outline" className="ml-2">Me</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{new Date(currentAdminProfile.created_at).toLocaleString()}</div>
                      </div>
                    ) : null}
                    {admins.length === 0 ? (
                      <p className="text-muted-foreground">No admins found.</p>
                    ) : (
                      <div className="space-y-2">
                        {admins.map((a) => (
                          <div key={a.id} className="flex items-center justify-between border-b pb-2">
                            <div className="font-medium">
                              {a.full_name ?? a.email}
                              {userId && a.id === userId ? (<Badge variant="outline" className="ml-2">Me</Badge>) : null}
                            </div>
                            <div className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            )}

            {activeTab === "contacts" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-primary">Contacts (Newsletter Subscriptions)</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <Input placeholder="Search name or email..." value={contactsSearch} onChange={(e)=> setContactsSearch(e.target.value)} className="w-full sm:w-64" />
                  <div className="flex items-center gap-2">
                    <Select value={contactsStatusFilter} onValueChange={setContactsStatusFilter}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => { setContactsStatusFilter("all"); setContactsSearch(""); }}>Reset</Button>
                    <Button variant="outline" onClick={() => exportToCsv(contacts.map(c => ({ id: c.id, email: c.email, source: c.source, path: c.path, referrer: c.referrer, user_agent: c.user_agent, status: c.status, created_at: c.created_at })), "contacts.csv")}>Export CSV</Button>
                    <Button onClick={() => setBulkEmailOpen(true)}>Bulk Email</Button>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {contactsLoading ? (
                      <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="grid grid-cols-6 gap-2 items-center">
                            <div className="h-4 bg-muted rounded col-span-2" />
                            <div className="h-4 bg-muted rounded col-span-2" />
                            <div className="h-4 bg-muted rounded col-span-1" />
                            <div className="h-4 bg-muted rounded col-span-1" />
                          </div>
                        ))}
                      </div>
                    ) : contacts.length === 0 ? (
                      <p className="text-muted-foreground">No newsletter subscriptions found.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Select</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts
                            .filter((c)=> (c.email||"").toLowerCase().includes(contactsSearch.toLowerCase()))
                            .filter((c)=> contactsStatusFilter === "all" ? true : (c.status||"active") === contactsStatusFilter)
                            .map((c) => (
                              <TableRow key={c.id}>
                                <TableCell>
                                  <input type="checkbox" checked={selectedContacts.has(c.id)} onChange={(e)=>{ const next = new Set(selectedContacts); if (e.target.checked) next.add(c.id); else next.delete(c.id); setSelectedContacts(next); }} />
                                </TableCell>
                                <TableCell>{c.email}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{c.source || "-"}</TableCell>
                                <TableCell className="max-w-[280px] truncate">{c.path || "-"}</TableCell>
                                <TableCell>
                                  <Badge className={(c.status === "active") ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{c.status || "active"}</Badge>
                                </TableCell>
                                <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <label className="inline-flex items-center gap-2 text-xs">
                                      <input type="checkbox" checked={(c.status||"active") === "unsubscribed"} onChange={async (e)=>{ try { await supabase.from("newsletter_subscriptions").update({ status: e.target.checked ? "unsubscribed" : "active" }).eq("id", c.id); const { data } = await supabase
                                        .from("newsletter_subscriptions")
                                        .select("id, created_at, email, source, path, referrer, user_agent, status")
                                        .order("created_at", { ascending: false }); setContacts(data || []); } catch (err:any) { toast({ title:"Error", description: err?.message ?? "Unknown error", variant:"destructive" }); } }} />
                                      Unsubscribed
                                    </label>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-xl ring-1 ring-border overflow-hidden">
                            <div className="aspect-[16/9] bg-muted" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-muted rounded w-2/3" />
                              <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
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
                        <Label htmlFor="svc-images">Images</Label>
                        <Input type="file" id="svc-images" multiple accept="image/*" onChange={(e) => setServiceImageFiles(Array.from(e.target.files || []))} />
                        <p className="text-xs text-muted-foreground">You can select multiple images to upload. If none selected, optionally paste URLs below.</p>
                        <Textarea id="svc-images-fallback" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={3} placeholder="Optional: comma-separated image URLs" />
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
              {/* Newsletter Bulk Email Dialog moved to global mount */}
              </div>
            )}

            {activeTab === "venues" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-primary">Featured Venues</h2>
                  <Button onClick={openCreateVenue}>Add Venue</Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {loadingVenues ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-xl ring-1 ring-border overflow-hidden">
                            <div className="aspect-[16/9] bg-muted" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-muted rounded w-2/3" />
                              <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : venues.length === 0 ? (
                      <p className="text-muted-foreground">No venues found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {venues.map((v) => (
                          <div key={v.id} className="relative group overflow-hidden rounded-xl ring-1 ring-border">
                            <div className="aspect-[16/9] bg-muted">
                              {v.images?.[0] ? (
                                <img src={v.images[0]} alt={v.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className={`absolute top-3 left-3 rounded-full ${v.hidden ? "bg-yellow-600/90" : "bg-green-600/90"} text-white text-xs px-2 py-0.5`}>{v.hidden ? "Hidden" : "Shown"}</span>
                            <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between">
                              <div>
                                <div className="text-white font-semibold drop-shadow-md">{v.name}</div>
                                <div className="text-white/80 text-xs">{v.category}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => openEditVenue(v)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => toggleVenueHidden(v)}>
                                  {v.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-300 hover:bg-red-500/20">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete venue?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove the venue.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteVenue(v.id)}>Delete</AlertDialogAction>
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

                <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingVenue ? "Edit Venue" : "Add Venue"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input value={venueForm.category} onChange={(e) => setVenueForm({ ...venueForm, category: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Short Description</Label>
                        <Textarea value={venueForm.short_description} onChange={(e) => setVenueForm({ ...venueForm, short_description: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Detailed Description</Label>
                        <Textarea value={venueForm.detailed_description} onChange={(e) => setVenueForm({ ...venueForm, detailed_description: e.target.value })} rows={6} />
                      </div>
                      <div className="space-y-2">
                        <Label>Niche</Label>
                        <Input value={venueForm.niche} onChange={(e) => setVenueForm({ ...venueForm, niche: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Weekday Hours</Label>
                        <Input value={venueForm.weekday_hours} onChange={(e) => setVenueForm({ ...venueForm, weekday_hours: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sunday Hours</Label>
                        <Input value={venueForm.sunday_hours} onChange={(e) => setVenueForm({ ...venueForm, sunday_hours: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Map URL</Label>
                        <Input value={venueForm.map_url} onChange={(e) => setVenueForm({ ...venueForm, map_url: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Images</Label>
                        <Input type="file" multiple accept="image/*" onChange={(e) => setVenueImageFiles(Array.from(e.target.files || []))} />
                        <p className="text-xs text-muted-foreground">Select multiple images to upload. If none selected, you can paste URLs below.</p>
                        <Textarea value={venueForm.images} onChange={(e) => setVenueForm({ ...venueForm, images: e.target.value })} rows={3} placeholder="Optional: comma-separated image URLs" />
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Switch id="venue-hidden" checked={venueForm.hidden} onCheckedChange={(v) => setVenueForm({ ...venueForm, hidden: v })} />
                        <Label htmlFor="venue-hidden">Hidden</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVenueDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveVenue}>{editingVenue ? "Save changes" : "Create venue"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Users list when on Membership > All Users */}
            {/* Users tab content moved inside TabsContent 'users' */}






            {activeTab === "membership" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-primary">Membership</h2>
                  <Button variant="outline" onClick={() => setMembershipDialogOpen(true)}>Membership Navigation</Button>
                </div>
                <Tabs value={membershipTab} onValueChange={setMembershipTab}>
                  <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="users">All Users</TabsTrigger>
                    <TabsTrigger value="invited">Invited</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="va">Virtual Assistance</TabsTrigger>
                  </TabsList>
                  <TabsContent value="members">
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <Input placeholder="Search members (name or email)..." value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} className="w-full sm:w-64" />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setBulkAudience("members"); setBulkUsersOpen(true); }}>Bulk Email</Button>
                          </div>
                        </div>
                        {usersLoading ? (
                          <div className="text-muted-foreground">Loading members…</div>
                        ) : users.filter((u)=>u.role==="member").length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No members in this tab.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.filter((u)=>u.role==="member").filter((u)=> (u.full_name||"").toLowerCase().includes(usersSearch.toLowerCase()) || (u.email||"").toLowerCase().includes(usersSearch.toLowerCase())).map((u)=>(
                                <TableRow key={u.id}>
                                  <TableCell>{u.full_name || "-"}</TableCell>
                                  <TableCell>{u.email || "-"}</TableCell>
                                  <TableCell>{u.phone || "-"}</TableCell>
                                  <TableCell>{userActivePlan[u.id] || "-"}</TableCell>
                                  <TableCell>
                                    <Select value={u.role} onValueChange={(v) => openRoleChangeConfirm(u, v)}>
                                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">admin</SelectItem>
                                        <SelectItem value="member">member</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => { setSingleEmailRecipient(u); setSingleEmailSubject(""); setSingleEmailBody(""); setSingleEmailOpen(true); }} title="Send Email">
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="admins">
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <Input placeholder="Search admins (name or email)..." value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} className="w-full sm:w-64" />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setBulkAudience("admins"); setBulkUsersOpen(true); }}>Bulk Email</Button>
                          </div>
                        </div>
                        {usersLoading ? (
                          <div className="text-muted-foreground">Loading admins…</div>
                        ) : users.filter((u)=>u.role==="admin").length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No admins in this tab.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.filter((u)=>u.role==="admin").filter((u)=> (u.full_name||"").toLowerCase().includes(usersSearch.toLowerCase()) || (u.email||"").toLowerCase().includes(usersSearch.toLowerCase())).map((u)=>(
                                <TableRow key={u.id}>
                                  <TableCell>
                                    {u.full_name || "-"}
                                    {userId && u.id === userId ? (<Badge variant="outline" className="ml-2">Me</Badge>) : null}
                                  </TableCell>
                                  <TableCell>{u.email || "-"}</TableCell>
                                  <TableCell>{u.phone || "-"}</TableCell>
                                  <TableCell>
                                    <Select value={u.role} onValueChange={(v) => openRoleChangeConfirm(u, v)}>
                                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">admin</SelectItem>
                                        <SelectItem value="member">member</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => { setSingleEmailRecipient(u); setSingleEmailSubject(""); setSingleEmailBody(""); setSingleEmailOpen(true); }} title="Send Email">
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="users">
                    {/* Metrics and actions toolbar for All Users */}
                    <div className="space-y-6 mt-4">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Input placeholder="Search users (name or email)..." value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} className="w-full sm:w-64" />
                        <div className="flex gap-2">
                          <Button onClick={() => setNewUserOpen(true)}>New User</Button>
                          <Button onClick={() => setBulkUsersOpen(true)} variant="outline">Bulk Email</Button>
                        </div>
                      </div>
                      <Card>
                        <CardContent className="pt-6">
                          {usersLoading ? (
                            <div className="animate-pulse space-y-3">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-5 gap-3">
                                  <div className="h-4 bg-muted rounded" />
                                  <div className="h-4 bg-muted rounded" />
                                  <div className="h-4 bg-muted rounded" />
                                  <div className="h-8 bg-muted rounded w-36" />
                                  <div className="h-4 bg-muted rounded" />
                                </div>
                              ))}
                            </div>
                          ) : users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No users found in this tab.</div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Joined</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {users
                                  .filter((u) => (u.full_name || "").toLowerCase().includes(usersSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(usersSearch.toLowerCase()))
                                  .map((u) => (
                                    <TableRow key={u.id}>
                                      <TableCell>{u.full_name || "-"}</TableCell>
                                      <TableCell>{u.email || "-"}</TableCell>
                                      <TableCell>{u.phone || "-"}</TableCell>
                                      <TableCell>
                                        <Select value={u.role} onValueChange={(v) => openRoleChangeConfirm(u, v)}>
                                          <SelectTrigger className="w-36">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="admin">admin</SelectItem>
                                            <SelectItem value="member">member</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button variant="ghost" size="icon" onClick={() => { setSingleEmailRecipient(u); setSingleEmailSubject(""); setSingleEmailBody(""); setSingleEmailOpen(true); }} title="Send Email">
                                            <Mail className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => { setUserToDelete(u); setDeleteUserDialogOpen(true); }} title="Delete User">
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="invited">
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                          <Input placeholder="Search invited (name or email)..." value={invitedSearch} onChange={(e) => setInvitedSearch(e.target.value)} className="w-full sm:w-64" />
                          <div className="text-sm text-muted-foreground">Total Invited: {invitedUsers.length}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-4">
                          Share the temporary password with the invitee and remind them to log in and change it.
                        </div>
                        {invitedLoading ? (
                          <div className="text-muted-foreground">Loading invited…</div>
                        ) : invitedUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No invited users.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Temp Password</TableHead>
                                <TableHead>Pending Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Invited</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invitedUsers
                                .filter((u) => (u.full_name || "").toLowerCase().includes(invitedSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(invitedSearch.toLowerCase()))
                                .map((u) => (
                                  <TableRow key={u.id}>
                                    <TableCell>{u.full_name || "-"}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.phone || "-"}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs">{u.temp_password || "-"}</span>
                                        {u.temp_password ? (
                                          <Button variant="ghost" size="icon" title="Copy password" onClick={async () => { try { await navigator.clipboard.writeText(u.temp_password); setCopiedInviteId(u.id); toast({ title: "Copied", description: "Temporary password copied to clipboard" }); setTimeout(() => setCopiedInviteId(null), 1500); } catch {} }}>
                                            {copiedInviteId === u.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                          </Button>
                                        ) : null}
                                      </div>
                                    </TableCell>
                                    <TableCell>{u.pending_role}</TableCell>
                                    <TableCell>{u.status}</TableCell>
                                    <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => markPasswordUpdated(u.id)} disabled={u.status !== "invited"}>Mark Password Updated</Button>
                                        <Button variant="default" size="sm" onClick={() => activateInvitedUser(u)} disabled={u.status === "activated"}>Activate</Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="bookings">
                    <Card>
                      <CardContent className="pt-6">
                        {/* Filters and actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-4">
                          <Input placeholder="Search name or email..." value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} className="w-full sm:w-64" />
                          <div className="flex flex-wrap gap-2 items-center">
                            <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="closed">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => { setSelectedBookings(new Set()); setBookingStatusFilter("all"); setBookingSearch(""); }}>Reset</Button>
                            <Button onClick={() => setBookingBulkEmailOpen(true)}>Bulk Email</Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          Status Legend:
                          <span className="ml-2 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500"></span> Pending</span>
                          <span className="ml-2 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600"></span> Resolved</span>
                        </div>
                        {bookingsLoading ? (
                          <div className="space-y-2 animate-pulse">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="grid grid-cols-8 gap-2 items-center">
                                <div className="h-4 bg-muted rounded col-span-2" />
                                <div className="h-4 bg-muted rounded col-span-2" />
                                <div className="h-4 bg-muted rounded col-span-1" />
                                <div className="h-4 bg-muted rounded col-span-1" />
                                <div className="h-4 bg-muted rounded col-span-1" />
                                <div className="h-4 bg-muted rounded col-span-1" />
                              </div>
                            ))}
                          </div>
                        ) : bookings.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No bookings yet.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Select</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Short Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(bookings.filter((b)=> (b.name||b.email||"").toLowerCase().includes(bookingSearch.toLowerCase()))
                                .filter((b)=> bookingStatusFilter === "all" ? true : (b.status||"pending") === bookingStatusFilter)).map((b) => (
                                <TableRow key={b.id}>
                                  <TableCell>
                                    <input type="checkbox" checked={selectedBookings.has(b.id)} onChange={(e)=>{
                                      const next = new Set(selectedBookings);
                                      if (e.target.checked) next.add(b.id); else next.delete(b.id);
                                      setSelectedBookings(next);
                                    }} />
                                  </TableCell>
                                  <TableCell>{b.name || b.email}</TableCell>
                                  <TableCell>{b.email}</TableCell>
                                  <TableCell>{b.service || "-"}</TableCell>
                                  <TableCell className="max-w-[280px] truncate">{b.message || "-"}</TableCell>
                                  <TableCell>
                                    <Badge className={(b.status === "closed") ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{b.status || "pending"}</Badge>
                                  </TableCell>
                                  
                                  <TableCell>{new Date(b.created_at).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" title="Preview" onClick={() => { setBookingPreviewItem(b); setBookingPreviewOpen(true); }}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" title="Email" onClick={() => { const subject = encodeURIComponent("Regarding your booking"); const body = encodeURIComponent("Hello,\n\nWe are following up on your request."); window.location.href = `mailto:${b.email}?subject=${subject}&body=${body}`; }}>
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                      <label className="inline-flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={(b.status||"pending") === "closed"} onChange={async (e)=>{ try { await supabase.from("concierge_requests").update({ status: e.target.checked ? "closed" : "pending" }).eq("id", b.id); await loadBookings(); } catch (err:any) { toast({ title:"Error", description: err?.message ?? "Unknown error", variant:"destructive" }); } }} />
                                        Resolved
                                      </label>
                                      <Button variant="destructive" size="icon" title="Delete" onClick={async () => { try { await supabase.from("concierge_requests").delete().eq("id", b.id); await loadBookings(); toast({ title: "Deleted", description: "Booking deleted" }); } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); } }}>
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                    {/* Bulk Email to Bookings Dialog */}
                    <Dialog open={bookingBulkEmailOpen} onOpenChange={setBookingBulkEmailOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Email to Bookings</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Label>Subject</Label>
                          <Input value={bulkBookingSubject} onChange={(e) => setBulkBookingSubject(e.target.value)} placeholder="Subject" />
                          <Label>Message</Label>
                          <Textarea value={bulkBookingBody} onChange={(e) => setBulkBookingBody(e.target.value)} placeholder="Write your email..." />
                          <p className="text-sm text-muted-foreground">Recipients: {selectedBookings.size || bookings.length} {selectedBookings.size ? "(selected)" : "(all)"}</p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBookingBulkEmailOpen(false)}>Cancel</Button>
                          <Button onClick={async () => {
                            try {
                              const recipients = (selectedBookings.size ? bookings.filter(b => selectedBookings.has(b.id)) : bookings).map(b => ({ email: b.email, name: b.name || null }));
                              const { data: campaign } = await supabase.from("email_campaigns").insert({ subject: bulkBookingSubject, body: bulkBookingBody, status: "draft" }).select("id").maybeSingle();
                              if (campaign?.id) {
                                await supabase.from("email_campaign_recipients").insert(recipients.map(r => ({ campaign_id: campaign.id, email: r.email, name: r.name })));
                              }
                              toast({ title: "Campaign saved", description: "Recipients added." });
                              setBookingBulkEmailOpen(false);
                              setBulkBookingSubject("");
                              setBulkBookingBody("");
                              setSelectedBookings(new Set());
                            } catch (e: any) {
                              toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                            }
                          }}>Save Campaign</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {/* Booking Preview Dialog moved to global mount */}
                  </TabsContent>
                  <TabsContent value="va">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <Input placeholder="Search name or email..." value={vaSearch} onChange={(e) => setVaSearch(e.target.value)} className="w-full sm:w-64" />
                          <div className="flex items-center gap-2">
                            <Select value={vaStatusFilter} onValueChange={setVaStatusFilter}>
                              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="closed">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => { setSelectedVa(new Set()); setVaStatusFilter("all"); setVaSearch(""); }}>Reset</Button>
                          </div>
                        </div>
                        {vaRequests.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No virtual assistance requests yet.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Select</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Short Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(vaRequests
                                .filter((r)=> (r.name||r.email||"").toLowerCase().includes(vaSearch.toLowerCase()))
                                .filter((r)=> vaStatusFilter === "all" ? true : (r.status||"pending") === vaStatusFilter)
                              ).map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell>
                                    <input type="checkbox" checked={selectedVa.has(r.id)} onChange={(e)=>{ const next = new Set(selectedVa); if (e.target.checked) next.add(r.id); else next.delete(r.id); setSelectedVa(next); }} />
                                  </TableCell>
                                  <TableCell>{r.name || r.email}</TableCell>
                                  <TableCell>{r.email}</TableCell>
                                  <TableCell>{r.topic || "-"}</TableCell>
                                  <TableCell className="max-w-[280px] truncate">{r.details || "-"}</TableCell>
                                  <TableCell>
                                    <Badge className={(r.status === "closed") ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{r.status || "pending"}</Badge>
                                  </TableCell>
                                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" title="Preview" onClick={() => { setBookingPreviewItem(r); setBookingPreviewOpen(true); }}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" title="Email" onClick={() => { const subject = encodeURIComponent("Regarding your request"); const body = encodeURIComponent("Hello,\n\nWe are following up on your request."); window.location.href = `mailto:${r.email}?subject=${subject}&body=${body}`; }}>
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                      <label className="inline-flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={(r.status||"pending") === "closed"} onChange={async (e)=>{ try { await supabase.from("virtual_assistance_requests").update({ status: e.target.checked ? "closed" : "pending" }).eq("id", r.id); await loadVaRequests(); } catch (err:any) { toast({ title:"Error", description: err?.message ?? "Unknown error", variant:"destructive" }); } }} />
                                        Resolved
                                      </label>
                                      <Button variant="destructive" size="icon" title="Delete" onClick={async () => { try { await supabase.from("virtual_assistance_requests").delete().eq("id", r.id); await loadVaRequests(); toast({ title: "Deleted", description: "Request deleted" }); } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); } }}>
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                {/* Newsletter & Contact Dialogs moved to global mount */}
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

            {activeTab === "finance" && (
              <div className="space-y-6">
                {/* Finance content only */}
                {/* Finance summary and tables render below; removed misplaced membership UI */}
              </div>
            )}

            {activeTab === "blogs" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-3xl font-bold text-primary">Blogs</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Input placeholder="Search blogs..." value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)} className="w-full sm:w-64" />
                    <Select value={blogCategory} onValueChange={(v) => setBlogCategory(v)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {Array.from(new Set(blogs.map((b) => b.category).filter(Boolean))).map((cat) => (
                          <SelectItem key={String(cat)} value={String(cat)}>{String(cat)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={openCreateBlog} className="bg-primary text-primary-foreground hover:bg-primary/90">Add Blog</Button>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {loadingBlogs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-xl ring-1 ring-border overflow-hidden">
                            <div className="aspect-[16/9] bg-muted" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-muted rounded w-2/3" />
                              <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : blogs.length === 0 ? (
                      <p className="text-muted-foreground">No blogs found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs
                          .filter((b) => (blogCategory === "all" || (b.category || "") === blogCategory))
                          .filter((b) => b.title.toLowerCase().includes(blogSearch.toLowerCase()) || (b.excerpt || "").toLowerCase().includes(blogSearch.toLowerCase()))
                          .map((b) => (
                            <div key={b.id} className="relative group overflow-hidden rounded-xl ring-1 ring-border">
                              <div className="aspect-[16/9] bg-muted">
                                {b.image ? (
                                  <img src={b.image} alt={b.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between">
                                <div>
                                  <div className="text-white font-semibold drop-shadow-md">{b.title}</div>
                                  <div className="text-white/80 text-xs">{b.category || "Uncategorized"}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" className="text-white hover:bg_white/20" onClick={() => openEditBlog(b)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-red-300 hover:bg-red-500/20">
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete blog?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently remove the blog post.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteBlog(b.id)}>Delete</AlertDialogAction>
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

                <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBlog ? "Edit Blog" : "Add Blog"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Excerpt</Label>
                        <Textarea value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Content</Label>
                        <Textarea value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} rows={6} />
                      </div>
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input value={blogForm.author} onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date (YYYY-MM-DD)</Label>
                        <Input value={blogForm.date} onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Featured Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setBlogImageFile((e.target.files && e.target.files[0]) || null)} />
                        <p className="text-xs text-muted-foreground">Upload an image. If not uploaded, you can paste a URL below.</p>
                        <Input value={blogForm.image} onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })} placeholder="Optional: image URL" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBlogDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveBlog}>{editingBlog ? "Save changes" : "Create blog"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {["website", "subscription", "media", "others"].includes(activeTab) && (
              <div className="space-y-6">
                {activeTab === "website" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-primary">Website UI</h2>
                    </div>
                    <Tabs value={websiteTab} onValueChange={setWebsiteTab}>
                      <TabsList>
                        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                        <TabsTrigger value="contact">Contact Info</TabsTrigger>
                        <TabsTrigger value="social">Social Links</TabsTrigger>
                      </TabsList>
                      <TabsContent value="testimonials">
                        <div className="flex justify-end">
                          <Button onClick={openAddTestimonial}>Add Testimonial</Button>
                        </div>
                        <Card>
                          <CardContent className="pt-6">
                            {testimonials.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">No testimonials yet.</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {testimonials.map((t) => (
                                  <div key={t.id} className="rounded-xl ring-1 ring-border p-4 space-y-2">
                                    <div className="font-semibold flex items-center justify-between">
                                      <span>{t.name}</span>
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditTestimonial(t)}>Edit</Button>
                                        <Button size="sm" variant="destructive" onClick={() => deleteTestimonial(t.id)}>Delete</Button>
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{t.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Name</Label><Input value={testimonialForm.name} onChange={(e)=> setTestimonialForm({ ...testimonialForm, name: e.target.value })} /></div>
                              <div className="space-y-2 md:col-span-2"><Label>Content</Label><Textarea value={testimonialForm.content} onChange={(e)=> setTestimonialForm({ ...testimonialForm, content: e.target.value })} rows={4} /></div>
                              <div className="space-y-2 md:col-span-2"><Label>Image</Label><Input type="file" accept="image/*" onChange={(e)=> setBlogImageFile((e.target.files && e.target.files[0]) || null)} /></div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={()=> setTestimonialDialogOpen(false)}>Cancel</Button>
                              <Button onClick={saveTestimonial}>{editingTestimonial ? "Save Changes" : "Save"}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TabsContent>
                      <TabsContent value="contact">
                        <Card>
                          <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2"><Label>Address</Label><Input value={contactInfo.address} onChange={(e)=> setContactInfo({ ...contactInfo, address: e.target.value })} /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {contactInfo.emails.map((em, idx)=>(
                                <Input key={idx} placeholder={`Email ${idx+1}`} value={em} onChange={(e)=> { const arr=[...contactInfo.emails]; arr[idx]=e.target.value; setContactInfo({ ...contactInfo, emails: arr }); }} />
                              ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {contactInfo.phones.map((ph, idx)=>(
                                <Input key={idx} placeholder={`Phone ${idx+1}`} value={ph} onChange={(e)=> { const arr=[...contactInfo.phones]; arr[idx]=e.target.value; setContactInfo({ ...contactInfo, phones: arr }); }} />
                              ))}
                            </div>
                            <div className="flex justify-end"><Button onClick={async ()=> {
                              try {
                                const { data } = await supabase.from("contact_info").select("id").limit(1);
                                if (data && data.length > 0) {
                                  await supabase.from("contact_info").update({ address: contactInfo.address, emails: contactInfo.emails, phones: contactInfo.phones }).eq("id", data[0].id);
                                } else {
                                  await supabase.from("contact_info").insert({ address: contactInfo.address, emails: contactInfo.emails, phones: contactInfo.phones });
                                }
                                await loadContactInfoData();
                                toast({ title: "Saved", description: "Contact info updated" });
                              } catch (e: any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
                            }}>Save</Button></div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="social">
                        <Card>
                          <CardContent className="pt-6 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries({ facebook:"Facebook", instagram:"Instagram", twitter:"Twitter", linkedin:"LinkedIn", youtube:"YouTube" }).map(([key,label])=> (
                                <div key={key} className="space-y-2"><Label>{label}</Label><Input value={(socialLinks as any)[key] || ""} onChange={(e)=> setSocialLinks({ ...socialLinks, [key]: e.target.value })} /></div>
                              ))}
                            </div>
                            <div className="flex justify-end"><Button onClick={async ()=> {
                              try {
                                const { data } = await supabase.from("social_links").select("id").limit(1);
                                if (data && data.length > 0) {
                                  await supabase.from("social_links").update(socialLinks).eq("id", data[0].id);
                                } else {
                                  await supabase.from("social_links").insert(socialLinks);
                                }
                                await loadSocialLinksData();
                                toast({ title: "Saved", description: "Social links updated" });
                              } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
                            }}>Save</Button></div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {activeTab === "subscription" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between"><h2 className="text-3xl font-bold text-primary">Subscription</h2><Button onClick={()=> setPlanDialogOpen(true)}>Add Plan</Button></div>
                    <div className="flex items-center gap-2"><Input placeholder="Search plans..." className="w-full sm:w-64" /></div>
                    <Card>
                      <CardContent className="pt-6">
                        {plans.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No plans yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map((p, i)=>(
                              <div key={i} className="rounded-xl ring-1 ring-border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">{p.name}</div>
                                    <div className="text-sm text-muted-foreground">{p.duration} • ₦{p.price}</div>
                                  </div>
                                  <div className="text-sm">Users: {planUserCounts[p.id] ?? 0}</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={()=> openPlanUsers(p)}>View Users</Button>
                                  <Button size="sm" onClick={()=> openAssignPlanDialog(p.id)}>Assign</Button>
                                  <Button size="sm" variant="secondary" onClick={()=> { setEditingPlan(p); setPlanDialogOpen(true); setPlanForm({ name: p.name || "", duration: p.duration || "", price: String(p.price ?? ""), coverImage: p.cover_image || "", benefits: Array.isArray(p.benefits) ? (p.benefits as string[]).join("\n") : "", showOnWebsite: !!p.show_on_website }); }}>Edit</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Dialog open={planDialogOpen} onOpenChange={(v)=>{ setPlanDialogOpen(v); if (!v) { setEditingPlan(null); } }}>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{editingPlan ? "Edit Plan" : "Add Plan"}</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Name</Label><Input value={planForm.name} onChange={(e)=> setPlanForm({ ...planForm, name: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Duration</Label><Input value={planForm.duration} onChange={(e)=> setPlanForm({ ...planForm, duration: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Price (₦)</Label><Input type="number" value={planForm.price} onChange={(e)=> setPlanForm({ ...planForm, price: e.target.value })} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Cover Image</Label><Input type="file" accept="image/*" onChange={(e)=> setBlogImageFile((e.target.files && e.target.files[0]) || null)} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Benefits</Label><Textarea value={planForm.benefits} onChange={(e)=> setPlanForm({ ...planForm, benefits: e.target.value })} rows={4} /></div>
                          <div className="flex items-center gap-2 md:col-span-2"><Switch checked={planForm.showOnWebsite} onCheckedChange={(v)=> setPlanForm({ ...planForm, showOnWebsite: v })} /><Label>Show on website</Label></div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={()=> setPlanDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async ()=>{
                            try {
                              let coverUrl = planForm.coverImage;
                              if (blogImageFile) {
                                const u = await uploadFiles([blogImageFile], "plans");
                                if (u.length) coverUrl = u[0];
                              }
                              if (editingPlan) {
                                const { error } = await supabase
                                  .from("membership_plans")
                                  .update({ name: planForm.name, duration: planForm.duration, price: Number(planForm.price), cover_image: coverUrl || null, benefits: (planForm.benefits || "").split("\n").filter(Boolean), show_on_website: !!planForm.showOnWebsite })
                                  .eq("id", editingPlan.id);
                                if (error) throw new Error(error.message);
                              } else {
                                const { error } = await supabase
                                  .from("membership_plans")
                                  .insert({ name: planForm.name, duration: planForm.duration, price: Number(planForm.price), cover_image: coverUrl || null, benefits: (planForm.benefits || "").split("\n").filter(Boolean), show_on_website: !!planForm.showOnWebsite });
                                if (error) throw new Error(error.message);
                              }
                              const { data } = await supabase
                                .from("membership_plans")
                                .select("id,name,duration,price,currency,cover_image,benefits,show_on_website,created_at")
                                .order("created_at", { ascending: false });
                              setPlans(data || []);
                              setPlanDialogOpen(false);
                              setEditingPlan(null);
                              setPlanForm({ name: "", duration: "", price: "", coverImage: "", benefits: "", showOnWebsite: true });
                            } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
                          }}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* View Users on Plan */}
                    <Dialog open={planUsersDialogOpen} onOpenChange={setPlanUsersDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Users on {selectedPlanForUsers?.name || "Plan"}</DialogTitle>
                          <DialogDescription>Manage memberships for this plan</DialogDescription>
                        </DialogHeader>
                        {planUsers.length === 0 ? (
                          <div className="text-muted-foreground">No users currently assigned to this plan.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {planUsers.map((u)=> (
                                <TableRow key={u.id}>
                                  <TableCell>{u.full_name || "-"}</TableCell>
                                  <TableCell>{u.email || "-"}</TableCell>
                                  <TableCell>{u.phone || "-"}</TableCell>
                                  <TableCell>{u.role || "user"}</TableCell>
                                  <TableCell>
                                    <Button size="sm" variant="destructive" onClick={()=> revokeMembership(u.id, selectedPlanForUsers!.id)}>Revoke</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={()=> setPlanUsersDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Assign Plan to User */}
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Plan</DialogTitle>
                          <DialogDescription>Select a user to assign this plan</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label>User</Label>
                          <Select value={assignUserId || undefined} onValueChange={setAssignUserId as any}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select user" /></SelectTrigger>
                            <SelectContent>
                              {usersBasic.map((u:any)=> (
                                <SelectItem key={u.id} value={u.id}>{u.full_name || u.email || u.id}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={()=> setAssignDialogOpen(false)}>Cancel</Button>
                          <Button onClick={assignPlanToUser}>Assign</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {activeTab === "media" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between"><h2 className="text-3xl font-bold text-primary">Media</h2><Button onClick={()=> setAssetDialogOpen(true)}>Add Asset</Button></div>
                    <Card>
                      <CardContent className="pt-6">
                        {assets.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No media assets yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assets.map((a)=>(
                              <div key={a.id} className="rounded-xl ring-1 ring-border overflow-hidden">
                                {a.type === "image" ? (<img src={a.url} alt={a.alt_text || ""} className="h-40 w-full object-cover" />) : (<div className="h-40 bg-muted flex items-center justify-center">Video</div>)}
                                <div className="p-3 text-sm text-muted-foreground">{a.page_slug || "-"}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Type</Label>
                            <Select value={assetForm.type} onValueChange={(v)=> setAssetForm({ ...assetForm, type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="image">image</SelectItem><SelectItem value="video">video</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>Page Slug</Label><Input value={assetForm.page_slug} onChange={(e)=> setAssetForm({ ...assetForm, page_slug: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Alt Text</Label><Input value={assetForm.alt_text} onChange={(e)=> setAssetForm({ ...assetForm, alt_text: e.target.value })} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>File</Label><Input type="file" onChange={(e)=> setAssetForm({ ...assetForm, file: (e.target.files && e.target.files[0]) || null })} /></div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={()=> setAssetDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async ()=> {
                            try {
                              let url = assetForm.url;
                              if (assetForm.file) {
                                const u = await uploadFiles([assetForm.file], "media_assets");
                                if (u.length) url = u[0];
                              }
                              const { data } = await supabase.from("media_assets").insert({ type: assetForm.type, url, page_slug: assetForm.page_slug || null, alt_text: assetForm.alt_text || null }).select("id");
                              toast({ title: "Asset added" });
                              setAssetDialogOpen(false);
                              setAssetForm({ type: "image", page_slug: "", alt_text: "", file: null, url: "" });
                            } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); }
                          }}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {activeTab === "others" && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-primary">Others</h2>
                    <Tabs value={othersTab} onValueChange={setOthersTab}>
                      <TabsList>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                        <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
                        <TabsTrigger value="pages">Pages</TabsTrigger>
                      </TabsList>
                      <TabsContent value="faq">
                        <div className="flex justify-end mb-3"><Button onClick={openAddFaq}>Add FAQ</Button></div>
                        <Card>
                          <CardContent className="pt-6">
                            {faqs.length === 0 ? (<div className="text-center py-8 text-muted-foreground">No FAQs yet.</div>) : (
                              <div className="space-y-3">
                                {faqs.map((f)=>(
                                  <div key={f.id} className="rounded-xl ring-1 ring-border p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="font-semibold">{f.question}</div>
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditFaq(f)}>Edit</Button>
                                        <Button size="sm" variant="destructive" onClick={() => deleteFaq(f.id)}>Delete</Button>
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{f.answer}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div className="space-y-2"><Label>Question</Label><Input value={faqForm.question} onChange={(e)=> setFaqForm({ ...faqForm, question: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Answer</Label><Textarea value={faqForm.answer} rows={4} onChange={(e)=> setFaqForm({ ...faqForm, answer: e.target.value })} /></div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={()=> setFaqDialogOpen(false)}>Cancel</Button>
                              <Button onClick={saveFaq}>{editingFaq ? "Save Changes" : "Save"}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TabsContent>
                      
                      <TabsContent value="vouchers">
                        <div className="flex justify-end mb-3"><Button onClick={openAddVoucher}>Add Voucher</Button></div>
                        <Card>
                          <CardContent className="pt-6">
                            {vouchers.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">No vouchers found.</div>
                            ) : (
                              <div className="space-y-3">
                                {vouchers.map((v) => (
                                  <div key={v.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm items-center">
                                    <div className="font-medium">{v.code}</div>
                                    <div>{v.type}</div>
                                    <div>{typeof v.value === "number" ? `₦${Number(v.value).toLocaleString()}` : v.value} {v.currency}</div>
                                    <div className="text-muted-foreground">{v.usage_count ?? 0}/{v.usage_limit ?? "-"}</div>
                                    <div className="text-muted-foreground">{v.is_active ? "Active" : "Inactive"}</div>
                                    <div className="text-muted-foreground">{v.valid_to ? new Date(v.valid_to).toLocaleDateString() : "-"}</div>
                                    <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="outline" onClick={() => openEditVoucher(v)}>Edit</Button>
                                      <Button size="sm" variant="destructive" onClick={() => deleteVoucher(v.id)}>Delete</Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{editingVoucher ? "Edit Voucher" : "Add Voucher"}</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Code</Label><Input value={voucherForm.code} onChange={(e)=> setVoucherForm({ ...voucherForm, code: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Type</Label>
                                <Select value={voucherForm.type} onValueChange={(v)=> setVoucherForm({ ...voucherForm, type: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="fixed">fixed</SelectItem><SelectItem value="percent">percent</SelectItem></SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2"><Label>Value</Label><Input type="number" value={voucherForm.value} onChange={(e)=> setVoucherForm({ ...voucherForm, value: Number(e.target.value) })} /></div>
                              <div className="space-y-2"><Label>Currency</Label><Input value={voucherForm.currency} onChange={(e)=> setVoucherForm({ ...voucherForm, currency: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Usage Limit</Label><Input type="number" value={voucherForm.usage_limit} onChange={(e)=> setVoucherForm({ ...voucherForm, usage_limit: Number(e.target.value) })} /></div>
                              <div className="space-y-2"><Label>Valid From</Label><Input type="date" value={voucherForm.valid_from} onChange={(e)=> setVoucherForm({ ...voucherForm, valid_from: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Valid To</Label><Input type="date" value={voucherForm.valid_to} onChange={(e)=> setVoucherForm({ ...voucherForm, valid_to: e.target.value })} /></div>
                              <div className="flex items-center gap-2 md:col-span-2"><Switch checked={voucherForm.is_active} onCheckedChange={(v)=> setVoucherForm({ ...voucherForm, is_active: v })} /><Label>Active</Label></div>
                              <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={voucherForm.description} rows={3} onChange={(e)=> setVoucherForm({ ...voucherForm, description: e.target.value })} /></div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={()=> setVoucherDialogOpen(false)}>Cancel</Button>
                              <Button onClick={saveVoucher}>{editingVoucher ? "Save Changes" : "Save"}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TabsContent>
                      <TabsContent value="pages">
                        <Card>
                          <CardContent className="pt-6">
                            {pagesList.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">No pages found.</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pagesList.map((p) => {
                                  const base = typeof window !== "undefined" ? window.location.origin : "";
                                  const linkPath = p.path || `/${p.slug}`;
                                  const fullUrl = `${base}${linkPath}`;
                                  return (
                                    <div key={p.id} className="rounded-xl ring-1 ring-border p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="font-semibold">{p.title}</div>
                                        <div className="text-xs text-muted-foreground">{p.is_visible ? "Visible" : "Hidden"}</div>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="text-muted-foreground">{linkPath}</div>
                                        <div className="flex gap-2">
                                          <a href={fullUrl} target="_blank" rel="noreferrer" className="text-primary text-xs">Open</a>
                                          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(fullUrl); toast({ title: "Copied", description: "Page link copied" }); }}>Copy Link</Button>
                                        </div>
                                      </div>
                                      <div className="text-sm">{p.hero_title || ""}</div>
                                      <div className="text-xs text-muted-foreground">{p.hero_subtitle || ""}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Edit Profile Dialog */}
                <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input value={profileForm.full_name} onChange={(e)=> setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={profileForm.phone} onChange={(e)=> setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={()=> setEditProfileOpen(false)}>Cancel</Button>
                      <Button onClick={async ()=>{ try { await supabase.from("profiles").update({ full_name: profileForm.full_name || null, phone: profileForm.phone || null }); toast({ title: "Profile updated" }); setEditProfileOpen(false); } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); } }}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {/* Finance tab */}
            {activeTab === "finance" && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Accounts</CardDescription>
                      <CardTitle className="text-2xl">{accounts.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-600 to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Pending Transfers</CardDescription>
                      <CardTitle className="text-2xl">{transfers.filter((t:any)=>t.status==="pending").length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-gradient-to-br from-yellow-600 to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Completed Transfers</CardDescription>
                      <CardTitle className="text-2xl">{transfers.filter((t:any)=>t.status==="completed").length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-gradient-to-br from-[hsl(var(--brand-blue))] to-black text-white ring-1 ring-white/10 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-white/80">Currencies</CardDescription>
                      <CardTitle className="text-2xl">{Array.from(new Set(accounts.map((a:any)=>a.currency))).length}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-primary">Finance</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportToCsv(accounts, "accounts.csv")}>Export Accounts</Button>
                    <Button variant="outline" onClick={() => exportToCsv(transfers, "transfers.csv")}>Export Transfers</Button>
                    <Button onClick={() => setTransferDialogOpen(true)}>Transfer Balance</Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>Summary of internal accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financeLoading ? (
                      <div className="animate-pulse space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="grid grid-cols-5 gap-3">
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                          </div>
                        ))}
                      </div>
                    ) : accounts.length === 0 ? (
                      <p className="text-muted-foreground">No accounts found.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{a.id}</TableCell>
                              <TableCell>{a.currency}</TableCell>
                              <TableCell>{formatCurrency(a.balance)}</TableCell>
                              <TableCell>{a.owner_id ?? "-"}</TableCell>
                              <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transfers</CardTitle>
                    <CardDescription>Recent account transfers</CardDescription>
                    <div className="mt-3 flex gap-2 items-center">
                      <Label>Status</Label>
                      <Select value={transferStatusFilter} onValueChange={setTransferStatusFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {financeLoading ? (
                      <div className="animate-pulse space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="grid grid-cols-7 gap-3">
                            {Array.from({ length: 7 }).map((__, j) => (
                              <div key={j} className="h-4 bg-muted rounded" />
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : transfers.length === 0 ? (
                      <p className="text-muted-foreground">No transfers found.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transfers
                        .filter((t:any)=> transferStatusFilter === "all" ? true : t.status === transferStatusFilter)
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.id}</TableCell>
                            <TableCell>{t.from_account_id ?? "-"}</TableCell>
                            <TableCell>{t.to_account_id ?? "-"}</TableCell>
                            <TableCell>{formatCurrency(t.amount)}</TableCell>
                            <TableCell>{t.status}</TableCell>
                            <TableCell>{t.reason ?? "-"}</TableCell>
                            <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Balance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Label>From Account</Label>
                      <Input value={transferForm.from} onChange={(e) => setTransferForm({ ...transferForm, from: e.target.value })} placeholder="Account ID" />
                      <Label>To Account</Label>
                      <Input value={transferForm.to} onChange={(e) => setTransferForm({ ...transferForm, to: e.target.value })} placeholder="Account ID" />
                      <Label>Amount</Label>
                      <Input type="number" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} placeholder="0.00" />
                      <Label>Reason (optional)</Label>
                      <Textarea value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Reason" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
                      <Button onClick={submitTransfer}>Submit</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Global dialogs */}
            <Dialog open={visitsDialogOpen} onOpenChange={setVisitsDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Website Visits Analytics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={visitsStartDate} onChange={(e) => setVisitsStartDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={visitsEndDate} onChange={(e) => setVisitsEndDate(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Path filter</Label>
                      <Input placeholder="e.g. /blog" value={visitsPath} onChange={(e) => setVisitsPath(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadVisitsAggregated}>Apply Filters</Button>
                    <Button variant="outline" onClick={() => exportToCsv(visitsAggregated, "website_visits.csv")}>Export CSV</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>First Visit</TableHead>
                        <TableHead>Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitsAggregated.map((row) => (
                        <TableRow key={row.ip}>
                          <TableCell>{row.ip}</TableCell>
                          <TableCell>{row.country}</TableCell>
                          <TableCell>{row.region}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell>{new Date(row.first_visit).toLocaleString()}</TableCell>
                          <TableCell>{new Date(row.last_visit).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Email to Contacts</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Subject</Label>
                  <Input value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} placeholder="Subject" />
                  <Label>Message</Label>
                  <Textarea value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} placeholder="Write your email..." />
                  <p className="text-sm text-muted-foreground">Recipients: {selectedContacts.size || contacts.length} {selectedContacts.size ? "(selected)" : "(all)"}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkEmailOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      const recipients = (selectedContacts.size ? contacts.filter(c => selectedContacts.has(c.id)) : contacts).map(c => ({ email: c.email, name: c.name || null }));
                      const { data: campaign } = await supabase.from("email_campaigns").insert({ subject: bulkSubject, body: bulkBody, status: "draft" }).select("id").maybeSingle();
                      if (campaign?.id) {
                        await supabase.from("email_campaign_recipients").insert(recipients.map(r => ({ campaign_id: campaign.id, email: r.email, name: r.name })));
                      }
                      toast({ title: "Campaign saved", description: "Recipients added." });
                      setBulkEmailOpen(false);
                      setBulkSubject("");
                      setBulkBody("");
                      setSelectedContacts(new Set());
                    } catch (e: any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Save Campaign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Bulk Email to Users Dialog */}
            <Dialog open={bulkUsersOpen} onOpenChange={setBulkUsersOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Email to Users</DialogTitle>
                  <DialogDescription>
                    Audience: {bulkAudience === "all" ? "All Users" : bulkAudience === "members" ? "Members" : "Admins"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Subject</Label>
                  <Input value={bulkUsersSubject} onChange={(e) => setBulkUsersSubject(e.target.value)} placeholder="Subject" />
                  <Label>Message</Label>
                  <Textarea value={bulkUsersBody} onChange={(e) => setBulkUsersBody(e.target.value)} placeholder="Write your email..." />
                  <p className="text-sm text-muted-foreground">
                    Recipients: {
                      users
                        .filter(u => (u.full_name || "").toLowerCase().includes(usersSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(usersSearch.toLowerCase()))
                        .filter(u => bulkAudience === "all" ? true : bulkAudience === "members" ? u.role === "member" : u.role === "admin")
                        .filter(u => !!u.email).length
                    }
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkUsersOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      const recipients = users
                        .filter(u => (u.full_name || "").toLowerCase().includes(usersSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(usersSearch.toLowerCase()))
                        .filter(u => bulkAudience === "all" ? true : bulkAudience === "members" ? u.role === "member" : u.role === "admin")
                        .filter(u => !!u.email)
                        .map(u => ({ email: u.email, name: u.full_name || null }));
                      const { data: campaign } = await supabase
                        .from("email_campaigns")
                        .insert({ subject: bulkUsersSubject, body: bulkUsersBody, status: "draft" })
                        .select("id")
                        .maybeSingle();
                      if (campaign?.id && recipients.length > 0) {
                        await supabase.from("email_campaign_recipients").insert(recipients.map(r => ({ campaign_id: campaign.id, email: r.email, name: r.name })));
                      }
                      toast({ title: "Campaign saved", description: `Recipients added: ${recipients.length}` });
                      setBulkUsersOpen(false);
                      setBulkUsersSubject("");
                      setBulkUsersBody("");
                    } catch (e: any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Save Campaign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Role Change Confirmation Dialog */}
            <Dialog open={roleConfirmOpen} onOpenChange={setRoleConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm role change</DialogTitle>
                  <DialogDescription>
                    {roleConfirmTarget ? (
                      <span>
                        Change role for <strong>{roleConfirmTarget.name}</strong> ({roleConfirmTarget.email})
                        from <strong>{roleConfirmTarget.currentRole}</strong> to <strong>{roleConfirmTarget.nextRole}</strong>?
                        {userId && roleConfirmTarget.id === userId && roleConfirmTarget.currentRole === "admin" && roleConfirmTarget.nextRole === "member" ? (
                          <>
                            {" "}This will remove your admin privileges. Ensure another admin can restore your access.
                          </>
                        ) : null}
                      </span>
                    ) : null}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRoleConfirmOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    if (!roleConfirmTarget) return;
                    await updateUserRole(roleConfirmTarget.id, roleConfirmTarget.nextRole);
                    setRoleConfirmOpen(false);
                  }}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* New User Dialog (Global) */}
            <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={newUserForm.email} onChange={(e)=> setNewUserForm({ ...newUserForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={newUserForm.full_name} onChange={(e)=> setNewUserForm({ ...newUserForm, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newUserForm.phone} onChange={(e)=> setNewUserForm({ ...newUserForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUserForm.role} onValueChange={(v)=> setNewUserForm({ ...newUserForm, role: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=> setNewUserOpen(false)}>Cancel</Button>
                  <Button onClick={async ()=>{ try {
                    const temp = Math.random().toString(36).slice(-12);
                    await supabase
                      .from("admin_added_users")
                      .insert({
                        email: newUserForm.email || null,
                        full_name: newUserForm.full_name || null,
                        phone: newUserForm.phone || null,
                        temp_password: temp,
                        pending_role: newUserForm.role,
                        invited_by: userId || null,
                        status: "invited",
                      });
                    toast({ title: "Invite recorded", description: `Temporary password: ${temp}` });
                    await loadInvitedUsers();
                    setNewUserOpen(false);
                    setNewUserForm({ email: "", full_name: "", phone: "", role: "member" }); } catch (e:any) { toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" }); } }}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Profile Edit Dialog */}
            <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your admin profile details</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profileEditForm.full_name} onChange={(e)=> setProfileEditForm({ ...profileEditForm, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={profileEditForm.phone} onChange={(e)=> setProfileEditForm({ ...profileEditForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Email</Label>
                    <Input value={profileEditForm.email} onChange={(e)=> setProfileEditForm({ ...profileEditForm, email: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=> setProfileEditOpen(false)}>Cancel</Button>
                  <Button onClick={async ()=>{
                    try {
                      if (!userId) { toast({ title: "No user", description: "Missing user id", variant: "destructive" }); return; }
                      const payload = { full_name: profileEditForm.full_name || null, phone: profileEditForm.phone || null, email: profileEditForm.email || null };
                      await supabase.from("profiles").update(payload).eq("id", userId);
                      toast({ title: "Profile updated" });
                      setCurrentAdminProfile(current => current ? { ...current, ...payload } : current);
                      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...payload } : u)));
                      setProfileEditOpen(false);
                    } catch (e:any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Single Email to User Dialog */}
            <Dialog open={singleEmailOpen} onOpenChange={setSingleEmailOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Email</DialogTitle>
                  <DialogDescription>{singleEmailRecipient?.full_name || singleEmailRecipient?.email || "Recipient"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Subject</Label>
                  <Input value={singleEmailSubject} onChange={(e) => setSingleEmailSubject(e.target.value)} placeholder="Subject" />
                  <Label>Message</Label>
                  <Textarea value={singleEmailBody} onChange={(e) => setSingleEmailBody(e.target.value)} placeholder="Write your email..." />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSingleEmailOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      if (!singleEmailRecipient?.email) { toast({ title: "No email", description: "This user has no email.", variant: "destructive" }); return; }
                      const { data: campaign } = await supabase
                        .from("email_campaigns")
                        .insert({ subject: singleEmailSubject, body: singleEmailBody, status: "draft" })
                        .select("id")
                        .maybeSingle();
                      if (campaign?.id) {
                        await supabase.from("email_campaign_recipients").insert({ campaign_id: campaign.id, email: singleEmailRecipient.email, name: singleEmailRecipient.full_name || null });
                      }
                      toast({ title: "Email saved", description: "Recipient added." });
                      setSingleEmailOpen(false);
                      setSingleEmailSubject("");
                      setSingleEmailBody("");
                      setSingleEmailRecipient(null);
                    } catch (e: any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Booking Preview Dialog (global mount) */}
            <Dialog open={bookingPreviewOpen} onOpenChange={setBookingPreviewOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Booking Preview</DialogTitle>
                  <DialogDescription>{bookingPreviewItem?.name || bookingPreviewItem?.email || "Details"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div><span className="font-medium">Email:</span> {bookingPreviewItem?.email}</div>
                  <div><span className="font-medium">Phone:</span> {bookingPreviewItem?.phone || "-"}</div>
                  <div><span className="font-medium">Type:</span> {bookingPreviewItem?.service || "-"}</div>
                  <div><span className="font-medium">Status:</span> {bookingPreviewItem?.status || "-"}</div>
                  <div><span className="font-medium">Priority:</span> {bookingPreviewItem?.priority || "-"}</div>
                  <div><span className="font-medium">Message:</span> {bookingPreviewItem?.message || "-"}</div>
                  <div className="text-muted-foreground">{bookingPreviewItem?.created_at ? new Date(bookingPreviewItem.created_at).toLocaleString() : ""}</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBookingPreviewOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Contact Preview (global mount) */}
            <Dialog open={contactPreviewOpen} onOpenChange={setContactPreviewOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact Preview</DialogTitle>
                  <DialogDescription>{contactPreviewItem?.name || contactPreviewItem?.email || "Details"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div><span className="font-medium">Email:</span> {contactPreviewItem?.email}</div>
                  <div><span className="font-medium">Phone:</span> {contactPreviewItem?.phone || "-"}</div>
                  <div><span className="font-medium">Subject:</span> {contactPreviewItem?.subject || "-"}</div>
                  <div><span className="font-medium">Status:</span> {contactPreviewItem?.status || "-"}</div>
                  <div><span className="font-medium">Message:</span> {contactPreviewItem?.message || "-"}</div>
                  <div className="text-muted-foreground">{contactPreviewItem?.created_at ? new Date(contactPreviewItem.created_at).toLocaleString() : ""}</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setContactPreviewOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Newsletter Modal with bulk email and export (global mount) */}
            <Dialog open={newsletterModalOpen} onOpenChange={setNewsletterModalOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Newsletter Subscribers</DialogTitle>
                  <DialogDescription>Manage newsletter signups: search, export, and bulk email.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-3">
                  <Input placeholder="Search email or name..." value={newsletterSearch} onChange={(e)=> setNewsletterSearch(e.target.value)} className="w-full sm:w-64" />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => { setNewsletterSearch(""); }}>Reset</Button>
                    <Button variant="outline" onClick={() => exportToCsv(newsletterSubs.map(n => ({ id: n.id, email: n.email, name: n.name, source: n.source, created_at: n.created_at })), "newsletter_subscribers.csv")}>Export CSV</Button>
                    <Button onClick={() => setNewsletterBulkEmailOpen(true)}>Bulk Email</Button>
                  </div>
                </div>
                {newsletterLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 items-center">
                        <div className="h-4 bg-muted rounded col-span-3" />
                        <div className="h-4 bg-muted rounded col-span-2" />
                        <div className="h-4 bg-muted rounded col-span-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Select</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newsletterSubs
                        .filter((n)=> ((n.email||"") + " " + (n.name||"")).toLowerCase().includes(newsletterSearch.toLowerCase()))
                        .map((n) => (
                          <TableRow key={n.id}>
                            <TableCell>
                              <input type="checkbox" checked={selectedNewsletter.has(n.id)} onChange={(e)=>{ const next = new Set(selectedNewsletter); if (e.target.checked) next.add(n.id); else next.delete(n.id); setSelectedNewsletter(next); }} />
                            </TableCell>
                            <TableCell>{n.email}</TableCell>
                            <TableCell>{n.name || "-"}</TableCell>
                            <TableCell>{n.source || "website"}</TableCell>
                            <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewsletterModalOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Newsletter Bulk Email Dialog (global mount) */}
            <Dialog open={newsletterBulkEmailOpen} onOpenChange={setNewsletterBulkEmailOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Email to Newsletter Subscribers</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Subject</Label>
                  <Input value={newsletterBulkSubject} onChange={(e) => setNewsletterBulkSubject(e.target.value)} placeholder="Subject" />
                  <Label>Message</Label>
                  <Textarea value={newsletterBulkBody} onChange={(e) => setNewsletterBulkBody(e.target.value)} placeholder="Write your email..." />
                  <p className="text-sm text-muted-foreground">Recipients: {selectedNewsletter.size || newsletterSubs.length} {selectedNewsletter.size ? "(selected)" : "(all)"}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewsletterBulkEmailOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      const recipients = (selectedNewsletter.size ? newsletterSubs.filter(n => selectedNewsletter.has(n.id)) : newsletterSubs).map(n => ({ email: n.email, name: n.name || null }));
                      const { data: campaign } = await supabase.from("email_campaigns").insert({ subject: newsletterBulkSubject, body: newsletterBulkBody, status: "draft" }).select("id").maybeSingle();
                      if (campaign?.id) {
                        await supabase.from("email_campaign_recipients").insert(recipients.map(r => ({ campaign_id: campaign.id, email: r.email, name: r.name })));
                      }
                      toast({ title: "Campaign saved", description: "Recipients added." });
                      setNewsletterBulkEmailOpen(false);
                      setNewsletterBulkSubject("");
                      setNewsletterBulkBody("");
                      setSelectedNewsletter(new Set());
                    } catch (e: any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Save Campaign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Delete User Confirmation */}
            <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete user?</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete this user? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteUserDialogOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    try {
                      if (!userToDelete?.id) return;
                      await supabase.from("profiles").delete().eq("id", userToDelete.id);
                      const next = users.filter(u => u.id !== userToDelete.id);
                      setUsers(next);
                      setUserCounts({ users: next.length, members: next.filter((u: any) => u.role === "member").length, admins: next.filter((u: any) => u.role === "admin").length });
                      setDeleteUserDialogOpen(false);
                      setUserToDelete(null);
                      toast({ title: "User deleted" });
                    } catch (e: any) {
                      toast({ title: "Error", description: e?.message ?? "Unknown error", variant: "destructive" });
                    }
                  }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
      </div>
    </div>
  );
}
