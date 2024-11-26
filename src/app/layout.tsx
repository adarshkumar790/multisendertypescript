import './globals.css'
import { type ReactNode } from 'react'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'

import { getConfig } from './config'
import { Providers } from './providers'
import Header from '@/components/Header'

export default function Layout({ children }: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    // headers().get('cookie')
  )
  return (
    <html lang="en">
      <body>

        <Providers initialState={initialState}>
          <Header/>
          {children}
        </Providers>
      </body>
    </html>
  )
}