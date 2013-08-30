var worldCollection = [];


    var width = 600,
        height = 300;

    var projection = d3.geo.mercator()
      .scale((width + 1) / 2 / Math.PI)
      .translate([width / 2, height / 2])
      .precision(.1);

    var path = d3.geo.path()
      .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select("#map1").append("svg")
      .attr("width", width)
      .attr("height", height);

    
    d3.json("../data/worldcountries.json", function(world){
      worldCollection = world;
      feature = svg.selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr('country_name', function(d){return d.properties.name;})
        .attr('country_centroid', function(d){return path.centroid(d)})
        .attr('fill', '#aaaaaa')
        .attr("d", path)
        .on("click", clicked)        
        .style('stroke', '#fff;');
    });    

    function clicked(x) {
      console.log(path.centroid(x));

    }

    

      

  




