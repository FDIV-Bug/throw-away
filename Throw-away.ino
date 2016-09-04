/*
   Copyright (c) 2015 Intel Corporation.  All rights reserved.

   This library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 2.1 of the License, or (at your option) any later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public
   License along with this library; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

*/

/*
   This sketch example demonstrates how the BMI160 on the
   Intel(R) Curie(TM) module can be used to read accelerometer data
*/

#include "CurieIMU.h"

void setup() {
  Serial.begin(9600); // initialize Serial communication
  while (!Serial);    // wait for the serial port to open

  // initialize device
  Serial.println("Initializing IMU device...");
  CurieIMU.begin();

  // Set the accelerometer range to 16G
  CurieIMU.setAccelerometerRange(16);

  // Calibrating the accelerometer device
  CurieIMU.autoCalibrateAccelerometerOffset(X_AXIS, 0);
  CurieIMU.autoCalibrateAccelerometerOffset(Y_AXIS, 0);
  CurieIMU.autoCalibrateAccelerometerOffset(Z_AXIS, 1);
}

void loop() {
  int axRaw, ayRaw, azRaw;         // raw accelerometer values
  float ax, ay, az;

  // read raw accelerometer measurements from device
  CurieIMU.readAccelerometer(axRaw, ayRaw, azRaw);

  // convert the raw accelerometer data to G's
  ax = convertRawAcceleration(axRaw);
  ay = convertRawAcceleration(ayRaw);
  az = convertRawAcceleration(azRaw);

  // display tab-separated accelerometer x/y/z values
  Serial.print("a:\t");
  Serial.print(ax);
  Serial.print("\t");
  Serial.print(ay);
  Serial.print("\t");
  Serial.print(az);
  Serial.println();  
}

float convertRawAcceleration(int aRaw) {
  float a = (aRaw/32768.0)*CurieIMU.getAccelerometerRange();
  return a;
}

