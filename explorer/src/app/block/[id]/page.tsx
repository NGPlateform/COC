import Link from 'next/link'
import { provider, formatHash, formatTimestamp, formatEther } from '@/lib/provider'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface BlockPageProps {
  params: Promise<{ id: string }>
}

export default async function BlockPage({ params }: BlockPageProps) {
  const { id } = await params
  const blockNumber = parseInt(id, 10)

  if (isNaN(blockNumber)) {
    notFound()
  }

  const block = await provider.getBlock(blockNumber)
  if (!block) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">区块 #{block.number}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">区块哈希</dt>
            <dd className="mt-1 text-sm font-mono break-all">{block.hash}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">父哈希</dt>
            <dd className="mt-1 text-sm font-mono break-all">{block.parentHash}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">时间戳</dt>
            <dd className="mt-1 text-sm">{formatTimestamp(block.timestamp)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Gas Used / Limit</dt>
            <dd className="mt-1 text-sm font-mono">
              {block.gasUsed?.toString()} / {block.gasLimit?.toString()}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Nonce</dt>
            <dd className="mt-1 text-sm font-mono">{block.nonce}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">交易数量</dt>
            <dd className="mt-1 text-sm">{block.transactions.length}</dd>
          </div>
        </div>
      </div>

      {block.transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">交易列表</h3>
          <div className="space-y-2">
            {block.transactions.map((txHash) => (
              <div key={txHash} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                <Link href={`/tx/${txHash}`} className="text-blue-600 hover:text-blue-800 font-mono text-sm">
                  {formatHash(txHash)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
