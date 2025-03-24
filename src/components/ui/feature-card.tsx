
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  className = ""
}: FeatureCardProps) {
  return (
    <div className={cn(
      "group relative p-6 sm:p-8 rounded-2xl bg-background border border-border",
      "hover:border-primary/20 hover:shadow-subtle transition-all duration-300",
      "page-transition-element",
      className
    )}>
      <div className="absolute -inset-px bg-gradient-to-b from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex flex-col space-y-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        
        <h3 className="text-xl font-medium">{title}</h3>
        
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
