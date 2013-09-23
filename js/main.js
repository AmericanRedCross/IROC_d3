var worldcountries = [];
var worldcapitals = [];
var appeals = [];
var appealsCountries = [];
var responses = [];
var responsesCountries = [];
var displayedAppeals = [];

// these don't need to be global
var endDate = "";
var oneMonth = "";
var twoMonth = "";
var threeMonth = ""; 
var fourMonth = "";
var fiveMonth = "";
var sixMonth = "";

var width = height = null;

var projection = d3.geo.projection(d3.geo.hammer.raw(2, 2))
    .rotate([-5, -30])
    .scale(180);

var path = d3.geo.path()
    .projection(projection)
    .pointRadius(1);
    

var rscale = d3.scale.sqrt();

var line = d3.svg.line()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })

  .interpolate("linear");


var graticule = d3.geo.graticule();

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "appeal-tooltip")    
    .text("a simple tooltip");

var svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

function initSizes() {
  width = $(window).width();
  height = $(window).height() - 100;
  projection.translate([width/2,height/2]);
  svg
    .attr("width", width)
    .attr("height", height);
  rscale.range([0, height/45]);
};

initSizes();

var countryGroup = svg.append('g').attr("id", "countries");
var responseGroup = svg.append('g').attr("id", "arcs");
var capitalsGroup = svg.append('g').attr("id", "capitals");

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


var leftMargin = 200; 
var fitMapProjection = function() {
  fitProjection(projection, worldcountries, [[leftMargin, 100], [width - 20, height-120]], true);
};


function getcountrydata(){
  $.ajax({
      type: 'GET',
      url: 'data/worldcountries.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
        worldcountries = json;
        fitMapProjection();
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
        
        getresponsedata();
      },
      error: function(e) {
          console.log(e);
      }
  });
}

function getresponsedata(){
  $.ajax({
      type: 'GET',
      url: 'data/iroc_response.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
        responses = json;
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
        addCountries();
      },
      error: function(e) {
        console.log(e);
      }
  });
}

function addCountries(){
 
 countryGroup.selectAll("path")
    .data(worldcountries.features)
    .enter().append("path")
    .attr('data-ADM0', function(d){return d.properties.geoCode;})    
    .attr('data-name', function(d){return d.properties.name;})        
    .attr('class', 'country')
    .attr("d", path);    
  buildLinks();
}

var arcOrigin = [];
var arcDestinations = [];
var arcLinks = [];

function buildLinks(){
  $(worldcapitals.features).each(function(i, capital){    
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
  addCapitals();  
}

function addCapitals(){
  capitalsGroup.selectAll("circle")
    .data(worldcapitals.features)
    .enter().append("circle")      
    .attr('id', function(d){return d.properties.ADM0_A3;})
    .attr('class', 'none')  
    .attr("cx", function(d){return projection([d.properties.LONGITUDE,d.properties.LATITUDE])[0]})
    .attr("cy", function(d){return projection([d.properties.LONGITUDE,d.properties.LATITUDE])[1]})
    .attr("r", 0)
    .on("mouseover", function(d){
      tooltip.html(d.properties.ADM0NAME);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+15)+"px");})
    .on("mouseout", function(){return tooltip.style("visibility", "hidden");}); 
  buildSlider();
}


function monthText(value){
  if(value === 0) {
    return "January"
  } else if (value === 1) {
    return "February"
  } else if (value === 2) {
    return "March"
  } else if (value === 3) {
    return "April"
  } else if (value === 4) {
    return "May"
  } else if (value === 5) {
    return "June"
  } else if (value === 6) {
    return "July"
  } else if (value === 7) {
    return "August"
  } else if (value === 8) {
    return "September"
  } else if (value === 9) {
    return "October"
  } else if (value === 10) {
    return "November"
  } else if (value === 11) {
    return "December"
  }
}

