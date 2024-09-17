'use client'

import React from 'react'
import { AzuroSDKProvider, LiveProvider, ChainId } from '@azuro-org/sdk'
import { RainbowKitProvider, getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygon, gnosis } from 'viem/chains'
import { BetslipProvider } from '@/context/betslip'

const { wallets } = getDefaultWallets()

const chains = [
  polygon,
  gnosis,
] as const

const wagmiConfig = getDefaultConfig({
  appName: 'Azuro',
  appIcon: 'https://path-to-your-icon.com/icon.png',
  projectId: '2f82a1608c73932cfc64ff51aa38a87b', // get your own project ID - https://cloud.walletconnect.com/sign-in
  wallets,
  chains,
})

const queryClient = new QueryClient()

type ProvidersProps = {
  children: React.ReactNode
  initialChainId?: string
  initialLiveState?: boolean
}

export function Providers(props: ProvidersProps) {
  const { children, initialChainId, initialLiveState } = props

  const chainId = initialChainId
    ? chains.find(chain => chain.id === +initialChainId) ? +initialChainId as ChainId : polygon.id
    : polygon.id

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AzuroSDKProvider initialChainId={chainId}>
            <LiveProvider initialLiveState={initialLiveState}>
              <BetslipProvider>
                {children}
              </BetslipProvider>
            </LiveProvider>
          </AzuroSDKProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}