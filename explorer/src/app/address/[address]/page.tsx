import { provider, formatEther } from '@/lib/provider'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface AddressPageProps {
  params: Promise<{ address: string }>
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { address } = await params

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    notFound()
  }

  const [balance, txCount, code] = await Promise.all([
    provider.getBalance(address),
    provider.getTransactionCount(address),
    provider.getCode(address)
  ])

  const isContract = code !== '0x'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">地址详情</h2>
          {isContract && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
              📄 合约地址
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">地址</dt>
            <dd className="mt-1 text-sm font-mono break-all">{address}</dd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">余额</dt>
              <dd className="mt-1 text-lg font-bold text-blue-600">{formatEther(balance)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">交易数量</dt>
              <dd className="mt-1 text-lg font-bold">{txCount}</dd>
            </div>
          </div>
        </div>
      </div>

      {isContract && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">合约字节码</h3>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {code}
            </pre>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            字节码长度: {(code.length - 2) / 2} bytes
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>提示:</strong> 交易历史功能将在未来版本中添加。
          当前仅显示余额和交易数量。
        </p>
      </div>
    </div>
  )
}
