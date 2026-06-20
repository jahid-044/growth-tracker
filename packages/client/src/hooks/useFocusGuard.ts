import { useState } from "react";

/**
 * Tracks focus for a single control so its validation error can be hidden while
 * the user is actively editing. Spread `onFocus`/`onBlur` after a register() spread.
 */
export function useFocusGuard() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
}
