import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Switch, PermissionsAndroid, Modal, TouchableOpacity, BackHandler } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation, useFocusEffect, NavigationContainer } from '@react-navigation/native'; // Assuming you're using React Navigation
import RNFS from 'react-native-fs';
import { useTest } from '../contexts/TestContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MainCameraScreen = ({ route }) => {
    const [isMainCameraActive, setIsMainCameraActive] = useState(true);
    const [mainScannedCodes, setMainScannedCodes] = useState([]);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [timer, setTimer] = useState(10);  // Timer state starts at 10 seconds
    const [hasMainScannedCode, setHasMainScannedCode] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const mainDevice = useCameraDevice('back', { physicalDevices: ['ultra-wide-angle-camera'] });

    const {
        isBackCameraTestResolved, setIsBackCameraTestResolved,
        isBackCameraTestRejected, setIsBackCameraTestRejected
    } = useTest();

    const navigation = useNavigation();
    const fromSettings = route.params?.fromSettings; // Check if navigation came from SettingsScreen

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
    }, [mainScannedCodes]);

    const onCodeScanned = useCallback((code) => {
        console.log('Scanning');
        const codeValue = Array.isArray(code) ? code[0].value : code.value;
        if (!hasMainScannedCode && !mainScannedCodes.includes(codeValue)) {
            setIsScanning(false);
            setMainScannedCodes(prevCodes => [...prevCodes, codeValue]);
            setAlertMessage(`Scanned QR Code:\n${codeValue}\n\nCamera is now disabled.`);
            setAlertVisible(true);
            console.log(`Scanned QR Code: ${codeValue}`);
            setIsMainCameraActive(false);
            clearTimeout(timer);  // Clear the existing timer
            setTimer(0);  // Reset timer to 0
            logCameraResult('PASS', 'Main');
            setTimeout(() => {
                if (fromSettings) {
                    setAlertVisible(false);
                    setIsBackCameraTestResolved(true);
                    setIsBackCameraTestRejected(false);
                    setMainScannedCodes([]);  // Clear scanned codes
                    console.log('Navigating back');
                    navigation.navigate('Settings', { fromMainCamera: true });
                }
            }, 500);
        }
    }, [mainScannedCodes, navigation, fromSettings]);


    useEffect(() => {
        const scanTimeout = setTimeout(() => {
            if (mainScannedCodes.length < 1) {
                setIsMainCameraActive(false);
                setIsScanning(false);
                logCameraResult('FAIL', 'Main');
                setAlertMessage("Failed to scan QR codes within the time limit.\n\nCamera is now disabled.");
                setAlertVisible(true);
                console.log('Scan failed and camera disabled');
                setTimeout(() => {
                if (fromSettings) {
                    setIsBackCameraTestRejected(true);
                    setIsBackCameraTestResolved(false);
                    setMainScannedCodes([]);  // Clear scanned codes
                    console.log('Navigating back');
                    navigation.navigate('Settings', { fromMainCamera: true });
                }
            }, 500);
            }
        }, 10000); // 10 seconds  timeout for scanning

        return () => clearTimeout(scanTimeout);
    }, [mainScannedCodes, navigation, fromSettings]);

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
                console.log('MAIN CAMERA: Camera ready');
            } else {
                console.log('Permissions not granted:', cameraPermission, microphonePermission);
            }
        };

        requestPermissions();
    }, []);

    const logCameraResult = async (status, camera) => {
        const serialNumber = await AsyncStorage.getItem('serialNumber');
        const fileName = `${serialNumber}_MainCameraLog.txt`;
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
            {isMainCameraActive && (
                <Camera
                    ref={mainDevice.ref}
                    style={styles.camera}
                    device={mainDevice}
                    isActive={isMainCameraActive && isScanning}
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

export default MainCameraScreen;