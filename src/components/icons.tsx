import type { ImgHTMLAttributes } from "react";
import arrowLeft from "../assets/icons/arrow-left-v1.png";
import chevronDown from "../assets/icons/chevron-down-v1.png";
import chevronRight from "../assets/icons/chevron-right-v1.png";
import chevronUp from "../assets/icons/chevron-up-v1.png";
import close from "../assets/icons/close-v1.png";
import fx from "../assets/icons/fx-v1.png";
import mix from "../assets/icons/mix-v1.png";
import plus from "../assets/icons/plus-v1.png";
import projects from "../assets/icons/projects-v1.png";
import spark from "../assets/icons/spark-v1.png";
import startSpark from "../assets/icons/start-spark-v1.png";
import trash from "../assets/icons/trash-v1.png";
import upload from "../assets/icons/upload-v1.png";

type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  size?: number;
};

/**
 * The Mini App uses one AI-generated raster pack rather than mixed SVG styles.
 * Semantics remain on the surrounding labelled controls; icons are decorative.
 */
function RasterIcon({
  src,
  size = 18,
  className = "",
  style,
  ...props
}: IconProps & { src: string }) {
  return (
    <img
      {...props}
      className={["icon", "icon--raster", className].filter(Boolean).join(" ")}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ width: size, height: size, ...style }}
    />
  );
}

export function IconChevronRight(props: IconProps) {
  return <RasterIcon src={chevronRight} {...props} />;
}

export function IconChevronDown(props: IconProps) {
  return <RasterIcon src={chevronDown} {...props} />;
}

export function IconChevronUp(props: IconProps) {
  return <RasterIcon src={chevronUp} {...props} />;
}

export function IconArrowLeft(props: IconProps) {
  return <RasterIcon src={arrowLeft} {...props} />;
}

export function IconClose(props: IconProps) {
  return <RasterIcon src={close} {...props} />;
}

export function IconPlus(props: IconProps) {
  return <RasterIcon src={plus} {...props} />;
}

export function IconTrash(props: IconProps) {
  return <RasterIcon src={trash} {...props} />;
}

export function IconUpload(props: IconProps) {
  return <RasterIcon src={upload} {...props} />;
}

export function IconSpark(props: IconProps) {
  return <RasterIcon src={spark} {...props} />;
}

/** CTA spark for onboarding «Начать» — mint glow, separate from chrome IconSpark. */
export function IconStartSpark(props: IconProps) {
  return <RasterIcon src={startSpark} {...props} />;
}

export function IconMixMark(props: IconProps) {
  return <RasterIcon src={mix} {...props} />;
}

export function IconFxMark(props: IconProps) {
  return <RasterIcon src={fx} {...props} />;
}

export function IconProjects(props: IconProps) {
  return <RasterIcon src={projects} {...props} />;
}
