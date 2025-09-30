import { useState, useRef, useEffect } from 'react';
import { AppShell, ActionIcon, Box, Drawer, useComputedColorScheme, Stack, Group, Text, Avatar, Divider, ScrollArea, Badge } from '@mantine/core';
import { IconPlus, IconRobot, IconFileText, IconExternalLink } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message, Source } from './types';
import { ChatHistory } from './components/ChatHistory';
import { ChatInput } from './components/ChatInput';
import { ChatList } from './components/ChatList';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { PdfViewer } from './components/PdfViewer';
import { streamChat } from './services/api';

function App() {

  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const viewport = useRef<HTMLDivElement>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [pdfSource, setPdfSource] = useState<{ file: string; pageNumber: number; highlight: string } | null>(null);

  // Load chats from local storage on initial render. Guard for React 18 StrictMode double-invoke in dev.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      setActiveChatId(Object.keys(parsedChats)[0] || null);
    } else {
      handleNewChat();
    }
  }, []);

  // Save chats to local storage whenever they change
  useEffect(() => {
    if (Object.keys(chats).length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChatId]);

  const handleNewChat = () => {
    const newChatId = uuidv4();
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          id: uuidv4(),
          content: 'Hello! How can I help you today?',
          role: 'assistant',
        },
      ],
      updatedAt: Date.now(),
    };
    setChats((prev) => ({ ...prev, [newChatId]: newChat }));
    setActiveChatId(newChatId);
  };

  const handleCitationClick = (source: Source) => {
    setPdfSource({
      file: source.metadata.source,
      pageNumber: source.metadata.page,
      highlight: source.content,
    });
    setDrawerOpened(true);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChatId) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue,
      role: 'user',
    };

    const updatedChats = { ...chats };
    const activeChat = updatedChats[activeChatId];
    const newMessages = [...activeChat.messages, userMessage];

    if (newMessages.filter((m) => m.role === 'user').length === 1) {
      activeChat.title = inputValue.substring(0, 30);
    }

    setChats({ ...updatedChats, [activeChatId]: { ...activeChat, messages: newMessages, updatedAt: Date.now() } });
    setInputValue('');

    const botMessageId = uuidv4();
    setChats((prev) => ({
      ...prev,
      [activeChatId]: {
        ...prev[activeChatId],
        messages: [
          ...newMessages,
          {
            id: botMessageId,
            role: 'assistant',
            content: '...',
          },
        ],
        updatedAt: Date.now(),
      },
    }));

    try {
      let content = '';
      let currentSources: Source[] = [];

      for await (const event of streamChat(newMessages.map(({ id, ...rest }) => rest))) {
        if (event.type === 'context') {
          currentSources = event.data;
        } else if (event.type === 'delta') {
          content += event.data;
          setChats((prev) => {
            const newMsgs = prev[activeChatId].messages.map((msg) =>
              msg.id === botMessageId ? { ...msg, content, sources: currentSources } : msg
            );
            return { ...prev, [activeChatId]: { ...prev[activeChatId], messages: newMsgs, updatedAt: Date.now() } };
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setChats((prev) => {
        const newMsgs = prev[activeChatId].messages.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: 'Error: Could not connect to the bot.' } : msg
        );
        return { ...prev, [activeChatId]: { ...prev[activeChatId], messages: newMsgs, updatedAt: Date.now() } };
      });
    }
  };

  const activeChat = activeChatId ? chats[activeChatId] : null;
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <AppShell
      padding="md"
      navbar={{ width: 250, breakpoint: 'sm' }}
      styles={(theme) => ({
        main: {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: computedColorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      })}
    >
      <AppShell.Navbar p="xs" withBorder>
        <Stack gap="xs" h="100%">
          <Group justify="space-between" p="xs">
            <Group gap="xs">
              <Avatar radius="sm" color="blue" variant="light" size={28}>
                <IconRobot size={16} />
              </Avatar>
              <Box>
                <Text fw={700} size="sm">ReformedAI</Text>
              </Box>
            </Group>
            <ActionIcon onClick={handleNewChat} size="lg" variant="light" aria-label="New chat">
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
          <Divider />

          <ScrollArea style={{ flex: 1 }} type="auto" scrollbarSize={6} offsetScrollbars>
            <ChatList chats={chats} activeChatId={activeChatId} onSelectChat={setActiveChatId} />
          </ScrollArea>

          <Divider />
          <Group justify="space-between" p="xs">
            <ThemeSwitcher />
          </Group>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <ChatHistory messages={activeChat?.messages || []} viewport={viewport} onCitationClick={handleCitationClick} />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSendMessage={handleSendMessage}
          disabled={!activeChatId}
        />
      </AppShell.Main>

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="50%"
        radius="md"
        withCloseButton
        overlayProps={{ blur: 2, opacity: 0.2 }}
        title={
          <Group gap="xs">
            <IconFileText size={16} />
            <Text fw={600} size="sm">Source document</Text>
            {pdfSource && (
              <Badge size="xs" variant="light">Page {pdfSource.pageNumber}</Badge>
            )}
          </Group>
        }
      >
        {pdfSource && (
          <Stack gap="xs">
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed" truncate="end" style={{ maxWidth: '80%' }}>
                {pdfSource.file}
              </Text>
              <a href={`http://localhost:8000/static/${pdfSource.file}`} target="_blank" rel="noreferrer" aria-label="Open in new tab">
                <ActionIcon variant="subtle" size="sm">
                  <IconExternalLink size={16} />
                </ActionIcon>
              </a>
            </Group>
            <Box style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--mantine-color-body)',
              height: 'calc(100vh - 180px)'
            }}>
              <PdfViewer
                file={pdfSource.file}
                pageNumber={pdfSource.pageNumber}
                highlight={pdfSource.highlight}
              />
            </Box>
          </Stack>
        )}
      </Drawer>
    </AppShell>
  );
}

export default App;
