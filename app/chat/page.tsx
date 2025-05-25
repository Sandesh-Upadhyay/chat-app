"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import ChatInterface from "@/components/chat-interface"
import ChatDebug from "@/components/chat-debug"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [chatReloadKey, setChatReloadKey] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (!user) {
        router.push("/")
      }
    }

    getUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <div className="p-4">
          <ChatDebug user={user} onChatsReloaded={() => setChatReloadKey((prev) => prev + 1)} />
        </div>
      )}
      <ChatInterface key={chatReloadKey} user={user} />
    </>
  )
}
