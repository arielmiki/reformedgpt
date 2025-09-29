import { ScrollArea, Group, Avatar, Paper, Text, useComputedColorScheme } from '@mantine/core';
import { IconRobot, IconUser } from '@tabler/icons-react';
import type { Message } from '../types';

interface ChatHistoryProps {
  messages: Message[];
  viewport: React.RefObject<HTMLDivElement | null>;
}

export function ChatHistory({ messages, viewport }: ChatHistoryProps) {
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <Group key={message.id} my="xl" wrap="nowrap" align="flex-start" gap="lg" justify={isUser ? 'flex-end' : 'flex-start'}>
              {!isUser && (
                <Avatar size="md" radius="xl">
                  <IconRobot />
                </Avatar>
              )}
              <Paper
                p="md"
                radius="lg"
                style={(theme) => ({
                  backgroundColor: isUser
                    ? (computedColorScheme === 'dark' ? theme.colors.blue[9] : theme.colors.blue[5])
                    : (computedColorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]),
                  color: isUser ? 'white' : 'inherit',
                })}
              >
                <Text size="sm">{message.content}</Text>
              </Paper>
              {isUser && (
                <Avatar size="md" radius="xl" color="blue">
                  <IconUser />
                </Avatar>
              )}
            </Group>
          );
        })}
      </div>
    </ScrollArea>
  );
}
