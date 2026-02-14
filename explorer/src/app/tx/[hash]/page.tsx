import Link from 'next/link'
import { provider, formatAddress, formatEther } from '@/lib/provider'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface TxPageProps {
  params: Promise<{ hash: string }>
}

export default async function TxPage({ params }: TxPageProps) {
  const { hash } = await params

  const [tx, receipt] = await Promise.all([
    provider.getTransaction(hash),
    provider.getTransactionReceipt(hash)
  ])

  if (!tx) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">交易详情</h2>
          {receipt && (
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              receipt.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {receipt.status === 1 ? '✅ 成功' : '❌ 失败'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">交易哈希</dt>
            <dd className="mt-1 text-sm font-mono break-all">{tx.hash}</dd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">区块号</dt>
              <dd className="mt-1 text-sm">
                {tx.blockNumber ? (
                  <Link href={`/block/${tx.blockNumber}`} className="text-blue-600 hover:text-blue-800">
                    #{tx.blockNumber}
                  </Link>
                ) : '待确认'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Nonce</dt>
              <dd className="mt-1 text-sm font-mono">{tx.nonce}</dd>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">From</dt>
              <dd className="mt-1 text-sm">
                <Link href={`/address/${tx.from}`} className="text-blue-600 hover:text-blue-800 font-mono">
                  {formatAddress(tx.from)}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">To</dt>
              <dd className="mt-1 text-sm">
                {tx.to ? (
                  <Link href={`/address/${tx.to}`} className="text-blue-600 hover:text-blue-800 font-mono">
                    {formatAddress(tx.to)}
                  </Link>
                ) : <span className="text-gray-500">[合约创建]</span>}
              </dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Value</dt>
            <dd className="mt-1 text-sm font-mono">{formatEther(tx.value)}</dd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Gas Limit</dt>
              <dd className="mt-1 text-sm font-mono">{tx.gasLimit?.toString()}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Gas Price</dt>
              <dd className="mt-1 text-sm font-mono">{tx.gasPrice?.toString()}</dd>
            </div>

            {receipt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Gas Used</dt>
                <dd className="mt-1 text-sm font-mono">{receipt.gasUsed?.toString()}</dd>
              </div>
            )}
          </div>

          {tx.data && tx.data !== '0x' && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Input Data</dt>
              <dd className="mt-1 text-xs font-mono bg-gray-50 p-3 rounded break-all">{tx.data}</dd>
            </div>
          )}
        </div>
      </div>

      {receipt && receipt.logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">事件日志 ({receipt.logs.length})</h3>
          <div className="space-y-3">
            {receipt.logs.map((log, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Address:</span>{' '}
                    <code className="text-xs">{log.address}</code>
                  </div>
                  <div>
                    <span className="font-medium">Topics:</span>
                    <div className="mt-1 space-y-1">
                      {log.topics.map((topic, j) => (
                        <div key={j} className="text-xs font-mono bg-white p-2 rounded">{topic}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>
                    <div className="text-xs font-mono bg-white p-2 rounded mt-1 break-all">{log.data}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
