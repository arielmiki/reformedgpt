import { useState, useRef, useEffect } from 'react';
import { TextInput, ActionIcon, ScrollArea, Paper, Text, Group, AppShell, NavLink, Avatar, Switch, useMantineColorScheme, useComputedColorScheme, Box } from '@mantine/core';
import { IconSend, IconMessageCircle, IconPlus, IconSun, IconMoon, IconUser, IconRobot } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

function App() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

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
          text: 'Hello! How can I help you today?',
          sender: 'bot',
        },
      ],
    };
    setChats((prev) => ({ ...prev, [newChatId]: newChat }));
    setActiveChatId(newChatId);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeChatId) return;

    const userMessage: Message = {
      id: uuidv4(),
      text: inputValue,
      sender: 'user',
    };

    const updatedChats = { ...chats };
    const activeChat = updatedChats[activeChatId];
    activeChat.messages.push(userMessage);

    // Update chat title if it's the first user message
    if (activeChat.messages.filter(m => m.sender === 'user').length === 1) {
      activeChat.title = inputValue.substring(0, 30);
    }

    setChats(updatedChats);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: uuidv4(),
        text: `I'm a bot, I received: "${inputValue}"`, // Replace with actual bot logic
        sender: 'bot',
      };
      const currentChats = { ...chats };
      currentChats[activeChatId].messages.push(botMessage);
      setChats(currentChats);
    }, 1000);
  };

  const activeChat = activeChatId ? chats[activeChatId] : null;

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
        <ScrollArea style={{ flex: 1 }}>
          {Object.values(chats).map((chat) => (
            <NavLink
              key={chat.id}
              href="#"
              label={<Text truncate="end">{chat.title}</Text>}
              leftSection={<IconMessageCircle size="1rem" stroke={1.5} />}
              active={chat.id === activeChatId}
              onClick={() => setActiveChatId(chat.id)}
            />
          ))}
        </ScrollArea>
        <Box style={{ position: 'absolute', bottom: 20, left: 10, right: 10 }}>
          <Group>
            <IconSun size={18} />
            <Switch
              checked={computedColorScheme === 'dark'}
              onChange={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              size="md"
            />
            <IconMoon size={18} />
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
            {activeChat?.messages.map((message) => {
              const isUser = message.sender === 'user';
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
                    <Text size="sm">{message.text}</Text>
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

        <Paper bg="transparent" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '16px 0' }}>
          <Group>
            <TextInput
              style={{ flex: 1 }}
              placeholder="Type your message..."
              value={inputValue}
              onChange={(event) => setInputValue(event.currentTarget.value)}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              radius="xl"
              size="md"
              disabled={!activeChatId}
            />
            <ActionIcon size="xl" onClick={handleSendMessage} variant="filled" color="blue" radius="xl" disabled={!activeChatId}>
              <IconSend size={22} />
            </ActionIcon>
          </Group>
        </Paper>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
