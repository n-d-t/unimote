angular.module('unimote', ['ionic', 'ngCordova'])

.factory('$remotesList', function() {
  var remotesList = {}
  remotesList.remotes = [];

  remotesList.add = function(json_data) {
    remotesList.remotes.push(json_data);
  }
  return remotesList;
})
.factory('$tcpSocket', function($cordovaSQLite, $remotesList) {
  var tcpSocket = {}
  tcpSocket.sockId = {};

  return $tcpSocket;
})
.factory('$dbHelper', function($cordovaSQLite, $remotesList) {

  var dbHelper = {};
  var db = null;
  var query = '';

  //to connect db and create table
  dbHelper.init = function() {
    db = $cordovaSQLite.openDB({name: 'unimote.db2', location: 'default'});
    query = 'CREATE TABLE IF NOT EXISTS devices (remote_id integer primary key, remote_name text, elem_config text, conn_config text, client_config text)';
    $cordovaSQLite.execute(db, query).then(function(res) {
      console.log("DB initialized");
    }, function(err) {
      console.error("failed to initialize DB");
    });

    query = 'SELECT * FROM devices';
    $cordovaSQLite.execute(db, query).then(function(res) {
      var rows = res.rows;
      for(var i = 0; i < rows.length; i++) {
        var remote_id = rows.item(i).remote_id;
        var remote_name = rows.item(i).remote_name.slice(1, -1);
        $remotesList.add({id: remote_id, name: remote_name});
      }
    }, function(err) {
      console.error(err);
    });
  }

  //returns name for given id
  dbHelper.getName = function(remote_id, successCb, failCb) {
    var remote_name = '';
    query = 'SELECT * FROM devices WHERE remote_id = ?';
    $cordovaSQLite.execute(db, query, [remote_id]).then(function(res) {
      var rows = res.rows;
      if(rows.length > 0) {
        remote_name = rows.item(0).remote_name.slice(1, -1);
        successCb(remote_name);
      }
    }, function(err) {
      failCb(err);
    });
  }

  //returns elem_config for given id
  dbHelper.getElem = function(remote_id, successCb, failCb) {
    var elem_config = {};
    query = 'SELECT * FROM devices WHERE remote_id = ?';
    $cordovaSQLite.execute(db, query, [remote_id]).then(function(res) {
      var rows = res.rows;
      if(rows.length > 0) {
        elem_config = JSON.parse(rows.item(0).elem_config);
        successCb(elem_config);
      }
    }, function(err) {
      failCb(err);
    });
  }

  //returns conn_config for given id
  dbHelper.getConn = function(remote_id, successCb, failCb) {
    var conn_config = {};
    query = 'SELECT * FROM devices WHERE remote_id = ?';
    $cordovaSQLite.execute(db, query, [remote_id]).then(function(res) {
      var rows = res.rows;
      if(rows.length > 0) {
        conn_config = rows.item(0).conn_config;
        successCb(conn_config);
      }
    }, function(err) {
      failCb(err);
    });
  }

  //returns client_config for given id
  dbHelper.getClient = function(remote_id, successCb, failCb) {
    var client_config = {};
    query = 'SELECT * FROM devices WHERE remote_id = ?';
    $cordovaSQLite.execute(db, query, [remote_id]).then(function(res) {
      var rows = res.rows;
      if(rows.length > 0) {
        client_config = rows.item(0).client_config;
        successCb(client_config);
      }
    }, function(err) {
      failCb(err);
    });
  }

  //inserting the json to db
  dbHelper.add = function(json_string) {
    var data = JSON.parse(json_string);
    var name = JSON.stringify(data.name);
    var elem = JSON.stringify(data.element);
    var conn = JSON.stringify(data.connection);
    var client = JSON.stringify(data.device);

    query = 'INSERT INTO devices (remote_name, elem_config, conn_config, client_config) VALUES (?, ?, ?, ?)';
    $cordovaSQLite.execute(db, query, [name, elem, conn, client]).then(function(res) {
      alert('Added successfully');
    }, function(err) {
      console.error(err);
    });

    query = 'SELECT * FROM devices';
    $cordovaSQLite.execute(db, query).then(function(res) {
      var rows = res.rows;
      if(rows.length > 0) {
        var last_index = rows.length - 1;
        var remote_id = rows.item(last_index).remote_id;
        var remote_name = rows.item(last_index).remote_name.slice(1, -1);
        $remotesList.add({id: remote_id, name: remote_name});
      }
    }, function(err) {
      console.error(err);
    });

  }

  return dbHelper;
})

.run(function($ionicPlatform, $dbHelper, $remotesList) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $dbHelper.init();
  });
})

