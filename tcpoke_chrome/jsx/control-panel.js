var rtcsettings = {
  iceServers: [
    {url: "stun:stun.ekiga.net"},
    {url: "stun:stun.voipbuster.com"},
    {url: "stun:stun.1.google.com:19302"},
    // yadayada
  ]   
};

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
        <form id="chatform" className="border" onSubmit={this.sendMessage}>
          <input type="text" placeholder="Your name" ref="author" />
          <input type="text" placeholder="Say something..." ref="text" />
          <input type="submit" value="Post" />
        </form>
      </div>
    );
  }
});

var UserList = React.createClass({
  connect: function(uuid, e) {
    console.log(uuid);
    this.props.session.connect(uuid);
  },
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
          <li key={key} onClick={this.connect.bind(this, key)}>{user.author}</li>
        );
      }
    }
    return (
      <div id="userlist" className="border">
      <span>Connect?</span>
      <ul>
      {users}
      </ul>
      </div>
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
  callbacks["myuuid"] = function(message) { uuid = message.myuuid; };

  self.sendChat = function(author, text) {
    self.socket.send(JSON.stringify({
      "uuid": uuid,
      "text": text,
      "author": author
    }));
  }
  
  self.connect = function(them) {
    var pc = new RTCPeerConnection(rtcsettings);
    self.channel = pc.createDataChannel("gamelink");
    console.log(pc, self.channel);
    self.peerconnection = pc;
    pc.createOffer(function(offer) {
      pc.setLocalDescription(new RTCSessionDescription(offer), function() {
        self.socket.send(JSON.stringify({
          "to": them,
          "uuid": uuid,
          "offer": offer,
        }));
      }, pc.close);
    }, pc.close);
  }

  callbacks["answer"] = function(message) {
    self.peerconnection.setRemoteDescription(
        new RTCSessionDescription(message.answer),
        function() { },
        self.peerconnection.close);
  }

  callbacks["offer"] = function(message) {
    var id = undefined;
    var offer = message.offer;
    chrome.notifications.create("",
          {"title": "Incomming connection",
            "message": "Do you want to play?",
            "type": "basic",
            "iconUrl": "images/gameboy.png",
            "buttons": [{"title": "Connect"}],
          },
          function(cbid){id = cbid;});
    // This will leak callbacks
    chrome.notifications.onButtonClicked.addListener(function (cbid, idx){
      if(id == cbid) {
        var pc = new RTCPeerConnection(rtcsettings);
        pc.ondatachannel = function(ch) {
          self.channel = ch;
          console.log(self.channel);
        }
        console.log(pc);
        pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
          pc.createAnswer(function(answer) {
            pc.setLocalDescription(new RTCSessionDescription(answer), function() {
              self.socket.send(JSON.stringify({
                "to": message.uuid,
                "uuid": uuid,
                "answer": answer,
              }));
            }, pc.close);
          }, pc.close);
        }, pc.close);
        self.peerconnection = pc;
      }
    });
  };

  var init = function() {
    self.socket = new WebSocket("ws://localhost:3000/websocket");
   
    self.socket.onerror = function () { self.socket.close() };
    self.socket.onclose = function () {
      chrome.notifications.create("wsclose",
          {"title": "Server connection lost",
            "message": "Attempting to reconnect",
            "type": "basic",
            "iconUrl": "images/globe.gif"},
          function(){});
      setTimeout(init, 30000);
    };

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
    <div className="container">
      <UserList session={session} />
      <ChatBox session={session} />
    </div>,
    document.getElementById("content")
  );
});

function enumerateDevices() {
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
    reset(hid_connection);
    pollForInput(console.log);
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
