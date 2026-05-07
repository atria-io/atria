import type { AccountIdentityProps } from "../accountPanelTypes.js";

const getAvatarInitial = (name: string, email: string): string => {
  const source = name.trim() || email.trim();
  return source ? source.charAt(0).toUpperCase() : "?";
};

export const AccountIdentity = (
  { user,
    avatarSize,
    showDetails = false
  }: AccountIdentityProps
) => {
  const avatarInitial = getAvatarInitial(user.name, user.email);

  return (
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
        <span
          className="studio-account__avatar studio-account__avatar-fallback"
          aria-label="Avatar"
          style={{ width: avatarSize, height: avatarSize }}
        >
          {avatarInitial}
        </span>
      )}
      {showDetails ? (
        <div className="studio-account__info">
          <span className="studio-account__name">{user.name}</span>
          <span className="studio-account__email">{user.email}</span>
        </div>
      ) : null}
    </div>
  );
};
