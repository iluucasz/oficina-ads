import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SettingsProvider } from "@/context/settings-context"
import { ProductsProvider } from "@/context/products-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SettingsMenu } from "@/components/settings-menu"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>
            <ProductsProvider>
              <div className="flex h-screen bg-background">
                <AppSidebar />
                <div className="flex-1 pl-64">
                  <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
                </div>
                <SettingsMenu />
              </div>
            </ProductsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </div>
  )
}
