'use client'

import { SessionProvider } from "next-auth/react"
import { CountryProvider } from "@/contexts/CountryContext"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CountryProvider>
                {children}
            </CountryProvider>
        </SessionProvider>
    )
}
