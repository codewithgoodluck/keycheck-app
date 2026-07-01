// Automated tests for ../firestore.rules, using the Firebase emulator so
// nothing here touches the real project. Written because firestore.rules
// itself says it has "NOT been tested against a live Firebase project" —
// this closes that gap without needing network access to a real project.
//
// Setup (from this directory):
//   npm install
//   npm test
//
// `npm test` runs `firebase emulators:exec`, which starts the Firestore
// emulator, runs this file against it, then shuts the emulator down —
// no need to manage a second terminal. Requires a JDK (the emulator runs
// on Java) and the Firebase CLI (npm install -g firebase-tools).

import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'

const testEnv = await initializeTestEnvironment({ projectId: 'keycheck-test' })

function anon() {
  return testEnv.unauthenticatedContext().firestore()
}

function asUser(tokenClaims) {
  return testEnv.authenticatedContext('test-uid', tokenClaims).firestore()
}

async function seed(docPath, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(docPath).set(data)
  })
}

let failures = 0

async function check(name, fn) {
  try {
    await fn()
    console.log(`PASS  ${name}`)
  } catch (err) {
    failures++
    console.error(`FAIL  ${name}\n      ${err.message}`)
  }
}

async function run() {
  await check('anyone can read a report', async () => {
    await seed('reports/r1', { status: 'unverified', upvotes: 0 })
    await assertSucceeds(anon().collection('reports').doc('r1').get())
  })

  await check('create requires status=unverified and upvotes=0', async () => {
    await assertFails(anon().collection('reports').add({ status: 'verified', upvotes: 0 }))
    await assertFails(anon().collection('reports').add({ status: 'unverified', upvotes: 5 }))
    await assertSucceeds(anon().collection('reports').add({ status: 'unverified', upvotes: 0 }))
  })

  await check('public can confirm (+1 upvote) but not skip ahead or touch other fields', async () => {
    await seed('reports/r2', { status: 'unverified', upvotes: 0 })
    const db = anon()
    await assertSucceeds(db.collection('reports').doc('r2').update({ upvotes: 1 }))
    await assertFails(db.collection('reports').doc('r2').update({ upvotes: 3 }))
    await assertFails(db.collection('reports').doc('r2').update({ status: 'verified' }))
  })

  await check('public can add exactly one reply at a time', async () => {
    await seed('reports/r3', { status: 'unverified', upvotes: 0, replies: [] })
    const db = anon()
    await assertSucceeds(db.collection('reports').doc('r3').update({ replies: [{ id: 'a' }] }))
    await assertFails(db.collection('reports').doc('r3').update({ replies: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }))
  })

  await check('non-admin cannot change status or delete', async () => {
    await seed('reports/r4', { status: 'unverified', upvotes: 0 })
    await assertFails(anon().collection('reports').doc('r4').delete())
    await assertFails(asUser({ email: 'nobody@example.com' }).collection('reports').doc('r4').update({ status: 'verified' }))
  })

  await check('bootstrap admin email can change status and delete', async () => {
    await seed('reports/r5', { status: 'unverified', upvotes: 0 })
    const admin = asUser({ email: 'goodluckmordi44@gmail.com' })
    await assertSucceeds(admin.collection('reports').doc('r5').update({ status: 'verified' }))
    await assertSucceeds(admin.collection('reports').doc('r5').delete())
  })

  await check('moderator custom claim can change status', async () => {
    await seed('reports/r6', { status: 'unverified', upvotes: 0 })
    const mod = asUser({ moderator: true })
    await assertSucceeds(mod.collection('reports').doc('r6').update({ status: 'disputed' }))
  })

  await check('search_misses accepts only {query, at} and is not publicly readable', async () => {
    const db = anon()
    await assertSucceeds(db.collection('search_misses').add({ query: 'lekki', at: new Date().toISOString() }))
    await assertFails(db.collection('search_misses').add({ query: 'lekki', at: new Date().toISOString(), extra: 'x' }))
    await assertFails(db.collection('search_misses').doc('does-not-matter').get())
  })

  await check('moderator can read search_misses', async () => {
    const mod = asUser({ moderator: true })
    await assertSucceeds(mod.collection('search_misses').limit(1).get())
  })

  await testEnv.cleanup()

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll firestore.rules tests passed.')
}

run()
