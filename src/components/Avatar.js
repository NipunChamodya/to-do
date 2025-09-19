import React from 'react';

// This component is self-contained and calculates initials and color from a name.
const Avatar = ({ name }) => {
  const getInitials = (nameString) => {
    if (!nameString) return '?';
    const names = nameString.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return nameString.substring(0, 2);
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const initials = getInitials(name).toUpperCase();
  const avatarColor = stringToColor(name);

  return (
    <div className="avatar" style={{ backgroundColor: avatarColor }} title={name}>
      {initials}
    </div>
  );
};

export default Avatar;
