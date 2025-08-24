/// <reference lib="dom" />

import { Temporal } from 'temporal-polyfill'
import Unstable_gallery from "./unstable_gallery.js"

const spinner = document.createElement('img')
spinner.src = '/img/fallback.jpeg'
spinner.classList.add('loader')
const app = document.getElementById('root')

app.appendChild(spinner)

try {
  const params = new URLSearchParams({ listType })
  const response = await fetch(`./api/dayrecord?${params.toString()}`)
  const dayRecords = await response.json()
  const newData = [null,null,null,null,null, null,null] // 7 days a week
  for (let i = 0; i < dayRecords.length && i < 7; i++) {
    const d = dayRecords[i]
    const { dayOfWeek } = Temporal.PlainDate.from(d.date)
    const ratioDailyTarget = d.net_words_change / targetWordsDaily * 100
    newData[dayOfWeek - 1] = {
      source: d,
      id: d.id,
      w: 400,
      h: 400,
      prompt: d.net_words_change,
      header: getDateName(d.date),
      ratioDailyTarget,
    }
  }
  for (let i = 0; i < 7; i++) {
    const d = newData[i]
    if (d === null) {
      newData[i] = {
        source: null,
        id: i,
        w: 400,
        h: 400,
        prompt: 0,
        header: weekdays[i]
      }
    }
  }
  data = newData
  if (spinner.parentElement) {
    app.removeChild(spinner)
  }
  Unstable_gallery.prepareData(data)
  Unstable_gallery.addEventListeners()
  Unstable_gallery.scheduleRender()
} catch (err) {
  console.error(err)
}

function getDateName(dateStr) {
  const date = Temporal.PlainDate.from(dateStr);
  const dayName = weekdays[date.dayOfWeek /* range 1-7*/ - 1];
	return dayName
}
