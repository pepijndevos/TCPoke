import hid, time, sys, socket

paths = [t['path'] for t in hid.enumerate(5824, 1158) if t['usage'] == 512]
teensy = hid.device()
teensy.open_path(paths[0])
teensy.set_nonblocking(1)
buf = bytearray([0]*64)

with socket.create_connection((sys.argv[1], sys.argv[2])) as sock:
    sock.setblocking(False)
    while True:
        try:
            data_in = teensy.read(64)[0]
        except IndexError:
            pass
        else:
            print(">>", hex(data_in))
            sock.send(bytearray([data_in]))

        try:
            data_out = ord(sock.recv(1))
        except BlockingIOError:
            pass
        else:
            print("<<", hex(data_out))
            buf[0] = data_out
            teensy.write(buf)
                
