import socket
import time
import struct
import enum

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
    return (Command(res[0]),) + res[1:]

def read_all(sock):
    try:
        while True:
            print(parse(sock.recv(pkgsize)))
    except socket.timeout:
        pass

if __name__ == "__main__":
    with socket.create_connection(("127.0.0.1", 8765)) as sock:
        sock.settimeout(0.3)
        sock.send(command(Command.version, 1, 4))
        read_all(sock)
        sock.send(command(Command.status, 1))
        read_all(sock)
        while True:
            sock.send(command(Command.master, 0x02, 0x81))
            read_all(sock)
