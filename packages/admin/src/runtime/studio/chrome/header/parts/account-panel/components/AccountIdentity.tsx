import type { AccountIdentityProps } from "../AccountPanelTypes.js";

export const AccountIdentity = ({ user, avatarSize, showDetails = false }: AccountIdentityProps) => (
  <div className={showDetails ? "studio-account__user" : "studio-account__profile-user"} aria-label="User info">
    {user.avatarUrl ? (
      <img
        className="studio-account__avatar"
        src={user.avatarUrl}
        alt={user.name}
        width={avatarSize}
        height={avatarSize}
      />
    ) : (
      <span className="studio-account__avatar" aria-label="Avatar" />
    )}
    {showDetails ? (
      <>
        <span className="studio-account__name">{user.name}</span>
        <span className="studio-account__name">{user.email}</span>
      </>
    ) : null}
  </div>
);
