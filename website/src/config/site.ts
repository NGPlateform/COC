// 双站变体单一真相源:NEXT_PUBLIC_SITE=palium(公链) | palimesh(存储)
// 同一 codebase 两次 build,导航/品牌/域名/首页/经济按变体区分。

export type SiteVariant = 'palium' | 'palimesh'

const VARIANT: SiteVariant =
  (process.env.NEXT_PUBLIC_SITE as SiteVariant) === 'palimesh' ? 'palimesh' : 'palium'

// 链基础设施只有一条链(88780),两站都链接到 palium.io 的 explorer/rpc/faucet
const CHAIN_DOMAINS = {
  explorer: 'https://explorer.palium.io',
  rpc: 'https://rpc.palium.io',
  ws: 'wss://rpc.palium.io/ws',
  faucet: 'https://faucet.palium.io',
}

export interface SiteConfig {
  variant: SiteVariant
  brand: string
  token: string // 代币符号(不含 $)
  apex: string
  chain: typeof CHAIN_DOMAINS
  logo: string
  title: string
  description: string
  // 导航项:i18n common key
  navKeys: string[]
}

const PALIUM: SiteConfig = {
  variant: 'palium',
  brand: 'Palium',
  token: 'PALI',
  apex: 'https://palium.io',
  chain: CHAIN_DOMAINS,
  logo: '/brand/palium-mark.svg',
  title: 'Palium \u00b7 Public chain for AI agents',
  description: 'Palium is a BFT blockchain purpose-built for AI agents: verifiable service (PoSe), EVM execution, and on-chain governance. Chain ID 88780. $PALI.',
  navKeys: ['technology', 'network', 'testnet', 'whitepaper', 'governance', 'economics', 'docs'],
}

const PALIMESH: SiteConfig = {
  variant: 'palimesh',
  brand: 'PaliMesh',
  token: 'MESH',
  apex: 'https://palimesh.io',
  chain: CHAIN_DOMAINS,
  logo: '/brand/logo-seal-simple.svg',
  title: 'PaliMesh \u00b7 Decentralized storage for AI agents',
  description: 'PaliMesh is a decentralized storage network for AI agents \u2014 erasure-coded P2P storage, portable identity (DID/Soul), and persistent memory, settled on Palium. $MESH.',
  navKeys: ['story', 'technology', 'services', 'identity', 'economics', 'docs'],
}

export const site: SiteConfig = VARIANT === 'palimesh' ? PALIMESH : PALIUM
export const isPalium = site.variant === 'palium'
export const isPaliMesh = site.variant === 'palimesh'
