import { getInitials } from "@reactive-resume/utils";

import { useUser } from "../services/user";

type Props = {
  size?: number;
  className?: string;
  withBorder?: boolean; // Add this prop if you want border control
};

export const UserAvatar = ({ size = 36, className = "", withBorder = false }: Props) => {
  const { user } = useUser();

  if (!user) return null;

  let picture: React.ReactNode;

  if (user.picture) {
    picture = (
      <img
        alt={user.name}
        src={user.picture}
        className={`object-cover ${withBorder ? 'border-2 border-white dark:border-gray-800' : ''}`}
        style={{ 
          width: size, 
          height: size,
          borderRadius: '50%'
        }}
      />
    );
  } else {
    const initials = getInitials(user.name);

    picture = (
      <div
        style={{ 
          width: size, 
          height: size,
          borderRadius: '50%',
          fontSize: Math.max(10, size / 2.5)
        }}
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold ${
          withBorder ? 'border-2 border-white dark:border-gray-800' : ''
        }`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        borderRadius: '50%',
        overflow: 'hidden', // Ensure no overflow
        display: 'inline-block'
      }}
    >
      {picture}
    </div>
  );
};