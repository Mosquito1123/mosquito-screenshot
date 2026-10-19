import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planScrollSegments } from '../helpers/segment.ts'

test('single screen content does not scroll', () => {
  const plan = planScrollSegments({ contentHeight: 500, viewportHeight: 800 })
  assert.equal(plan.segments.length, 1)
  assert.equal(plan.segments[0].scrollTop, 0)
  assert.equal(plan.segments[0].keepHeight, 500)
  assert.equal(plan.truncated, false)
})

test('tall page is split into overlapping segments', () => {
  const plan = planScrollSegments({
    contentHeight: 2500,
    viewportHeight: 1000,
    overlap: 100,
  })
  assert.ok(plan.segments.length >= 3)
  assert.equal(plan.segments[0].scrollTop, 0)
  assert.equal(plan.segments[0].cropTop, 0)
  assert.ok(plan.segments[1].scrollTop > 0)
  assert.equal(plan.segments[1].cropTop, 100)
  assert.equal(plan.totalHeight, 2500)
})

test('maxHeight truncates the plan', () => {
  const plan = planScrollSegments({
    contentHeight: 50_000,
    viewportHeight: 1000,
    maxHeight: 2500,
  })
  assert.equal(plan.truncated, true)
  assert.ok(plan.totalHeight <= 2500)
  assert.ok(plan.segments.length >= 2)
})

test('bad sizes yield empty plan', () => {
  assert.deepEqual(planScrollSegments({ contentHeight: 0, viewportHeight: 100 }).segments, [])
  assert.deepEqual(planScrollSegments({ contentHeight: 100, viewportHeight: Number.NaN }).segments, [])
})
