
var currentSearchResults = null;

var HomePage = Vue.component("home-page", {
    data: function () {
        var data = {};
        data.dataset = this.$root.defaultDataset;
        data.options = this.$root.defaultDatasetOptions;

        data.visible_filters = [];

        if( this.$route.name=="browse" && this.$route.params.field != null && this.$route.params.value != null ) {
            data.browse= { field:this.$route.params.field, value:this.$route.params.value };
            data.options.filters_by_id[ data.browse.field ].mode = "is";
            data.options.filters_by_id[ data.browse.field ].term = data.browse.value;
        } else {
            data.browse = null;
        }

        return data;
    },
    beforeRouteUpdate: function(to, from, next) {
        // triggered when the params to the current route changes
        this.onRouteUpdate( to );
    },
    mounted: function() { 
        // triggered when the template dom is rendered the first time
        this.setVisibleFilters();
    },
    watch: {
        '$route': function(to, from) {
            // triggered when we move between named routes
            this.onRouteUpdate( to );
        },
        'options.show_all_filters': function( to, from ) {
            this.setVisibleFilters();
        }
    },
    updated: function() {
        // enable tooltips
        $('[data-toggle="tooltip"]').tooltip();
    },
    methods: {
        onRouteUpdate: function(to) {
            // when the route is updated, update the filters
            if( to.name=="browse" && to.params.field != null && to.params.value != null ) {
                this.options.show_all_filters = false;
                this.resetFilters();
                this.browse= { field: to.params.field, value: to.params.value };
                this.options.filters_by_id[ this.browse.field ].mode = "is";
                this.options.filters_by_id[ this.browse.field ].term = this.browse.value;
            } else {
                this.browse = null;
            }
            this.setVisibleFilters();
        },
        setVisibleFilters: function() {
            this.visible_filters = [];
            for (var i = 0; i < this.options.filters.length; i++) {
                var filter = this.options.filters[i];
                if (( this.options.show_all_filters 
                   || filter.field.quick_search 
                   || ( this.browse!=null && filter.field.id==this.browse.field) )) {
                    this.visible_filters.push( filter );
                }
            } 
        },
        filterResults: function() {
            // build a list of filters to be applied
            var active_filters = [];
            for (var i = 0; i < this.options.filters.length; i++) {
                // does the filter pass?
                var filter = this.options.filters[i];
                if (filter.isSet() && ( this.options.show_all_filters 
                                     || filter.field.quick_search 
                                     || ( this.browse!=null && filter.field.id==this.browse.field) )) {
                    active_filters.push(filter);
                }
            }

            // iterate over each record
            var records_to_show = [];
            for (var i = 0; i < this.dataset.records.length; i++) {
                var record = this.dataset.records[i];

                // iterate over each active filter
                var all_match = true;
                for (var j = 0; j < active_filters.length; j++) {
                    // does the filter pass?
                    var filter = active_filters[j];
                    if (!filter.matchesRecord(record)) {
                        all_match = false;
                        break;
                    }
                }

                // if all filters pass then add to array of matching records
                if (all_match) {
                    records_to_show.push(record);
                }
            }

            return records_to_show;
        },
        sortResults: function(results) {
            // sort records based on sort field
            var component = this;
            results.sort( function(a,b) {
                var av = a[component.options.sort_field].value;
                var bv = b[component.options.sort_field].value;
                if(typeof av === 'array') { av = av[0]; }
                if(typeof bv === 'array') { bv = bv[0]; }
                if( av == null ) { av = ""; }
                if( bv == null ) { bv = ""; }
                av = av.toLowerCase();
                bv = bv.toLowerCase();
                if( av==bv ) { return 0; }
                if( component.options.sort_dir == 'asc'  && av>bv ) { return 1; }
                if( component.options.sort_dir == 'desc' && av<bv ) { return 1; }
                return -1;
            });
            return results;
        },
        resetFilters: function() {
            for (var i = 0; i < this.options.filters.length; i++) {
                this.options.filters[i].reset();
            }
        },
        ignoreEnter: function(e) { e.stopPropagation(); return true; }
    },
    computed: {
        // more efficient to have this as a computed as the results are cached
        filteredAndSortedResults: function() {
            var results = this.filterResults();
            results = this.sortResults(results);
            // argh, this is a side effect! It lets the record view know the prev and next result
            currentSearchResults = {};
            return results;
        }
    },
    template: template
});
