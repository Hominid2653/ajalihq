import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { cn } from "@/lib/utils"

type FaIconProps = {
  icon: IconDefinition
  className?: string
  title?: string
}

/** Font Awesome icon wrapper with consistent sizing. */
function FaIcon({ icon, className, title }: FaIconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={cn("size-[1em] shrink-0", className)}
      title={title}
      aria-hidden={title ? undefined : true}
    />
  )
}

export { FaIcon }
