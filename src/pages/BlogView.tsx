import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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

export default function BlogView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("id,title,excerpt,content,author,date,image,category")
          .eq("id", id)
          .single();
        if (!error && data && isMounted) {
          setBlog(data);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* Hero / Featured Image */}
        <section className="bg-black">
          <div className="container py-6">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => navigate("/blog")}> 
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Button>
          </div>
        </section>

        {loading ? (
          <section className="py-12 bg-black">
            <div className="container">
              <div className="h-64 rounded-lg bg-gray-800 animate-pulse mb-8" />
              <div className="max-w-4xl mx-auto">
                <div className="h-8 bg-gray-800 rounded animate-pulse mb-4" />
                <div className="h-4 bg-gray-800 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-800 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-800 rounded animate-pulse mb-2" />
              </div>
            </div>
          </section>
        ) : !blog ? (
          <section className="py-20 bg-black">
            <div className="container">
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <HelpCircle className="h-10 w-10 mb-3" />
                <p>Blog post not found.</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="bg-black">
              <div className="container">
                <Card className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-64 sm:h-96 w-full">
                    <BlurImage src={blog.image} alt={blog.title} />
                  </div>
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-primary text-black">{blog.category}</Badge>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center"><User className="h-4 w-4 mr-1" />{blog.author}</span>
                        <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{new Date(blog.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{blog.title}</h1>
                    {blog.excerpt && (
                      <p className="text-gray-300 mb-6 leading-relaxed">{blog.excerpt}</p>
                    )}
                    <article className="prose prose-invert max-w-none">
                      {(blog.content || "")
                        .split(/\n\n+/)
                        .map((para: string, idx: number) => (
                          <p key={idx} className="text-gray-200 leading-relaxed mb-4">{para}</p>
                        ))}
                    </article>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}