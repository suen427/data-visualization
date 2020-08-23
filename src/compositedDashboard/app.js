var GaugeChartIndex = 0
function GaugeChart() {

  var pi = Math.PI;
  var rad = pi / 180;

  var properties = {

    
    width: 800,
    height: 300,
    margin: 50,
    center: null,
    scale: 1,
    opacity: 1,

    rotation: 0,
    thickness: 0.15,
    arc: 1,
    ticks: 5,

    tick_color: "#FFFFFF",
    needle_color: "#000000",

    label: ""
  };

  var id = "gauge_" + GaugeChartIndex++
  var needlePercent = 0;
  var center = {};
  var radii = {};
  var angles = {};
  var ticks = {};
  var scales = {};
  var needleLength = 0;

  var setCenter = (function initCenter() {

    center.x = properties.center ? properties.center[0] : properties.width / 2;
    center.y = properties.center ? properties.center[1] :properties.height - properties.margin;

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
  GaugeChart.draw = function (parentSvg) {
    
    if (parentSvg) {
      svg = parentSvg
    } else {
      svg = svg || d3.create("svg")
      svg.attr("viewBox", [0, 0, properties.width, properties.height])
    }

    var gauge = svg.append("g")
      .attr("id", id)
      .attr("transform", `translate(${center.x}, ${center.y}) scale(${properties.scale})`)
      .attr("class", "gauge-container")
      .attr("opacity", properties.opacity);

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
      .join("path")
      .attr("class", "tick")
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
      .attr("d", d => scales.lineRadial([[scales.needleScale(d), radii.cap], [scales.needleScale(d), needleLength]]))
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
      .style("fill", "transparent");

    // data
    gauge.append('g')
      .attr("class", "value")
      .html(`
        <g transform="translate(-24, 60)" fill="#58A6D4" font-family="DINCond-Medium" font-size="36">
          <text>
            <tspan>24</tspan>
            <tspan fill="white" font-size="14" font-family="PingFangSC-Regular">/ 100</tspan>
          </text>
        </g>
        <g transform="translate(-30, 100)" fill="#FFFFFF" font-family="PingFangSC-Regular, PingFang SC" font-size="16">
          <text>
            <tspan>${properties.label}</tspan>
          </text>
        </g>
      `)

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

    var gauge = svg.select('.gauge-container#' + id)

    gauge
      .transition()
      .duration(duration)
      .attr("transform", `translate(${center.x}, ${center.y}) scale(${properties.scale})`)
      .attr("opacity", properties.opacity);

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
      .selectAll("path")
      .data(ticks)
      .join("path")
      .attr("class", "tick")
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
          var angel = d3.scaleLinear()
            .domain([0, 1])
            .range([startAngleInterpolate(t), endAngleInterpolate(t)])(interpolate(t))
          return scales.lineRadial([[angel, radii.cap], [angel, needleLength]])
        };
      })

      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 3.5)
      .attr("stroke-linecap", "round")

    gauge
      .select(".needle circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radii.cap)
      .attr("stroke", properties.needle_color)
      .attr("stroke-width", 1.5)

    return svg;

  }

  return GaugeChart;

};

