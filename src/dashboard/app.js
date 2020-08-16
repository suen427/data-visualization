function GaugeChart() {

  var pi = Math.PI,
    rad = pi / 180,
    deg = 180 / pi;

  var properties = {

    width: 800,
    height: 300,
    margin: 50,

    rotation: 0,
    thickness: 0.15,
    arc: 1,
    ticks: 5,

    color_scheme: "interpolateRdYlBu",
    color_step: 150,
    tick_color: "#FFFFFF",
    needle_color: "#000000"

  };

  var needlePercent = 0;
  var center = {};
  var radii = {};
  var angles = {};
  var ticks = {};
  var scales = {};
  var needleLength = 0;

  var setCenter = (function initCenter() {

    center.x = properties.width / 2;
    center.y = properties.height - properties.margin;

    return initCenter;

  })();

  var setRadii = (function initRadii() {

    var base = Math.min(
      (properties.width - properties.margin) / 2,
      properties.height - (2 * properties.margin),
    );

    radii.base = base;
    radii.cap = base / 15;
    radii.inner = base * (1 - properties.thickness);
    radii.outer_tick = base + 5;
    radii.arc = base + 15;

    needleLength = radii.inner * 0.6

    return initRadii;

  })();

  var setAngles = (function initAngles() {

    var arc_complement = 1 - properties.arc;

    angles.arc_complement = arc_complement,
      angles.start_angle = (-pi / 2) + (pi * arc_complement / 2) + (properties.rotation * rad),
      angles.end_angle = (pi / 2) - (pi * arc_complement / 2) + (properties.rotation * rad);

    return initAngles;

  })();

  var setTicks = (function initTicks() {

    var sub_arc = (angles.end_angle - angles.start_angle) / (properties.ticks - 1)

    ticks = d3.range(properties.ticks).map(function (d) {
      var sub_angle = angles.start_angle + (sub_arc * d);
      return {
        coordinates: [
          [sub_angle, radii.inner],
          [sub_angle, radii.outer_tick]
        ],
        sub_angle
      }
    });

    return initTicks;

  })();

  var setScales = (function initScales() {

    scales.lineRadial = d3.lineRadial();

    scales.needleScale = d3.scaleLinear()
      .domain([0, 1])
      .range([angles.start_angle, angles.end_angle]);

    return initScales;

  })();


  function updateValues() {

    setCenter();
    setRadii();
    setAngles();
    setTicks();
    setScales();

  }

  var GaugeChart = {};

  GaugeChart.setProperties = function (params) {

    Object.keys(params).map(function (d) {
      if (d in properties)
        properties[d] = params[d];
      else
        throw new Error('One or more parameters not accepted.');
    });
    updateValues();

  }

  GaugeChart.getProperties = function () {
    return properties;
  }

  GaugeChart.debug = function () {
    return { needlePercent, properties, center, radii, angles, ticks, svg, scales };
  }

  GaugeChart.setPercentage = function (pct) {
    needlePercent = pct;
  }

  var svg
  GaugeChart.draw = function () {

    svg = svg || d3.create("svg")
    svg.attr("viewBox", [0, 0, properties.width, properties.height])

    var gauge = svg.append("g")
      .attr("transform", `translate(${center.x}, ${center.y})`)
      .attr("class", "gauge-container");

    /* begin arc */
    var svgDefs = svg.append('defs');

    var mainGradient = svgDefs.append('linearGradient')
      .attr('id', 'arcLinearGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    mainGradient.append('stop')
      .attr('offset', '0')
      .attr('stop-color', '#58A6D4');
    mainGradient.append('stop')
      .attr('offset', '1')
      .attr('stop-color', '#58A6D4')
      .attr('stop-opacity', 0);

    var arc = d3.arc()
      .innerRadius(radii.arc)
      .outerRadius(radii.arc)
      .startAngle(angles.start_angle)
      .endAngle(angles.end_angle);

    gauge.append("g")
      .attr("class", "gauge-arc")
      .append("path")
      .attr("d", arc)
      .attr("stroke-width", 4)
      .attr("stroke", "url(#arcLinearGradient)")
    /* end arc */

    gauge.append("g")
      .attr("class", "gauge-ticks")
      .selectAll("path")
      .data(ticks)
      .enter()
      .append("g")
      .attr("class", "tick")
      .append("path")
      .attr("d", d => scales.lineRadial(d.coordinates))
      .attr("stroke", d => {
        return scales.needleScale.invert(d.sub_angle) <= needlePercent ? '#58A6D4' : '#C0C4CC'
      })
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")

    gauge.append("g")
      .attr("class", "needle")
      .selectAll("path")
      .data([needlePercent])
      .enter()
      .append("path")
      .attr("d", d => scales.lineRadial([[0, 0], [scales.needleScale(d), needleLength]]))
      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 3.5)
      .attr("stroke-linecap", "round");

    gauge.select("g.needle")
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radii.cap)
      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 1.5)
      .style("fill", "white");


    return svg;

  }

  GaugeChart.update = function (newNeedlePercent, props = {}, duration = 750) {
    var oldNeedlePercent = needlePercent
    var oldStartAngle = angles.start_angle
    var oldEndAngle = angles.end_angle

    this.setPercentage(newNeedlePercent)
    this.setProperties(props)
    updateValues()

    var interpolate = d3.interpolate(oldNeedlePercent, needlePercent);
    var startAngleInterpolate = d3.interpolate(oldStartAngle, angles.start_angle);
    var endAngleInterpolate = d3.interpolate(oldEndAngle, angles.end_angle);

    // svg.attr("viewBox", [0, 0, properties.width, properties.height])

    var gauge = svg
      .select('.gauge-container')
      .attr("transform", `translate(${center.x}, ${center.y})`);

    /* begin arc */
    var arc = d3.arc()
      .innerRadius(radii.arc)
      .outerRadius(radii.arc)

    gauge
      .select('.gauge-arc')
      .select("path")
      .attr("stroke-width", 4)
      .attr("stroke", "url(#arcLinearGradient)")
      .transition()
      .duration(duration)
      .attrTween("d", () => {
        return function (t) {
          return arc
            .startAngle(startAngleInterpolate(t))
            .endAngle(endAngleInterpolate(t))()
        };
      })
    /* end arc */

    gauge
      .select('.gauge-ticks')
      .selectAll("g")
      .data(ticks)
      .join("g")
      .attr("class", "tick")
      .select("path")
      // .attr("d", d => scales.lineRadial(d.coordinates))
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .transition()
      .duration(duration)
      .attrTween("stroke", (d) => {
        return function (t) {
          return scales.needleScale.invert(d.sub_angle) <= interpolate(t) ? '#58A6D4' : '#C0C4CC'
        };
      })
      .attrTween("d", (d, i) => {
        return function (t) {
          var start_angle = startAngleInterpolate(t)
          var end_angle = endAngleInterpolate(t)
          var sub_arc = (end_angle - start_angle) / (properties.ticks - 1)
          var sub_angle = start_angle + (sub_arc * i);
          return scales.lineRadial([
            [sub_angle, radii.inner],
            [sub_angle, radii.outer_tick]
          ])
        };
      })

    gauge
      .select(".needle path")
      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 3.5)
      .attr("stroke-linecap", "round")
      .transition()
      .duration(duration)
      .attrTween("d", () => {
        return function (t) {
          return scales.lineRadial([[0, 0], [scales.needleScale(interpolate(t)), needleLength]])
        };
      })

    gauge
      .select(".needle circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radii.cap)
      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 1.5)
      .style("fill", "white");

    return svg;

  }

  return GaugeChart;

};

