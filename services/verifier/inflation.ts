// Inflation schedule: annualized rate decreases over time
// Year 1: 8%, Year 2: 6%, Year 3: 4%, Year 4: 3%, Year 5+: 2%

export interface InflationSchedule {
  yearRateBps: number // basis points (100 = 1%)
  startYear: number
}

const SCHEDULE: InflationSchedule[] = [
  { startYear: 0, yearRateBps: 800 },
  { startYear: 1, yearRateBps: 600 },
  { startYear: 2, yearRateBps: 400 },
  { startYear: 3, yearRateBps: 300 },
  { startYear: 4, yearRateBps: 200 },
]

const EPOCHS_PER_YEAR = 365 * 24 // hourly epochs
const BPS = 10_000n

export function getYearlyRateBps(year: number): number {
  for (let i = SCHEDULE.length - 1; i >= 0; i--) {
    if (year >= SCHEDULE[i].startYear) {
      return SCHEDULE[i].yearRateBps
    }
  }
  return SCHEDULE[SCHEDULE.length - 1].yearRateBps
}

export function computeInflationRewardPool(
  totalSupply: bigint,
  epochsSinceGenesis: number,
): bigint {
  const year = Math.floor(epochsSinceGenesis / EPOCHS_PER_YEAR)
  const rateBps = getYearlyRateBps(year)

  // Per-epoch reward = totalSupply * rateBps / BPS / EPOCHS_PER_YEAR
  const yearlyReward = (totalSupply * BigInt(rateBps)) / BPS
  const perEpochReward = yearlyReward / BigInt(EPOCHS_PER_YEAR)

  return perEpochReward
}

export function computeYearlyInflation(totalSupply: bigint, year: number): bigint {
  const rateBps = getYearlyRateBps(year)
  return (totalSupply * BigInt(rateBps)) / BPS
}
