export const CROSSPAY_ACTIVITY_EVENT = "crosspay:activity-updated";

export const emitActivityUpdate = (detail = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(CROSSPAY_ACTIVITY_EVENT, { detail }));
};
