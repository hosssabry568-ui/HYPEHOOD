import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Initialize conversation
  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!res.ok) throw new Error("Failed to start chat");
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      // Add initial greeting
      setMessages([
        {
          role: "assistant",
          content: "Welcome to HYPEHOOD. I'm your AI stylist. Looking for something fresh?",
        },
      ]);
    },
  });

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Ensure conversation exists
    let currentId = conversationId;
    if (!currentId) {
      const conv = await initMutation.mutateAsync();
      currentId = conv.id;
    }

    // Add user message immediately
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Start SSE request
      const res = await fetch(`/api/conversations/${currentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      // Add placeholder for assistant
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMsg += data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantMsg;
                  return newMsgs;
                });
              }
              if (data.done) {
                setIsThinking(false);
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I lost connection to the server. Please try again." },
      ]);
      setIsThinking(false);
    }
  };

  return {
    messages,
    sendMessage,
    isThinking,
    initChat: () => !conversationId && initMutation.mutate(),
  };
}
