EESchema Schematic File Version 2
LIBS:power
LIBS:device
LIBS:transistors
LIBS:conn
LIBS:linear
LIBS:regul
LIBS:74xx
LIBS:cmos4000
LIBS:adc-dac
LIBS:memory
LIBS:xilinx
LIBS:special
LIBS:microcontrollers
LIBS:dsp
LIBS:microchip
LIBS:analog_switches
LIBS:motorola
LIBS:texas
LIBS:intel
LIBS:audio
LIBS:interface
LIBS:digital-audio
LIBS:philips
LIBS:display
LIBS:cypress
LIBS:siliconi
LIBS:opto
LIBS:atmel
LIBS:contrib
LIBS:valves
LIBS:tcpoke_shield-cache
EELAYER 25 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title ""
Date ""
Rev ""
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L R R2
U 1 1 54EF02BD
P 2200 2350
F 0 "R2" V 2280 2350 50  0000 C CNN
F 1 "1K" V 2207 2351 50  0000 C CNN
F 2 "Resistors_ThroughHole:Resistor_Horizontal_RM10mm" V 2130 2350 30  0000 C CNN
F 3 "" H 2200 2350 30  0000 C CNN
	1    2200 2350
	1    0    0    -1  
$EndComp
$Comp
L R R1
U 1 1 54EF02F1
P 2000 2450
F 0 "R1" V 2080 2450 50  0000 C CNN
F 1 "1K" V 2007 2451 50  0000 C CNN
F 2 "Resistors_ThroughHole:Resistor_Horizontal_RM10mm" V 1930 2450 30  0000 C CNN
F 3 "" H 2000 2450 30  0000 C CNN
	1    2000 2450
	1    0    0    -1  
$EndComp
$Comp
L R R3
U 1 1 54EF033D
P 2400 2250
F 0 "R3" V 2480 2250 50  0000 C CNN
F 1 "1K" V 2407 2251 50  0000 C CNN
F 2 "Resistors_ThroughHole:Resistor_Horizontal_RM10mm" V 2330 2250 30  0000 C CNN
F 3 "" H 2400 2250 30  0000 C CNN
	1    2400 2250
	1    0    0    -1  
$EndComp
$Comp
L CONN_01X05 Link1
U 1 1 54EF04AB
P 2800 3150
F 0 "Link1" H 2800 3450 50  0000 C CNN
F 1 "CONN_01X05" V 2900 3150 50  0000 C CNN
F 2 "Socket_Strips:Socket_Strip_Straight_1x05" H 2800 3150 60  0000 C CNN
F 3 "" H 2800 3150 60  0000 C CNN
	1    2800 3150
	1    0    0    -1  
$EndComp
NoConn ~ 3800 2300
$Comp
L CONN_01X05 P1
U 1 1 54EF0DA9
P 2800 2200
F 0 "P1" H 2800 2500 50  0000 C CNN
F 1 "CONN_01X05" V 2900 2200 50  0000 C CNN
F 2 "Socket_Strips:Socket_Strip_Straight_1x05" H 2800 2200 60  0000 C CNN
F 3 "" H 2800 2200 60  0000 C CNN
	1    2800 2200
	1    0    0    -1  
$EndComp
NoConn ~ 3800 2400
$Comp
L LED D1
U 1 1 54F0B061
P 3400 2100
F 0 "D1" H 3400 2200 50  0000 C CNN
F 1 "LED" H 3400 2000 50  0000 C CNN
F 2 "Diodes_ThroughHole:Diode_LED_3mm_round_vertical" H 3400 2100 60  0000 C CNN
F 3 "" H 3400 2100 60  0000 C CNN
	1    3400 2100
	-1   0    0    -1  
$EndComp
$Comp
L R R4
U 1 1 54F0B12F
P 3200 2550
F 0 "R4" V 3280 2550 50  0000 C CNN
F 1 "1K" V 3207 2551 50  0000 C CNN
F 2 "Resistors_ThroughHole:Resistor_Horizontal_RM10mm" V 3130 2550 30  0000 C CNN
F 3 "" H 3200 2550 30  0000 C CNN
	1    3200 2550
	1    0    0    -1  
$EndComp
Wire Wire Line
	2600 2000 2400 2000
Wire Wire Line
	2600 2100 2200 2100
Wire Wire Line
	2600 2200 2000 2200
Connection ~ 2600 2950
Wire Wire Line
	2400 2500 2400 3150
Wire Wire Line
	2400 3150 2600 3150
Wire Wire Line
	2200 2600 2200 3250
Wire Wire Line
	2200 3250 2600 3250
Wire Wire Line
	2000 2700 2000 3350
Wire Wire Line
	2000 3350 2600 3350
Wire Wire Line
	2600 2400 2600 3050
Connection ~ 2600 2800
$Comp
L CONN_01X05 P2
U 1 1 54EF0E94
P 4000 2200
F 0 "P2" H 4000 2500 50  0000 C CNN
F 1 "CONN_01X05" V 4100 2200 50  0000 C CNN
F 2 "Socket_Strips:Socket_Strip_Straight_1x05" H 4000 2200 60  0000 C CNN
F 3 "" H 4000 2200 60  0000 C CNN
	1    4000 2200
	1    0    0    -1  
$EndComp
Wire Wire Line
	3200 2100 3200 2300
Wire Wire Line
	3200 2800 2600 2800
NoConn ~ 3800 2000
NoConn ~ 3800 2100
Wire Wire Line
	3800 2200 3600 2200
Wire Wire Line
	3600 2200 3600 2100
$EndSCHEMATC
