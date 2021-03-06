// select svg container first
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', 600)
  .attr('height', 600)

// create margins and dimensions
const margin = { top: 20, right: 20, bottom: 100, left: 100 }
const graphWidth = 600 - margin.left - margin.right
const graphHeigth = 600 - margin.top - margin.bottom

const graph = svg
  .append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeigth)
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

const xAxisGroup = graph
  .append('g')
  .attr('transform', `translate(0, ${graphHeigth})`)
const yAxisGroup = graph.append('g')

// scales
const y = d3.scaleLinear().range([graphHeigth, 0])

const x = d3.scaleBand().range([0, 500]).paddingInner(0.5).paddingOuter(0.2)

// create the axes
const xAxis = d3.axisBottom(x)
const yAxis = d3
  .axisLeft(y)
  .ticks(3)
  .tickFormat((d) => d + ' orders')

// update x axis text
xAxisGroup
  .selectAll('text')
  .attr('transform', 'rotate(-40)')
  .attr('text-anchor', 'end')
  .attr('fill', '#00C59B')

const t = d3.transition().duration(1500)

// update function
const update = (data) => {
  // updating scale domains
  y.domain([0, d3.max(data, (d) => d.orders)])
  x.domain(data.map((item) => item.name))

  //join the data to rects
  const rects = graph.selectAll('rect').data(data)

  // remove exit selection
  rects.exit().remove()

  // update current shape in the DOM
  rects
    .attr('width', x.bandwidth)
    .attr('fill', '#00C59B')
    .attr('x', (d) => x(d.name))
    // .transition(t)
    //   .attr('height', (d) => graphHeigth - y(d.orders))
    //   .attr('y', (d) => y(d.orders))

  // append enter selection to the DOM
  rects
    .enter()
    .append('rect')
    .attr('height', 0)
    .attr('fill', '#00C59B')
    .attr('x', (d) => x(d.name))
    .attr('y', (d) => graphHeigth)
    .merge(rects)
    .transition(t)
      .attrTween('width', widthTweens)
      .attr('y', (d) => y(d.orders))
      .attr('height', (d) => graphHeigth - y(d.orders))

  // call axes
  xAxisGroup.call(xAxis)
  yAxisGroup.call(yAxis)
}

let data = []

// get data from firebase
db.collection('dishes').onSnapshot((res) => {
  res.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id }

    switch(change.type) {
      case 'added': 
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex(item => item.id == doc.id)
        data[index] = doc;
        break;
      case 'removed':
          data = data.filter(item => item.id !== doc.id)
          break;
        default:
          break;
    }
  })

  update(data)
})


// Tweens

const widthTweens = d => {
  //define interpolation
  //d3.interpolate returns a function which we call 'i'
  let i = d3.interpolate(0, x.bandwidth())

  //return a function which takes in a time ticker 't'
  return function(t) {
    //return the value from passing the ticker into the interpolation
    return i(t)
  }
}