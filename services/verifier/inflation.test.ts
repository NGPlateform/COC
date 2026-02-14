import test from "node:test"
import assert from "node:assert/strict"
import { getYearlyRateBps, computeInflationRewardPool, computeYearlyInflation } from "./inflation.ts"

test("year 0 rate is 8%", () => {
  assert.equal(getYearlyRateBps(0), 800)
})

test("year 1 rate is 6%", () => {
  assert.equal(getYearlyRateBps(1), 600)
})

test("year 2 rate is 4%", () => {
  assert.equal(getYearlyRateBps(2), 400)
})

test("year 3 rate is 3%", () => {
  assert.equal(getYearlyRateBps(3), 300)
})

test("year 4+ rate is 2%", () => {
  assert.equal(getYearlyRateBps(4), 200)
  assert.equal(getYearlyRateBps(10), 200)
  assert.equal(getYearlyRateBps(100), 200)
})

test("inflation reward pool is positive for non-zero supply", () => {
  const supply = 1_000_000_000n * 10n ** 18n // 1B tokens
  const reward = computeInflationRewardPool(supply, 0)
  assert.ok(reward > 0n)
})

test("inflation reward pool decreases in later years", () => {
  const supply = 1_000_000_000n * 10n ** 18n
  const rewardY0 = computeInflationRewardPool(supply, 0)
  const rewardY1 = computeInflationRewardPool(supply, 365 * 24)
  const rewardY4 = computeInflationRewardPool(supply, 4 * 365 * 24)

  assert.ok(rewardY0 > rewardY1)
  assert.ok(rewardY1 > rewardY4)
})

test("inflation reward pool is zero for zero supply", () => {
  assert.equal(computeInflationRewardPool(0n, 0), 0n)
})

test("yearly inflation calculation matches expected rate", () => {
  const supply = 10_000n * 10n ** 18n // 10k tokens
  const yearly = computeYearlyInflation(supply, 0)
  // 8% of 10k = 800 tokens
  assert.equal(yearly, 800n * 10n ** 18n)
})

test("yearly inflation for year 4 is 2%", () => {
  const supply = 10_000n * 10n ** 18n
  const yearly = computeYearlyInflation(supply, 4)
  assert.equal(yearly, 200n * 10n ** 18n)
})

test("per-epoch reward is yearly / epochs_per_year", () => {
  const supply = 1_000_000n * 10n ** 18n
  const epochsPerYear = 365 * 24
  const perEpoch = computeInflationRewardPool(supply, 0)
  const yearly = computeYearlyInflation(supply, 0)
  // perEpoch should approximately equal yearly / epochsPerYear
  const expected = yearly / BigInt(epochsPerYear)
  assert.equal(perEpoch, expected)
})
