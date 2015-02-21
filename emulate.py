import socket
import time
import struct
import enum
import hid

paths = [t['path'] for t in hid.enumerate(5824, 1158) if t['usage'] == 512]
teensy = hid.device()
teensy.open_path(paths[0])
teensy.set_nonblocking(1)
buf = bytearray([0]*64)

class Command(enum.IntEnum):
    version = 1
    joypad = 101
    master = 104
    slave = 105
    sync = 106
    status = 108

fmt = "!BBBBi"
pkgsize = struct.calcsize(fmt)

def timestamp():
    return int(time.time() * (2**21)) & 0x7fffffff

def command(cmd, b1=0, b2=0, b3=0):
    return struct.pack(fmt, cmd, b1, b2, b3, timestamp())

def parse(data):
    res = struct.unpack(fmt, data)
    return (Command(res[0]),) + res[1:4]

def read_all(sock):
    try:
        while True:
            yield parse(sock.recv(pkgsize))
    except BlockingIOError:
        pass

if __name__ == "__main__":
    with socket.create_connection(("127.0.0.1", 8765)) as sock:
        sock.settimeout(0)
        sock.send(command(Command.version, 1, 4))
        read_all(sock)
        sock.send(command(Command.status, 1))
        read_all(sock)
        while True:
            time.sleep(0.1)
            #sock.send(command(Command.sync, 0))
            print("doing stuff")
            try:
                in_data = teensy.read(64)[0]
                print("tnsy", hex(in_data))
                sock.send(command(Command.slave, in_data, 0x81))
            except IndexError:
                pass
                
            for cmd, b1, b2, b3 in read_all(sock):
                print(cmd, hex(b1))
                if cmd == Command.master and b1 != 0xFE:
                    buf[0] = b1
                    teensy.write(buf)
