# TCPoke

Internet of Pokemon

## Overview

This is what you call full-stack development.

* `tcpoke_shield` KiCAD drawings for a Teensy shield for a Game Link Cable.
* `tcpoke_teensy` Arduino sketch for talking to a Game Boy via a Teensy 2.0 in raw HID mode.
* `tcpoke_chrome` Chrome App talking USB HID and WebRTC.
* `tcpoke_server` Clojure WebSocket server for chat and WebRTC initiation.

## Useful commands

Start the server

    lein run 3000

Deploy server to Heroku

    git subtree push --prefix tcpoke_server heroku master

Compile JSX

    jsx --watch jsx/ .
