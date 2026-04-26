import type { AccountIdentityProps } from "../accountPanelTypes.js";

export const AccountIdentity = ({ user, avatarSize, showDetails = false }: AccountIdentityProps) => (
  <div className={
        showDetails ?
        "studio-account__user" :
        "studio-account__profile-user"
      }
      aria-label="User info">
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
        <div className="studio-account__info">
          <span className="studio-account__name">{user.name}</span>
          <span className="studio-account__email">{user.email}</span>
        </div>
      </>
    ) : null}
  </div>
);
