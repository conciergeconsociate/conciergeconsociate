import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

const ThankYou = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAuthenticated(true);
      setChecking(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-primary">Thank You!</h1>
          
          <div className="space-y-2 text-muted-foreground">
            {isAuthenticated ? (
              <p className="text-lg">Your payment was successful and your plan has been updated.</p>
            ) : (
              <>
                <p className="text-lg">Your payment was successful and your account has been created.</p>
                <p>We have sent a confirmation email with your login details to your inbox.</p>
              </>
            )}
          </div>

          {!checking && isAuthenticated && (
            <div className="pt-6">
              <Button asChild size="lg" className="w-full">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