.controller('remotesListCtrl', function($scope, $dbHelper, $remotesList) {
  $scope.remotes = $remotesList.remotes;
  var count = 0;
  /*
  $scope.add = function() {
    count += 1;
    var _name = 'Device' + count.toString();
    var fh = {
      name: _name,
      element: [
              {type: 'button', caption: 'Forward', data: 'u', reply: '1'},
              {type: 'button', caption: 'Back', data: 'd', reply: '1'},
              {type: 'button', caption: 'Left', data: 'l', reply: '1'},
              {type: 'button', caption: 'Right', data: 'r', reply: '1'}
              ],
      connection: {type: 'wifi', ssid: 'XT1033'},
      device: {ip: '8.8.8.8', port: '80'}
    }
    console.log(JSON.stringify(fh))
    //$dbHelper.add(JSON.stringify(fh));

  }
  */
})

.controller('remoteCtrl', function($scope, $stateParams, $dbHelper) {
  $scope.remoteId = parseInt($stateParams.remoteId);
  $scope.socket = new Socket();
  $scope.socket.onData = function(data) {
    console.log('Data received from ' + $scope.remoteClient.ip + ':' + data);
  };

  $dbHelper.getName($scope.remoteId,
    function(name) {
      $scope.remoteName = name;
    },
    function(error) {
      console.error(error);
    });

  $dbHelper.getElem($scope.remoteId,
    function(elem) {
      $scope.remoteElem = elem;
    },
    function(error) {
      console.error(error);
    });

  $dbHelper.getConn($scope.remoteId,
    function(conn) {
      $scope.remoteConn = JSON.parse(conn);
    },
    function(error) {
      console.error(error);
    });

  $dbHelper.getClient($scope.remoteId,
    function(client) {
      $scope.remoteClient = JSON.parse(client);
    },
    function(error) {
      console.error(error);
    });

  var notConnected = true;

  function connect(data) {
    //console.log($scope.remoteConn);
    //console.log($scope.remoteConn.ssid);
    //console.log($scope.remoteClient);
    WifiWizard.connectNetwork($scope.remoteConn.ssid,
    function() {
      console.log('Connected to the network: ' + $scope.remoteConn.ssid);
      $scope.socket.open($scope.remoteClient.ip.toString(), parseInt($scope.remoteClient.port),
        function() {
          console.log('Connected to the IP: ' + $scope.remoteClient.ip);
          notConnected = false;
          $scope.send(data);
        },
        function(error) {
          console.error('Failed to connect to the IP: ' + $scope.remoteClient.ip);
          console.error(error);
        });
    },function(error) {
      console.error('Failed to connect to the network: ' + $scope.remoteConn.ssid);
      alert(error);
      console.error(error);
    });
  }

  $scope.send = function(data) {
    if(notConnected) {
      connect(data);
    }
    else {
      console.log(data)
      $scope.socket.write(data);
    }
  }

})
.controller('uploadCtrl',function($scope,$ionicLoading,$dbHelper){
  $scope.readBlob = function() {
    var data = {};
    var files = document.getElementById('files').files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) {
        data = evt.target.result;
        document.getElementById('content').innerHTML  = "<br>"+data+"<br>";
        $dbHelper.add(evt.target.result);
      }
    };
    var blob = file;
    reader.readAsBinaryString(blob);
  };
})

.directive('uniElem', function($compile) {

  var getTemplate = function(type) {
    if(type === 'button') {
      return '<ion-item class="item item-button-right">{{ctrlElem.caption}}<button class="button button-dark" ng-click="send({data: ctrlElem.data})"><i class="icon ion-android-radio-button-off"></i></button></ion-item>';
    }
    return '';
  }

  var linker = function(scope, htmlElem, attr) {
    htmlElem.html(getTemplate(scope.ctrlElem.type));
    $compile(htmlElem.contents())(scope);
  }

  return {
    restrict: 'E',
    link: linker,
    scope: {
      ctrlElem: '=ctrlElem',
      send: '&ctrlClick'
    }
  }
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('upload', {
      url: '/upload',
      templateUrl: 'templates/upload.html',
      controller: 'uploadCtrl'
    })
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html'
    })
    .state('app.remotesList', {
      url: '/remotes',
      views: {
        'mainView': {
          templateUrl: 'templates/remotesList.html',
          controller: 'remotesListCtrl'
        }
      }
    })

    .state('app.remote', {
      url: '/remotes/:remoteId',
      views: {
        'mainView': {
          templateUrl: 'templates/remote.html',
          controller: 'remoteCtrl'
        }
      }
    })

    .state('app.settings', {
      url: '/settings',
      views: {
        'mainView': {
          templateUrl: 'templates/settings.html',
        }
      }
    })

    .state('app.about', {
      url: '/about',
      views: {
        'mainView': {
          templateUrl: 'templates/about.html',
        }
      }
    });

    $urlRouterProvider.otherwise('/app/remotes');
});
