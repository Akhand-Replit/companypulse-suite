
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ 
  title, 
  subtitle, 
  centered = false, 
  className = ""
}: SectionHeadingProps) {
  return (
    <div className={cn(
      "space-y-4 max-w-3xl",
      centered ? "mx-auto text-center" : "",
      className
    )}>
      <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight page-transition-element">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-muted-foreground page-transition-element delay-100">
          {subtitle}
        </p>
      )}
    </div>
  );
}
