(function() {
  var peer;
  var hid_connection;
  var peer_connection;

  var inputlog;
  var outputlog;
  var peerdisplay;
  var peerform;

  var initializeWindow = function() {
    inputlog = document.getElementById("inputlog");
    outputlog = document.getElementById("outputlog");
    peerdisplay = document.getElementById("peerid");
    peerform = document.getElementById("connectform");

    peer = new Peer({host: 'tcpoke.herokuapp.com', port: 80});
    peer.on('open', function(id) {
      peerdisplay.textContent = id;
    });
    peer.on('connection', function(conn) {
      peer_connection = conn;
      peer_connection.on('data', sendOutput);
      enumerateDevices();
    });

    peerform.addEventListener("submit", function(e) {
      e.preventDefault();
      peer_connection = peer.connect(this.connectid.value);
      peer_connection.on('data', sendOutput);
      enumerateDevices();
    });
  };

  var enumerateDevices = function() {
    var deviceIds = [];
    var permissions = chrome.runtime.getManifest().permissions;
    for (var i = 0; i < permissions.length; ++i) {
      var p = permissions[i];
      if (p.hasOwnProperty('usbDevices')) {
        deviceIds = p.usbDevices;
      }
    }
    chrome.hid.getDevices({"filters": deviceIds}, onDevicesEnumerated);
  };

  var onDevicesEnumerated = function(devices) {
      console.log(devices);
      connectDevice(devices[0]);
  };

  var connectDevice = function(deviceInfo) {
    if (!deviceInfo)
      return;
    chrome.hid.connect(deviceInfo.deviceId, function(connectInfo) {
      if (!connectInfo) {
        console.warn("Unable to connect to device.");
      }
      hid_connection = connectInfo.connectionId;
      reset();
      pollForInput();
    });
  };

  var reset = function() {
    var bytes = new Uint8Array(64);
    bytes[1] = 1;
    chrome.hid.send(hid_connection, 0, bytes.buffer, function() {});
  };

  var sendOutput = function(out_data) {
    outputlog.textContent += byteToHex(out_data) + " ";
    var bytes = new Uint8Array(64);
    bytes[0] = out_data;
    chrome.hid.send(hid_connection, 0, bytes.buffer, function() {});
  };

  var pollForInput = function() {
    chrome.hid.receive(hid_connection, function(reportId, data) {
      isReceivePending = false;
      var data = new Uint8Array(data);
      inputlog.textContent += byteToHex(data[0]) + " ";
      peer_connection.send(data[0]);
      setTimeout(pollForInput, 0);
    });
  };

  var byteToHex = function(value) {
    if (value < 16)
      return '0' + value.toString(16);
    return value.toString(16);
  };

  window.addEventListener('load', initializeWindow);
}());
