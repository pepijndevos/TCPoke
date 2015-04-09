import threading
import socket
import struct
import random
import time
import enum
import hid
import sys
import os

class BGBLinkCable():
	def __init__(self,ip,port):
		self.ip = ip
		self.port = port
		self.ticks = 0
		self.frames = 0
		self.received = 0
		self.sent = 0
		self.transfer = -1
		self.exchangeHandler = None
		
	def start(self):
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.sock.connect((self.ip, self.port))
		threading.Thread(target=self.networkLoop, daemon=True).start()
	
	def queryStatus(self):
		status = [0x6a,0,0,0,0,0,0,0]
		self.ticks += 1
		self.frames += 8
		status[2] = self.ticks % 256
		status[3] = (self.ticks // 256) % 256
		status[5] = self.frames % 256
		status[6] = (self.frames // 256) % 256
		status[7] = (self.frames // 256 // 256) % 256
		return bytes(status)
		
	def getStatus(self):
		return (self.frames, self.ticks, self.received, self.sent)
	
	def networkLoop(self):
		while True:
			try:
				data = bytearray(self.sock.recv(8))
			except KeyboardInterrupt:
				raise
			if len(data) == 0:
				break
			if data[0] == 0x01:
				self.sock.send(data)
				self.sock.send(b'\x6c\x03\x00\x00\x00\x00\x00\x00')
				continue
			if data[0] == 0x6C:
				self.sock.send(b'\x6c\x01\x00\x00\x00\x00\x00\x00')
				self.sock.send(self.queryStatus())
				continue
			if data[0] == 0x65:
				continue
			if data[0] == 0x6A:
				self.sock.send(self.queryStatus())
				continue
			if data[0] == 0x69:
				self.sock.send(self.queryStatus())
				continue
			if data[0] == 0x68:
				self.received+=1
				self.sent+=1
				data[1] = self.exchangeHandler(data[1], self)
				self.sock.send(data)
				self.sock.send(self.queryStatus())
				continue
			print("Unknown command " + hex(data[0]))
			print(data)
			
	def setExchangeHandler(self, ex):
		self.exchangeHandler = ex

paths = [t['path'] for t in hid.enumerate(5824, 1158) if t['usage'] == 512]
teensy = hid.device()
teensy.open_path(paths[0])
#teensy.set_nonblocking(1)
buf = bytearray([0]*64)

def myHandler(data, obj):
    buf[0] = data
    teensy.write(buf)
    return teensy.read(64)[0]

if __name__ == "__main__":
    try:
        print("[!] Connecting to 127.0.0.1:8765...")
        link = BGBLinkCable('127.0.0.1',8765)
        link.setExchangeHandler(myHandler)
        link.start()
        print("[!] Waiting for link cable interaction")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
