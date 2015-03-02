var rtcsettings = {
  iceServers: [
    {url: "stun:stun.ekiga.net"},
    {url: "stun:stun.voipbuster.com"},
    {url: "stun:stun.1.google.com:19302"},
    // yadayada
  ]   
};

var ChatBox = React.createClass({
  addMessage: function() {
    this.setState({"messages": this.props.session.messages});
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
    this.props.session.addCallback(this.addMessage);
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
    this.props.session.request_connect(uuid);
  },
  setUsers: function() {
    this.setState({"users": this.props.session.users});
  },
  componentDidMount: function() {
    this.props.session.addCallback(this.setUsers);
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

var ConnectionStatus = React.createClass({
  setConnections: function() {
    var session = this.props.session;
    this.setState({
      "server": session.socket.readyState == 1,
      "peer": session.channel ? session.channel.readyState == "open" : false,
      "teensy": session.teensy ? session.teensy.hid_connection : false,
      "gameboy": session.teensy ? session.teensy.bytes : 0,
    })
  },
  componentDidMount: function() {
    this.props.session.addCallback(this.setConnections);
  },
  getInitialState: function() {
    return {gameboy: 0, teensy: false, peer: false, server: false};
  },
  render: function() {
    return (
      <div id="connectionstate" className="border">
        <div><span className={this.state.server ? 'ball active' : 'ball'}></span> Server</div>
        <div><span className={this.state.peer ? 'ball active' : 'ball'}></span> Peer</div>
        <div><span className={this.state.teensy ? 'ball active' : 'ball'}></span> Teensy</div>
        <div><span className={this.state.gameboy ? 'ball active' : 'ball'}></span> Game Boy ({this.state.gameboy})</div>
      </div>
    );
  }
});

function SessionHandler() {
  var self = this;
  var callbacks = {};
  var views = [];
  var uuid = null;

  self.users = {};
  self.messages = [];
  self.socket = null;
  self.channel = null;
  self.teensy = null;

  self.addCallback = function(cb) {
    views.push(cb);
  }

  var notify = function() {
    views.map(function(cb) { cb(); });
  }

  callbacks["myuuid"] = function(message) { uuid = message.myuuid; };
  callbacks["users"] = function(message) {
    self.users = message.users;
    notify();
  };
  callbacks["text"] = function(message) {
    self.messages.push(message);
    self.users[message.uuid].author = message.author;
    notify();
  };

  self.sendChat = function(author, text) {
    self.socket.send(JSON.stringify({
      "uuid": uuid,
      "text": text,
      "author": author
    }));
  }
  
  var peerconnection = function(to) {
    var pc = new RTCPeerConnection(rtcsettings);
    pc.onicecandidate = function(e) {
      if(e.candidate) {
        self.socket.send(JSON.stringify({
          "to": to,
          "uuid": uuid,
          "candidate": e.candidate,
        }));
      }
    };
    return pc;
  }

  var init_channel = function(dc) {
    self.teensy = new TeensyController();
    self.teensy.socket = dc;
    self.teensy.addCallback(notify);
    dc.onopen = function(e) { self.teensy.enumerateDevices(); notify(); };
    dc.onclose = function(e) { notify(); };
    dc.onmessage = function(e) { self.teensy.send(e.data); };
    dc.onerror = function(e) { dc.close(); };
  }

  var pcerror = function(e) {
    console.warn(e);
    self.peerconnection.close();
    chrome.notifications.create("wsclose",
      {"title": "Peer connection lost",
       "message": "Try again later",
       "type": "basic",
       "iconUrl": "images/globe.gif"},
      function(){});
  }
  
  self.request_connect = function(them) {
    self.socket.send(JSON.stringify({
      "to": them,
      "uuid": uuid,
      "request": true}));
  }
  
  chrome.notifications.onButtonClicked.addListener(function(them, idx) {
    var pc = peerconnection(them);
    self.peerconnection = pc;
    self.channel = pc.createDataChannel("gamelink");
    init_channel(self.channel);
    pc.createOffer(function(offer) {
      pc.setLocalDescription(new RTCSessionDescription(offer), function() {
        self.socket.send(JSON.stringify({
          "to": them,
          "uuid": uuid,
          "offer": offer,
        }));
      }, pcerror);
    }, pcerror);
  });

  callbacks["request"] = function(message) {
    var name = self.users[message.uuid].author;
    chrome.notifications.create(message.uuid,
      {"title": name + " wants to fight!",
       "message": "Do you want to link?",
       "type": "basic",
       "buttons": [{"title": "Connect"}],
       "iconUrl": "images/globe.gif"},
      function(){});
  }

  callbacks["answer"] = function(message) {
    self.peerconnection.setRemoteDescription(
        new RTCSessionDescription(message.answer),
        function() { },
        pcerror);
  }

  callbacks["candidate"] = function(message) {
    self.peerconnection.addIceCandidate(new RTCIceCandidate(message.candidate));
  }

  callbacks["offer"] = function(message) {
    var offer = message.offer;
    var pc = peerconnection(message.uuid);
    self.peerconnection = pc;
    pc.ondatachannel = function(e) {
      self.channel = e.channel;
      init_channel(self.channel);
    }
    pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
      pc.createAnswer(function(answer) {
        pc.setLocalDescription(new RTCSessionDescription(answer), function() {
          self.socket.send(JSON.stringify({
            "to": message.uuid,
            "uuid": uuid,
            "answer": answer,
          }));
        }, pcerror);
      }, pcerror);
    }, pcerror);
  };

  var init = function() {
    self.socket = new WebSocket("ws://tcpoke.herokuapp.com/websocket");
   
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
      <ConnectionStatus session={session} />
      <UserList session={session} />
      <ChatBox session={session} />
    </div>,
    document.getElementById("content")
  );
});

