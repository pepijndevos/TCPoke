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

#reset
buf[0:2] = [0x01, 0x01]
teensy.write(buf)
buf[0:2] = [0x00, 0x00]

class Command(enum.IntEnum):
    version = 1
    joypad = 101
    master = 104
    slave = 105
    sync = 106
    status = 108

fmt = "!BBBBI"
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
        sock.send(command(Command.status, 1))
        connected = False
        while True:
            time.sleep(0.01)
            try:
                data_in = teensy.read(64)[0]
            except IndexError:
                data_in = -1

            if not connected:
                sock.send(command(Command.master, 0x01, 0x81))
            elif data_in > -1:
                print("gb", hex(data_in))
                sock.send(command(Command.master, data_in, 0x81))
            else:
                sock.send(command(Command.sync, 1))

            for cmd, b1, b2, b3 in read_all(sock):
                print(cmd, hex(b1))
                if cmd == Command.sync and b1 == 0:
                    sock.send(command(Command.sync))
                elif cmd == Command.slave:
                    if connected or b1 == 0x60:
                        connected = True
                        buf[0] = b1
                        teensy.write(buf)

