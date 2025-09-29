import { ScrollArea, Group, Avatar, Paper, Text, useComputedColorScheme } from '@mantine/core';
import { IconRobot, IconUser } from '@tabler/icons-react';
import type { Message } from '../types';
import { Citation } from './Citation';

import type { Source } from '../types';

interface ChatHistoryProps {
  messages: Message[];
  viewport: React.RefObject<HTMLDivElement | null>;
  onCitationClick: (source: Source) => void;
}

function renderMessageContent(message: Message, onCitationClick: (source: Source) => void) {
  const content = message?.content ?? '';
  const parts: React.ReactNode[] = [];
  // Supports both self-closing: <citation source_id="0" />
  // and paired tags:        <citation source_id="0">...ignored children...</citation>
  const regex = /<citation\s+source_id="(\d+)">\s*([\s\S]*?)\s*<\/citation>|<citation\s+source_id="(\d+)"\s*\>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add the text before the citation
    if (match.index > lastIndex) {
      parts.push(
        <Text component="span" key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </Text>
      );
    }

    // Add the citation
    const sourceId = parseInt((match[1] ?? match[3]) as string, 10);
    const sources = message.sources || [];
    parts.push(
      <Citation
        key={`citation-${match.index}`}
        sourceId={sourceId}
        sources={sources}
        onClick={() => {
          const src = sources[sourceId];
          if (src) onCitationClick(src);
        }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last citation
  if (lastIndex < content.length) {
    parts.push(
      <Text component="span" key={`text-${lastIndex}`}>
        {content.substring(lastIndex)}
      </Text>
    );
  }

  return parts;
}


export function ChatHistory({ messages, viewport, onCitationClick }: ChatHistoryProps) {
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
                <Text size="sm">
                  {renderMessageContent(message, onCitationClick)}
                </Text>
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
