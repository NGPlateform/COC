import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "COC Explorer - ChainOfClaw Block Explorer",
  description: "Explore blocks, transactions, and addresses on the COC blockchain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold">COC Explorer</h1>
                  <span className="text-sm opacity-75">ChainOfClaw Block Explorer</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4 text-center text-sm">
              <p>© 2026 COC Explorer | ChainID: 18780</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
