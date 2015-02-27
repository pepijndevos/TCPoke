var ChatBox = React.createClass({
  addMessage: function(message) {
    this.state.messages.push(message);
    this.setState(this.state);
  },
  sendMessage: function(e) {
    e.preventDefault();
    var author = this.refs.author.getDOMNode().value.trim();
    var text = this.refs.text.getDOMNode().value.trim();
    if (!text || !author) {
      return;
    }

    this.props.session.sendChat(author, text);

    this.refs.text.getDOMNode().value = '';
  },
  componentDidMount: function() {
    this.props.session.register("text", this.addMessage);
  },
  getInitialState: function() {
    return {messages: []};
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

var UserList = React.createClass({
  setUsers: function(users) {
    this.setState(users);
  },
  componentDidMount: function() {
    this.props.session.register("users", this.setUsers);
  },
  getInitialState: function() {
    return {users: {}};
  },
  render: function() {
    users = [];
    for (var key in this.state.users) {
      if (this.state.users.hasOwnProperty(key)) {
        var user = this.state.users[key];
        users.push(
          <li key={key}>{user.author}</li>
        );
      }
    }
    return (
      <ul id="userlist" className="border">
      {users}
      </ul>
    );
  }
});

function SessionHandler() {
  var self = this;

  var callbacks = {};
  self.register = function(key, callback) {
    callbacks[key] = callback;
  }

  var uuid = undefined;
  callbacks["uuid"] = function(message) { uuid = message.uuid; };

  self.sendChat = function(author, text) {
    self.socket.send(JSON.stringify({
      "uuid": uuid,
      "text": text,
      "author": author
    }));
  }
  
  self.connect = function(them) {
    var pc = new RTCPeerConnection();
    pc.createOffer(function(offer) {
      pc.setLocalDescription(new RTCSessionDescription(offer), function() {
        self.socket.send(JSON.encode({
          "to": them,
          "uuid": uuid,
          "session": offer,
        }));
      }, pc.close);
    }, pc.close);
    return pc;
  }

  var init = function() {
    self.socket = new WebSocket("ws://localhost:3000/websocket");
   
    self.socket.onclose = function () { setTimeout(init, 10*1000); };
    self.socket.onerror = function () { setTimeout(init, 20*1000); };

    self.socket.onopen  = function (e) { console.log(e); };

    self.socket.onmessage = function (e) {
      message = JSON.parse(e.data);
      console.log(message);
      for (var key in callbacks) {
        if (callbacks.hasOwnProperty(key) && message.hasOwnProperty(key)) {
          callbacks[key](message);
        }
      }
    };
  };
  init();

}

window.addEventListener('load', function () {
  window.session = new SessionHandler();
  React.render(
    <div>
      <UserList session={session} />
      <ChatBox session={session} />
    </div>,
    document.body
  );
});

//TODO integrate everything below
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
