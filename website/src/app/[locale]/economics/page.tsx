'use client'

import { useTranslations } from 'next-intl'
import { site } from '@/config/site'
import { PageHero, AntiqueDivider, SectionHead } from '@/components/shared/Manuscript'
import { SealInk } from '@/components/ink/InkArt'

type Fact = { k: string; v: string }
type Point = { title: string; body: string }
type Alloc = { label: string; value: string }

export default function EconomicsPage() {
  const t = useTranslations(`economics.${site.variant}`)
  const facts = t.raw('facts') as Fact[]
  const points = t.raw('points') as Point[]
  const allocation = t.raw('allocation') as Alloc[]

  return (
    <div className="relative">
      <PageHero
        kicker={t('kicker')}
        title={t('title')}
        subtitle={t('subtitle')}
        mark={<SealInk size={40} />}
      />

      {/* 事实速览 */}
      <AntiqueDivider />
      <section className="mb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="vellum-card p-7">
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {facts.map((f, i) => (
                <div key={i} className="flex items-baseline justify-between border-b border-line pb-2">
                  <dt className="text-sm text-text-muted">{f.k}</dt>
                  <dd className="font-mono text-sm text-text-primary">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 机制/效用 */}
      <AntiqueDivider />
      <section className="mb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <SectionHead kicker={t('pointsKicker')} title={t('pointsTitle')} subtitle={t('pointsSubtitle')} />
          <div className="grid md:grid-cols-2 gap-6">
            {points.map((p, i) => (
              <div key={i} className="vellum-card p-6">
                <div className="font-mono text-xs text-accent-purple/70 mb-2">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 供应分配(仅当有数据) */}
      {allocation.length > 0 && (
        <>
          <AntiqueDivider />
          <section className="mb-16">
            <div className="container mx-auto px-4 max-w-3xl">
              <SectionHead kicker={t('allocKicker')} title={t('allocTitle')} subtitle={t('allocSubtitle')} />
              <div className="vellum-card p-7 space-y-3">
                {allocation.map((a, i) => (
                  <div key={i} className="flex items-baseline justify-between border-b border-line pb-2 last:border-0">
                    <span className="text-sm text-text-primary">{a.label}</span>
                    <span className="font-mono text-sm text-accent-purple">{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
