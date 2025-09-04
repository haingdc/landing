
/**
 * Delays showing a spinner until a promise has been pending for a certain time.
 * If the promise resolves/rejects before that time, no spinner is shown.
 * If the promise resolves/rejects after that time, the spinner is shown for
 * at least a minimum duration.
 * @param {Promise} promise The promise to monitor
 * @param {Object} options Configuration options
 * @param {number} options.delay Time in ms to wait before showing the spin
 * @param {number} options._minDuration Minimum time in ms the spin should be visible
 */
export async function unstable_delaySpin(promise, { delay, _minDuration} = { delay: 3000, _minDuration: 1000}) {
  let result = {
    state: 'pending',
  }
  let startTime = performance.now(),
      endTime = undefined
  promise.then(res => {
    result.state = 'fulfilled'
  }).catch(err => {
    result.state = 'rejected'
  }).finally(() => {
    endTime = performance.now()
    console.log('elapsed', `${endTime - startTime}ms`)
  })
  let p2 = new Promise((res, rej) => {
    setTimeout(() => {
      if (result.state === 'pending') { // task is slow, let's show a spin
        res('show_the_spin')
      } else { // task is fast enough, we don't need a spin
        res('idle')
      }
    }, delay)
  })
  let state = await p2
  return state
}

// TODO: we need to write a test for this instead of just running it manually

// uncomment to give it a try
// var unpredictableMs = 3001
// var p1 = new Promise((res, rej) => {
//   setTimeout(() => {
//     res('4')
//   }, unpredictableMs)
// })
// await delaySpin(p1)