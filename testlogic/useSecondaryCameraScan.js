import { useState, useCallback, useRef, useEffect } from 'react';
import { PermissionsAndroid, Alert } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useTest } from '../contexts/TestContext';

const useSecondaryCameraScan = () => {
    const [hasScannedCode, setHasScannedCode] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const secondaryCameraRef = useRef(null);
    const frontDevice = useCameraDevice('front');
    const { scannedSecondaryCode, setScannedSecondaryCode, setShowSecondaryCamera, setTestResults } = useTest();

    // Permission request moved inside useEffect to ensure proper execution
    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            const microphonePermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED || microphonePermission !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permissions Error', 'Camera and microphone permissions are required.');
                console.log('Permissions not granted:', cameraPermission, microphonePermission);
            }
        };
        requestPermissions();
    }, []);

    const onCodeScanned = useCallback((code) => {
        console.log('useSecondaryCameraScan: Scanning');
        setIsSwitching(true);  // Disable the switch while switching cameras
        setIsScanning(true);
        setHasScannedCode(false);

        if (!hasScannedCode && isScanning) {
            const codeValue = Array.isArray(code) ? code[0].value : code.value;
            setScannedSecondaryCode(codeValue);
            setTestResults((prev) => [...prev, { name: 'Secondary Camera Test', result: true }]);
            console.log('USESECONDARYCAMERASCAN: Scanned QR Code:', codeValue);
            setIsScanning(false);
            setHasScannedCode(true);
            setShowSecondaryCamera(false);
        }
    }, [hasScannedCode, isScanning, scannedSecondaryCode]);

    const secondaryCodeScanner = useCodeScanner({
        isActive: isScanning,
        codeTypes: ['qr'],
        onCodeScanned: onCodeScanned
    });

    return {
        secondaryCameraRef,
        frontDevice,
        isSwitching,
        secondaryCodeScanner,
        hasScannedCode,
    };
};

export default useSecondaryCameraScan;