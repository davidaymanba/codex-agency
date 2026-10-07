import { siBehance, siInstagram, siTiktok, siWhatsapp, siX } from "simple-icons";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const make = (path: string) =>
  function SimpleIcon(props: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d={path} />
      </svg>
    );
  };

export const WhatsAppIcon = make(siWhatsapp.path);
export const InstagramIcon = make(siInstagram.path);
export const BehanceIcon = make(siBehance.path);
export const XIcon = make(siX.path);
export const TiktokIcon = make(siTiktok.path);

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path
        d="M3 3h18v18H3zM6.5 9.75V18h2.75V9.75zm1.38-4.25a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM11 9.75V18h2.75v-4.3c0-1.13.21-2.23 1.62-2.23 1.39 0 1.4 1.3 1.4 2.3V18h2.73v-4.75c0-2.33-.5-4.12-3.22-4.12-1.31 0-2.18.72-2.54 1.4h-.04V9.75z"
        fillRule="evenodd"
      />
    </svg>
  );
}
