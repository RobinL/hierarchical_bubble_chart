//TODO:  zoom and pan
//TODO:  collapsable
//TODO:  draggable

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

    var svg = d3.select("#svgholder")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

    this.draw_from_scratch = function() {

        svg.selectAll("*").remove()

        this.simulation = d3.forceSimulation(dataholder.nodes)
        this.update_simulation()



    }

    this.update_simulation = function() {
        this.simulation.force("link",
            d3.forceLink(dataholder.links)
            .distance(function(d) {
                //We want the distance to be equal so they are spaced in a circle around the parent
                //So we use the source rather than destination as the length
                return Math.pow(d.source.data.value, 0.5) * constant.circle_scale * constant.link_distance
            })
            .strength(function(d) {
                //Strength just needs to be enough so that length is uniform
                return constant.link_strength;
            })
        )
            .force("charge", d3.forceManyBody()
                .strength(function(d) {
                    var force = -Math.pow(d.data.value, 0.5) * constant.circle_scale;
                    return force
                })
                .distanceMin(0)
                .distanceMax(200)
        )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(function(d) {
                return Math.pow(d.data.value, 0.5) * constant.circle_scale
            }))
            .velocityDecay(constant.velocityDecay)
            .alphaMin(constant.alphaMin)
            .alphaDecay(constant.alphaDecay)
            .on("tick", this.ticked)

    }

    this.ticked = function() {

        var selection = svg.selectAll(".my_links")
            .data(dataholder.links)

        selection.enter()
            .append("line")
            .attr("class", "my_links")
            .merge(selection)
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


        selection.exit().remove();

        // Update the nodes…
        selection = svg.selectAll(".my_nodes")
            .data(dataholder.nodes, function(d) {
                return d.id;
            })

        //Entering
        enterSelection = selection
            .enter()
            .append("g")
            .attr("class", "my_nodes")



        circles = enterSelection.append("circle")

        rectangles = enterSelection.append("text")

        .text(function(d) {

            return d.data.text;
        })

        .style("font-size", function(d) {
            var r = Math.pow(d.data.value, 0.5) * constant.circle_scale


            var size = Math.min(2 * r, (2 * r - 8) / this.getComputedTextLength() * 24);
            if (size < 0) {
                return 0.01 + "px"
            } else {
                return size + "px"
            }
        })
            .attr("dy", ".35em")
            .style("fill", "black")


        //Update
        enterSelection.merge(selection)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            });

        enterSelection.merge(selection).select("circle")
            .attr("r", function(d) {
                return Math.pow(d.data.value, 0.5) * constant.circle_scale;
            })
            .attr("fill", function(d, i) {


                return colour_scale(i)

            })
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

function stop_change() {
    myforcedirected.simulation.alphaTarget(0.5);
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