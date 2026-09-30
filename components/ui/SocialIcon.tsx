import { Icon } from "./Icon";

type Name = "whatsapp" | "linkedin" | "github" | "instagram";

/* Social logos in the template's style: Phosphor, regular weight. */
export function SocialIcon({ name, size = 20 }: { name: Name; size?: number }) {
  return <Icon name={name} size={size} />;
}
