var worldcountries = [];
var worldcapitals = [];
var appeals = [];
var appealsCountries = [];
var responses = [];
var displayedResponses = [];
var displayedAppeals = [];
var appealsToDate = [];
var minDate;
var MaxDate;
var NHQ = [-77.009418580800002, 38.899549376499998];
var responseLines = []; 
var xyNHQ = [];
// var arcDestinations = [];
// var arcLinks = [];
var sliderValue = null;
var totalMonths;
var leftMargin = 200; 
var sliderWidth = null;
var maxAppealBudget = 0;
var minAppealBudget = 0;
var appealBudgets = [];
var endDate;
var oneMonth;
var twoMonth;
var threeMonth; 
var fourMonth;
var fiveMonth;
var sixMonth;
var appealsSums = [];

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
    .text("");

var map = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

function initSizes() {
  width = $("#right").width();
  height = $(window).height() - 60;
  projection.translate([width/2,height/2]);
  map
    .attr("width", width)
    .attr("height", height);
  rscale.range([0, height/45]);
  
};

initSizes();

function normalizeAppealBudget(dollas) {
  var c = 4; // smallest marker radius
  var d = 13; // largest marker radius
  return c + ((dollas - minAppealBudget)*(d - c)) / (maxAppealBudget - minAppealBudget)
}

var appealMarkerScale = d3.scale.linear()
  .range([4, 13]); //smallest and largest marker radius --- domain set within getappealdata()

var appealAnimationScale = d3.scale.linear()
  .range([15, 65]); //smallest and largest marker radius --- domain set within getappealdata()

function fitMapProjection() {
  var xTwo = $("#map").width();
  var yTwo = $("#map").height();
  fitProjection(projection, worldcountries, [[0, 0], [xTwo, yTwo]], true);
};

var countryGroup = map.append('g').attr("id", "countries");
var capitalsGroup = map.append('g').attr("id", "capitals");
var appealsGroup = map.append('g').attr("id", "appealmarkers");
var responseGroup = map.append('g').attr("id", "responses");

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
      url: 'data/appealsData.json',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 10000,
      success: function(json) {
        appeals = json;
        $(appeals).each(function(i, response){
          var dollas = parseInt(response.TOTAL_BUDGET);
          if (isFinite(dollas) == true){
            appealBudgets.push(response.TOTAL_BUDGET)
          }          
        });
        maxAppealBudget = Math.max.apply(null, appealBudgets);
        minAppealBudget = Math.min.apply(null, appealBudgets);
        appealMarkerScale.domain([0, maxAppealBudget]);
        appealAnimationScale.domain([0, maxAppealBudget]);
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
        buildSlider();
      },
      error: function(e) {
        console.log(e);
      }
  });
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
  totalMonths = (((maxDate.getFullYear()-minDate.getFullYear())-1)*12)+((12-minDate.getMonth())+(maxDate.getMonth()+1)); 
  $('#dateSlider').noUiSlider({
    range: [0,totalMonths],
    start: [0],
    step: 1,
    handles: 1,
    slide: onSlide,
    connect: "lower",

  });
  $(".noUi-base").append('<div class="ticksWrap"></div>')
  for(var i = 0; i < totalMonths+1; i++) {
    $(".ticksWrap").append('<span class="ticks"></span>');
  }
  var startMonth = minDate.getMonth();
  var yearBreakOne = 11 - startMonth;  
  for(var i = yearBreakOne; i <= totalMonths; i++) {
    $(".ticksWrap").children().eq(i).addClass("yearTick");
    i = i + 11;
  }
  $(".ticksWrap").children().eq(0).css("border-color","rgba(0,0,0,0)");
  $(".ticksWrap").children().eq(totalMonths).css("display","none");
  sizeSliderElements();
  // buildWorldAllAppeals();
}

var worldAllAppealsScale = d3.scale.linear();
var worldYearAppealsScale = d3.scale.linear();
var appealsW = $("#left").width();
var appealsH = 125;
var appealsBarPadding = 1;
var numberGraphBars = 0;
var appealsGraph = d3.select("#appealsGraphContainer")
  .append("svg")  
  .attr("width", appealsW)
  .attr("height", appealsH);
var appealBars = appealsGraph.append('g').attr("id", "appealBars");
var appealIcons = appealsGraph.append('g').attr("id", "appealIcons");


