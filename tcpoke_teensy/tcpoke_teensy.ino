// It took me four years to paint like Raphael,
// but a lifetime to paint like a child.
// -- Pablo Picasso

#include <SPI.h>

#define SERIAL_NO_DATA_BYTE 0xFE
#define ESTABLISH_CONNECTION_WITH_INTERNAL_CLOCK 0x01
#define ESTABLISH_CONNECTION_WITH_EXTERNAL_CLOCK 0x02
#define SERIAL_NYBLE 0x60

#define READ_DELAY 10 // Gen II requires a fast negotiation
#define WRITE_DELAY 1000 // Try not to lose bytes

#define LED 20


byte buffer[64];

void setup() {
    Serial.begin(115200);
    Serial.print("hello world\n");

    SPI.begin();
    SPI.beginTransaction(SPISettings(8000, MSBFIRST, SPI_MODE3));
    
    pinMode(LED, OUTPUT);
}

bool connected = false;

void loop() {
    byte in_data = 0;
    byte out_data = RawHID.recv(buffer, READ_DELAY);
    if(out_data) {
        digitalWrite(LED, HIGH);
        connected = true;
        out_data = buffer[0];
        if(buffer[1]) {
          digitalWrite(LED, LOW);
          connected = false; // reset
        }
    } else if (!connected) {
        out_data = ESTABLISH_CONNECTION_WITH_INTERNAL_CLOCK;
    } else {
        return;
    }
    in_data = SPI.transfer(out_data);
    Serial.print(in_data, HEX);
    Serial.print("\n");

    if(connected || in_data == SERIAL_NYBLE || in_data == SERIAL_NYBLE+1) {
        digitalWrite(LED, HIGH);
        connected = true;
        buffer[0] = in_data;
        RawHID.send(buffer, WRITE_DELAY);
    }
}
