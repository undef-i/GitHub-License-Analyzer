import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'antd/dist/reset.css'
import { ConfigProvider } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GitHub License Analyzer',
  description: 'Analyze the distribution of open source licenses in GitHub repositories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}