import type { ReactNode } from "react";
import { Recorder, type RecorderProps } from "./recorder";

declare const process: { env: { NODE_ENV?: string } };

const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";

export interface DevRecorderProps extends RecorderProps {
  children: ReactNode;
}

/**
 * The record toolbar around `children` in development. In a production build it renders
 * `children` alone, so the toolbar never ships.
 */
export function DevRecorder({ children, ...props }: DevRecorderProps) {
  if (!isDev) return <>{children}</>;
  return <Recorder {...props}>{children}</Recorder>;
}
