import { useEffect, useRef, useState } from "react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import type { StudioAccountPanelProps } from "./AccountPanelTypes.js";
import { AccountIdentity } from "./components/AccountIdentity.js";
import { AccountLogout } from "./components/AccountLogout.js";
import { AccountScheme } from "./components/AccountScheme.js";

export const StudioAccountPanel = ({ user, onLogout }: StudioAccountPanelProps) => {
  const { mode, modes, setMode } = useScheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const openPanel = (): void => {
    setIsClosing(false);
    setIsMounted(true);
    setIsOpen(true);
  };

  const closePanel = (): void => {
    if (!isMounted) {
      return;
    }

    setIsOpen(false);
    setIsClosing(true);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      if (!root.contains(event.target as Node)) {
        closePanel();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="studio-account__container" ref={rootRef}>
      <button
        type="button"
        className="studio-account__profile"
        aria-label="User info"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen || isClosing) {
            closePanel();
            return;
          }
          openPanel();
        }}
        data-tooltip="Painel"
      >
        <AccountIdentity user={user} avatarSize={22} />
      </button>
      {isMounted ? (
        <div
          className={isClosing ? "studio-account__panel studio-account__panel--closing" : "studio-account__panel"}
          onAnimationEnd={() => {
            if (!isClosing) {
              return;
            }

            setIsClosing(false);
            setIsMounted(false);
          }}
        >
          <div className="studio-account__menu">
            <div className="studio-account__menu--content">
              <AccountIdentity user={user} avatarSize={24} showDetails />
              <AccountScheme mode={mode} modes={modes} onSetMode={setMode} />
              <AccountLogout onLogout={onLogout} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
