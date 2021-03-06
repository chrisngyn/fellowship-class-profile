function renderSpiderChart(body, globalData) {
    body.append("div")
        .attr("class", "subheader")
        .style("color", colors.black)
        .html("Global contributions")
    body.append("div")
        .attr("class", "caption")
        .style("color", colors.black)
        .html("This is how our contributions were distributed.")
    body.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("width", "100%")
        .style("padding", "10px 0px 10px 0px")

    let margin = {
            top: 30,
            right: 80,
            bottom: 20,
            left: 80
        },
        width = Math.min(700, window.innerWidth / 4) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom);

    let chart_data = [{
        name: 'Code contribution stats',
        axes: [{
            axis: 'Code Reviews',
            value: Math.log(globalData["num_code_reviews"])
        }, {
            axis: 'Commits',
            value: Math.log(globalData["num_commits"])
        }, {
            axis: 'Pull Requests',
            value: Math.log(globalData["num_prs"])
        }, {
            axis: 'Issues Opened',
            value: Math.log(globalData["num_issues_opened"])
        }, {
            axis: 'Issues Contributed To',
            value: Math.log(globalData["num_issues_contributed"])
        }, ],
        color: '#26AF32'
    }, ];

    let radarChartOptions = {
        w: 390,
        h: 450,
        margin: margin,
        levels: 5,
        roundStrokes: true,
        color: d3.scaleOrdinal().range([colors.blue]),
        format: '.0f',
        unit: 'e^'
    };

    // Draw the radar chart
    RadarChart(body, chart_data, radarChartOptions);
}

/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////

let RadarChart = function RadarChart(body, data, options) {
    let max = Math.max;
    let sin = Math.sin;
    let cos = Math.cos;
    let HALF_PI = Math.PI / 2;
    //Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
    let wrap = (text, width) => {
            text.each(function() {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.4, // ems
                    y = text.attr("y"),
                    x = text.attr("x"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .attr("font-family", "Noto Sans TC")
                            .attr("font-size", 12)
                            .text(word);
                    }
                }
            });
        } //wrap

    let cfg = {
        w: 600, //Width of the circle
        h: 600, //Height of the circle
        margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
        levels: 3, //How many levels or inner circles should there be drawn
        maxValue: 0, //What is the value that the biggest circle will represent
        labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, //The opacity of the area of the blob
        dotRadius: 4, //The size of the colored circles of each blog
        opacityCircles: 0.1, //The opacity of the circles of each blob
        strokeWidth: 2, //The width of the stroke around each blob
        roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal(d3.schemeCategory10), //Color function,
        format: '.2%',
        unit: '',
        legend: false
    };

    //Put all of the options into a letiable called cfg
    if ('undefined' !== typeof options) {
        for (let i in options) {
            if ('undefined' !== typeof options[i]) { cfg[i] = options[i]; }
        } //for i
    } //if

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // let maxValue = max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = 0;
    for (let j = 0; j < data.length; j++) {
        for (let i = 0; i < data[j].axes.length; i++) {
            data[j].axes[i]['id'] = data[j].name;
            if (data[j].axes[i]['value'] > maxValue) {
                maxValue = data[j].axes[i]['value'];
            }
        }
    }
    maxValue = max(cfg.maxValue, maxValue);

    let allAxis = data[0].axes.map((i, j) => i.axis), //Names of each axis
        total = allAxis.length, //The number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
        Format = d3.format(cfg.format), //Formatting
        angleSlice = Math.PI * 2 / total; //The width in radians of each "slice"

    //Scale for the radius
    let rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////
    // let parent = d3.select(parent_selector);

    //Remove whatever chart with the same id/class was present before
    // parent.select("svg").remove();

    //Initiate the radar chart SVG
    let div = body.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")

    let svg = div.append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar");

    //Append a g element
    let g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    let axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", colors.grey)
        .style("stroke", colors.grey)
        .style("fill-opacity", cfg.opacityCircles)

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .attr("font-size", 10)
        .attr("font-family", "Noto Sans TC")
        .attr("fill", "grey")
        .text(d => Math.round(Math.exp(maxValue * d / cfg.levels)));

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    let axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "caption")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * cos(angleSlice * i - HALF_PI))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * sin(angleSlice * i - HALF_PI))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    let radarLine = d3.radialLine()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed)
    }

    //Create a wrapper for the blobs
    let blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.axes))
        .style("fill", (d, i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function(d, i) {
            //Dim all blobs
            div.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', () => {
            //Bring back all blobs
            div.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    //Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d, i) { return radarLine(d.axes); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d.axes)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
        .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
        .style("fill", (d) => cfg.color(d.id))
        .style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    //Wrapper for the invisible circles on top
    let blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
        .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d, i) {
            tooltip
                .attr('x', this.cx.baseVal.value - 10)
                .attr('y', this.cy.baseVal.value - 10)
                .transition()
                .style('display', 'block')
                .text(Math.round(Math.exp(d.value)));
        })
        .on("mouseout", function() {
            tooltip.transition()
                .style('display', 'none').text('');
        });

    let tooltip = g.append("text")
        .attr("font-size", 12)
        .attr("font-family", "Space Mono")
        .attr("fill", colors.blue)
        .attr('x', 0)
        .attr('y', 0)
        .style('display', 'none')
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em");

    if (cfg.legend !== false && typeof cfg.legend === "object") {
        let legendZone = svg.append('g');
        let names = data.map(el => el.name);
        if (cfg.legend.title) {
            let title = legendZone.append("text")
                .attr("class", "title")
                .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`)
                .attr("x", cfg.w - 70)
                .attr("y", 10)
                .attr("font-size", 12)
                .attr("fill", colors.black)
                .text(cfg.legend.title);
        }
        let legend = legendZone.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY + 20})`);
        // Create rectangles markers
        legend.selectAll('rect')
            .data(names)
            .enter()
            .append("rect")
            .attr("x", cfg.w - 65)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", (d, i) => cfg.color(i));
        // Create labels
        legend.selectAll('text')
            .attr("class", "caption")
            .data(names)
            .enter()
            .append("text")
            .attr("x", cfg.w - 52)
            .attr("y", (d, i) => i * 20 + 9)
            .attr("font-size", 12)
            .attr("fill", colors.black)
            .text(d => d);
    }
    return svg;
}