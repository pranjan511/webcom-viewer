wvmodule.controller('NodesController', function(alertService,
$scope, NodesFactory, $state, $uibModal, displayRestError, CommonServices, mchelper, $filter) {

  $scope.headerStringList = $filter('translate')('NODES_DETAIL');
  $scope.noItemsSystemMsg = $filter('translate')('NO_NODES_SETUP');
  $scope.noItemsSystemIcon = "fa fa-sitemap";

	$scope.getAllItems = function(){
    NodesFactory.getAll($scope.query, function(response) {
      $scope.queryResponse = response;
      $scope.filteredList = $scope.queryResponse.data;
      $scope.filterConfig.resultsCount = $scope.queryResponse.query.filteredCount;
    },function(error){
      displayRestError.display(error);            
    });
  }

	commonServices.updateSortChange = function (remoteScope, sortId, isAscending) {
    if(isAscending){
      remoteScope.query.order = "asc";
    }else{
      remoteScope.query.order = "dsec";
    }
    remoteScope.query.orderBy = sortId.id;
    remoteScope.getAllItems();
  };
  $scope.selectAllItems = function(){
    CommonServices.selectAllItems($scope);
  };

  $scope.selectItem = function(item){
    CommonServices.selectItem($scope, item);
  };
  
  //On page change
  $scope.pageChanged = function(newPage){
    CommonServices.updatePageChange($scope, newPage);
  };

var filterChange = function (filters) {
    //Reset filter fields and update items
    CommonServices.updateFiltersChange($scope, filters);
  };

  $scope.filterConfig = {
    fields: [
      {
        id: 'name',
        title: $filter('translate')('NAME'),
        placeholder: $filter('translate')('FILTER_BY_NAME'),
        filterType: 'text'
      },
      {
        id: 'state',
        title:  $filter('translate')('STATUS'),
        placeholder: $filter('translate')('FILTER_BY_STATUS'),
        filterType: 'select',
        filterValues: ['Up','Down','Unavailable'],
      },
      {
        id: 'type',
        title:  'Type',
        placeholder: $filter('translate')('FILTER_BY_TYPE'),
        filterType: 'select',
        filterValues: ['Node','Repeater node'],
      },
      {
        id: 'eui',
        title:  'EUI',
        placeholder: $filter('translate')('FILTER_BY_EUI'),
        filterType: 'text',
      },
      {
        id: 'version',
        title:  'Version',
        placeholder: $filter('translate')('FILTER_BY_VERSION'),
        filterType: 'text',
      },
      {
        id: 'libVersion',
        title:  'Library Version',
        placeholder: $filter('translate')('FILTER_BY_LIBRARY_VERSION'),
        filterType: 'text',
      }
    ],
    resultsCount: $scope.filteredList.length,
    appliedFilters: [],
    onFilterChange: filterChange
    };
var sortChange = function (sortId, isAscending) {
    //Reset sort type and update items
    commonServices.updateSortChange($scope, sortId, isAscending);
  };

  $scope.sortConfig = {
    fields: [
      {
        id: 'name',
        title:  $filter('translate')('NAME'),
        sortType: 'text'
      },
      {
        id: 'state',
        title:  $filter('translate')('STATUS'),
        sortType: 'text'
      },
      {
        id: 'eui',
        title:  $filter('translate')('EUI'),
        sortType: 'text'
      },
      {
        id: 'type',
        title:  $filter('translate')('TYPE'),
        sortType: 'text'
      },
      {
        id: 'version',
        title:  $filter('translate')('VERSION'),
        sortType: 'text'
      },
      {
        id: 'libVersion',
        title:  $filter('translate')('LIBRARY_VERSION'),
        sortType: 'text'
      }
    ],
    onSortChange: sortChange
  };
});

//Node Detail
wvmodule.controller('NodesControllerDetail', function ($scope, $stateParams, mchelper, NodesFactory, TypesFactory, MetricsFactory, $filter, $timeout, $window) {
  //Load mchelper variables to this scope
  $scope.mchelper = mchelper;
  $scope.item = {};
  $scope.headerStringList = $filter('translate')('NODE_DETAILS');
  
  $scope.item = NodesFactory.get({"nodeId":$stateParams.id});
  $scope.resourceCount = MetricsFactory.getResourceCount({"resourceType":"NODE", "resourceId":$stateParams.id});
  
  $scope.chartOptions = {
        chart: {
            type: 'lineChart',
            noErrorCheck: true,
            height: 325,
            width:null,
            margin : {
                top: 0,
                right: 10,
                bottom: 90,
                left: 65
            },
            color: ["#2ca02c","#1f77b4", "#ff7f0e"],
          
            x: function(d){return d[0];},
            y: function(d){return d[1];},
            useVoronoi: false,
            clipEdge: false,
            transitionDuration: 500,
            useInteractiveGuideline: true,
            xAxis: {
                showMaxMin: false,
                tickFormat: function(d) {
                    return d3.time.format('hh:mm:ss a')(new Date(d))
                },
                //axisLabel: 'Timestamp',
                rotateLabels: -20
            },
            yAxis: {
                tickFormat: function(d){
                    return d3.format(',.2f')(d) + ' %';
                },
                //axisLabel: ''
            }
        },
          title: {
            enable: false,
            text: 'Title'
        }
    };
  
  //pre select, should be updated from server
  TypesFactory.getMetricsSettings(function(response){
    $scope.metricsSettings = response;
    $scope.chartEnableMinMax = $scope.metricsSettings.enabledMinMax;
    $scope.chartFromTimestamp = $scope.metricsSettings.defaultTimeRange.toString();
    MetricsFactory.getBatteryMetrics({"nodeId":$stateParams.id, "withMinMax":$scope.chartEnableMinMax, "timestampFrom": new Date().getTime() - $scope.chartFromTimestamp},function(response){
      $scope.batteryChartData = response;
      //Update display time format
      $scope.chartTimeFormat = response.timeFormat;
      $scope.chartOptions.chart.type = response.chartType;
      $scope.chartOptions.chart.interpolate = response.chartInterpolate;
      $scope.fetching = false;
    });
  });
  $scope.chartTimeFormat = mchelper.cfg.dateFormat;
  $scope.chartOptions.chart.xAxis.tickFormat = function(d) {return $filter('date')(d, $scope.chartTimeFormat, mchelper.cfg.timezone)};
  
  $scope.updateChart = function(){
    MetricsFactory.getBatteryMetrics({"nodeId":$stateParams.id, "withMinMax":$scope.chartEnableMinMax, "timestampFrom": new Date().getTime() - $scope.chartFromTimestamp}, function(resource){
      $scope.batteryChartData.chartData = resource.chartData;
      //Update display time format
      $scope.chartTimeFormat = resource.timeFormat;
    });
  }

  //Graph resize issue, see: https://github.com/krispo/angular-nvd3/issues/40
  $scope.$watch('fetching', function() {
      if(!$scope.fetching) {
        $timeout(function() {
          $window.dispatchEvent(new Event('resize'));
          $scope.fetching = true;
        }, 1000);
      }
    });
  
});

