/// <reference types="vite/client" />

import type { CSSProperties, HTMLAttributes, RefAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "hyperframes-player": HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement> & {
        src?: string;
        width?: number | string;
        height?: number | string;
        controls?: boolean;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        poster?: string;
        "playback-rate"?: number | string;
        style?: CSSProperties;
      };
    }
  }
}

export {};