function appealGraphResize() {
  appealsW = $("#left").width();
  appealsGraph.attr("width", appealsW);  
  var dataBars = appealBars.selectAll("rect");
  dataBars
    .attr("x", function(d,i) {
      return i * (appealsW / numberGraphBars);
    })
    .attr("width", appealsW / numberGraphBars - appealsBarPadding);
}


function buildWorldAllAppeals() {
  var maxYear = maxDate.getFullYear();
  var minYear = minDate.getFullYear();
  var divisionNumber = maxYear - minYear + 1;
  appealsSums = [];
  for(var i = minYear; i <= maxYear; i++){
    var appealsCount = 0;
    $(appeals).each(function(aIndex, appeal){
      var appealYear = new Date(appeal.ST_DATE).getFullYear();
      if(appealYear == i){
        appealsCount += 1;
      }
    });
    appealsSums.push(appealsCount);
  }
  var maxSum = Math.max.apply(null, appealsSums);
  numberGraphBars = appealsSums.length;
  worldAllAppealsScale.range([1, appealsH])
    .domain([0,maxSum]); 
  var dataBars = appealBars.selectAll("rect")
    .data(appealsSums);
  dataBars.enter().append("rect")
    .attr("fill", "#e47b85");
  dataBars.exit()  
    .transition()
    .duration(300)
    .ease("exp")
      .attr("width", 0)
    .remove();
  dataBars   
    .transition()
    .duration(300)
    .ease("quad") 
    .attr("x", function(d,i) {
      return i * (appealsW / numberGraphBars);
    })
    .attr("y", function(d){
      return appealsH - worldAllAppealsScale(d);
    })
    .attr("width", appealsW / numberGraphBars - appealsBarPadding)
    .attr("height", worldAllAppealsScale)
    .attr("fill", "#e47b85")
    .attr("data-number", function(d){ return d; });  
  $("#appealBox .yearLabel").empty();
  $("#appealsGraphWrap .xLabelMin").html(minYear.toString());
  $("#appealsGraphWrap .xLabelMax").html(maxYear.toString());  
}

function buildWorldYearAppeals(date){
  year = new Date(date).getFullYear();
  var graphYearAppeals = [];
  var monthSums = [];
  $(appeals).each(function(aIndex, appeal){
    var appealYear = new Date(appeal.ST_DATE).getFullYear();
    if(appealYear == year){
      graphYearAppeals.push(appeal);
    }
  });
  for(var i=0; i<12; i++){
    var appealsCount = 0;
    $(graphYearAppeals).each(function(aIndex, appeal){
      var appealMonth = null;
      appealMonth = new Date(appeal.ST_DATE).getMonth();
      if(appealMonth == i){
        appealsCount +=1;
      }
    });
    monthSums.push(appealsCount);
  }
  var maxSum = Math.max.apply(null, monthSums);
  numberGraphBars = monthSums.length;
  worldYearAppealsScale.range([1, appealsH])
    .domain([0,maxSum]);
  
  var dataBars = appealBars.selectAll("rect")
    .data(monthSums);
  dataBars.enter().insert("rect")
    .attr("fill", "#e47b85");
  dataBars.exit()
    .transition()
    .duration(300)
    .ease("exp")
      .attr("width", 0)
      .remove();
  dataBars
    .transition()
    .duration(300)
    .ease("quad")    
    .attr("x", function(d,i) {
      return i * (appealsW / numberGraphBars);
    })
    .attr("y", function(d){
      return appealsH - worldYearAppealsScale(d);
    })
    .attr("width", appealsW / numberGraphBars - appealsBarPadding)
    .attr("height", worldYearAppealsScale)
    // .attr("fill", "#e47b85")
    .attr("data-number", function(d){ return d; });  
  $("#appealBox .yearLabel").html(year.toString());
  $("#appealsGraphWrap .xLabelMin").html("Jan");
  $("#appealsGraphWrap .xLabelMax").html("Dec");  
}


