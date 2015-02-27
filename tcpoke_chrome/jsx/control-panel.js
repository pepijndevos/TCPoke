var ChatBox = React.createClass({
  addMessage: function(e) {
    console.log(e.data);
    var message = JSON.parse(e.data);
    if (message.text) {
      this.state.messages.push(message);
      this.setState(this.state);
    }
  },
  sendMessage: function(e) {
    e.preventDefault();
    var author = this.refs.author.getDOMNode().value.trim();
    var text = this.refs.text.getDOMNode().value.trim();
    if (!text || !author) {
      return;
    }

    console.log(author, text);
    message = JSON.stringify({author: author, text: text});
    this.props.socket.send(message);

    this.refs.text.getDOMNode().value = '';
  },
  getInitialState: function() {
    return {messages: []};
  },
  componentDidMount: function() {
    this.props.socket.addEventListener("message", this.addMessage);
  },
  render: function() {
    msgs = this.state.messages.map(function (msg, idx) {
      return (
        <div key={idx}><strong>{msg.author}</strong> <span>{msg.text}</span></div>
      );
    });
    return (
      <div>
        <div id="chatbox" className="border">
        {msgs}
        </div>
        <form className="commentForm" onSubmit={this.sendMessage}>
          <input type="text" placeholder="Your name" ref="author" />
          <input type="text" placeholder="Say something..." ref="text" />
          <input type="submit" value="Post" />
        </form>
      </div>
    );
  }
});

var Connection = React.createClass({
  getInitialState: function() {
    return {connected: false};
  },
  render: function() {
    return (
      <div>
        <label>{this.props.name}</label>
        <input type="checkbox" checked={this.state.connected} />
      </div>
    );
  }
});

window.addEventListener('load', function () {
  socket = new WebSocket("ws://localhost:3000/websocket");
  socket.onopen = function () { console.log(arguments); };
  socket.onclose = function () { console.log(arguments); };
  socket.onerror = function () { console.log(arguments); };
  React.render(
    <div>
      <Connection name="Game Boy" />
      <ChatBox socket={socket}/>
    </div>,
    document.body
  );
});

function initialize () {
  peer = new Peer("imac", {host: 'tcpoke.herokuapp.com', port: 80});
  peer.on('open', function(id) {
    peerdisplay.textContent = id;
  });
  peer.on('connection', function(conn) {
    console.log(conn);
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
}

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
}

function onDevicesEnumerated (devices) {
    console.log(devices);
    connectDevice(devices[0]);
}

function connectDevice (deviceInfo) {
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
}

function reset(hid_connection) {
  var bytes = new Uint8Array(64);
  bytes[1] = 1;
  chrome.hid.send(hid_connection, 0, bytes.buffer, function() {});
}

function sendOutput (hid_connection, out_data) {
  console.log("> " + byteToHex(out_data));
  var bytes = new Uint8Array(64);
  bytes[0] = out_data;
  // what is the callback for?
  chrome.hid.send(hid_connection, 0, bytes.buffer, function() {});
}

function pollForInput(callback) {
  chrome.hid.receive(hid_connection, function(reportId, data) {
    setTimeout(pollForInput, 0);
    var data = new Uint8Array(data);
    console.log("> " + byteToHex(data[0]));
    callback(data[0]);
  });
}

function byteToHex (value) {
  if (value < 16)
    return '0' + value.toString(16);
  return value.toString(16);
}
