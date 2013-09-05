var worldcountries = [];
var worldcapitals = [];
var appeals = [];
var appealsCountries = [];


var width = 960,
    height = 960,
    m = .25, // drag sensitivity
    format = d3.format(".1f");

// var projection = d3.geo.orthographic()
//     .clipAngle(90)
//     .rotate([-5, -5])
//     .precision(.1)
//     .translate([width / 2, height / 2])
//     .scale(470);

// var gilbert = d3.geo.gilbert(projection);

// var path = d3.geo.path().projection(gilbert)
//   .pointRadius(2);

var projection = d3.geo.projection(d3.geo.hammer.raw(1.75, 2))
    .rotate([-10, -45])
    .scale(210);

var path = d3.geo.path()
    .projection(projection)
    .pointRadius(2);

var line = d3.svg.line()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })

  .interpolate("linear");


var graticule = d3.geo.graticule();

var svg = d3.select("#map1").append("svg")
  .attr("width", width)
  .attr("height", height);

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
        getappealdata();
      },
      error: function(e) {
          console.log(e);
      }
  });
}

function getappealdata(){
  $.ajax({
      type: 'GET',
      url: 'data/demoData_adm0_cut.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
        appeals = json;
        $(appeals).each(function(i, appeal){
          country = appeal.ADM0_A3;
          if ($.inArray(country, appealsCountries) == -1){
            appealsCountries.push(country);
          }
        });
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
var activeLinks = [];

function buildLinks(){
  $(worldcapitals.features).each(function(i, capital){
    // var caplat = capital.properties.LATITUDE;
    // var caplong = capital.properties.LONGITUDE;
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
  $()
  drawLinks();  
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

function drawLinks(){
  drawnLink = [];
  
  $(arcLinks).each(function(i, link){
    
    if ($.inArray(link.destination, appealsCountries) != -1){
      lineData = []; 
      lineData.push(
        {"x": projection(link.coordinates[0])[0], "y": projection(link.coordinates[0])[1]},
        {"x": projection(link.coordinates[1])[0], "y": projection(link.coordinates[1])[1]}        
        );

      drawnLink.push(link);
      arcGroup.append("path")
        .attr("d", line(lineData))
        .style({
          fill:'none',
          stroke: '#0000ff',
          'stroke-width': '1px'
        })
        .call(lineTransition);
    }
  });
   // arcGroup.selectAll("path")
  //   .data(drawnLink)
  //   .enter().append("path")
  //   .attr('class', 'arc')
  //   .attr('d', path)
    
  //   .style({
  //     fill:'none',
  //     stroke: '#0000ff',
  //     'stroke-width': '1px'
  //   })
  //   .call(lineTransition);

  // arcGroup.selectAll("path")
  //   .data(lineData)
  //   .enter().append("path")
  //   .attr("d", line(linesData))
  //   .style({
  //     fill:'none',
  //     stroke: '#0000ff',
  //     'stroke-width': '1px'
  //   })


  // arcGroup.selectAll("line")
  //   .data(drawnLink)
  //   .enter().append("line")
  //   .attr("x1", function(d){return projection(d.coordinates[0])[0]})
  //   .attr("y1", function(d){return projection(d.coordinates[0])[1]})
  //   .attr("x2", function(d){return projection(d.coordinates[1])[0]})
  //   .attr("y2", function(d){return projection(d.coordinates[1])[1]})
  //   .attr("transform", '')
  //   .style({
  //     fill:'none',
  //     stroke: '#0000ff',
  //     'stroke-width': '1px'
  //   });

}


getcountrydata();