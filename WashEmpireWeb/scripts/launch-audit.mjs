import { spawn } from 'node:child_process'

const steps = [
  { name: 'visual reward audit', command: 'npm.cmd run audit:visual-rewards' },
  { name: 'tests', command: 'npm.cmd run test' },
  { name: 'build', command: 'npm.cmd run build' },
  { name: 'browser smoke/screenshot', command: 'npm.cmd run audit:smoke-ui' },
]

for (const step of steps) {
  await runStep(step)
}

console.log('\n[launch-audit] All launch checks passed.')

function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n[launch-audit] Running ${step.name}...`)
    const child = spawn(step.command, { stdio: 'inherit', shell: true })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`[launch-audit] Failed at step: ${step.name} (exit ${code ?? 'unknown'})`))
    })

    child.on('error', (error) => {
      reject(new Error(`[launch-audit] Could not start step: ${step.name}. ${error.message}`))
    })
  })
}