function showCountryYearAppeals(country){
  var data = [];
  admCode = country.properties.ADM0_A3;
  sliderValue = parseInt($("#dateSlider").val());
  var start = new Date(minDate);
  var startMonth = start.getMonth();
  var activeMonthValue = startMonth + sliderValue;    
  var selectedDate = new Date(start.setMonth(activeMonthValue));
  var currentYear = selectedDate.getFullYear();
  $(appeals).each(function(aIndex, appeal){
    if(appeal.ADM0_A3 == admCode){
      var currentAppealYear = new Date(appeal.ST_DATE);
      currentAppealYear = currentAppealYear.getFullYear();
      if(currentAppealYear == currentYear){
        data.push(appeal);
      }
    };
  });
  if(data.length != 0){
    tooltip.html(country.properties.name);     
    $("#allYearsButton").hide();
    $("#appealBars").hide();
    $("#appealsGraphTitle").hide();
    $("#countryAppealsTitle").html("<h2>" + country.properties.name + " " + currentYear.toString() + "</h2>"); 
    $("#countryAppealsTitle").show();     
    $("#appealsGraphWrap .xLabelMin").hide();
    $("#appealsGraphWrap .xLabelMax").hide();
    $("#appealsGraphWrap .xLabelJan").show();
    $("#appealsGraphWrap .xLabelDec").show();
    // add tick marks for months
    var monthScale = d3.scale.linear()
      .domain([0,12])
      .range([0,appealsW-1]);
      var xAxis = d3.svg.axis()
      .scale(monthScale)
      .tickFormat("")
      .orient("top");
      appealIcons.append("g")
      .attr("class", "x axis")
      .attr("transform","translate(" + 0 + "," + appealsH + ")")
      .call(xAxis); 
    var iconW = appealsW / 12;
    $(data).each(function(dIndex, d){
      dMonth = new Date(d.ST_DATE).getMonth();
      disasterType = d.CATEGORY;
      d3.select("#appealIcons").append("svg:image")
        .attr("xlink:href", "img/disasters/" + disasterType + ".png")
        .attr("width", iconW + "px")
        .attr("height", iconW + "px")
        .attr("x", dMonth * iconW)
        .attr("y", appealsH - iconW);
    })
  } 
}

function hideCountryYearAppeals() {
  $("#allYearsButton").show();
  $("#appealIcons").empty();
  $("#appealBars").show();
  $("#appealsGraphTitle").show(); 
  $("#countryAppealsTitle").hide();
  $("#appealsGraphWrap .xLabelMin").show();
  $("#appealsGraphWrap .xLabelMax").show();
  $("#appealsGraphWrap .xLabelJan").hide();
  $("#appealsGraphWrap .xLabelDec").hide();  
}


function sizeSliderElements(){
  var sliderWrapWidth = $(window).width() - 60;
  $("#sliderWrap").width(sliderWrapWidth);
  sliderWidth = $(".noUi-base")[0].getBoundingClientRect().width;
  var spanWidth = ((sliderWidth - totalMonths) / totalMonths);
  $('.ticks').css("margin-right", spanWidth.toString() + "px");
  $(".ticksWrap").children().eq(totalMonths-1).css("margin-right","0");
  $('.noUi-handle').css("width", spanWidth + "px");
  addCountries();
}

function addCountries(){
  fitMapProjection(); 
  countryGroup.selectAll("path")
    .data(worldcountries.features)
    .enter().append("path")      
    .attr('class', 'country')
    // .on("mouseover", function(d){
    //   showCountryYearAppeals(d);                 
    // })
    // .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+15)+"px");})
    // .on("mouseout", function(){
    //   tooltip.html("");
    //   hideCountryYearAppeals();
    // })
    .attr("d", path);    
  addAppealMarkers();
}


function addAppealMarkers(){
  // tie coordinates to each appeal
  $(appeals).each(function(aIndex, a){
    $(worldcapitals.features).each(function(bIndex, b){
      if(a.ADM0_A3 == b.properties.ADM0_A3){
        var thisLat = b.properties.LATITUDE;
        var thisLong = b.properties.LONGITUDE;
        appeals[aIndex].LATITUDE = thisLat;
        appeals[aIndex].LONGITUDE = thisLong;
      }
    })
  })
  // add appeals to map
  var groups = appealsGroup.selectAll().data(appeals).enter().append("g");
  groups.append("circle")
    .attr("class", "appealCircle")
    .attr("r", function(d){ return appealMarkerScale(d.TOTAL_BUDGET) })
    .attr("cx", function(d){ return projection([d.LONGITUDE,d.LATITUDE])[0] })
    .attr("cy", function(d){ return projection([d.LONGITUDE,d.LATITUDE])[1] });
    // .on("mouseover", function(d){
    //   showCountryYearAppeals(d);
    // })
    // .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+15)+"px");})
    // .on("mouseout", function(){
    //   tooltip.html("");
    //   hideCountryYearAppeals();
    // });  
  addResponseLines();
}

