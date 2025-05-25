"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Send,
  Archive,
  Star,
  Settings,
  Users,
  MessageCircle,
  Bell,
  HelpCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

interface Chat {
  id: string
  name: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: "online" | "offline"
  avatar?: string
  type: "individual" | "group"
}

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name: string
}

export default function ChatInterface({ user }: { user: User }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadChats()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChats = async () => {
    try {
      // Try to load real chats from database first
      const { data: userChats, error: chatsError } = await supabase
        .from("chat_participants")
        .select(`
        chats (
          id,
          name,
          type,
          created_at
        )
      `)
        .eq("user_id", user.id)

      if (chatsError) throw chatsError

      if (userChats && userChats.length > 0) {
        // Convert database chats to our Chat interface
        const formattedChats: Chat[] = userChats.map((participant: any) => ({
          id: participant.chats.id,
          name: participant.chats.name,
          last_message: "No messages yet",
          last_message_time: new Date().toLocaleDateString(),
          unread_count: 0,
          status: "offline" as const,
          type: participant.chats.type,
        }))

        setChats(formattedChats)
        if (formattedChats.length > 0) {
          setSelectedChat(formattedChats[0])
        }
      } else {
        // Create some demo chats if none exist
        await createDemoChats()
      }
    } catch (error) {
      console.error("Error loading chats:", error)
      // Fallback to creating demo chats
      await createDemoChats()
    }
  }

  const createDemoChats = async () => {
    try {
      // Create demo chats
      const demoChats = [
        { name: "Test Skope Final 5", type: "individual" },
        { name: "Periskope Team Chat", type: "group" },
        { name: "+91 99999 99999", type: "individual" },
        { name: "Test Demo17", type: "individual" },
        { name: "Test El Centro", type: "individual" },
      ]

      const createdChats: Chat[] = []

      for (const chat of demoChats) {
        // Create chat
        const { data: newChat, error: chatError } = await supabase
          .from("chats")
          .insert([{ name: chat.name, type: chat.type }])
          .select()
          .single()

        if (chatError) throw chatError

        // Add current user as participant
        const { error: participantError } = await supabase
          .from("chat_participants")
          .insert([{ chat_id: newChat.id, user_id: user.id }])

        if (participantError) throw participantError

        createdChats.push({
          id: newChat.id,
          name: newChat.name,
          last_message: "Start a conversation...",
          last_message_time: new Date().toLocaleDateString(),
          unread_count: 0,
          status: "offline",
          type: newChat.type,
        })
      }

      setChats(createdChats)
      if (createdChats.length > 0) {
        setSelectedChat(createdChats[0])
      }
    } catch (error) {
      console.error("Error creating demo chats:", error)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      // Set empty messages array if there's an error
      setMessages([])
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMessage = payload.new as Message
        setMessages((prev) => [...prev, newMessage])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    const message = {
      chat_id: selectedChat.id,
      sender_id: user.id,
      content: newMessage.trim(),
      sender_name: user.user_metadata?.full_name || user.email,
    }

    try {
      const { data, error } = await supabase.from("messages").insert([message]).select().single()

      if (error) throw error

      // Message will be added via real-time subscription
    } catch (error) {
      console.error("Error sending message:", error)
      // Add message locally as fallback
      const localMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, localMessage])
    }

    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-500 text-white">
                  {user.user_metadata?.full_name?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">chats</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500">5 / 8 phones</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 mb-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Custom Filter
            </Badge>
            <Button variant="ghost" size="sm" className="text-xs">
              Save
            </Button>
            <div className="flex items-center space-x-1 ml-auto">
              <Search className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Search</span>
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Filters</span>
            </div>
          </div>

          {/* Search */}
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col p-2 border-b border-gray-200">
          <Button variant="ghost" size="sm" className="justify-start">
            <MessageCircle className="h-4 w-4 mr-2" />
            All Chats
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Star className="h-4 w-4 mr-2" />
            Starred
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Groups
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedChat?.id === chat.id ? "bg-green-50 border-l-4 border-l-green-500" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-300">{chat.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {chat.status === "online" && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500">{chat.last_message_time}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-1">{chat.last_message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
                      {chat.type === "group" && <Users className="h-3 w-3 text-gray-400" />}
                      <span className="text-xs text-gray-400">{chat.type === "group" ? "Group" : "Individual"}</span>
                    </div>
                    {chat.unread_count > 0 && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-300">{selectedChat.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium">{selectedChat.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === "group" ? "Group chat" : "Individual chat"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user.id ? "bg-green-500 text-white" : "bg-white border border-gray-200"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender_id === user.id ? "text-green-100" : "text-gray-500"}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                  />
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-green-500 hover:bg-green-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
