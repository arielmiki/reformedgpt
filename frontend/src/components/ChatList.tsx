import { ScrollArea, NavLink, Text } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import type { Chat } from '../types';

interface ChatListProps {
  chats: Record<string, Chat>;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
}

export function ChatList({ chats, activeChatId, onSelectChat }: ChatListProps) {
  return (
    <ScrollArea style={{ flex: 1 }}>
      {Object.values(chats).map((chat) => (
        <NavLink
          key={chat.id}
          href="#"
          label={<Text truncate="end">{chat.title}</Text>}
          leftSection={<IconMessageCircle size="1rem" stroke={1.5} />}
          active={chat.id === activeChatId}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </ScrollArea>
  );
}
