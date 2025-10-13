import React from 'react';
import Avatar from './Avatar';

// Shows a subtle "Seen" indicator beneath the LAST read outgoing message only.
// No check icons are used, per requirement.
const MessageStatus = ({ message, isOwnMessage, isLastReadOwnMessage, recipientAvatar }) => {
  if (!isOwnMessage) return null;

  if (!message?.isRead || !isLastReadOwnMessage) return null;

  const readAt = message.readAt ? new Date(message.readAt) : null;
  const timeText = readAt
    ? readAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const dateText = readAt
    ? readAt.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' })
    : '';

  return (
    <div className="flex items-center justify-end mt-1 gap-2">
      {recipientAvatar && recipientAvatar !== 'null' && recipientAvatar.trim() !== '' ? (
        <Avatar
          src={recipientAvatar}
          alt="seen by"
          className="w-4 h-4 rounded-full border border-emerald-200"
        />
      ) : null}
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[10px] text-emerald-100">{`Seen${timeText ? ` ${timeText}` : ''}`}</span>
        {dateText ? (
          <span className="text-[10px] text-emerald-100/90">{dateText}</span>
        ) : null}
      </div>
    </div>
  );
};

export default MessageStatus;
