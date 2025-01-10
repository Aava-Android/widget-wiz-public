import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Switch, PermissionsAndroid, Modal, TouchableOpacity, BackHandler } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation, useFocusEffect, NavigationContainer } from '@react-navigation/native'; // Assuming you're using React Navigation
import RNFS from 'react-native-fs';
import { useTest } from '../contexts/TestContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecondaryCameraScreen = ({ route }) => {
    const [isSecondaryCameraActive, setIsSecondaryCameraActive] = useState(true);
    const [scannedCodes, setScannedCodes] = useState([]);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [timer, setTimer] = useState(10);  // Timer state starts at 10 seconds
    const [hasScannedCode, setHasScannedCode] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const secondaryDevice = useCameraDevice('front');

    const {
        isFrontCameraTestResolved, setIsFrontCameraTestResolved,
        isFrontCameraTestRejected, setIsFrontCameraTestRejected
    } = useTest();

    const navigation = useNavigation();
    const fromSettings = route.params?.fromSettings; // Check if navigation came from SettingsScreen

    useFocusEffect(
        useCallback(() => {
            // Check if there are existing scanned codes when the screen comes into focus
            if (scannedCodes.length > 0) {
                console.log('Existing scanned codes found:', scannedCodes);
            }
        }, [scannedCodes])  // Depend only on scannedCodes
    );

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (fromSettings) {
                    // Optionally show an alert or handle differently
                    console.log('Back press disabled during scanning');
                    return true;  // Return true to prevent default behavior
                }
                // Allow back press if not from settings or not scanning
                return false;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () =>
                BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [fromSettings])
    );

    useEffect(() => {
        let timerId = setInterval(() => {
            setTimer(prevTimer => {
                if (prevTimer <= 1) {
                    clearInterval(timerId);
                    /*
                    if (scannedCodes.length < 1) {
                        setIsScanning(false);
                        setAlertMessage("Failed to scan QR codes within the time limit. Camera is now disabled.");
                        setAlertVisible(true);
                        if (fromSettings) {
                        rejectScan(true);  // Assuming you want to reject the scan on timeout
                        console.log('Scan rejected and navigating back')
                        setTimeout(() => navigation.goBack(), 2000);
                        }
                    }
                    */
                    return 0;
                }
                return prevTimer - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [scannedCodes]);

    const onCodeScanned = useCallback((code) => {
        console.log('Scanning');
        const secondaryCodeValue = Array.isArray(code) ? code[0].value : code.value;
        if (!hasScannedCode && !scannedCodes.includes(secondaryCodeValue)) {
            setIsScanning(false);
            setScannedCodes(prevCodes => [...prevCodes, secondaryCodeValue]);
            setAlertMessage(`Scanned QR Code:\n${secondaryCodeValue}\n\nCamera is now disabled.`);
            setAlertVisible(true);
            console.log(`Scanned QR Code: ${secondaryCodeValue}`);
            setIsSecondaryCameraActive(false);
            clearTimeout(timer);  // Clear the existing timer
            setTimer(0);  // Reset timer to 0
            logCameraResult('PASS', 'Secondary');
            setTimeout(() => {
                if (fromSettings) {
                    setAlertVisible(false);
                    setIsFrontCameraTestResolved(true);
                    setIsFrontCameraTestRejected(false);
                    setScannedCodes([]);  // Clear scanned codes
                    console.log('Navigating back');
                    navigation.navigate('Settings', { fromSecondaryCamera: true });
                }
            }, 500);
        }
    }, [scannedCodes, navigation, fromSettings]);

    useEffect(() => {
        const scanTimeout = setTimeout(() => {
            if (scannedCodes.length < 1) {
                setIsSecondaryCameraActive(false);
                setIsScanning(false);
                logCameraResult('FAIL', 'Secondary');
                setAlertMessage("Failed to scan QR codes within the time limit.\n\nCamera is now disabled.");
                setAlertVisible(true);
                setTimeout(() => {
                if (fromSettings) {
                    setIsFrontCameraTestRejected(true);
                    setIsFrontCameraTestResolved(false);
                    setScannedCodes([]);  // Clear scanned codes
                    console.log('Navigating back');
                    navigation.navigate('Settings', { fromSecondaryCamera: true });
                }
            }, 500);
            }
        }, 10000); // 10 timeout seconds for scanning

        return () => clearTimeout(scanTimeout);
    }, [scannedCodes, navigation, fromSettings]);

    const codeScanner = useCodeScanner({
        isActive: isScanning,
        codeTypes: ['qr'],
        onCodeScanned: onCodeScanned
    });

    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            const microphonePermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (cameraPermission === PermissionsAndroid.RESULTS.GRANTED && microphonePermission === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('SECONDARY CAMERA: Camera ready');
            } else {
                console.log('Permissions not granted:', cameraPermission, microphonePermission);
            }
        };

        requestPermissions();
    }, []);

    const logCameraResult = async (status, camera) => {
        const serialNumber = await AsyncStorage.getItem('serialNumber');
        const fileName = `${serialNumber}_SecCameraLog.txt`;
        const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        const now = new Date();
        const timestamp = now.toLocaleString().replace(',', '');

        const logEntry = `${timestamp}, ${status}, ${camera} camera\n`;
        console.log('Logging camera result:', logEntry);

        try {
            const fileExists = await RNFS.exists(path);
            if (!fileExists) {
                await RNFS.writeFile(path, 'Date, Result, Camera\n', 'utf8');
            }
            await RNFS.appendFile(path, logEntry, 'utf8');
        } catch (error) {
            console.error('Failed to log camera result:', error);
        }
    }

    return (
        <View style={styles.container}>
            {isSecondaryCameraActive && (
                <Camera
                    ref={secondaryDevice.ref}
                    style={styles.camera}
                    device={secondaryDevice}
                    isActive={isSecondaryCameraActive && isScanning}
                    codeScanner={codeScanner}
                />
            )}
            <Modal
                transparent={true}
                visible={alertVisible}
                onRequestClose={() => {
                    setAlertVisible(false);
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>{alertMessage}</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setAlertVisible(false)}>
                            <Text style={styles.textStyle}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Text style={styles.timerText}>{timer} seconds remaining</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        width: '100%',
        height: '100%',
        flex: 1
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
        width: 0,
        height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#2196F3",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    }
});

export default SecondaryCameraScreen;