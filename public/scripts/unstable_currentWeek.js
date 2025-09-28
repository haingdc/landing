/// <reference lib="dom" />
import * as d3 from "d3";
import { Temporal } from 'temporal-polyfill'
import getColor from './getColor.js'

// === Constants
const targetWordsDaily = 300
const weekdaysLong = [
  "Thứ hai", "Thứ ba", "Thứ tư",
  "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"
];
const weekdaysShort = [
  "T2", "T3", "T4",
  "T5", "T6", "T7", "CN"
];

function getDateName(dateStr, weekdays) {
  const date = Temporal.PlainDate.from(dateStr);
  const dayName = weekdays[date.dayOfWeek /* range 1-7*/ - 1];
  return dayName
}

function currentWeekChart(
  svg,
  dayRecords,
  { containerWidth, containerHeight}
) {
  const isMobile = containerWidth && containerWidth < 500
  const newData = [null, null, null, null, null, null, null] // 7 days a week
  let today = Temporal.Now.plainDateISO('Asia/Ho_Chi_Minh');
  const weekdays = isMobile ? weekdaysShort : weekdaysLong
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
      header: getDateName(d.date, weekdays),
      ratioDailyTarget,
      value: d.net_words_change
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
        header: weekdays[i],
        ratioDailyTarget: today.dayOfWeek === i + 1 ? 0 : undefined,
        value: 0,
      }
    }
  }
  let width = +svg.attr("width")
  let height = +svg.attr("height")
  const margin = { top: 40, right: 30, bottom: 50, left: 60 }
  console.log({ containerWidth, containerHeight})
  width = containerWidth ?? width
  height = containerHeight ?? height

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scale
  const x = d3.scaleBand()
    .domain(newData.map(d => d.header))
    .range([0, chartWidth])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(newData, d => d.value) || targetWordsDaily]) // đảm bảo trục y luôn có giá trị tối đa
    .nice()
    .range([chartHeight, 0]);

  // trục
  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .attr('class', 'x-axis')
    .style('color', 'white');

  // Điều chỉnh số lượng ticks cho trục y dựa trên kích thước màn hình
  const yAxisTicks = isMobile ? 4 : 6;
  
  g.append("g")
    .call(d3.axisLeft(y).ticks(yAxisTicks).tickFormat(d => `${d} từ`))
    .attr('class', 'y-axis')
    .style('color', 'white');

  // offset giả lập 3D
  const dx = isMobile ? 6 : 12, dy = isMobile ? 6 : 12;

  // vẽ từng cột
  newData.forEach(d => {
    const barX = x(d.header);
    const barY = y(d.value);
    const barW = x.bandwidth();
    const barH = chartHeight - barY;
    const { light, saturation, hue } = getColor(d.ratioDailyTarget);

    // mặt trước (màu nhạt)
    g.append("rect")
      .attr("x", barX)
      .attr("y", barY)
      .attr("width", barW)
      .attr("height", barH)
      .attr("fill", `hsl(${hue}deg ${saturation}% ${light * 1.2}%)`);

    // mặt trên (màu nhạt trung bình)
    g.append("polygon")
      .attr("points", `
      ${barX},${barY}
      ${barX + dx},${barY - dy}
      ${barX + barW + dx},${barY - dy}
      ${barX + barW},${barY}
    `)
      .attr("fill", `hsl(${hue}deg ${saturation}% ${light}%)`);

    // mặt bên (màu đậm nhất)
    g.append("polygon")
      .attr("points", `
      ${barX + barW},${barY}
      ${barX + barW + dx},${barY - dy}
      ${barX + barW + dx},${barY - dy + barH}
      ${barX + barW},${barY + barH}
    `)
      .attr("fill", `hsl(${hue}deg ${saturation}% ${light * 0.75}%)`);

  });
}

export {
  currentWeekChart
}