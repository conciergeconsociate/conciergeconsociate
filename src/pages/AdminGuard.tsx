import { Navigate } from "react-router-dom";
import Admin from "./Admin";
import { useAuth } from "@/hooks/useAuth";

export default function AdminGuard() {
  const { loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Admin />;
}