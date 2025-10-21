import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, User, ArrowRight, HelpCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className ?? ''} w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("id,title,excerpt,content,author,date,image,category")
          .order("date", { ascending: false })
          .limit(100);
        if (!error && data && isMounted) {
          setBlogs(data as any[]);
        }
      } catch {}
      if (isMounted) setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    blogs.forEach((b) => { if (b.category) set.add(b.category); });
    return Array.from(set);
  }, [blogs]);

  const featuredPost = useMemo(() => blogs[0] || null, [blogs]);
  const regularPosts = useMemo(() => (blogs.slice(1) || []), [blogs]);

  const filteredPosts = useMemo(() => {
    const posts = regularPosts;
    return posts.filter((post: any) => {
      const matchesSearch = (post.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.excerpt || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [regularPosts, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="container">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
                Insights & Stories
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Discover expert insights, industry trends, and inspiring stories from the world of premium concierge services.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {loading ? (
          <section className="py-16 bg-black">
            <div className="container">
              <div className="max-w-6xl mx-auto">
                <div className="h-64 rounded-lg bg-gray-800 animate-pulse" />
              </div>
            </div>
          </section>
        ) : !featuredPost ? (
          <section className="py-16 bg-black">
            <div className="container">
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <HelpCircle className="h-8 w-8 mb-2" />
                <p>No blog posts found.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-16 bg-black">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Featured Article</h2>
              </div>
              
              <Card className="bg-gray-900 border-gray-800 overflow-hidden max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="h-64 lg:h-auto">
                    <BlurImage src={featuredPost.image} alt={featuredPost.title} />
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-primary text-black">{featuredPost.category}</Badge>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {featuredPost.title}
                    </CardTitle>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {featuredPost.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(featuredPost.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button className="w-fit group" onClick={() => navigate(`/blog/${featuredPost.id}`)}>
                      Read Full Article
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section className="py-8 bg-gray-900">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-primary text-black" 
                    : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-16 bg-black">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Latest Articles</h2>
              <p className="text-gray-300">Stay updated with our latest insights and stories</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-lg bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No articles found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post: any) => (
                  <Card key={post.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-primary/50 transition-colors group">
                    <div className="h-48 overflow-hidden">
                      <BlurImage src={post.image} alt={post.title} />
                    </div>
                    <CardContent className="p-6">
                      <Badge className="mb-3 bg-gray-800 text-primary border-primary/20">{post.category}</Badge>
                      <CardTitle className="text-xl font-bold text-white mb-3 line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {post.author}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(post.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-primary hover:text-black hover:border-primary" onClick={() => navigate(`/blog/${post.id}`)}>
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-gradient-to-t from-black to-gray-900">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Stay Updated
              </h2>
              <p className="text-gray-300 mb-8">
                Subscribe to our newsletter and never miss our latest insights, tips, and exclusive content.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <Button
                  className="bg-primary text-black hover:bg-primary/90"
                  onClick={async () => {
                    if (!newsletterEmail) {
                      toast({ title: "Email required", description: "Please enter an email to subscribe.", variant: "destructive" });
                      return;
                    }
                    try {
                      const payload = {
                        email: newsletterEmail,
                        source: "blog",
                        path: typeof window !== "undefined" ? window.location.pathname : null,
                        referrer: typeof document !== "undefined" ? document.referrer : null,
                        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
                      };
                      await supabase.from("newsletter_subscriptions").insert([payload]);
                      try {
                        await supabase.functions.invoke("notify", {
                          body: { type: "newsletter_subscription", userEmail: newsletterEmail, data: payload },
                        });
                      } catch {}
                      toast({ title: "Subscribed", description: "You’re on the list. Thanks for subscribing!" });
                      setNewsletterEmail("");
                    } catch {
                      try {
                        await supabase.functions.invoke("notify", {
                          body: { type: "newsletter_subscription", userEmail: newsletterEmail, data: { email: newsletterEmail, source: "blog" } },
                        });
                      } catch {}
                      toast({ title: "Subscribed", description: "You’re on the list. Thanks for subscribing!" });
                      setNewsletterEmail("");
                    }
                  }}
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}