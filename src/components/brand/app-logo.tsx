import Image from "next/image";

type AppLogoProps = {
  className?: string;
  label?: string;
  priority?: boolean;
  showName?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
};

const logoSizes = {
  xs: { className: "size-8", pixels: 32 },
  sm: { className: "size-9", pixels: 36 },
  md: { className: "size-11", pixels: 44 },
  lg: { className: "size-16", pixels: 64 },
} as const;

export function AppLogo({
  className = "",
  label = "Aula",
  priority = false,
  showName = false,
  size = "sm",
}: AppLogoProps) {
  const selectedSize = logoSizes[size];

  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`.trim()}>
      <span
        data-testid="app-logo-mark"
        className={`relative block shrink-0 overflow-hidden rounded-full border border-cyan-300/45 bg-[#030710] shadow-[0_0_20px_rgba(34,211,238,0.22)] ${selectedSize.className}`}
      >
        <Image
          src="/aula-app-icon.png"
          alt="Logo Aula Studio Virtuale"
          fill
          priority={priority}
          sizes={`${selectedSize.pixels}px`}
          className="object-cover"
        />
      </span>
      {showName && <span>{label}</span>}
    </span>
  );
}