function addResponseLines(){
  // tie coordinates for Washington, DC and destination to each response 
  xyNHQ = projection([-77.009418580800002, 38.899549376499998]);
  $(responses).each(function(aIndex, a){
    $(worldcapitals.features).each(function(bIndex, b){
      if(a.ADM0_A3 == b.properties.ADM0_A3){
        var latlngDestination = [b.properties.LONGITUDE, b.properties.LATITUDE];
        var xyDestination = projection (latlngDestination);
        responseLines.push({
          lineData: [
            {"x": xyNHQ[0], "y": xyNHQ[1]},
            {"x": xyDestination[0], "y": xyDestination[1]}   
          ],
          properties: a
        });
      }
    })
  })
  // add responses data to map
  var groups = responseGroup.selectAll().data(responseLines).enter().append("g");
  groups.append("path")
    .attr("d", function(d){return line(d.lineData)})
    .style({
      'fill':'none',
      'stroke': '#7f181b',
      'stroke-width': '2px'
    });
    
  refreshMap();    
}


function monthToText(value){
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

// took this from Dale's first IROC response map
Number.prototype.formatNumber = function(c, d, t) {
    var n = this,
    c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "," : d,
    t = t == undefined ? "." : t,
    s = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

function opacityValue(date){     
  if(date >= oneMonth){        
    return 1;        
  } else if (date >=twoMonth){
    return 0.9;
  } else if (date >=threeMonth){
    return 0.7;
  } else if (date >=fourMonth){
    return 0.5;
  } else if (date >=fiveMonth){
    return 0.3;
  } else if (date >=sixMonth){
    return 0.1;
  }   
}


function onSlide() {
  if(parseInt($("#dateSlider").val()) !== sliderValue) {
    sliderValue = parseInt($("#dateSlider").val());
    start = new Date(minDate);
    startMonth = start.getMonth();
    changeValue = startMonth + sliderValue;    
    selectedDate = new Date(start.setMonth(changeValue));
    updateMap(selectedDate);
    updateSidebar(selectedDate);
    updateSidebarResponses(selectedDate);
    // buildWorldYearAppeals(selectedDate);
  }  
}

function refreshMap() {
  sliderValue = parseInt($("#dateSlider").val());
  start = new Date(minDate);
  startMonth = start.getMonth();
  changeValue = startMonth + sliderValue;  
  selectedDate = new Date(start.setMonth(changeValue));
  updateMap(selectedDate);
  updateSidebar(selectedDate);
}

function updateMap(date) { 
  // update Date breaks
  oneMonth = date;
  var endStart = oneMonth.getMonth();
  endStart += 1;
  endDate = new Date(oneMonth);
  endDate = new Date(endDate.setMonth(endStart));
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

  // filter appeals by Date
  // maybe should be <= and >=   ????????
  var filtered = appealsGroup.selectAll("g").attr("visibility","hidden")
    .filter(function(d) {return Date.parse(d.ST_DATE) < endDate && Date.parse(d.ST_DATE) > sixMonth })
    .attr("visibility","visible")
    .attr('opacity', function(d) { return opacityValue(Date.parse(d.ST_DATE)) });
  // animation for new appeals
  filtered.filter(function(d) {return Date.parse(d.ST_DATE) >= oneMonth })
    .append("circle")
    .attr("class", "animationCircle")
    .attr("r", 0)
    .attr("cx", function(d){ return projection([d.LONGITUDE,d.LATITUDE])[0] })
    .attr("cy", function(d){ return projection([d.LONGITUDE,d.LATITUDE])[1] })
    .style("fill","red")
    .style("fill-opacity", 0.8)
    .transition()
    .duration(2500)
    .ease(Math.sqrt)
    .attr("r", function(d){ return appealAnimationScale(d.TOTAL_BUDGET) })
    .style("fill","#f40")
    .style("fill-opacity", 1e-6)
    .remove();

  // filter responses by Date
  var filteredResponses = responseGroup.selectAll("g").attr("visibility","hidden")
    .filter(function(d) {return Date.parse(d.properties.Date) < endDate && Date.parse(d.properties.Date) > sixMonth })
    .attr("visibility","visible")
    .attr("opacity", function(d) {return opacityValue(Date.parse(d.properties.Date)) });
  // animation for new responses
  filteredResponses.filter(function(d) {return Date.parse(d.properties.Date) < endDate && Date.parse(d.properties.Date) >= oneMonth })
    .selectAll("path")
    .call(lineTransition);

}

// --- Helper functions (for tweening the path) from http://bl.ocks.org/enoex/6201948
var lineTransition = function lineTransition(path) {
    path.transition()
        //NOTE: Change this number (in ms) to make lines draw faster or slower
        .duration(2000)
        .attrTween("stroke-dasharray", tweenDash);
        // .each("end", function(d,i) {});
};
var tweenDash = function tweenDash() {
    //This function is used to animate the dash-array property, which is a
    //  nice hack that gives us animation along some arbitrary path (in this
    //  case, makes it look like a line is being drawn from point A to B)
    var len = this.getTotalLength(),
        interpolate = d3.interpolateString("0," + len, len + "," + len);
    return function(t) { return interpolate(t); };
};


var totalAppealBudgets = 0;
var totalAppealBeneficiaries = 0;

function updateSidebar(date){
  // get upper bound of displayed time period
  var endStart = date.getMonth();
  endStart += 1;
  endDate = new Date(date);
  endDate = new Date(endDate.setMonth(endStart));
  // update date display
  monthText = monthToText(date.getMonth());
  yearText = date.getFullYear().toString();
  $("#sliderYear").html(yearText + " ");
  $("#sliderMonth").html(monthText);
  // build array of appeals to date
  // count totals
  appealsToDate = [];
  totalAppealBudgets = 0;
  totalAppealBeneficiaries = 0;
  $(appeals).each(function(i, appeal){
    var appealStart = new Date(appeal.ST_DATE);
    if (appealStart < endDate) {
      appealsToDate.push(appeal);
      budget = parseInt(appeal.TOTAL_BUDGET);
      if (isFinite(budget)){
        totalAppealBudgets += budget;
      };
      beneficiaries = parseInt(appeal.TOT_TARGET_BENIFICIARIES);
      if (isFinite(beneficiaries)){
        totalAppealBeneficiaries += beneficiaries;
      };    
    }
  });  
  var appealCountFormated = appealsToDate.length.formatNumber(0, '.', ',');
  $("#totalAppealCount").html(appealCountFormated);
  var appealBudgetsFormated = totalAppealBudgets.formatNumber(0, '.', ',');
  $("#totalAppealBudgets").html(appealBudgetsFormated);
  var appealBeneficiariesFormated = totalAppealBeneficiaries.formatNumber(0, '.', ',');
  $("#totalAppealBeneficiaries").html(appealBeneficiariesFormated);
}

var responsesCount = 0;
var money = 0;
var staff = 0;
var foodParcels = 0;
var hygieneKits = 0;
var jerryCans = 0;
var kitchenSets = 0;
var mosquitoNets = 0;
var otherItems = 0;
var riceBags = 0;
var sleepingMats = 0;
var tarps = 0;
var tents = 0;
var vehicles = 0;

function updateSidebarResponses(date){
  // zero out response totals
  responsesCount = 0;
  money = 0;
  staff = 0;
  foodParcels = 0;
  hygieneKits = 0;
  jerryCans = 0;
  kitchenSets = 0;
  mosquitoNets = 0;
  otherItems = 0;
  riceBags = 0;
  sleepingMats = 0;
  tarps = 0;
  tents = 0;
  vehicles = 0;

  // get upper bound of displayed time period
  var endStart = date.getMonth();
  endStart += 1;
  endDate = new Date(date);
  endDate = new Date(endDate.setMonth(endStart));

  $.each(responses, function(a, b) {
    var thisResponseDate = new Date(b.Date);
    if (thisResponseDate < endDate){
      responsesCount += 1;
      if (isFinite(parseInt(b.Money))){
        money += parseInt(b.Money);
      }
      if (isFinite(parseInt(b.PeopleDeployed))){
        staff += parseInt(b.PeopleDeployed);
      }
      if (isFinite(parseInt(b.FoodParcels))){
        foodParcels += parseInt(b.FoodParcels);
      }
      if (isFinite(parseInt(b.HygieneKits))){
        hygieneKits += parseInt(b.HygieneKits);
      }
      if (isFinite(parseInt(b.JerryCans))){
        jerryCans += parseInt(b.JerryCans);
      }
      if (isFinite(parseInt(b.KitchenSets))){
        kitchenSets += parseInt(b.KitchenSets);
      }
      if (isFinite(parseInt(b.MosquitoNets))){
        mosquitoNets += parseInt(b.MosquitoNets);
      }
      if (isFinite(parseInt(b.OtherItems))){
        otherItems += parseInt(b.OtherItems);
      }
      if (isFinite(parseInt(b.RiceBags))){
        riceBags += parseInt(b.RiceBags);
      }
      if (isFinite(parseInt(b.SleepingMats))){
        sleepingMats += parseInt(b.SleepingMats);
      }
      if (isFinite(parseInt(b.Tarps))){
        tarps += parseInt(b.Tarps);
      }
      if (isFinite(parseInt(b.Tents))){
        tents += parseInt(b.Tents);
      }
      if (isFinite(parseInt(b.Vehicles))){
        vehicles += parseInt(b.Vehicles);
      }
    }
  })
  responseCountFormated = responsesCount.formatNumber(0, '.', ',');
  $("#responsesCount").html(responseCountFormated);
  moneyFormated = money.formatNumber(0, '.', ',');
  $("#totalMoney").html(moneyFormated);
  staffFormated = staff.formatNumber(0, '.', ',');
  $("#totalStaff").html(staffFormated);
  foodParcelsFormated = foodParcels.formatNumber(0, '.', ',');
  $("#totalFoodParcels").html(foodParcelsFormated);
  hygieneKitsFormated = hygieneKits.formatNumber(0, '.', ',');
  $("#totalHygieneKits").html(hygieneKitsFormated);
  jerryCansFormated = jerryCans.formatNumber(0, '.', ',');
  $("#totalJerryCans").html(jerryCansFormated);
  kitchenSetsFormated = kitchenSets.formatNumber(0, '.', ',');
  $("#totalKitchenSets").html(kitchenSetsFormated);
  mosquitoNetsFormated = mosquitoNets.formatNumber(0, '.', ',');
  $("#totalMosquitoNets").html(mosquitoNetsFormated);
  otherItemsFormated = otherItems.formatNumber(0, '.', ',');
  $("#totalOtherItems").html(otherItemsFormated);
  riceBagsFormated = riceBags.formatNumber(0, '.', ',');
  $("#totalRiceBags").html(riceBagsFormated);
  sleepingMatsFormated = sleepingMats.formatNumber(0, '.', ',');
  $("#totalSleepingMats").html(sleepingMatsFormated);
  tarpsFormated = tarps.formatNumber(0, '.', ',');
  $("#totalTarps").html(tarpsFormated);
  tentsFormated = tents.formatNumber(0, '.', ',');
  $("#totalTents").html(tentsFormated);
  vehiclesFormated = vehicles.formatNumber(0, '.', ',');
  $("#totalVehicles").html(vehiclesFormated);

}

function autoAdvance(){
  if(parseInt($("#dateSlider").val()) == totalMonths){
    $("#dateSlider").val(0);
    onSlide();
  } else{
    var sliderChangeValue = parseInt($("#dateSlider").val()) + 1;
    $("#dateSlider").val(sliderChangeValue);
    onSlide();
  }
}

var playTimer;

$(".playPause").click(function(){
  var icon = $(".playPause").children();
  if($(".playPause").hasClass("paused")){
    playTimer = setInterval(function(){autoAdvance()}, 1000);
    icon.removeClass("glyphicon-play");
    icon.addClass("glyphicon-pause");
    $(".playPause").removeClass("paused");
    // $(".playPause").addClass("playing");    
  } else {
    clearInterval(playTimer);
    icon.removeClass("glyphicon-pause");
    icon.addClass("glyphicon-play");
    $(".playPause").addClass("paused");
    // $(".playPause").removeClass("playing");
  }
})

/*  THIS IS BROKEN */

// $(window).resize(function(){
//   $("#countries").empty();
//   $("#responses").empty();
//   $("#capitals").empty();
//   initSizes();
//   sizeSliderElements();
// })


getcountrydata();

$( document ).ready(function(){
  playTimer = setInterval(function(){autoAdvance()}, 1000);
});