import { ScrollArea, Group, Avatar, Paper, Text, useComputedColorScheme } from '@mantine/core';
import { IconRobot, IconUser } from '@tabler/icons-react';
import type { Message } from '../types';
import { Citation } from './Citation';

import type { Source } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ChatHistoryProps {
  messages: Message[];
  viewport: React.RefObject<HTMLDivElement | null>;
  onCitationClick: (source: Source) => void;
}

function renderMessageContent(message: Message, onCitationClick: (source: Source) => void) {
  const content = message?.content ?? '';
  const sources = message.sources || [];

  // Render whole message once to avoid paragraph breaks around inline citations
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw as any]}
      components={{
        // Typography
        p: ({ node, ...props }: any) => <Text component="p" size="sm" m={0} {...props} />,
        h1: ({ node, ...props }: any) => <Text component="h1" fw={700} size="lg" {...props} />,
        h2: ({ node, ...props }: any) => <Text component="h2" fw={700} size="md" {...props} />,
        h3: ({ node, ...props }: any) => <Text component="h3" fw={600} size="sm" {...props} />,
        ul: ({ node, ...props }: any) => <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }} {...props} />,
        ol: ({ node, ...props }: any) => <ol style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }} {...props} />,
        li: ({ node, ...props }: any) => <li style={{ marginTop: 2, marginBottom: 2 }} {...props} />,
        code: ({ inline, children, ...props }: any) => (
          <code
            style={{
              background: 'rgba(0,0,0,0.08)',
              padding: inline ? '0 4px' : '8px',
              display: inline ? 'inline' : 'block',
              borderRadius: 4,
              overflowX: 'auto',
              whiteSpace: inline ? 'pre-wrap' : 'pre',
            }}
            {...props}
          >
            {children}
          </code>
        ),
        // Custom inline citation element from model output: <citation source_id="0" />
        citation: ({ node }: any) => {
          const propsAny = (node as any)?.properties || {};
          const sidStr = propsAny['source_id'] ?? propsAny['sourceId'] ?? propsAny['data-source-id'];
          const sourceId = Number.parseInt(String(sidStr ?? ''), 10);
          return (
            <Citation
              sourceId={Number.isFinite(sourceId) ? sourceId : 0}
              sources={sources}
              onClick={() => {
                const src = sources[sourceId];
                if (src) onCitationClick(src);
              }}
            />
          );
        },
      } as any}
    >
      {content}
    </ReactMarkdown>
  );
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
                {renderMessageContent(message, onCitationClick)}
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

