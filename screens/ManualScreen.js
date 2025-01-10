import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ManualScreen = () => {
    const date = new Date();
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.heading}>App Manual</Text>

            <Text style={styles.title}>Introduction</Text>
            <Text style={styles.text}>
                This application is designed to facilitate Android device testing, 
                allowing users to perform various hardware tests such as 5G, Cameras, Bluetooth, WLAN, GPS, and more, 
                either individually or simultaneously.
            </Text>

            <Text style={styles.title}>Pre-Requirements</Text>
            <Text style={styles.text}>
                - Rooted Android device with Android 13 or higher. (See limitations of non-root devices for more information) {"\n"}
                - Provide the necessary permissions for the app to access devices features. {"\n"}
                - Set Device language and time settings to Finnish. {"\n"}
                - Ensure that: {"\n"}{""}
                {""}  - Audio volume is set to maximum for audio testing. {"\n"}
                {""}  - The device is connected to the internet with WLAN or mobile data. {"\n"}
                {""}  - The device has a functional SIM card inserted for cellular testing. {"\n"}
                {""}  - NFC Card is available for NFC testing. {"\n"}
                {""}  - Required accessories are connected for accessory testing and USB testing before selecting the tests. {"\n"}
                {""}  - The QR codes are available for camera testing and ambient lighting is available all the time. {"\n"}
                - Clear previous test results before starting a new test.
            </Text>

            <Text style={styles.title}>Limitations of non-root devices</Text>
            <Text style={styles.text}>
                - Non-rooted devices have limited access to hardware features and may not be able to perform all tests. {"\n"}
                - Following features are not available for non-rooted devices: {"\n"}
                {""}    - Fetching device Serial Number for test result log files. {"\n"}
                {""}    - Initialization of the device after app installation. {"\n"}
                {""}    - Cellular test {"\n"}
                {""}    - NFC test {"\n"}
                {""}    - Power Metrics {"\n"}
                {""}    - Thermal Service {"\n"}
                {""}    - ADB Hardware {"\n"}
                {""}    - Sensor test {"\n"}
                {""}    - Accessory test {"\n"}
                {""}    - CPIN test
            </Text>

            <Text style={styles.title}>Automatic test cycling</Text>
            <Text style={styles.text}>
                - Automatic test cycling feature allows users to run selected tests autonomously with selected frequency. {"\n"}
                - Tests can be selected and deselected as needed. {"\n"}
                - The result of each test is displayed in real-time in the test buttons. {"\n"}
                - The test results of a testing period are displayed in the status bar. {"\n"}
                - Test cycle frequency can be adjusted between 3 and 60 minutes. {"\n"}
                - A countdown timer is displayed between test cycles in the status bar when automatic test cycling is running.
            </Text>

            <Text style={styles.title}>Recording test results</Text>
            <Text style={styles.text}>
               - The app records the results of each test, including the device serial number, test name, result, and timestamp. {"\n"}
               - Summarizer feature can be used to create a summary log file of all available log files. {"\n"}
               - All recorded log files are saved in the device's internal storage and can be accessed via the device's 'Download' folder. {"\n"}
               - Log files are automatically backed up to the cloud storage. {"\n"}
               - Log files can also be backed up to an external storage device such as a USB drive or SD card.
            </Text>

            <Text style={styles.title}>Testing Screens</Text>
            <Text style={styles.text}>- Audio: Test the audio by recording and analyzing test sound played by the device. </Text>
            <Text style={styles.text}>- Backlight: Stress test for the backlight of the device. </Text>
            <Text style={styles.text}>- Bluetooth: Test the Bluetooth functionality by scanning available BLE devices. </Text>
            <Text style={styles.text}>- Cellular: Test the cellular connectivity by pinging with a mobile network connection. </Text>
            <Text style={styles.text}>- Cameras: Test the camera functionality by reading a QR Code. </Text>
            <Text style={styles.text}>- GPS: Test the GPS functionality by connecting to satellites and locating the device. </Text>
            <Text style={styles.text}>- NFC: Test the NFC functionality by reading an NFC tag. </Text>
            <Text style={styles.text}>- Power Metrics: Provides information about device battery and charging. </Text>
            <Text style={styles.text}>- Thermal Service: Provides information about device temperature status. </Text>
            <Text style={styles.text}>- USB: Test the connection of a USB device with a write/read test. </Text>
            <Text style={styles.text}>- Vibrator: Test the vibrator and accelerometer functionality of the device. </Text>
            <Text style={styles.text}>- WLAN: Test the WLAN functionality by scanning available networks. </Text>
            <Text style={styles.text}>- ADB Hardware: Provides information about hardware events and status. </Text>
            <Text style={styles.text}>- Touch: Test for touch events. </Text>
            <Text style={styles.text}>- Sensor: Test to check the connection of hardware sensors. </Text>
            <Text style={styles.text}>- Accessory: Test to follow the connection status of 1-3 connected accessories. </Text>
            <Text style={styles.text}>- CPIN: AT Command test for SIM-Card Reader. </Text>

            <Text style={styles.title}>Navigating</Text>
            <Text style={styles.text}>
                - Test buttons are displayed on the main screen. {"\n"}
                - Select the desired test to start the test. {"\n"}
                - Long press the test button to enter the individual test screen for manual testing. {"\n"}
                - Test results are displayed in real-time on the test buttons. {"\n"}
                {""}   - Green indicates a pass, red indicates a fail, yellow indicates a selected or ongoing test. {"\n"}
                - The settings button is located in the status bar. {"\n"}
                {""}   - When tests are selected or running, the settings button changes to a start/stop button for automatic test cycling.
            </Text>

            <Text style={styles.title}>Application created by:</Text>
            <Text style={styles.text}>Anssi Kulotie {"\n"}</Text>
            <Text style={styles.text}>Miikka Tyvelä {"\n"}</Text>
            <Text style={styles.text}>Niko Kolehmainen {"\n"}</Text>

            <Text style={styles.text}>Aava Mobile Oy © 2024 - {date.getFullYear()} {"\n"}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: 'black',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'lightgray',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        color: 'lightgray',
    },
    text: {
        fontSize: 16,
        marginTop: 5,
        marginBottom: 10,
        color: 'lightgray',
    }
});

export default ManualScreen;
