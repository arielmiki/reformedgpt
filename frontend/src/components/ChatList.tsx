import { NavLink, Text, Tooltip, Group } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import type { Chat } from '../types';

interface ChatListProps {
  chats: Record<string, Chat>;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  compact?: boolean;
}

export function ChatList({ chats, activeChatId, onSelectChat, compact = false }: ChatListProps) {
  const sorted = Object.values(chats).sort((a: Chat, b: Chat) => {
    const at = a.updatedAt ?? 0;
    const bt = b.updatedAt ?? 0;
    return bt - at; // newest first
  });

  return (
    <>
      {sorted.map((chat) => {
        const url = `/chat/${encodeURIComponent(chat.id)}`;
        const item = (
          <NavLink
            key={chat.id}
            href={url}
            label={compact ? undefined : <Text truncate="end">{chat.title}</Text>}
            leftSection={<IconMessageCircle size="1rem" stroke={1.5} />}
            active={chat.id === activeChatId}
            onClick={(e) => { e.preventDefault(); onSelectChat(chat.id); }}
            variant="light"
            style={{ borderRadius: 8 }}
            title={chat.title}
          />
        );
        return compact ? (
          <Tooltip key={chat.id} label={chat.title} withinPortal>
            <Group wrap="nowrap">
              {item}
            </Group>
          </Tooltip>
        ) : (
          item
        );
      })}
    </>
  );
}
