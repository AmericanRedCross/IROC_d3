var worldcountries = [];
var worldcapitals = [];

var svgwidth = 960,
    svgheight = 960;

var projection = d3.geo.orthographic()
    .clipAngle(90)
    .rotate([-5, -5])
    .precision(.1)
    .translate([svgwidth / 2, svgheight / 2])
    .scale(470);

var gilbert = d3.geo.gilbert(projection);


var path = d3.geo.path()
  .projection(gilbert)
  .pointRadius(2);

var graticule = d3.geo.graticule();

var svg = d3.select("#map1").append("svg")
  .attr("width", svgwidth)
  .attr("height", svgheight);

var countryGroup = svg.append('g').attr("id", "countries");
var arcGroup = svg.append('g').attr("id", "arcs");
var capitalGroup = svg.append('g').attr("id", "capitals");


function getcountrydata(){
  $.ajax({
      type: 'GET',
      url: 'data/worldcountries.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
          worldcountries = json;
          getcapitaldata();
      },
      error: function(e) {
          console.log(e);
      }
  });
}

function getcapitaldata(){
  $.ajax({
      type: 'GET',
      url: 'data/worldcapitals.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
          worldcapitals = json;
          mapIt();
      },
      error: function(e) {
          console.log(e);
      }
  });
}

function mapIt(){
  // svg.append("path")
  //   .datum({type: "Sphere"})
  //   .attr("class", "background")
  //   .attr("d", path);

 countryGroup.selectAll("path")
    .data(worldcountries.features)
    .enter().append("path")
    .attr('data-ADM0', function(d){return d.properties.geoCode;})    
    .attr('data-name', function(d){return d.properties.name;})        
    .attr('class', 'country')
    .attr("d", path);    
  addCapitals();
}

function addCapitals(){
  capitalGroup.selectAll("path")
    .data(worldcapitals.features)
    .enter().append("path")      
    .attr('data-ADM0', function(d){return d.properties.ADM0_A3;})
    .attr('class', 'capital')  
    .attr("d", path);
  buildLinks();
}


var arcOrigin = [];
var arcDestinations = [];
var arcLinks = [];

function buildLinks(){
  $(worldcapitals.features).each(function(i, capital){
    var caplat = capital.properties.LATITUDE;
    var caplong = capital.properties.LONGITUDE;
    if (capital.properties.ADM0_A3 == "USA"){      
      arcOrigin.push(capital);      
    } else {
      arcDestinations.push(capital);      
    }
  });
  $(arcDestinations).each(function(i, destination){
    arcLinks.push({
      type: "LineString",
      destination: destination.properties.ADM0_A3,
      coordinates: [
        [arcOrigin[0].geometry.coordinates[0], arcOrigin[0].geometry.coordinates[1]],
        [destination.geometry.coordinates[0], destination.geometry.coordinates[1]]
      ]
    });
  });
  drawLink("NPL");  
}

// --- Helper functions (for tweening the path)
var lineTransition = function lineTransition(path) {
    path.transition()
        //NOTE: Change this number (in ms) to make lines draw faster or slower
        .duration(5500)
        .attrTween("stroke-dasharray", tweenDash)
        .each("end", function(d,i) { 
            ////Uncomment following line to re-transition
            //d3.select(this).call(transition); 
            
            ////We might want to do stuff when the line reaches the target,
            //doStuffWhenLineFinishes(d,i);
        });
};
var tweenDash = function tweenDash() {
    //This function is used to animate the dash-array property, which is a
    //  nice hack that gives us animation along some arbitrary path (in this
    //  case, makes it look like a line is being drawn from point A to B)
    var len = this.getTotalLength(),
        interpolate = d3.interpolateString("0," + len, len + "," + len);

    return function(t) { return interpolate(t); };
};

function drawLink(adm0){
  drawnLink = [];
  $(arcLinks).each(function(i, link){
    if (link.destination == adm0){
      drawnLink.push(link);
    }
  });
  arcGroup.selectAll(adm0)
    .data(drawnLink)
    .enter().append("path")
    .attr('class', 'arc')
    .attr('d', path)
    .style({
      fill:'none',
      stroke: '#0000ff',
      'stroke-width': '2px'
    })
    .call(lineTransition);
}


getcountrydata();