function autoHeight(el) {
  var box = el.getBBox();
  return { y: box.y, h: box.height }
}


/* ================ use ==================== */
function draw(props, percent, chartWrapper) {

  var chart = GaugeChart();

  chart.setProperties(props);

  chart.setPercentage(percent);

  var svg = chart.draw();

  chartWrapper.childNodes.forEach(child => chartWrapper.removeChild(child))
  chartWrapper.appendChild(svg.node())

  return chart
}

// draw(
//   {
//     width: 200,
//     height: 200,
//     rotation: -16,
//     thickness: 0.08,
//     arc: 0.78,
//     ticks: 16,
//     color_scheme: 'interpolateRdYlGn',
//     color_step: 150,
//     tick_color: "#FFF",
//     needle_color: "#C0C4CC"
//   },
//   0.6,
//   document.querySelector('#chart1')
// )

var chart2 = draw(
  {
    width: 200,
    height: 200,
    rotation: 0,
    thickness: 0.08,
    arc: 1,
    ticks: 16,
    color_scheme: 'interpolateRdYlGn',
    color_step: 150,
    tick_color: "#FFF",
    needle_color: "#C0C4CC"
  },
  0.0,
  document.querySelector('#chart2')
)

// draw(
//   {
//     width: 200,
//     height: 200,
//     rotation: 16,
//     thickness: 0.08,
//     arc: 0.78,
//     ticks: 16,
//     color_scheme: 'interpolateRdYlGn',
//     color_step: 150,
//     tick_color: "#FFF",
//     needle_color: "#C0C4CC"
//   },
//   0.6,
//   document.querySelector('#chart3')
// )

let percent = 0
let rotation = 0
let arc = 1
let ticks = 16
// requestAnimationFrame(function animateChart() {
//   if (percent < 0.8) {
//     requestAnimationFrame(animateChart)
//     percent += 0.02
//     rotation += 0.4
//     arc -= 0.0055
//     ticks -= 0.1

//     chart2.setPercentage(percent)
//     chart2.setProperties({
//       rotation,
//       arc,
//       ticks: Math.round(ticks)
//     })
//   }
//   chart2.update()
// })
setTimeout(() => {
  chart2.update(0.8, {
    rotation: 16,
    arc: 0.78,
    ticks: 12
  })
}, 2000)