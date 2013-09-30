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
var arcOrigin = [];
var arcDestinations = [];
var arcLinks = [];
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
    .text("a simple tooltip");

var map = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

function initSizes() {
  width = $(window).width();
  height = $(window).height() - 100;
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
  .range([4, 13]); //smallest and largest marker radius

function fitMapProjection() {
  fitProjection(projection, worldcountries, [[leftMargin, 100], [width - 20, height-120]], true);
};

var countryGroup = map.append('g').attr("id", "countries");
var capitalsGroup = map.append('g').attr("id", "capitals");
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
      url: 'data/demoData_adm0_cut.json',
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
        buildLinks();
      },
      error: function(e) {
        console.log(e);
      }
  });
}

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
  buildSlider();  
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
    slide: onSlide
  });
  $(".noUi-base").append('<div class="ticksWrap"></div>')
  for(var i = 0; i < totalMonths+1; i++) {
    $(".ticksWrap").append('<span class="ticks"></span>');
  }
  var startMonth = minDate.getMonth();
  var yearBreakOne = 12 - startMonth;  
  for(var i = yearBreakOne; i <= totalMonths; i++) {
    $(".ticksWrap").children().eq(i).addClass("yearTick");
    i = i + 11;
  }
  $(".ticksWrap").children().eq(0).css("border-color","rgba(0,0,0,0)");
  $(".ticksWrap").children().eq(totalMonths).css("display","none");
  sizeSliderElements();
}

function buildAppealsGraph(){
  var maxYear = maxDate.getFullYear();
  var minYear = minDate.getFullYear();
  var divisionNumber = maxYear - minYear + 1;
  for(var i = minYear; i <= maxYear; i++){
    appealsCount = 0;
    $(appeals).each(function(aIndex, appeal){
      var appealYear = new Date(appeal.ST_DATE).getFullYear();
      if(appealYear <= i){
        appealsCount += 1;
      }
    });
    appealsSums.push(appealsCount);
  }

  var w = 300;
  var h = 650;
  var barPadding = 1;
  var appealGraph = d3.select("#appealGraph")
    .append("svg")
    .attr("width", w)
    .attr("height", h);
  appealGraph.selectAll("rect")
    .data(appealsSums)
    .enter()
    .append("rect")
    .attr("x", function(d,i) {
      return i * (w / appealsSums.length)
    })
    .attr("y", function(d){
      return h - d;
    })
    .attr("width", w / appealsSums.length - barPadding)
    .attr("height", function(d) {
      return d;
    });
}

function sizeSliderElements(){
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
    .attr('data-ADM0', function(d){return d.properties.geoCode;})    
    .attr('data-name', function(d){return d.properties.name;})        
    .attr('class', 'country')
    .attr("d", path);    
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
    .on("click", function(d){capitalClick(d);})
    .on("mouseover", function(d){
      tooltip.html(d.properties.ADM0NAME);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+15)+"px");})
    .on("mouseout", function(){return tooltip.style("visibility", "hidden");}); 
  refreshMap();
}

