import hid, time

paths = [t['path'] for t in hid.enumerate(5824, 1158) if t['usage'] == 512]
teensy = hid.device()
teensy.open_path(paths[0])
teensy.set_nonblocking(1)

if __name__ == "__main__":
        while True:
            try:
                buf = teensy.read(64)
                print(hex(buf[0]))
                teensy.write(buf)
            except IndexError:
                pass
                
