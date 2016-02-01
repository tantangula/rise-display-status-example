function init() {
  var opts = {
    lines: 13 // The number of lines to draw
    , length: 28 // The length of each line
    , width: 14 // The line thickness
    , radius: 42 // The radius of the inner circle
    , scale: .9 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: (window.innerHeight/2)-(83)  // Top position relative to parent
    , left: (window.innerWidth/2)-(83) // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
  };
  var target = document.getElementById('loading');
  var spinner = new Spinner(opts).spin(target);
  console.log('init');
  window.initAng();
}

var app = angular.module('displayAdmin', []);

app.controller('displayCtrl', function($scope,$window)
  {
    $scope.ROOT = 'https://rvaserver2.appspot.com/_ah/api'; //Api for github pages
    $scope.config = {
        'client_id': '483891519638-4u9kfl02ni1ts9rhdejdcdb55itq038e.apps.googleusercontent.com',
        'scope': 'email',
        'immediate': false,
        'cookie_policy': 'single_host_origin'
    };
    $scope.API_NAME = 'core';
    $scope.API_VER = 'v1';
    $scope.companyName = "";
    $scope.userName = "";
    $scope.showNames = false;
    $scope.displays = [];
    $scope.showDisplays = false;
    $scope.showDisplayTitle = false;
    $scope.presentations = [];
    $scope.showPresentations = false;
    $scope.showPresentationTitle = false;
    $scope.hideSpinner = true;

    $scope.spinnerCheck = function() {
      if($scope.showNames && $scope.showDisplays && $scope.showDisplayTitle /*&& $scope.showPresentations && $scope.showPresentationTitle*/)
      {
        $scope.hideSpinner = true;
      }
    }

    $window.initAng = function() {
      console.log('check auth');
      gapi.auth.authorize($scope.config,
        function(authResult)
        {
          console.log('handle auth');
          console.log(authResult);
          if (authResult && !authResult.error) {
              console.log('authResult Successful');
              gapi.client.load('oauth2', 'v2',
                function()
                {
                  console.log('make request to oauth2');
                  var request = gapi.client.oauth2.userinfo.get();

                  request.execute(
                    function (resp)
                    {
                      if (!resp.code) {
                          console.log(resp);
                          $scope.listDisplayCall();
                          $scope.listPresentationCall();
                          $scope.getUserCompanyCall();
                      }
                    }
                  );
                }
              );
          }
        }
      );
    }

    $scope.getUserCompanyCall = function() {
      console.log('getUserCompany');

      var userParameters = {};

      // loading and calling the api passing the parameter object
      gapi.client.load($scope.API_NAME, $scope.API_VER, function () {
          var userRequest = gapi.client.core.user.get(userParameters);

          userRequest.execute(function (jsonResp, rawResp) {
            console.log(jsonResp);
            $scope.userName = jsonResp.item.firstName + " " + jsonResp.item.lastName;
            var companyParameters = {};
            companyParameters['id'] = jsonResp.item.companyId;
            var companyRequest = gapi.client.core.company.get(companyParameters);

            companyRequest.execute(function (jsonResp, rawResp) {
              console.log(jsonResp);
              $scope.companyName = jsonResp.item.name;
              $scope.$apply(function()
                {
                  $scope.showNames = true;
                  $scope.spinnerCheck();
                });
            });
          });
      }, $scope.ROOT);
    }

    $scope.listDisplayCall = function() {
      console.log('listDisplay');

      var displayParameters = {};

      // loading and calling the api passing the parameter object
      gapi.client.load($scope.API_NAME, $scope.API_VER, function () {

          var scheduleParameters = {};
          var presentationParameters = {};

          var displayRequest = gapi.client.core.display.list(displayParameters);
          displayRequest.execute(function (jsonRespDisplay) {

            var scheduleRequest = gapi.client.core.schedule.list(scheduleParameters);
            scheduleRequest.execute(function (jsonRespSchedule) {

              var presenationRequest = gapi.client.core.presentation.list(presentationParameters);
              presenationRequest.execute(function (jsonRespPresentation) {

                for(var i = 0; i < jsonRespDisplay.items.length; i++)
                {
                  //format dates for last activity parameter
                  var tempDate = new Date(jsonRespDisplay.items[i].lastActivityDate);
                  var dispId = jsonRespDisplay.items[i].id;

                  jsonRespDisplay.items[i].showInfo = false;

                  jsonRespDisplay.items[i].lastActivityDate = (tempDate.getMonth()+1)+"/"+(tempDate.getDate())+"/"+(tempDate.getFullYear());

                  //check each schedule to find out if a schedule is attached to a display
                  for(var j = 0; j < jsonRespSchedule.items.length; j++)
                  {
                    if(jsonRespSchedule.items[j].distribution!=undefined)
                    {
                      for(var k = 0; k < jsonRespSchedule.items[j].distribution.length; k++)
                      {
                        if(jsonRespSchedule.items[j].distribution[k]==dispId)
                        {
                          jsonRespDisplay.items[i].currentScheduleName = jsonRespSchedule.items[j].name;
                          jsonRespDisplay.items[i].currentScheduleId = jsonRespSchedule.items[j].id;
                          jsonRespDisplay.items[i].currentPresentations = [];
                          for(var l = 0; l < jsonRespSchedule.items[j].presentationIds.length; l++)
                          {
                            for(var m = 0; m < jsonRespPresentation.items.length; m++)
                            {
                              if(jsonRespSchedule.items[j].presentationIds[l] == jsonRespPresentation.items[m].id)
                              {
                                var presentation = {name:jsonRespPresentation.items[m].name,id:jsonRespPresentation.items[m].id};
                                jsonRespDisplay.items[i].currentPresentations.push(presentation);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                console.log(jsonRespDisplay);
                $scope.displays = jsonRespDisplay.items;
                $scope.$apply(function() {$scope.showDisplayTitle = true;$scope.showDisplays = true;$scope.spinnerCheck();});
              });
            });
          });
      }, $scope.ROOT);
    }

    $scope.getDisplayInfo = function(display) {
      console.log('clickDisplayInfo');
      if(display.showInfo == true)
      {
        display.showInfo = false;
      }
      else
      {
        display.showInfo = true;
      }
    }

    $scope.getDisplays = function() {
      console.log('clickDisplay');
      if($scope.showDisplays == true)
      {
        $scope.showDisplays = false;
      }
      else
      {
        $scope.showDisplays = true;
      }
    }

    $scope.listPresentationCall = function() {
      console.log('listPresentation');

      var parameters = {};

      // loading and calling the api passing the parameter object
      gapi.client.load($scope.API_NAME, $scope.API_VER, function () {
          var request = gapi.client.core.presentation.list(parameters);

          request.execute(function (jsonResp, rawResp) {
            console.log(jsonResp);
            $scope.presentations = jsonResp.items;
            $scope.$apply(function() {$scope.showPresentationTitle = true;$scope.showPresentations = true;$scope.spinnerCheck();});
          });
      }, $scope.ROOT);
    }

    $scope.getPresentations = function() {
      console.log('click');
      if($scope.showPresentations == true)
      {
        $scope.showPresentations = false;
      }
      else
      {
        $scope.showPresentations = true;
      }
    }
  }
);
