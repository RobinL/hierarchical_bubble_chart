//TODO:  zoom and pan
//TODO:  collapsable


var constant = {}
constant.circle_scale = null
constant.max_levels = null
constant.link_distance = null
constant.link_strength = null
constant.alphaMin = null
constant.velocityDecay = null
constant.alphaDecay = null
constant.max_children = null
constant.min_children = null
constant.first_run = true
constant.animation_duration = 1200
constant.delay_proportion = 3
refresh_constants()

var dataholder = new DataHolder()
dataholder.create_csv_data()
dataholder.transform_csv_data()


function MyForceDirected() {

    var colour_scale = d3.scaleOrdinal(d3.schemeCategory10);

    var margin = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        },
        padding = {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60
        },
    outerWidth = $(window).width();
    outerHeight = $(window).height();
    innerWidth = outerWidth - margin.left - margin.right,
    innerHeight = outerHeight - margin.top - margin.bottom,
    width = innerWidth - padding.left - padding.right,
    height = innerHeight - padding.top - padding.bottom;
    var transform = d3.zoomIdentity;

    var svg = d3.select("#svgholder")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        
    var g = svg.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

    var links_layer = g.append("g")
    var circles_layer = g.append("g")

    var me = this

    this.draw_from_scratch = function() {

        links_layer.selectAll("*").remove()
        circles_layer.selectAll("*").remove()

        this.simulation = d3.forceSimulation(dataholder.nodes)
        this.update_simulation()

    }


    svg.call(d3.zoom()
        .scaleExtent([1 / 4, 256])
        .on("zoom", zoomed));

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    function dragged(d) {
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }


    this.update_simulation = function() {
        this.simulation.force("link",
            d3.forceLink(dataholder.links)
            .distance(function(d) {
                //We want the distance to be equal so they are spaced in a circle around the parent
                //So we use the source rather than destination as the length
                return Math.pow(d.source.data.value_normalised, 0.5) * constant.circle_scale * constant.link_distance
            })
            .strength(function(d) {
                //Strength just needs to be enough so that length is uniform
                return constant.link_strength;
            })
        )
            .force("charge", d3.forceManyBody()
                .strength(function(d) {
                    var force = -Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale;
                    return force
                })
                .distanceMin(0)
                .distanceMax(200)
        )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(function(d) {
                return Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale
            }))
            .velocityDecay(constant.velocityDecay)
            .alphaMin(constant.alphaMin)
            .alphaDecay(constant.alphaDecay)
            .on("tick", this.ticked)
            this.enter_exit()

    }

    this.enter_exit = function() {

  
        var animation_duration = constant.animation_duration;
        

        var selection = links_layer.selectAll(".my_links")
            .data(dataholder.links, function(d) {return d.target.id})

        var min_depth_enter = 100
        var max_depth_enter = 0
        var min_depth_exit = 100
        var max_depth_exit = 0


        selection.exit().each(function(d) {
            min_depth_exit = Math.min(d.source.depth, min_depth_exit)
            max_depth_exit = Math.max(d.target.depth, max_depth_exit)
        })

        selection.enter().each(function(d) {
            min_depth_enter = Math.min(d.source.depth, min_depth_enter)
            max_depth_enter = Math.max(d.target.depth, max_depth_enter)
        })


        links_layer.selectAll(".my_links").transition()

        selection.enter()
            .append("line")
            .attr("class", "my_links")
            .attr("opacity", 0)
            .merge(selection)
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                return (d.target.depth-min_depth_enter) * animation_duration/constant.delay_proportion;
            })
            .attr("opacity", 1)
           

        selection.exit()
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                console.log(d.target.depth)
                return (max_depth_exit-d.target.depth)  * animation_duration/constant.delay_proportion;
            })
            .attr("opacity", 0)
            .remove();

    
        circles_layer.selectAll(".my_nodes").transition()

        selection = circles_layer.selectAll(".my_nodes")
            .data(dataholder.nodes, function(d) {
                return d.id;
            })

        enterSelection = selection
            .enter()
            .append("g")
            .attr("class", "my_nodes")
       

        circles = enterSelection.append("circle")
            .call(node_drag)
            .on("click", clicked);


        rectangles = enterSelection.append("text")
            .text(function(d) {

                return d.data.text.substring(0,16);
            })
            .style("font-size", function(d) {
                var r = Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale  //Radius of circle

                var text_length = d.data.text.length

                var size_div_scale = d3.scalePow().exponent(2).domain([1,7,16]).range([1,2.2,4.8])
                
                var size = r/size_div_scale(text_length)  //getComputedTextLength is how many characters are visible
                
                if (size < 0) {
                    var text_size = 0.01;
                } else {
                    var text_size = size;
                }
                d.text_size = text_size;
                return text_size + "px"
            })
            .attr("dy", ".35em")
            .style("fill", "black")
            .attr("class", "circle_text")
            .style("opacity", 0)

        var currency_format = d3.format(",.1f")
        rectangles = enterSelection.append("text")
            .text(function(d) {
                return "£" + currency_format(d.data.value) + "m";
            })
            .style("font-size", function(d) {
                var r = Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale 
                return (r/3) + "px"
            })
            .attr("dy", "2em")
            .style("fill", "white")
            .attr("class", "circle_text")
            .style("opacity", 0)

        var perc_format = d3.format(",.1%")
        rectangles = enterSelection.append("text")
            .text(function(d) {
                return perc_format(d.data.value /
                    dataholder.root.data.value);
            })
            .style("font-size", function(d) {
                var r = Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale 
                return (r/3) + "px"
            })
            .attr("dy", "-1.3em")
            .style("fill", "white")
            .attr("class", "circle_text")
            .style("opacity", 0)

        selection.merge(enterSelection)
            .selectAll("text")
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                return (d.depth-min_depth_enter) * animation_duration/constant.delay_proportion 
            })
            .style("opacity", 0.5)


        selection.merge(enterSelection).select("circle")
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                return (d.depth-min_depth_enter-1) * animation_duration/constant.delay_proportion 
            })
            .attr("r", function(d) {
                return Math.pow(d.data.value_normalised, 0.5) * constant.circle_scale;
            })
            .attr("fill", function(d, i) {
                return colour_scale(d.depth)
            })
       
 


        selection.exit().selectAll("text")
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                return ((max_depth_exit)-d.depth) * animation_duration/constant.delay_proportion 
            })
            .style("opacity",0)
           

        selection.exit().selectAll("circle")
            .transition()
            .duration(animation_duration)
            .delay(function(d) {
                return ((max_depth_exit)-d.depth) * animation_duration/constant.delay_proportion 
            })
            .attr("r",0)
           

        selection
            .exit()
            .transition()
            .duration(animation_duration)
             .delay(function(d) {
                return ((max_depth_exit)-d.depth) * animation_duration
            })
            .remove()

    }

    var node_drag = d3.drag()
        .on("start", dragstart)
        .on("drag", dragmove)
        .on("end", dragend);

    function dragstart(d) {
        if (!d3.event.active) me.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragmove(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragend(d) {
        if (!d3.event.active) me.simulation.alphaTarget(0);

        if (!document.getElementById('input_fix_drag').checked) {
            d.fx = null; //Note fx stands for fixed so that if you set these to a value, it fixes nodes in place
            d.fy = null;
        }
    }

    // Toggle children on click.
    function clicked(d) {
      if (!d3.event.defaultPrevented) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
      }
      dataholder.refresh_data()

      me.enter_exit()
    }

    this.ticked = function() {

        var selection = links_layer.selectAll(".my_links")
            .data(dataholder.links, function(d) {
                return d.target.id
            })

        selection
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            })


        // Update the nodes…
        selection = circles_layer.selectAll(".my_nodes")
            .data(dataholder.nodes, function(d) {
                return d.id;
            })


        //Update
        selection.merge(selection)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            });



        
    }

}


