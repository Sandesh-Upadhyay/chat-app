"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Upload, FileIcon, ImageIcon, Video, Music } from "lucide-react"

interface FileUploadProps {
  chatId: string
  userId: string
  userName: string
  onFileUploaded: () => void
  onClose: () => void
}

export default function FileUpload({ chatId, userId, userName, onFileUploaded, onClose }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClientComponentClient()

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // In a real app, you would upload to Supabase Storage here
      // const { data, error } = await supabase.storage
      //   .from('chat-files')
      //   .upload(`${chatId}/${Date.now()}-${file.name}`, file)

      // For demo purposes, we'll just create a message
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const fileMessage = `📎 ${getFileIcon(type)} ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`

      const message = {
        chat_id: chatId,
        sender_id: userId,
        content: fileMessage,
        sender_name: userName,
        message_type: type,
      }

      const { error } = await supabase.from("messages").insert([message])

      if (error) throw error

      setUploadProgress(100)
      setTimeout(() => {
        onFileUploaded()
        onClose()
      }, 500)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error uploading file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️"
      case "video":
        return "🎥"
      case "audio":
        return "🎵"
      default:
        return "📄"
    }
  }

  const createFileInput = (accept: string, type: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB")
          return
        }
        handleFileUpload(file, type)
      }
    }
    input.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share File</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {uploading ? (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Uploading file...</p>
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-center text-gray-500">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => createFileInput("image/*", "image")}
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-sm">Photo</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => createFileInput("video/*", "video")}
            >
              <Video className="h-6 w-6" />
              <span className="text-sm">Video</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => createFileInput("audio/*", "audio")}
            >
              <Music className="h-6 w-6" />
              <span className="text-sm">Audio</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => createFileInput(".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx", "document")}
            >
              <FileIcon className="h-6 w-6" />
              <span className="text-sm">Document</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