function TeensyController() {
  self = this;
  self.socket = undefined;
  self.hid_connection = undefined;
  self.bytes = 0;

  var views = [];

  self.addCallback = function(cb) {
    views.push(cb);
  }

  var notify = function() {
    views.map(function(cb) { cb(); });
  }

  var pollForInput = function() {
    chrome.hid.receive(self.hid_connection, function(reportId, data) {
      setTimeout(pollForInput, 0);
      var data = new Uint8Array(data);
      console.log("> " + byteToHex(data[0]));
      if(self.socket) {
        self.socket.send(data[0]);
      }
      self.bytes += 1;
      notify();
    });
  }

  var connectDevice = function(deviceInfo) {
    if (!deviceInfo)
      return;
    chrome.hid.connect(deviceInfo.deviceId, function(connectInfo) {
      if (!connectInfo) {
        console.warn("Unable to connect to device.");
      }
      self.hid_connection = connectInfo.connectionId;
      self.reset();
      pollForInput();
      notify();
    });
  }

  var onDevicesEnumerated = function(devices) {
    var dev = devices[0];
    console.log(dev);
    if(dev) {
      connectDevice(devices[0]);
    } else {
      chrome.notifications.create("teensymissing",
          {"title": "Teensy not connected",
            "message": "Connect your Teensy and try again",
            "type": "basic",
            "iconUrl": "images/arduino.png"},
          function(){});
    }
  }

  self.reset = function() {
    var bytes = new Uint8Array(64);
    bytes[1] = 1;
    chrome.hid.send(self.hid_connection, 0, bytes.buffer, function() {});
    self.bytes = 0;
  }

  self.send = function(out_data) {
    console.log("< " + byteToHex(out_data));
    var bytes = new Uint8Array(64);
    bytes[0] = out_data;
    // what is the callback for?
    chrome.hid.send(self.hid_connection, 0, bytes.buffer, function() {});
  }

  self.enumerateDevices = function() {
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
}

function byteToHex (value) {
  if (value < 16)
    return '0' + value.toString(16);
  return value.toString(16);
}
