import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "wouter";

/**
 * Standardized Home button component used across all simulator pages
 * Provides consistent design, positioning, and styling for navigation back to home page
 */
export default function HomeButton() {
  return (
    <Link href="/">
      <Button 
        variant="outline" 
        size="sm"
        className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30 hover:border-blue-400/50 transition-all"
      >
        <Home className="w-4 h-4 mr-2" />
        Return Home
      </Button>
    </Link>
  );
}
