"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
      <Toaster position="bottom-right" theme="dark" />
    </Providers>
  )
}
