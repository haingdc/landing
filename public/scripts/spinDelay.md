# part 1

```javascript
// === constant
var unpredictableMs = 2999,
    delay = 3000,
		minDuration = 1000
var result = {
  state: 'pending',
}

var startTime = performance.now(),
    endTime = null;

console.log('start at', startTime)


var p1 = new Promise((res, rej) => {
  setTimeout(() => {
    res('4')
  }, unpredictableMs)
}).then(res => {
  endTime = performance.now()
  console.log('end at', endTime)
  result.state = 'fulfilled'
  result.data = res
})

var p2 = new Promise((res, rej) => {
  setTimeout(() => {
    if (result.state !== 'fulfilled') {
      res('show the spin')
    } else {
      res('no need the spin')
    }
  }, delay)
})

Promise.all([p1, p2]).then(res => {
//   console.log('all', res);
  console.log('elapsed', endTime - startTime)
})

var checking = await p2
console.log('👻 checking:', checking)
```
# part 2

```javascript
var unpredictableMs = 3001

async function delaySpin(promise, { delay, minDuration} = { delay: 3000, minDuration: 1000}) {
  let result = {
    state: 'pending',
  }
  let startTime = performance.now(),
      endTime = undefined
  p1.then(res => {
    endTime = performance.now()
    result.state = 'fulfilled'
  }).catch(err => {
    endTime = performance.now()
    result.state = 'rejected'
  })
  let p2 = new Promise((res, rej) => {
    setTimeout(() => {
      if (result.state === 'pending') { // task is slow, let's show a spin
        res('show the spin')
      } else { // task is fast enough, we don't need a spin
        res('no need the spin')
      }
    }, delay)
  })
  let checking = await p2
  console.log('👻 checking:', checking)
}

var p1 = new Promise((res, rej) => {
  setTimeout(() => {
    res('4')
  }, unpredictableMs)
})
await delaySpin(p1)
```