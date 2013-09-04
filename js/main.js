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
var capitalsGroup = svg.append('g').attr("id", "capitals");


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
    .attr("d", path)
    .on("click", logIt);
  addCapitals();
}

function addCapitals(){
  capitalsGroup.selectAll("path")
    .data(worldcapitals.features)
    .enter().append("path")      
    .attr('data-ADM0', function(d){return d.properties.ADM0_A3;})
    .attr('class', 'capital')  
    .attr("d", path);
}

function logIt(x){
  console.log(x);
}


getcountrydata();