import { KN_LOGO_PATH } from "@/lib/brand/kn-logo";

type Props = {
  width?: number;
  className?: string;
  alt?: string;
};

/** Logo oficial K&N — proposta comercial e documentos. */
export function KnLogoMark({ width = 120, className, alt = "K&N Tecnologia" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={KN_LOGO_PATH}
      alt={alt}
      width={width}
      height={width}
      className={className}
      style={{ display: "block", width, height: "auto", maxHeight: width, objectFit: "contain" }}
      decoding="async"
    />
  );
}