function buildSlider(){
  var allDates = [];
  $(appeals).each(function(i, appeal){
    selected = appeal.ST_DATE;
    selectedDate = new Date(selected);
    allDates.push(selectedDate);
  });
  $(responses).each(function(i, response){
    selected = response.Date;
    selectedDate = new Date(selected);
    allDates.push(selectedDate);
  });
  maxDate = new Date(Math.max.apply(null, allDates));
  minDate = new Date(Math.min.apply(null, allDates));
  $("#slider").dateRangeSlider({
    bounds:{
      min: minDate,
      max: maxDate
    },
    step:{
      months: 1
    },
    range:{
      min: {months:1},
      max: {months:1}
    },
    defaultValues:{
      min: new Date(2006,8,1),
      max: new Date(2006,9,1)
    },
    formatter:function(val){
        var month = monthText(val.getMonth());
        var year = val.getFullYear();
        return month + " " + year;
      }
  });
  updateMap($("#slider").dateRangeSlider("values").min, $("#slider").dateRangeSlider("values").max);

}


$("#slider").bind("valuesChanging", function(e, data){
  updateMap(data.values.min, data.values.max);
})

function updateMap(min, max){  
  $('[id="capitals"]').children().attr('class','none');
  endDate = max;
  oneMonth = min;
  var twoStart = oneMonth.getMonth();
  twoStart -= 1;
  twoMonth = new Date(oneMonth);
  twoMonth = new Date(twoMonth.setMonth(twoStart));
  var threeStart = twoMonth.getMonth();
  threeStart -= 1;
  threeMonth = new Date(twoMonth);
  threeMonth = new Date(threeMonth.setMonth(threeStart));
  var fourStart = threeMonth.getMonth();
  fourStart -= 1;
  fourMonth = new Date(threeMonth);
  fourMonth = new Date(fourMonth.setMonth(fourStart));
  var fiveStart = fourMonth.getMonth();
  fiveStart -= 1;
  fiveMonth = new Date(fourMonth);
  fiveMonth = new Date(fiveMonth.setMonth(fiveStart));
  var sixStart = fiveMonth.getMonth();
  sixStart -= 1;
  sixMonth = new Date(fiveMonth);
  sixMonth = new Date(sixMonth.setMonth(sixStart));
  $(appeals).each(function(i, appeal){
    appealStart = new Date(appeal.ST_DATE);
    appealCountry = appeal.ADM0_A3;
    // not "less than or equal to" since endDate is the first day of the next month
    if (appealStart < endDate) {
      var oldClass = $('[id="capitals"]').children("#" + appealCountry).attr('class');  
      if(appealStart >= oneMonth){        
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' oneMonth');
      } else if (appealStart >=twoMonth){
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' twoMonth');
      } else if (appealStart >=threeMonth){
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' threeMonth');
      } else if (appealStart >=fourMonth){
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' fourMonth');
      } else if (appealStart >=fiveMonth){
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' fiveMonth');
      } else if (appealStart >=sixMonth){
        $('[id="capitals"]').children("#" + appealCountry).attr('class', oldClass + ' sixMonth');
      }
    }
  });  
  $('[id="capitals"]').children(".none").attr('r','0');
  $('[id="capitals"]').children(".sixMonth").attr('r','2').attr('opacity','0.5');
  $('[id="capitals"]').children(".fiveMonth").attr('r','3').attr('opacity','0.6');
  $('[id="capitals"]').children(".fourMonth").attr('r','4').attr('opacity','0.7');
  $('[id="capitals"]').children(".threeMonth").attr('r','5').attr('opacity','0.8');
  $('[id="capitals"]').children(".twoMonth").attr('r','7').attr('opacity','0.9');  
  $('[id="capitals"]').children(".oneMonth").attr('r','9').attr('opacity','1');  
  
}







function addResponses(year){
  $(responses).each(function(i, response){
    country = response.ADM0_A3;
    var d = new Date(response.Date);
    var responseYear = d.getFullYear();
    if (responseYear == year){
      if ($.inArray(country, responsesCountries) == -1){
        responsesCountries.push(country);
      }  
    }
    
  });

  drawnLink = [];
  $(arcLinks).each(function(i, link){
    
    if ($.inArray(link.destination, responsesCountries) != -1){
      lineData = []; 
      lineData.push(
        {"x": projection(link.coordinates[0])[0], "y": projection(link.coordinates[0])[1]},
        {"x": projection(link.coordinates[1])[0], "y": projection(link.coordinates[1])[1]}        
        );
      drawnLink.push(link);
      responseGroup.append("path")
        .attr("d", line(lineData))
        .style({
          fill:'none',
          stroke: '#0000ff',
          'stroke-width': '1px'
        })
        .call(lineTransition);
    }
  });

}


getcountrydata();