function CompositedGaugeChart(initProps) {
  var props = initProps
  var charts = []
  for (let chart of props.chartsProps) {
    var gaugeChart = GaugeChart();
    charts.push(gaugeChart)

    gaugeChart.setProperties(chart.props);

    gaugeChart.setPercentage(chart.percent);
  }

  let CompositedGauge = {}

  CompositedGauge.setProperties = function (params) {
    Object.keys(params).map(function (d) {
      if (d !== 'chartsProps') {
        props[d] = params[d];
      }
    })
  }

  CompositedGauge.getGaugeCharts = function() {
    return charts
  }

  var svg
  CompositedGauge.draw = function() {
    svg = svg || d3.create("svg")
    svg.attr("viewBox", [0, 0, props.width, props.height])

    for (let chart of charts) {
      chart.draw(svg)
    }

    svg.append('g')
      .attr("class", "data")
      .html(`
        <g transform="translate(78, 215)">
          <circle fill="#FFFFFF" cx="2" cy="9" r="2" />
          <g transform="translate(12.000000, 0.000000)" font-weight="normal">
            <g
              fill="#FFFFFF"
              font-family="PingFangSC-Regular, PingFang SC"
              font-size="10"
            >
              <text>
                <tspan x="0" y="11">All User</tspan>
              </text>
            </g>
            <g
              transform="translate(0.000000, 18.000000)"
              fill="#58A6D4"
              font-family="DINCond-Medium"
              font-size="12"
            >
              <text>
                <tspan x="0" y="11.4210526" class="data-value">${props.data}</tspan>
              </text>
            </g>
          </g>
        </g>
        <g transform="translate(164.000000, 215.000000)">
          <circle fill="#FFFFFF" cx="2" cy="9" r="2" />
          <g transform="translate(12.000000, 0.000000)">
            <g
              fill="#FFFFFF"
              font-family="PingFangSC-Regular, PingFang SC"
              font-size="10"
              font-weight="normal"
            >
              <text>
                <tspan x="0" y="11">Since Last month</tspan>
              </text>
            </g>
            <g transform="translate(0.000000, 18.000000)" fill="#52C41A">
              <g
                transform="translate(13.137000, 0.421000)"
                font-family="DINCond-Medium"
                font-size="12"
                font-weight="normal"
              >
                <g>
                  <text>
                    <tspan x="0" y="11" class="data-change">${props.change}%</tspan>
                  </text>
                </g>
              </g>
              <g transform="translate(0.392000, 1.421000)">
                <path
                  d="M4.725,0.818 C4.46762855,0.581849445 4.07237145,0.581849445 3.815,0.818 L0.6,3.836 C0.480006087,3.94533699 0.411621603,4.10016357 0.411621603,4.2625 C0.411621603,4.42483643 0.480006087,4.57966301 0.6,4.689 C0.85737145,4.92515055 1.25262855,4.92515055 1.51,4.689 L3.627,2.702 L3.627,8.487 C3.627,8.82 3.915,9.09 4.27,9.09 C4.625,9.09 4.913,8.82 4.913,8.487 L4.913,2.702 L7.031,4.689 C7.156,4.807 7.321,4.866 7.485,4.866 C7.65,4.866 7.815,4.807 7.94,4.689 C8.05999391,4.57966301 8.1283784,4.42483643 8.1283784,4.2625 C8.1283784,4.10016357 8.05999391,3.94533699 7.94,3.836 L4.725,0.818 Z"
                />
              </g>
            </g>
          </g>
        </g>
      `)

    return svg
  }

  CompositedGauge.update = function (newProps = {}, duration = 750) {
    var oldData = props.data
    var oldChange = props.change
    this.setProperties(newProps)
    
    var valueInterpolateNumber = d3.interpolateNumber(oldData, props.data)
    var changeInterpolateNumber = d3.interpolateNumber(oldChange, props.change)

    for (let i = 0; i < charts.length; i++) {
      let chart = charts[i]
      let newChartProps = newProps.chartsProps[i]
      chart.update(newChartProps.percent, newChartProps.props, duration)
    }

    
    svg.select(".data-value")
      .transition()
      .duration(duration)
      .tween('text', function() {
        return function (t) {
          this.textContent = Math.round(valueInterpolateNumber(t))
        }
      })

    svg.select(".data-change")
      .transition()
      .duration(duration)
      .tween('text', function(){
        return function(t) {
          this.textContent = changeInterpolateNumber(t).toFixed(2) + '%'
        }
      })
  }

  CompositedGauge.svg = CompositedGauge.draw()

  return CompositedGauge
}


/* ================ use ==================== */
function draw(props, chartWrapper) {

  var chart = CompositedGaugeChart(props);

  // var svg = chart.draw();

  chartWrapper.childNodes.forEach(child => chartWrapper.removeChild(child))
  chartWrapper.appendChild(chart.svg.node())

  return chart
}

let chart = draw(
  {
    width: 400,
    height: 250,

    data: 32045424,
    change: 13.23,
    
    chartsProps: [
      {
        percent: 0,
        props: {
          label: "All User",
          scale: 0.8,
          opacity: 1,
          center: [200, 120],
          width: 200,
          height: 200,
          rotation: 0,
          thickness: 0.08,
          arc: 1,
          ticks: 16,
          tick_color: "#FFF",
          needle_color: "#C0C4CC"
        }
      },
      {
        percent: 0,
        props: {
          label: "Customers",
          scale:0.5,
          opacity: 0.5,
          center: [315, 120],
          width: 200,
          height: 200,
          rotation: 16,
          thickness: 0.08,
          arc: 0.78,
          ticks: 12,
          tick_color: "#FFF",
          needle_color: "#C0C4CC"
        }
      },
      {
        percent: 0,
        props: {
          label: "Prospects",
          scale:0.5,
          opacity: 0.5,
          center: [85, 120],
          width: 200,
          height: 200,
          rotation: -16,
          thickness: 0.08,
          arc: 0.78,
          ticks: 12,
          tick_color: "#FFF",
          needle_color: "#C0C4CC"
        }
      }
    ]
  },
  document.querySelector('#chart')
)

var flag = false
function update() {
  var chartsProps = [
    {
      percent: Math.random(),
      props: {
        label: "Customers",
        scale: 0.5,
        opacity: 0.5,
        center: [315, 120],
        width: 200,
        height: 200,
        rotation: 16,
        thickness: 0.08,
        arc: 0.78,
        ticks: 12,
        tick_color: "#FFF",
        needle_color: "#C0C4CC"
      }
    },
    {
      percent: Math.random(),
      props: {
        label: "All User",
        scale: 0.8,
        opacity: 1,
        center: [200, 120],
        width: 200,
        height: 200,
        rotation: 0,
        thickness: 0.08,
        arc: 1,
        ticks: 16,
        tick_color: "#FFF",
        needle_color: "#C0C4CC"
      }
    },
    {
      percent: Math.random(),
      props: {
        label: "Prospects",
        scale: 0.5,
        opacity: 0.5,
        center: [85, 120],
        width: 200,
        height: 200,
        rotation: -16,
        thickness: 0.08,
        arc: 0.78,
        ticks: 12,
        tick_color: "#FFF",
        needle_color: "#C0C4CC"
      }
    }
  ]

  flag = !flag
  if (flag) {
    chartsProps = [
      chartsProps[1],
      chartsProps[0],
      chartsProps[2],
    ]
  }

  chart.update(
    {
      data: Math.round(Math.random() * 10000000),
      change: Math.round(Math.random() * 10000) / 100,
      chartsProps
    },
    3000
  )
}

setInterval(update, 5000)
