"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface TemplateProps {
  children: ReactNode
}

const pageVariants = {
  initial: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
}

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
}

export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={false}
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}
