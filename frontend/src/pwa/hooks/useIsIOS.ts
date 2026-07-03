import { useMemo } from "react";
import { isSafariOnIOS } from "../utils/iosDetection";

export function useIsIOS(): boolean {
  return useMemo(isSafariOnIOS, []);
}
