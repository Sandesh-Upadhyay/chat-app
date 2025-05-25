"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Search,
  Filter,
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
  Home,
  Camera,
  Mic,
  X,
  ImageIcon,
  Video,
  FileText,
  Music,
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
  message_status?: "sent" | "delivered" | "read"
}

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name: string
  message_type?: string
}

export default function ChatInterface({ user }: { user: User }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentView, setCurrentView] = useState("all") // all, archived, starred, groups, notifications, settings

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker || showFileUpload) {
        setShowEmojiPicker(false)
        setShowFileUpload(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker, showFileUpload])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChats = async () => {
    try {
      // First try to load from database
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

      if (userChats && userChats.length > 0) {
        const formattedChats: Chat[] = []

        for (const participant of userChats) {
          if (participant.chats) {
            const { data: lastMessage } = await supabase
              .from("messages")
              .select("content, created_at")
              .eq("chat_id", participant.chats.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            formattedChats.push({
              id: participant.chats.id,
              name: participant.chats.name,
              last_message: lastMessage?.content || "No messages yet",
              last_message_time: lastMessage
                ? new Date(lastMessage.created_at).toLocaleDateString()
                : new Date().toLocaleDateString(),
              unread_count: 0,
              status: Math.random() > 0.5 ? "online" : "offline",
              type: participant.chats.type,
              message_status: "delivered",
            })
          }
        }

        setChats(formattedChats)
        if (formattedChats.length > 0 && !selectedChat) {
          setSelectedChat(formattedChats[0])
        }
      } else {
        // Create demo chats that match the screenshot
        await createDemoChats()
      }
    } catch (error) {
      console.error("Error loading chats:", error)
      await createDemoChats()
    }
  }

  const createDemoChats = async () => {
    try {
      const demoChats = [
        {
          name: "Test Skope Final 5",
          type: "individual",
          last_message: "Support?? This doesn't go on Tuesday...",
          status: "offline",
          message_status: "delivered",
        },
        {
          name: "Periskope Team Chat",
          type: "group",
          last_message: "Periskope: Test message",
          status: "online",
          message_status: "read",
        },
        {
          name: "+91 99999 99999",
          type: "individual",
          last_message: "Hi there, I'm Swapnika, Co-Founder of ...",
          status: "online",
          message_status: "sent",
        },
        {
          name: "Test Demo17",
          type: "individual",
          last_message: "Rohitesh: 123",
          status: "offline",
          message_status: "delivered",
        },
        {
          name: "Test El Centro",
          type: "individual",
          last_message: "Rohitesh: Hello, Ahmedgarh",
          status: "offline",
          message_status: "read",
        },
        {
          name: "Testing group",
          type: "group",
          last_message: "Testing 12345",
          status: "offline",
          message_status: "sent",
        },
        {
          name: "Yasin 3",
          type: "individual",
          last_message: "First Bulk Message",
          status: "offline",
          message_status: "delivered",
        },
        {
          name: "Test Skope Final 9473",
          type: "individual",
          last_message: "Heyy",
          status: "offline",
          message_status: "read",
        },
        {
          name: "Skope Demo",
          type: "individual",
          last_message: "Test 123",
          status: "offline",
          message_status: "sent",
        },
        {
          name: "Test Demo15",
          type: "individual",
          last_message: "Test 123",
          status: "offline",
          message_status: "delivered",
        },
      ]

      // Create chats in database
      const createdChats: Chat[] = []

      for (const [index, chat] of demoChats.entries()) {
        try {
          const { data: newChat, error: chatError } = await supabase
            .from("chats")
            .insert([{ name: chat.name, type: chat.type }])
            .select()
            .single()

          if (chatError) throw chatError

          const { error: participantError } = await supabase
            .from("chat_participants")
            .insert([{ chat_id: newChat.id, user_id: user.id }])

          if (participantError) throw participantError

          createdChats.push({
            id: newChat.id,
            name: chat.name,
            last_message: chat.last_message,
            last_message_time: "04-Feb-25",
            unread_count: 0,
            status: chat.status as "online" | "offline",
            type: chat.type as "individual" | "group",
            message_status: chat.message_status as "sent" | "delivered" | "read",
          })
        } catch (error) {
          // If database creation fails, use local data
          createdChats.push({
            id: `chat-${index}`,
            name: chat.name,
            last_message: chat.last_message,
            last_message_time: "04-Feb-25",
            unread_count: 0,
            status: chat.status as "online" | "offline",
            type: chat.type as "individual" | "group",
            message_status: chat.message_status as "sent" | "delivered" | "read",
          })
        }
      }

      setChats(createdChats)
      if (createdChats.length > 0) {
        setSelectedChat(createdChats[4]) // Select "Test El Centro" by default
      }
    } catch (error) {
      console.error("Error creating demo chats:", error)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (data && data.length > 0) {
        setMessages(data)
      } else {
        // Load demo messages for Test El Centro
        const selectedChatData = chats.find((chat) => chat.id === chatId)
        if (selectedChatData?.name === "Test El Centro") {
          const demoMessages = [
            {
              id: "1",
              chat_id: chatId,
              sender_id: "other",
              content: "CYFER",
              created_at: "2025-01-22T10:30:00Z",
              sender_name: "Test El Centro",
            },
            {
              id: "2",
              chat_id: chatId,
              sender_id: "other",
              content: "CDERT",
              created_at: "2025-01-22T10:31:00Z",
              sender_name: "Test El Centro",
            },
            {
              id: "3",
              chat_id: chatId,
              sender_id: user.id,
              content: "Periskope\nhello",
              created_at: "2025-01-22T10:32:00Z",
              sender_name: "You",
            },
            {
              id: "4",
              chat_id: chatId,
              sender_id: "other",
              content: "Hello, South Ezra!",
              created_at: "2025-01-23T09:15:00Z",
              sender_name: "Test El Centro",
            },
            {
              id: "5",
              chat_id: chatId,
              sender_id: "other",
              content: "Hello, Livonia!",
              created_at: "2025-01-23T09:16:00Z",
              sender_name: "Test El Centro",
            },
            {
              id: "6",
              chat_id: chatId,
              sender_id: user.id,
              content: "Periskope\ntest of whatsapp",
              created_at: "2025-01-23T09:17:00Z",
              sender_name: "You",
            },
            {
              id: "7",
              chat_id: chatId,
              sender_id: user.id,
              content: "Periskope\ntesting",
              created_at: "2025-01-23T09:18:00Z",
              sender_name: "You",
            },
          ]
          setMessages(demoMessages)
        } else {
          setMessages([])
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error)
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

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      chat_id: selectedChat.id,
      sender_id: user.id,
      content: newMessage.trim(),
      sender_name: user.user_metadata?.full_name || user.email,
      created_at: new Date().toISOString(),
    }

    // Add message immediately for instant UI feedback
    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage("")

    // Try to save to database in background
    try {
      const message = {
        chat_id: selectedChat.id,
        sender_id: user.id,
        content: optimisticMessage.content,
        sender_name: optimisticMessage.sender_name,
      }

      const { data, error } = await supabase.from("messages").insert([message]).select().single()

      if (error) throw error

      // Update the optimistic message with the real one from database
      setMessages((prev) => prev.map((msg) => (msg.id === optimisticMessage.id ? { ...data, id: data.id } : msg)))
    } catch (error) {
      console.error("Error sending message:", error)
      // Keep the optimistic message since database failed
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileUpload = (type: "image" | "video" | "document" | "audio") => {
    const input = document.createElement("input")
    input.type = "file"

    switch (type) {
      case "image":
        input.accept = "image/*"
        break
      case "video":
        input.accept = "video/*"
        break
      case "document":
        input.accept = ".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
        break
      case "audio":
        input.accept = "audio/*"
        break
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB")
          return
        }

        const fileMessage = `📎 Shared ${type}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`

        const optimisticMessage: Message = {
          id: crypto.randomUUID(),
          chat_id: selectedChat!.id,
          sender_id: user.id,
          content: fileMessage,
          sender_name: user.user_metadata?.full_name || user.email,
          message_type: type,
          created_at: new Date().toISOString(),
        }

        // Add message immediately
        setMessages((prev) => [...prev, optimisticMessage])
        setShowFileUpload(false)

        // Save to database in background
        try {
          const message = {
            chat_id: selectedChat!.id,
            sender_id: user.id,
            content: fileMessage,
            sender_name: user.user_metadata?.full_name || user.email,
            message_type: type,
          }

          const { data, error } = await supabase.from("messages").insert([message]).select().single()
          if (error) throw error

          // Update with real message from database
          setMessages((prev) => prev.map((msg) => (msg.id === optimisticMessage.id ? { ...data, id: data.id } : msg)))
        } catch (error) {
          console.error("Error uploading file:", error)
          // Keep optimistic message
        }
      }
    }
    input.click()
  }

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false)

      const voiceMessage = "🎤 Voice message recorded"
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        chat_id: selectedChat!.id,
        sender_id: user.id,
        content: voiceMessage,
        sender_name: user.user_metadata?.full_name || user.email,
        message_type: "audio",
        created_at: new Date().toISOString(),
      }

      // Add message immediately
      setMessages((prev) => [...prev, optimisticMessage])

      // Save to database in background
      try {
        const message = {
          chat_id: selectedChat!.id,
          sender_id: user.id,
          content: voiceMessage,
          sender_name: user.user_metadata?.full_name || user.email,
          message_type: "audio",
        }

        supabase
          .from("messages")
          .insert([message])
          .select()
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setMessages((prev) =>
                prev.map((msg) => (msg.id === optimisticMessage.id ? { ...data, id: data.id } : msg)),
              )
            }
          })
      } catch (error) {
        console.error("Error saving voice message:", error)
      }
    } else {
      setIsRecording(true)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Search functionality would filter chats and messages
  }

  const handleNavigation = (view: string) => {
    setCurrentView(view)

    switch (view) {
      case "archived":
        // In a real app, you'd filter archived chats from database
        alert("Archived chats - No archived conversations found")
        break
      case "starred":
        // Filter starred chats (demo: show chats with "Test" in name)
        const starredChats = chats.filter((chat) => chat.name.includes("Test"))
        console.log("Starred chats:", starredChats)
        if (starredChats.length > 0) {
          setSelectedChat(starredChats[0])
        }
        break
      case "groups":
        // Filter and show only group chats
        const groupChats = chats.filter((chat) => chat.type === "group")
        console.log("Group chats:", groupChats)
        if (groupChats.length > 0) {
          setSelectedChat(groupChats[0])
          alert(`Found ${groupChats.length} group chats`)
        } else {
          alert("No group chats found")
        }
        break
      case "notifications":
        alert(
          "🔔 Notification Settings\n\n✅ Message notifications: ON\n✅ Sound alerts: ON\n✅ Desktop notifications: ON\n⚠️ Do not disturb: OFF",
        )
        break
      case "settings":
        alert(
          "⚙️ Settings Panel\n\n👤 Profile Settings\n🔒 Privacy & Security\n💬 Chat Settings\n🌙 Dark Mode: OFF\n📱 App Preferences",
        )
        break
      default:
        console.log("Showing all chats")
        break
    }
  }

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message.toLowerCase().includes(searchQuery.toLowerCase())

    switch (currentView) {
      case "groups":
        return matchesSearch && chat.type === "group"
      case "starred":
        return matchesSearch && chat.name.includes("Test") // Demo logic for starred
      case "archived":
        return false // No archived chats in demo
      default:
        return matchesSearch
    }
  })

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case "sent":
        return "✓"
      case "delivered":
        return "✓✓"
      case "read":
        return "✓✓"
      default:
        return ""
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-500 text-white text-xs">
                  {user.user_metadata?.full_name?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">chats</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => loadChats()}>
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
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Custom Filter</Badge>
            <Button variant="ghost" size="sm" className="text-xs h-6">
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
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-8 text-sm"
          />
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col py-2 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "all" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("all")}
          >
            <Home className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">All Chats</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "archived" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("archived")}
          >
            <Archive className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Archived</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "starred" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("starred")}
          >
            <Star className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Starred</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "groups" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("groups")}
          >
            <Users className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Groups</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "notifications" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("notifications")}
          >
            <Bell className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`justify-start h-10 px-4 mx-2 rounded-lg ${
              currentView === "settings" ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
            }`}
            onClick={() => handleNavigation("settings")}
          >
            <Settings className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Settings</span>
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
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
                      {chat.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.status === "online" && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">{chat.last_message_time}</span>
                      {chat.message_status && (
                        <span className="text-xs text-gray-400">{getMessageStatusIcon(chat.message_status)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 truncate">{chat.last_message}</p>
                    {chat.unread_count > 0 && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-xs h-5 w-5 rounded-full p-0">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    {chat.type === "group" && <Users className="h-3 w-3 text-gray-400 mr-1" />}
                    <span className="text-xs text-gray-400">{chat.type === "group" ? "Group" : "Individual"}</span>
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
                    <AvatarFallback className="bg-gray-300 text-gray-700">
                      {selectedChat.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-base">{selectedChat.name}</h2>
                    <p className="text-sm text-gray-500">
                      Test Skope Jaipur, Rajasthan Jio, Sector Kumar Ramesh, Faridabad
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">A</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-green-500 text-white text-xs">B</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-purple-500 text-white text-xs">C</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500">+3</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === user.id
                const showDate =
                  index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? "text-green-100" : "text-gray-500"} text-right`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Button variant="ghost" size="sm" onClick={() => setShowFileUpload(!showFileUpload)}>
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  {showFileUpload && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                      <div className="text-xs text-gray-500 mb-2">Attach file</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleFileUpload("image")}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                          type="button"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span>Photo</span>
                        </button>
                        <button
                          onClick={() => handleFileUpload("video")}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                          type="button"
                        >
                          <Video className="h-4 w-4" />
                          <span>Video</span>
                        </button>
                        <button
                          onClick={() => handleFileUpload("document")}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                          type="button"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Document</span>
                        </button>
                        <button
                          onClick={() => handleFileUpload("audio")}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                          type="button"
                        >
                          <Music className="h-4 w-4" />
                          <span>Audio</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleFileUpload("image")}>
                  <Camera className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-16 rounded-full"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-6 w-6 p-0"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}>
                        <div
                          className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 w-96 max-h-80 overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-3 sticky top-0 bg-white">
                            <span className="text-sm font-medium text-gray-700">Choose an emoji</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowEmojiPicker(false)}
                              className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {/* Recently Used */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">Recently Used</div>
                              <div className="grid grid-cols-8 gap-1">
                                {["😀", "👍", "❤️", "😂", "🔥", "💯", "🎉", "😍"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Smileys & People */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">😀 Smileys & People</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "😀",
                                  "😃",
                                  "😄",
                                  "😁",
                                  "😆",
                                  "😅",
                                  "🤣",
                                  "😂",
                                  "🙂",
                                  "🙃",
                                  "😉",
                                  "😊",
                                  "😇",
                                  "🥰",
                                  "😍",
                                  "🤩",
                                  "😘",
                                  "😗",
                                  "😚",
                                  "😙",
                                  "😋",
                                  "😛",
                                  "😜",
                                  "🤪",
                                  "😝",
                                  "🤑",
                                  "🤗",
                                  "🤭",
                                  "🤫",
                                  "🤔",
                                  "🤐",
                                  "🤨",
                                  "😐",
                                  "😑",
                                  "😶",
                                  "😏",
                                  "😒",
                                  "🙄",
                                  "😬",
                                  "🤥",
                                  "😔",
                                  "😪",
                                  "🤤",
                                  "😴",
                                  "😷",
                                  "🤒",
                                  "🤕",
                                  "🤢",
                                  "🤮",
                                  "🤧",
                                  "🥵",
                                  "🥶",
                                  "🥴",
                                  "😵",
                                  "🤯",
                                  "🤠",
                                  "🥳",
                                  "😎",
                                  "🤓",
                                  "🧐",
                                  "😕",
                                  "😟",
                                  "🙁",
                                  "☹️",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Animals & Nature */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">🐶 Animals & Nature</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🐶",
                                  "🐱",
                                  "🐭",
                                  "🐹",
                                  "🐰",
                                  "🦊",
                                  "🐻",
                                  "🐼",
                                  "🐨",
                                  "🐯",
                                  "🦁",
                                  "🐮",
                                  "🐷",
                                  "🐽",
                                  "🐸",
                                  "🐵",
                                  "🙈",
                                  "🙉",
                                  "🙊",
                                  "🐒",
                                  "🐔",
                                  "🐧",
                                  "🐦",
                                  "🐤",
                                  "🐣",
                                  "🐥",
                                  "🦆",
                                  "🦅",
                                  "🦉",
                                  "🦇",
                                  "🐺",
                                  "🐗",
                                  "🐴",
                                  "🦄",
                                  "🐝",
                                  "🐛",
                                  "🦋",
                                  "🐌",
                                  "🐞",
                                  "🐜",
                                  "🦟",
                                  "🦗",
                                  "🕷️",
                                  "🕸️",
                                  "🦂",
                                  "🐢",
                                  "🐍",
                                  "🦎",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Food & Drink */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">🍎 Food & Drink</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🍎",
                                  "🍐",
                                  "🍊",
                                  "🍋",
                                  "🍌",
                                  "🍉",
                                  "🍇",
                                  "🍓",
                                  "🫐",
                                  "🍈",
                                  "🍒",
                                  "🍑",
                                  "🥭",
                                  "🍍",
                                  "🥥",
                                  "🥝",
                                  "🍅",
                                  "🍆",
                                  "🥑",
                                  "🥦",
                                  "🥬",
                                  "🥒",
                                  "🌶️",
                                  "🫑",
                                  "🌽",
                                  "🥕",
                                  "🫒",
                                  "🧄",
                                  "🧅",
                                  "🥔",
                                  "🍠",
                                  "🥐",
                                  "🍞",
                                  "🥖",
                                  "🥨",
                                  "🧀",
                                  "🥚",
                                  "🍳",
                                  "🧈",
                                  "🥞",
                                  "🧇",
                                  "🥓",
                                  "🥩",
                                  "🍗",
                                  "🍖",
                                  "🦴",
                                  "🌭",
                                  "🍔",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Activities */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">⚽ Activities</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "⚽",
                                  "🏀",
                                  "🏈",
                                  "⚾",
                                  "🥎",
                                  "🎾",
                                  "🏐",
                                  "🏉",
                                  "🥏",
                                  "🎱",
                                  "🪀",
                                  "🏓",
                                  "🏸",
                                  "🏒",
                                  "🏑",
                                  "🥍",
                                  "🏏",
                                  "🪃",
                                  "🥅",
                                  "⛳",
                                  "🪁",
                                  "🏹",
                                  "🎣",
                                  "🤿",
                                  "🥊",
                                  "🥋",
                                  "🎽",
                                  "🛹",
                                  "🛷",
                                  "⛸️",
                                  "🥌",
                                  "🎿",
                                  "⛷️",
                                  "🏂",
                                  "🪂",
                                  "🏋️",
                                  "🤼",
                                  "🤸",
                                  "⛹️",
                                  "🤺",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Travel & Places */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">🚗 Travel & Places</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🚗",
                                  "🚕",
                                  "🚙",
                                  "🚌",
                                  "🚎",
                                  "🏎️",
                                  "🚓",
                                  "🚑",
                                  "🚒",
                                  "🚐",
                                  "🛻",
                                  "🚚",
                                  "🚛",
                                  "🚜",
                                  "🏍️",
                                  "🛵",
                                  "🚲",
                                  "🛴",
                                  "🛹",
                                  "🛼",
                                  "🚁",
                                  "🛸",
                                  "✈️",
                                  "🛩️",
                                  "🪂",
                                  "⛵",
                                  "🚤",
                                  "🛥️",
                                  "🛳️",
                                  "⛴️",
                                  "🚢",
                                  "⚓",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Objects */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">💎 Objects</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "⌚",
                                  "📱",
                                  "📲",
                                  "💻",
                                  "⌨️",
                                  "🖥️",
                                  "🖨️",
                                  "🖱️",
                                  "🖲️",
                                  "🕹️",
                                  "🗜️",
                                  "💽",
                                  "💾",
                                  "💿",
                                  "📀",
                                  "📼",
                                  "📷",
                                  "📸",
                                  "📹",
                                  "🎥",
                                  "📽️",
                                  "🎞️",
                                  "📞",
                                  "☎️",
                                  "📟",
                                  "📠",
                                  "📺",
                                  "📻",
                                  "🎙️",
                                  "🎚️",
                                  "🎛️",
                                  "🧭",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Symbols */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">❤️ Symbols</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "❤️",
                                  "🧡",
                                  "💛",
                                  "💚",
                                  "💙",
                                  "💜",
                                  "🖤",
                                  "🤍",
                                  "🤎",
                                  "💔",
                                  "❣️",
                                  "💕",
                                  "💞",
                                  "💓",
                                  "💗",
                                  "💖",
                                  "💘",
                                  "💝",
                                  "💟",
                                  "☮️",
                                  "✝️",
                                  "☪️",
                                  "🕉️",
                                  "☸️",
                                  "✡️",
                                  "🔯",
                                  "🕎",
                                  "☯️",
                                  "☦️",
                                  "🛐",
                                  "⛎",
                                  "♈",
                                  "♉",
                                  "♊",
                                  "♋",
                                  "♌",
                                  "♍",
                                  "♎",
                                  "♏",
                                  "♐",
                                  "♑",
                                  "♒",
                                  "♓",
                                  "🆔",
                                  "⚛️",
                                  "🉑",
                                  "☢️",
                                  "☣️",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Flags */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-2">🏁 Flags</div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🏁",
                                  "🚩",
                                  "🎌",
                                  "🏴",
                                  "🏳️",
                                  "🏳️‍🌈",
                                  "🏳️‍⚧️",
                                  "🏴‍☠️",
                                  "🇦🇫",
                                  "🇦🇱",
                                  "🇩🇿",
                                  "🇦🇸",
                                  "🇦🇩",
                                  "🇦🇴",
                                  "🇦🇮",
                                  "🇦🇶",
                                  "🇦🇬",
                                  "🇦🇷",
                                  "🇦🇲",
                                  "🇦🇼",
                                  "🇦🇺",
                                  "🇦🇹",
                                  "🇦🇿",
                                  "🇧🇸",
                                  "🇧🇭",
                                  "🇧🇩",
                                  "🇧🇧",
                                  "🇧🇾",
                                  "🇧🇪",
                                  "🇧🇿",
                                  "🇧🇯",
                                  "🇧🇲",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setNewMessage((prev) => prev + emoji)
                                      // Don't close picker immediately, let user add multiple emojis
                                    }}
                                    className="text-xl hover:bg-gray-100 rounded-lg p-2 transition-colors flex items-center justify-center"
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${isRecording ? "text-red-500" : ""}`}
                      onClick={handleVoiceRecording}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-500 hover:bg-green-600 rounded-full h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
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
