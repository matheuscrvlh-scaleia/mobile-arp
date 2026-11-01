/* Curvas do CSS (tokens.motion) prontas para withTiming. Separado dos tokens para eles
   continuarem puros (sem Reanimated). */
import { Easing } from "react-native-reanimated";
import { motion } from "./tokens";

export const easings = {
  ease: Easing.bezier(...motion.ease),
  spring: Easing.bezier(...motion.spring),
  linear: Easing.linear,
} as const;
