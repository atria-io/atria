import type { AccountIdentityProps } from "../AccountPanelTypes.js";

export const AccountIdentity = ({ user, avatarSize, showDetails = false }: AccountIdentityProps) => (
  <>
    {user.avatarUrl ? (
      <img
        className="studio-account__avatar-image"
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
        <noscript>{JSON.stringify(user, null, 2)}</noscript>
      </>
    ) : null}
  </>
);
