import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface FaIconProps {
  icon: IconProp;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FaIcon({ icon, size = 14, className, style }: FaIconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      style={{ fontSize: size, ...style }}
      className={className}
    />
  );
}
