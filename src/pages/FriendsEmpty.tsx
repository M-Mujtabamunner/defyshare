import React from 'react';

const FriendsEmpty: React.FC = () => (
  <div className="h-full flex items-center justify-center p-6">
    <div className="text-center space-y-2">
      <h2 className="text-lg font-semibold">Select a friend or group to start sharing.</h2>
      <p className="text-sm text-muted-foreground">
        Use the sidebar to open a chat, accept friend requests, or create a group.
      </p>
    </div>
  </div>
);

export default FriendsEmpty;
