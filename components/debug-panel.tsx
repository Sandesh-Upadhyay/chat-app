"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugPanelProps {
  user: any
}

export default function DebugPanel({ user }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const checkDatabase = async () => {
    setLoading(true)
    try {
      // Check chats
      const { data: chats, error: chatsError } = await supabase.from("chats").select("*")

      // Check participants
      const { data: participants, error: participantsError } = await supabase.from("chat_participants").select("*")

      // Check messages
      const { data: messages, error: messagesError } = await supabase.from("messages").select("*")

      setDebugInfo({
        user: user,
        chats: { data: chats, error: chatsError },
        participants: { data: participants, error: participantsError },
        messages: { data: messages, error: messagesError },
      })
    } catch (error) {
      console.error("Debug error:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTestChat = async () => {
    try {
      // Create a test chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert([{ name: "Test Chat " + Date.now(), type: "individual" }])
        .select()
        .single()

      if (chatError) throw chatError

      // Add user as participant
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert([{ chat_id: newChat.id, user_id: user.id }])

      if (participantError) throw participantError

      alert("Test chat created successfully!")
      checkDatabase()
    } catch (error) {
      console.error("Error creating test chat:", error)
      alert("Error creating test chat: " + (error as any).message)
    }
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={checkDatabase} disabled={loading}>
            {loading ? "Checking..." : "Check Database"}
          </Button>
          <Button onClick={createTestChat} variant="outline">
            Create Test Chat
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-2">
            <div>
              <strong>User ID:</strong> {debugInfo.user?.id}
            </div>
            <div>
              <strong>Total Chats:</strong> {debugInfo.chats?.data?.length || 0}
            </div>
            <div>
              <strong>Total Participants:</strong> {debugInfo.participants?.data?.length || 0}
            </div>
            <div>
              <strong>Total Messages:</strong> {debugInfo.messages?.data?.length || 0}
            </div>

            {debugInfo.chats?.error && (
              <div className="text-red-600">
                <strong>Chats Error:</strong> {debugInfo.chats.error.message}
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Raw Data</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
