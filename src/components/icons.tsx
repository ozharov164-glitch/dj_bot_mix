import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function baseProps(
  size: number,
  props: SVGProps<SVGSVGElement>,
): SVGProps<SVGSVGElement> {
  const { className, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    className: ["icon", className].filter(Boolean).join(" "),
    ...rest,
  };
}

export function IconChevronRight({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M9 5.5 15.5 12 9 18.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronDown({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M5.5 9 12 15.5 18.5 9"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronUp({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M5.5 15 12 8.5 18.5 15"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArrowLeft({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M14.5 5.5 8 12l6.5 6.5M8.5 12H20"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClose({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M12 5.5v13M5.5 12h13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTrash({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M8.5 5.5V4.8A1.3 1.3 0 0 1 9.8 3.5h4.4a1.3 1.3 0 0 1 1.3 1.3v.7M5 7h14M16.2 7l-.5 11.1a1.4 1.4 0 0 1-1.4 1.3H9.7a1.4 1.4 0 0 1-1.4-1.3L7.8 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUpload({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M12 15.5V6.2M8.2 9.5 12 5.7l3.8 3.8M6 17.5h12"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSpark({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M12 3.5 13.4 8.6 18.5 10 13.4 11.4 12 16.5 10.6 11.4 5.5 10 10.6 8.6 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** MIX project mark — layered waveform. */
export function IconMixMark({ size = 22, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)} viewBox="0 0 24 24">
      <rect
        x="3.5"
        y="9"
        width="2.4"
        height="6"
        rx="1.2"
        fill="currentColor"
        opacity="0.45"
      />
      <rect
        x="7.3"
        y="6.5"
        width="2.4"
        height="11"
        rx="1.2"
        fill="currentColor"
        opacity="0.7"
      />
      <rect x="11.1" y="4.5" width="2.4" height="15" rx="1.2" fill="currentColor" />
      <rect
        x="14.9"
        y="7"
        width="2.4"
        height="10"
        rx="1.2"
        fill="currentColor"
        opacity="0.75"
      />
      <rect
        x="18.7"
        y="9.5"
        width="2.4"
        height="5"
        rx="1.2"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}

/** SINGLE FX mark — concentric pulse. */
export function IconFxMark({ size = 22, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)} viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.35"
      />
      <circle
        cx="12"
        cy="12"
        r="4.6"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity="0.7"
      />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function IconProjects({ size = 22, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 9.5h8M8 12.5h8M8 15.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