function capitalClick(d) {
  console.log(d);
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

function opacityValue(date){     
  if(date >= oneMonth){        
    return 1;        
  } else if (date >=twoMonth){
    return 0.9;
  } else if (date >=threeMonth){
    return 0.8;
  } else if (date >=fourMonth){
    return 0.6;
  } else if (date >=fiveMonth){
    return 0.4;
  } else if (date >=sixMonth){
    return 0.2;
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
  displayedAppeals = [];
  displayedResponses = [];
  $("#responses").empty();
  $('[id="capitals"]').children().attr('r','0');
  $('[id="capitals"]').children().attr('opacity','0');  
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
  $(appeals).each(function(i, appeal){
    var appealStart = new Date(appeal.ST_DATE);
    var appealCountry = appeal.ADM0_A3;
    if (appealStart < endDate && appealStart >= sixMonth){
      displayedAppeals.push(appeal);
      var previousOpacity = $('[id="capitals"]').children("#" + appealCountry).attr('opacity');
      var appealOpacity = opacityValue(appealStart);
      if (appealOpacity > previousOpacity){
        $('[id="capitals"]').children("#" + appealCountry).attr('opacity', appealOpacity);
      }
    } 
  });  
  $(displayedAppeals).each(function(i,appeal){
    var adminId = "#" + appeal.ADM0_A3;
    // if 2 appeals occured in the 6 months displayed period, the largest budget is used to
    // set the radius. however, this can be changed to add the two together
    var previousR = $('[id="capitals"]').children(adminId).attr('r');
    // if you pass "" to normalizeAppealBudget it returns the min radius
    var appealR = appealMarkerScale(appeal.TOTAL_BUDGET);
    if(appealR > previousR){
      $('[id="capitals"]').children(adminId).attr('r',appealR);
    }
  });
    
  $(responses).each(function(i, response){
    var responseDate = new Date(response.Date);
    var responseCountry = response.ADM0_A3;    
    if (responseDate < endDate && responseDate >= sixMonth){
      displayedResponses.push(response);      
      responseOpacity = opacityValue(responseDate);
      $(arcLinks).each(function(i, link){    
        if (link.destination === responseCountry){
          lineData = []; 
          lineData.push(
            {"x": projection(link.coordinates[0])[0], "y": projection(link.coordinates[0])[1]},
            {"x": projection(link.coordinates[1])[0], "y": projection(link.coordinates[1])[1]}        
            );      
          responseGroup.append("path")
          .attr("d", line(lineData))
          .style({
            'fill':'none',
            'stroke': '#7f181b',
            'stroke-width': '2px',
            'opacity': responseOpacity
          })        
        }
      });      
    }    
  });
}

function updateSidebar(date){
  // get upper bound of displayed time period
  var endStart = date.getMonth();
  endStart += 1;
  endDate = new Date(date);
  endDate = new Date(endDate.setMonth(endStart));
  // update date display
  monthText = monthToText(date.getMonth());
  yearText = date.getFullYear().toString();
  $("#sliderDate").html(monthText + " " + yearText);
  // build array of appeals to date
  // count totals of shit
  appealsToDate = [];
  var totalBudgets = 0;
  var totalBeneficiaries = 0;
  $(appeals).each(function(i, appeal){
    var appealStart = new Date(appeal.ST_DATE);
    if (appealStart < endDate) {
      appealsToDate.push(appeal);
      budget = parseInt(appeal.TOTAL_BUDGET);
      if (isFinite(budget) == true){
        totalBudgets += budget;
      };
      beneficiaries = parseInt(appeal.TOT_TARGET_BENIFICIARIES);
      if (isFinite(beneficiaries) == true){
        totalBeneficiaries += beneficiaries;
      };    
    }
  });  
  var totalNumber = appealsToDate.length.toString();
  $("#appealCount").html("<b><u>Appeals</u></b><br>" + totalNumber + " so far!<br>" + totalBudgets.toString() + " USD in the budgets!<br>and " + totalBeneficiaries.toString() + " total target beneficiaries!<br>(nota bene: data not complete)");
}

$(".slider-control-right").click(function(){  
  if(parseInt($("#dateSlider").val()) < totalMonths){
    var sliderChangeValue = parseInt($("#dateSlider").val()) + 1;
    $("#dateSlider").val(sliderChangeValue);
    onSlide();
  }
})

$(".slider-control-left").click(function(){  
  if(parseInt($("#dateSlider").val()) > 0){
    var sliderChangeValue = parseInt($("#dateSlider").val()) - 1;
    $("#dateSlider").val(sliderChangeValue);
    onSlide();
  }
})

$(window).resize(function(){
  $("#countries").empty();
  $("#responses").empty();
  $("#capitals").empty();
  initSizes();
  sizeSliderElements();
})


getcountrydata();