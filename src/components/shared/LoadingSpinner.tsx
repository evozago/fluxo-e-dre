import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "pulse";
  className?: string;
  text?: string;
}

const sizeVariants = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

function DefaultSpinner({ size = "md", className }: { size: keyof typeof sizeVariants; className?: string }) {
  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeVariants[size],
        className
      )}
      role="status"
      aria-label="Carregando..."
    />
  );
}

function DotsSpinner({ size = "md", className }: { size: keyof typeof sizeVariants; className?: string }) {
  const dotSize = size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-4 w-4";
  
  return (
    <div className={cn("flex space-x-1", className)} role="status" aria-label="Carregando...">
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "0ms" }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "150ms" }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function PulseSpinner({ size = "md", className }: { size: keyof typeof sizeVariants; className?: string }) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-full bg-primary/20",
        sizeVariants[size],
        className
      )}
      role="status"
      aria-label="Carregando..."
    />
  );
}

export function LoadingSpinner({ size = "md", variant = "default", className, text }: LoadingSpinnerProps) {
  const SpinnerComponent = variant === "dots" ? DotsSpinner : variant === "pulse" ? PulseSpinner : DefaultSpinner;
  
  if (text) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <SpinnerComponent size={size} className={className} />
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    );
  }
  
  return <SpinnerComponent size={size} className={className} />;
}

// Componente para loading de página inteira
export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="xl" variant="default" />
      <p className="text-lg text-muted-foreground">{text}</p>
    </div>
  );
}

// Componente para loading inline
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" variant="dots" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}