import { expect, test } from '@playwright/test'
import { json, mockApi } from './fixtures'

test('creating a node and saving a new graph sends the right payload', async ({ page }) => {
  let savedBody: Record<string, unknown> | null = null

  await mockApi(page, {
    'POST /graphs': async (route) => {
      savedBody = route.request().postDataJSON()
      await json(route, {
        message: 'Graph saved successfully',
        status: 'success',
        id: 'new-graph-id',
        name: savedBody!.name,
        nodes: (savedBody!.nodes as unknown[]).length,
        edges: 0,
      })
    },
    // Saving a brand-new graph moves the URL onto its real id (see
    // GraphEditorPage's saveGraph), which re-triggers the load effect.
    'GET /graphs/new-graph-id': (route) =>
      json(route, {
        id: 'new-graph-id',
        name: savedBody!.name,
        text: null,
        nodes: savedBody!.nodes,
        edges: savedBody!.edges,
      }),
  })

  await page.goto('/graphs/new')

  await page.getByRole('button', { name: 'Add node' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Robert Smith')
  await page.getByLabel('Type', { exact: true }).fill('Person')
  await page.getByLabel('Graph name').fill('My Family')

  await page.getByRole('button', { name: 'Save graph' }).click()

  await expect(page.getByText(/Saved "My Family"/)).toBeVisible()
  await expect(page).toHaveURL(/\/graphs\/new-graph-id$/)

  expect(savedBody).not.toBeNull()
  expect(savedBody!.name).toBe('My Family')
  expect(savedBody!.nodes).toHaveLength(1)
  expect((savedBody!.nodes as Array<{ data: { name: string; type: string } }>)[0].data).toMatchObject({
    name: 'Robert Smith',
    type: 'Person',
  })
})

test('loading an existing graph renders its nodes and the edge label', async ({ page }) => {
  await mockApi(page, {
    'GET /graphs/g1': (route) =>
      json(route, {
        id: 'g1',
        name: 'Smith Family Tree',
        text: null,
        nodes: [
          {
            id: 'robert',
            type: 'graph',
            position: { x: 0, y: 0 },
            data: { name: 'Robert Smith', type: 'Person', properties: [] },
          },
          {
            id: 'james',
            type: 'graph',
            position: { x: 400, y: 300 },
            data: { name: 'James Smith', type: 'Person', properties: [] },
          },
        ],
        edges: [
          { id: 'e1', source: 'robert', target: 'james', relationship: 'Father' },
        ],
      }),
  })

  await page.goto('/graphs/g1')

  await expect(page.getByLabel('Graph name')).toHaveValue('Smith Family Tree')
  await expect(page.getByLabel('Name', { exact: true }).first()).toHaveValue('Robert Smith')
  await expect(page.getByLabel('Relationship')).toHaveValue('Father')
})

test('auto-arrange spreads out nodes that start on top of each other', async ({ page }) => {
  const sameSpotNodes = Array.from({ length: 4 }, (_, i) => ({
    id: `n${i}`,
    type: 'graph',
    position: { x: 0, y: 0 }, // deliberately identical — a congested/overlapping start
    data: { name: `Node ${i}`, type: 'Thing', properties: [] },
  }))

  await mockApi(page, {
    'GET /graphs/g1': (route) =>
      json(route, { id: 'g1', name: 'Congested', text: null, nodes: sameSpotNodes, edges: [] }),
  })

  await page.goto('/graphs/g1')
  await expect(page.locator('[data-id="n0"]')).toBeVisible()

  const positionsBefore = await Promise.all(
    sameSpotNodes.map((n) => page.locator(`[data-id="${n.id}"]`).boundingBox()),
  )
  // Confirms the fixture actually starts them stacked, so the assertion
  // below is testing something real.
  for (const box of positionsBefore) {
    expect(box!.x).toBeCloseTo(positionsBefore[0]!.x, 0)
    expect(box!.y).toBeCloseTo(positionsBefore[0]!.y, 0)
  }

  await page.getByRole('button', { name: 'Auto-arrange' }).click()
  // The fitView animation triggered by auto-arrange.
  await page.waitForTimeout(500)

  const positionsAfter = await Promise.all(
    sameSpotNodes.map((n) => page.locator(`[data-id="${n.id}"]`).boundingBox()),
  )
  const uniqueXY = new Set(positionsAfter.map((box) => `${Math.round(box!.x)},${Math.round(box!.y)}`))
  expect(uniqueXY.size).toBe(sameSpotNodes.length)
})
