import { Variants, Transition } from "framer-motion";

export const smoothTransition: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1], // easeOutExpo
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  hover: {
    scale: 1.02,
    y: -6,
    boxShadow: "0 20px 40px -12px rgba(99, 102, 241, 0.15)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
