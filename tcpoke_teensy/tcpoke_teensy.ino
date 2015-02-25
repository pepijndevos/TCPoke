#include <SPI.h>

#define SERIAL_NO_DATA_BYTE 0xFE
#define ESTABLISH_CONNECTION_WITH_INTERNAL_CLOCK 0x01
#define ESTABLISH_CONNECTION_WITH_EXTERNAL_CLOCK 0x02
#define SERIAL_NYBLE 0x60

#define DELAY 1000

byte buffer[64];

void setup() {
    Serial.begin(115200);
    Serial.print("hello world\n");

    SPI.begin();
    SPI.beginTransaction(SPISettings(8000, MSBFIRST, SPI_MODE3));
}

bool connected = false;

void loop() {
    byte in_data = 0;
    byte out_data = RawHID.recv(buffer, DELAY);
    if(out_data) {
        out_data = buffer[0];
        if(buffer[1]) connected = false; // reset
    } else if (!connected) {
        out_data = ESTABLISH_CONNECTION_WITH_INTERNAL_CLOCK;
    } else {
        return;
    }
    in_data = SPI.transfer(out_data);
    Serial.print(in_data, HEX);
    Serial.print("\n");

    if(connected || in_data == SERIAL_NYBLE) {
        connected = true;
        buffer[0] = in_data;
        RawHID.send(buffer, DELAY);
    }
}
