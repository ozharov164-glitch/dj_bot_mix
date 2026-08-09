import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { hapticImpact, hapticSelection } from "../lib/telegram";
import { IconCheck, IconChevronDown } from "./icons";

export type OptionPickerItem = {
  value: string;
  label: string;
  description?: string;
};

type OptionPickerProps = {
  label: string;
  value: string;
  options: OptionPickerItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** @deprecated kept for call-site compat; dropdown has no sheet title */
  sheetTitle?: string;
  hint?: ReactNode;
  footnote?: ReactNode;
};

type MenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
};

const MENU_GAP = 6;
const MENU_MAX = 220;
const VIEW_PAD = 10;

/**
 * Compact in-app select — anchored dropdown under the field (not a bottom sheet).
 */
export function OptionPicker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  hint,
  footnote,
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  function measure(): MenuBox | null {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEW_PAD;
    const spaceAbove = rect.top - VIEW_PAD;
    const preferBelow = spaceBelow >= 140 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(
      MENU_MAX,
      Math.max(120, preferBelow ? spaceBelow - MENU_GAP : spaceAbove - MENU_GAP),
    );
    if (preferBelow) {
      return {
        top: rect.bottom + MENU_GAP,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: "below",
      };
    }
    return {
      top: rect.top - MENU_GAP - maxHeight,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement: "above",
    };
  }

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    setBox(measure());

    const onReposition = () => setBox(measure());
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);

    requestAnimationFrame(() => {
      const selectedBtn = menuRef.current?.querySelector<HTMLButtonElement>(
        '[aria-selected="true"]',
      );
      (selectedBtn ?? menuRef.current?.querySelector("button"))?.focus();
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
      triggerRef.current?.focus();
    };
  }, [open]);

  function choose(next: string) {
    hapticSelection();
    onChange(next);
    setOpen(false);
  }

  const menuStyle: CSSProperties | undefined = box
    ? {
        top: box.top,
        left: box.left,
        width: box.width,
        maxHeight: box.maxHeight,
      }
    : undefined;

  return (
    <div className="field" ref={rootRef}>
      <span className="field__label" id={labelId}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className={
          open ? "option-trigger option-trigger--open" : "option-trigger"
        }
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId}
        onClick={() => {
          if (disabled) return;
          hapticImpact("light");
          setOpen((prev) => !prev);
        }}
      >
        <span className="option-trigger__value">
          {selected?.label ?? "Выберите…"}
        </span>
        <span className="option-trigger__chevron" aria-hidden="true">
          <IconChevronDown size={18} />
        </span>
      </button>

      {footnote ? (
        <span className="field__hint field__hint--footnote">{footnote}</span>
      ) : null}
      {hint ? <span className="field__hint">{hint}</span> : null}

      {open && box
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              className={`option-menu option-menu--${box.placement}`}
              style={menuStyle}
              role="listbox"
              aria-labelledby={labelId}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={option.description}
                    className={
                      isSelected
                        ? "option-menu__item option-menu__item--selected"
                        : "option-menu__item"
                    }
                    onClick={() => choose(option.value)}
                  >
                    <span className="option-menu__label">{option.label}</span>
                    {isSelected ? (
                      <span className="option-menu__check" aria-hidden="true">
                        <IconCheck size={15} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
