

// the below is stuff from http://remittances.herokuapp.com/?en

// but this >>> http://eyeseast.github.io/visible-data/2013/08/26/responsive-d3/ <<<
// looks simpler and might work just fine



var chart_svg = d3.select("#chart").append("svg");

var background = chart_svg.append("rect")
  .attr("fill", "#111");

//
var width = height = null;

var projection = d3.geo.projection(d3.geo.hammer.raw(1.75, 2))
    .rotate([-10, -45])
    .scale(180);

var path = d3.geo.path()
    .projection(projection);

var rscale = d3.scale.sqrt();

//


function initSizes() {
  width = $(window).width();
  height = $(window).height() - 40;
  background
    .attr("width", width)
    .attr("height", height);
  projection.translate([width/2.3,height/2]);
  chart_svg
    .attr("width", width)
    .attr("height", height);
  rscale.range([0, height/45]);
};

initSizes();


//


var leftMargin = 350; // Math.max(100, width*0.4);
var fitMapProjection = function() {
  fitProjection(projection, world, [[leftMargin, 60], [width - 20, height-120]], true);
};
fitMapProjection();

//


var onResize = function() {
  initSizes();
  fitMapProjection();
  updateMap();
  updateBubblePositions();
  updateBubbleSizes();
  updateCircleLegend();
};
$(window).resize(onResize);
  
