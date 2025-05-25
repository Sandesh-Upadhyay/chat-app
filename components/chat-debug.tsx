"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface ChatDebugProps {
  user: any
  onChatsReloaded: () => void
}

export default function ChatDebug({ user, onChatsReloaded }: ChatDebugProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const debugChats = async () => {
    setLoading(true)
    try {
      // Check what's in the database
      const { data: allChats } = await supabase.from("chats").select("*")
      const { data: allParticipants } = await supabase.from("chat_participants").select("*")
      const { data: userParticipants } = await supabase.from("chat_participants").select("*").eq("user_id", user.id)

      console.log("=== CHAT DEBUG ===")
      console.log("All chats:", allChats)
      console.log("All participants:", allParticipants)
      console.log("User participants:", userParticipants)
      console.log("User ID:", user.id)

      // Force reload chats
      onChatsReloaded()
    } catch (error) {
      console.error("Debug error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={debugChats} disabled={loading} className="mb-2">
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      Debug Chats
    </Button>
  )
}
