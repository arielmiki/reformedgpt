import { ScrollArea, Group, Avatar, Paper, useComputedColorScheme } from '@mantine/core';
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
        // Typography (inherit font size from container for consistency)
        p: ({ node, ...props }: any) => <p style={{ margin: 0 }} {...props} />,
        h1: ({ node, ...props }: any) => (
          <h1 style={{ fontSize: '1.25em', fontWeight: 700, margin: '0.5em 0 0.35em' }} {...props} />
        ),
        h2: ({ node, ...props }: any) => (
          <h2 style={{ fontSize: '1.15em', fontWeight: 700, margin: '0.45em 0 0.3em' }} {...props} />
        ),
        h3: ({ node, ...props }: any) => (
          <h3 style={{ fontSize: '1.05em', fontWeight: 600, margin: '0.4em 0 0.25em' }} {...props} />
        ),
        ul: ({ node, ...props }: any) => <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }} {...props} />,
        ol: ({ node, ...props }: any) => <ol style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }} {...props} />,
        li: ({ node, ...props }: any) => <li style={{ marginTop: 2, marginBottom: 2 }} {...props} />,
        // Tables
        table: ({ node, ...props }: any) => (
          <div style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: 400,
              }}
              {...props}
            />
          </div>
        ),
        thead: ({ node, ...props }: any) => <thead {...props} />,
        tbody: ({ node, ...props }: any) => <tbody {...props} />,
        tr: ({ node, ...props }: any) => <tr {...props} />,
        th: ({ node, ...props }: any) => (
          <th
            style={{
              border: '1px solid currentColor',
              padding: '6px 8px',
              textAlign: 'left',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
            {...props}
          />
        ),
        td: ({ node, ...props }: any) => (
          <td
            style={{
              border: '1px solid currentColor',
              padding: '6px 8px',
              verticalAlign: 'top',
            }}
            {...props}
          />
        ),
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
                  fontSize: theme.fontSizes.sm,
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