var myforcedirected = new MyForceDirected()
myforcedirected.draw_from_scratch()

function refresh_constants() {

    constant.circle_scale = parseFloat($("#input_circle_size").val())
    constant.max_levels = parseInt($("#input_max_levels").val())
    constant.link_distance = parseFloat($("#input_link_distance").val())
    constant.link_strength = parseFloat($("#input_link_strength").val())
    constant.alphaMin = parseFloat($("#input_alphamin").val())
    constant.velocityDecay = parseFloat($("#input_velocityDecay").val())
    constant.alphaDecay = parseFloat($("#input_alphaDecay").val())
    constant.max_children = parseInt($("#input_max_children").val())
    constant.min_children = parseInt($("#input_min_children").val())
}

function start_change() {
    myforcedirected.simulation.alpha(1);
    myforcedirected.simulation.restart()
}





$(".refresh_sim").on("change", function(d) {
    //Update the value to be the one from the dict
    start_change()
    refresh_constants()

    myforcedirected.update_simulation()

    myforcedirected.ticked()

})



$(".restart_sim").on("change", function(d) {
    //Update the value to be the one from the dict

    refresh_constants()
    dataholder.create_csv_data()
    dataholder.transform_csv_data()
    myforcedirected.draw_from_scratch()


})

$("#input_toggle_start").on("click", function(d) {


    //Iterate through nodes fixing all of them.
    _.each(myforcedirected.simulation.nodes(), function(node) {

        if (node.fx == null) {
        node.fx = node.x;
        node.fy = node.y;
            } else {
        node.fx = null;
        node.fy = null;
            }
    })

    // myforcedirected.simulation.stop()

})