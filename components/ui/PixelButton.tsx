"use client";

import Link from "next/link";
import { motion, LayoutGroup } from "motion/react";
import { useId, useRef, useState, type ReactNode } from "react";
import { PixelArrow } from "./PixelArrow";
import styles from "./PixelButton.module.css";

/*
 * The template's primary CTA. At rest a tile holds the pixel arrow and the
 * label sits beside it; on hover the tile grows to fill the pill, the label
 * moves inside it and the arrow travels to the right end.
 * Transition taken from the Framer component: spring, 0.4s, bounce 0.2.
 */
const SPRING = { type: "spring", duration: 0.4, bounce: 0.2 } as const;

export type PixelButtonVariant = "primary" | "secondary" | "light" | "primarySmall" | "secondarySmall";

type CommonProps = {
  children: ReactNode;
  variant?: PixelButtonVariant;
  className?: string;
};

type LinkProps = CommonProps & { href: string; newTab?: boolean };
type ButtonProps = CommonProps & { type: "submit" | "button"; disabled?: boolean; onClick?: () => void };

const MotionLink = motion.create(Link);

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function PixelButton(props: LinkProps | ButtonProps) {
  const { children, variant = "primary", className } = props;
  const [hovered, setHovered] = useState(false);
  const [lockedWidth, setLockedWidth] = useState<number>();
  const ref = useRef<HTMLElement | null>(null);
  const id = useId();
  const small = variant === "primarySmall" || variant === "secondarySmall";

  const enter = () => {
    // Keep the pill the same width while its contents rearrange.
    if (ref.current) setLockedWidth(ref.current.offsetWidth);
    setHovered(true);
  };
  const leave = () => setHovered(false);

  const inner = (
    <>
      <motion.span layout transition={SPRING} className={styles.tile}>
        {hovered && (
          <motion.span layoutId={`${id}-label`} transition={SPRING} className={`${styles.label} ${styles.labelInTile}`}>
            {children}
          </motion.span>
        )}
        <motion.span layout="position" transition={SPRING} className={styles.icon}>
          <PixelArrow width={small ? 16 : 30} paused={hovered} />
        </motion.span>
      </motion.span>
      {!hovered && (
        <motion.span layoutId={`${id}-label`} transition={SPRING} className={styles.label}>
          {children}
        </motion.span>
      )}
    </>
  );

  const shared = {
    ref: (el: HTMLElement | null) => {
      ref.current = el;
    },
    className: `${styles.btn} ${styles[variant]} ${className ?? ""}`,
    "data-hovered": hovered,
    style: { width: hovered ? lockedWidth : undefined },
    onHoverStart: enter,
    onHoverEnd: leave,
    onFocus: enter,
    onBlur: leave,
  };

  let el: ReactNode;
  if ("type" in props) {
    el = (
      <motion.button {...shared} type={props.type} disabled={props.disabled} onClick={props.onClick}>
        {inner}
      </motion.button>
    );
  } else if (isExternal(props.href)) {
    el = (
      <motion.a
        {...shared}
        href={props.href}
        target={props.newTab ? "_blank" : undefined}
        rel={props.newTab ? "noopener" : undefined}
      >
        {inner}
      </motion.a>
    );
  } else {
    el = (
      <MotionLink {...shared} href={props.href}>
        {inner}
      </MotionLink>
    );
  }

  return <LayoutGroup id={id}>{el}</LayoutGroup>;
}
