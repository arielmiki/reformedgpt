import { useState, useRef, useEffect } from 'react';
import { AppShell, ActionIcon, Box, useComputedColorScheme } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message } from './types';
import { ChatHistory } from './components/ChatHistory';
import { ChatInput } from './components/ChatInput';
import { ChatList } from './components/ChatList';
import { ThemeSwitcher } from './components/ThemeSwitcher';

function App() {

  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const viewport = useRef<HTMLDivElement>(null);

  // Load chats from local storage on initial render
  useEffect(() => {
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
    };
    setChats((prev) => ({ ...prev, [newChatId]: newChat }));
    setActiveChatId(newChatId);
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

    setChats({ ...updatedChats, [activeChatId]: { ...activeChat, messages: newMessages } });
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
      },
    }));

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages.map(({ id, ...rest }) => rest) }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const eventLines = chunk.split('\n\n').filter(line => line.startsWith('data:'));

        for (const line of eventLines) {
          const jsonStr = line.replace('data: ', '');
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'delta') {
              content += event.data;
              setChats((prev) => {
                const newMsgs = prev[activeChatId].messages.map((msg) =>
                  msg.id === botMessageId ? { ...msg, content } : msg
                );
                return { ...prev, [activeChatId]: { ...prev[activeChatId], messages: newMsgs } };
              });
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', jsonStr);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setChats((prev) => {
        const newMsgs = prev[activeChatId].messages.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: 'Error: Could not connect to the bot.' } : msg
        );
        return { ...prev, [activeChatId]: { ...prev[activeChatId], messages: newMsgs } };
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
      <AppShell.Navbar p="xs">
        <ActionIcon onClick={handleNewChat} size="lg" variant="default" mb="md">
          <IconPlus size={18} />
        </ActionIcon>
        <ChatList chats={chats} activeChatId={activeChatId} onSelectChat={setActiveChatId} />
        <Box style={{ position: 'absolute', bottom: 20, left: 10, right: 10 }}>
          <ThemeSwitcher />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <ChatHistory messages={activeChat?.messages || []} viewport={viewport} />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSendMessage={handleSendMessage}
          disabled={!activeChatId}
        />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
