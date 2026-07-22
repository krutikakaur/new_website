import serial
import time

SERIAL_PORT = 'COM3'
BAUD_RATE = 115200

print(f"Opening {SERIAL_PORT} in diagnostic mode...")
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

try:
    while True:
        # Check if any bytes at all are coming down the wire
        if ser.in_waiting > 0:
            raw_bytes = ser.readline()
            print(f"RAW BYTES: {raw_bytes}")
        else:
            print("Waiting for data... (Buffer is empty)")
            time.sleep(0.5)
except KeyboardInterrupt:
    print("\nStopping diagnostics.")
    ser.close()