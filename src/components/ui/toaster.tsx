import * as React from "react";

export function Toaster() {
  return (
    <div
      role="region"
      aria-label="Notifications (F8)"
      tabIndex={-1}
      style={{ pointerEvents: "none" }}
    >
      <ol
        tabIndex={-1}
        className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      />
    </div>
  );
}
