import React, { useState, useContext } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogScreen = () => {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [logHeader, setLogHeader] = useState(null); // To store the header
    const [fileName, setFileName] = useState(null); // To store the file name
    const [isSummaryLog, setIsSummaryLog] = useState(false); // To check if the selected log is the SummaryLog

    const pickLogFile = async () => {
        try {
            setSelectedLog(null); // Reset the selected log
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.plainText],
            });
            const serialNumber = await AsyncStorage.getItem('serialNumber');
            const filePath = res[0].uri;
            const fileContent = await RNFS.readFile(filePath, 'utf8');
            const logArray = fileContent.split('\n');

            // Set the first line as the header
            const header = logArray[0]; // First line as header

            if (
                res[0].name.includes(`${serialNumber}_SummaryLog.txt`) ||
                res[0].name.includes(`${serialNumber}_PowerMetricsLog.txt`) ||
                res[0].name.includes(`${serialNumber}_ThermalLog.txt`) ||
                res[0].name.includes(`${serialNumber}_HardwareLog.txt`) ||
                res[0].name.includes(`${serialNumber}_AccessoryLog.txt`) ||
                res[0].name.includes(`${serialNumber}_SensorLog.txt`)
                ) {
                // If it's the SummaryLog, don't reverse the log entries
                const logEntries = logArray.slice(1); // Remove the first line
                setLogs(logEntries); // Set logs as is
                setLogHeader(header); // Save the header
                setFileName(res[0].name); // Save the file name
                setIsSummaryLog(true); // Set the flag
            } else {
                // For other logs, reverse everything after the header
                const logEntries = logArray.slice(1).reverse(); // Reverse the remaining lines
                setLogs(logEntries); // Set reversed logs
                setLogHeader(header); // Save the header
                setFileName(res[0].name); // Save the file name
                setIsSummaryLog(false); // Reset the flag
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled the picker');
            } else {
                throw err;
            }
        }
    };

    const renderLogItem = ({ item }) => (
        <TouchableOpacity
            style={styles.logItem}
            onPress={() => setSelectedLog(item)}
        >
            <Text style={styles.logText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={pickLogFile}>
                <Text style={styles.buttonText}>Select Log File</Text>
            </TouchableOpacity>

            {/* Display the file name */}
            {fileName && (
                <View style={styles.fileNameContainer}>
                    <Text style={styles.fileName}>{fileName}</Text>
                    <Text style={styles.logHeader}>{logHeader}</Text>
                </View>
            )}
            {/* Display the selected log */}
            {selectedLog && !isSummaryLog && (
                <TouchableOpacity
                    onPress={() => setSelectedLog(null)} // Deselect the log when tapping on the selected log area
                    style={styles.selectedLogContainer}
                >
                    <Text style={styles.selectedLogTitle}>Selected Log:</Text>
                    <Text style={styles.selectedLog}>{selectedLog}</Text>
                </TouchableOpacity>
            )}

            {/* Render log entries */}
            <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.flatList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#121212', // Dark background color
    },
    button: {
        backgroundColor: '#0078D7', // Blue button
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff', // White text
        fontSize: 16,
        fontWeight: 'bold',
    },
    fileNameContainer: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#2C2C2C', // Darker gray background for file name
        borderRadius: 5,
    },
    fileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF', // White text for the file name
        marginBottom: 5,
    },
    logHeaderContainer: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#333333', // Dark gray background for the header
        borderRadius: 5,
    },
    logHeader: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#CCCCCC', // Light gray text for log header
    },
    logItem: {
        padding: 10,
        backgroundColor: '#1F1F1F', // Dark background for log items
        borderBottomWidth: 1,
        borderBottomColor: '#444', // Darker border between items
    },
    logText: {
        fontSize: 14,
        color: '#FFFFFF', // White text for log items
    },
    selectedLogContainer: {
        marginVertical: 10,
        padding: 15,
        backgroundColor: '#424242', // Dark gray background for selected log
        borderRadius: 5,
    },
    selectedLogTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF5252', // Red color for selected log title
    },
    selectedLog: {
        fontSize: 14,
        color: '#FFFFFF', // White text for selected log
    },
    flatList: {
        marginTop: 10,
    },
});

export default LogScreen;