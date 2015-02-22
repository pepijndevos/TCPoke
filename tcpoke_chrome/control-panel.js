(function() {
  var connection = -1;
  var inputlog;

  var initializeWindow = function() {
    inputlog = document.getElementById("inputlog");
    enumerateDevices();
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
      connection = connectInfo.connectionId;
      pollForInput();
    });
  };

  var onSendClicked = function() {
    var id = +ui.outId.value;
    var bytes = new Uint8Array(+ui.outSize.value);
    var contents = ui.outData.value;
    contents = contents.replace(/\\x[a-fA-F0-9]{2}/g, function(match, capture) {
      return String.fromCharCode(parseInt(capture, 16));
    });
    for (var i = 0; i < contents.length && i < bytes.length; ++i) {
      if (contents.charCodeAt(i) > 255) {
        throw "I am not smart enough to decode non-ASCII data.";
      }
      bytes[i] = contents.charCodeAt(i);
    }
    var pad = +ui.outPad.value;
    for (var i = contents.length; i < bytes.length; ++i) {
      bytes[i] = pad;
    }
    ui.send.disabled = true;
    chrome.hid.send(connection, id, bytes.buffer, function() {
      ui.send.disabled = false;
    });
  };

  var isReceivePending = false;
  var pollForInput = function() {
    isReceivePending = true;
    chrome.hid.receive(connection, function(reportId, data) {
      isReceivePending = false;
      var data = new Uint8Array(data);
      console.log(data[0]);
      inputlog.textContent += byteToHex(data[0]) + " ";
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
