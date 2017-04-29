function DataHolder() {

    var me = this

    this.create_csv_data = function() {
        //This will be in the format as if it were read in from a csv file
        csv_data = []
        first_node = {
            id: 1,
            parent: null,
            value: 200,
            text: "level_0"
        }
        csv_data.push(first_node)
        var id_counter = 2;

        var get_text = function(level) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var length = Math.floor(Math.random() * 16)
            // var length = 16
            for(var i = 0; i < length; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        }

        function recurse(node, level) {

            if (level > constant.max_levels) {
                return 0

            }

            var amount_to_apportion = node.value;
            var num_children = getRandomInt(constant.min_children, constant.max_children)

            // Split amount_to_apportion amongst children.
            var randoms = _.map(d3.range(num_children), function(d) {
                return Math.random()
            })
            var sum_randoms = _.reduce(randoms, function(a, b) {
                return a + b;
            })
            var randoms = _.map(randoms, function(d) {
                return d / sum_randoms
            });

            _.each(randoms, function(d) {
                var new_node = {
                    id: id_counter,
                    parent: node.id,
                    value: d * node.value,
                    text: get_text(level)
                };

                id_counter += 1;

                csv_data.push(new_node)
                var apportioned = recurse(new_node, level + 1);

            })
        }
        recurse(first_node, 1)

        this.csv_data = csv_data



    }

    this.transform_csv_data = function() {

        // Normalise data 
        var max_value = -Infinity

        me.csv_data.forEach(function(element) {
                max_value = Math.max(element.value, max_value)
        })
        
        me.csv_data.forEach(function(element) {
                element.value_normalised = (element.value / max_value) * 100
        })


        var root_fn = d3.stratify()
            .id(function(d) {
                return d.id;
            })
            .parentId(function(d) {
                return d.parent;
            })


        var root = root_fn(this.csv_data);

        //Recurse into root's children, and when we find 
        var links = root.links()
        var nodes = flatten(root)

        // add_label_leaves(csv_data, root)
        var root = root_fn(csv_data)

        //Collapse all to a given level


        var links = root.links()
        var nodes = flatten(root)



        this.root = root
        this.links = links
        this.nodes = nodes

        


    }

    this.refresh_data = function() {

    	this.links = this.root.links()
        this.nodes = flatten(this.root)


    }

}