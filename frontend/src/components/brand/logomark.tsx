import { cn } from "@/lib/utils"

type LogomarkProps = {
  className?: string
}

function Logomark({ className }: LogomarkProps) {
  return (
    <img
      src="/logo.png"
      alt="Ajali!"
      width={252}
      height={320}
      className={cn("h-28 w-auto shrink-0 object-contain", className)}
    />
  )
}

export { Logomark }
