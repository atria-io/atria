import * as React from "react";
import * as Icon from "lucide-react";
import { Button } from "@atria/ui";
import { Popover } from "@atria/ui";
import { usePopover } from "@atria/ui";
import type { User } from "@/app/realms/studio/model/studio.types.js";

const PANEL_ID = "studio-account-panel-menu";

interface AccountProps {
  user: User;
  onLogout: () => void;
}

type AccountViewProps = AccountProps & {
  isOpen: boolean;
  isClosing: boolean;
  isMounted: boolean;
  onClick: () => void;
  onPanelAnimationEnd: React.AnimationEventHandler<HTMLDivElement>;
};

function useAccountProps(
  props: AccountProps,
  rootRef: React.RefObject<HTMLDivElement | null>,
): AccountViewProps {
  const { isOpen, isClosing, isMounted, toggle, onAnimationEnd } = usePopover(rootRef);

  return {
    ...props,
    isOpen,
    isClosing,
    isMounted,
    onClick: toggle,
    onPanelAnimationEnd: onAnimationEnd,
  };
}

function getFirstNameInitial(name: string): string {
  return (name.trim().split(/\s+/)[0] ?? "?").charAt(0).toUpperCase();
}

function AccountButton({
  isOpen,
  onClick,
  children,
}: {
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      aria-label="User info"
      aria-haspopup="menu"
      aria-controls={PANEL_ID}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function AccountLogoutButton({ onLogout }: Pick<AccountProps, "onLogout">) {
  return (
    <div className="studio-account__logout" aria-label="Logout action">
      <Button
        type="button"
        variant="overlay"
        className="studio-account__logout-button"
        data-tooltip="Log out"
        onClick={onLogout}
        icon
      >
        <Icon.LogOut size={14} />
      </Button>
    </div>
  );
}

function AccountTrigger({ user, isOpen, onClick }: AccountViewProps) {
  const firstNameInitial = getFirstNameInitial(user.name);

  return (
    <AccountButton isOpen={isOpen} onClick={onClick}>
      <span className="studio-account__profile-user" role="region" aria-label="User info">
        <span className="studio-account__avatar studio-account__avatar--control" aria-label="Avatar">
          {user.avatarUrl ? (
            <img className="studio-account__avatar-image" src={user.avatarUrl} alt={user.name} />
          ) : (
            <span className="studio-account__avatar-text">{firstNameInitial}</span>
          )}
        </span>
      </span>
    </AccountButton>
  );
}

function AccountPopoverContent({ user, onLogout }: AccountViewProps) {
  const firstNameInitial = getFirstNameInitial(user.name);

  return (
    <>
      <div className="studio-account__user" aria-label="User info">
        <span className="studio-account__avatar studio-account__avatar--user" aria-label="Avatar">
          {user.avatarUrl ? (
            <img className="studio-account__avatar-image" src={user.avatarUrl} alt={user.name} />
          ) : (
            <span className="studio-account__avatar-text">{firstNameInitial}</span>
          )}
        </span>
        <div className="studio-account__info">
          <span className="studio-account__name">{user.name}</span>
          <span className="studio-account__email">{user.email}</span>
        </div>
      </div>
      <AccountLogoutButton onLogout={onLogout} />
    </>
  );
}

function AccountPopover({
  isOpen,
  isClosing,
  isMounted,
  onPanelAnimationEnd,
  children,
}: AccountViewProps & { children: React.ReactNode }) {
  return (
    <Popover
      id={PANEL_ID}
      size="md"
      open={isOpen}
      closing={isClosing}
      mounted={isMounted}
      onAnimationEnd={onPanelAnimationEnd}
      scope="studio-account"
    >
      {children}
    </Popover>
  );
}

const Account = ({ ...input }: AccountProps) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const props = useAccountProps(input, rootRef);

  return (
    <div className="studio-account" data-tooltip={props.user.name} ref={rootRef}>
      <AccountTrigger {...props} />
      <AccountPopover {...props}>
        <AccountPopoverContent {...props} />
      </AccountPopover>
    </div>
  );
};

export { Account };
