
import React from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex justify-end">
      {typingUsers.length === 1 ? (
        <span className="text-xs text-primary-500">{typingUsers[0]} está digitando...</span>
      ) : (
        <span className="text-xs text-primary-500">várias pessoas estão digitando...</span>
      )}
    </div>
  );
};

export default TypingIndicator;
