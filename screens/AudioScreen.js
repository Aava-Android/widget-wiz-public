// AudioScreen.js

import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import useAudioTest from '../testlogic/useAudioTest';

export default function AudioScreen() {
  const {
    isPlaying,
    disableStart,
    isLoading,
    playAudio,
    alarmBuffer,
    audioBuffer,
    matchedBuffer,
    averageAmplitude,
    offset,
    setOffset,
    passTest,
    renderWaveform,
    renderCombinedWaveform,
  } = useAudioTest();

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 20 }}
    >
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 10 }}>
        Audio Testing Screen
      </Text>
      <Button
        title="Play Alarm Sound"
        onPress={playAudio}
        disabled={isPlaying || disableStart}
      />

      {isLoading && <Text>Calculating best match...</Text>}

      <View style={{ marginTop: 10 }}>
        <Text>Original Alarm Waveform</Text>
        <Svg height={100} width={300}>
          <Path
            d={renderWaveform(alarmBuffer, 'red', 2).pathData}
            fill="none"
            stroke="red"
            strokeWidth={2}
          />
        </Svg>
      </View>

      <View style={{ marginVertical: 0 }}>
        <Text>Recorded Audio Waveform</Text>
        <Svg height={100} width={300}>
          <Path
            d={renderWaveform(audioBuffer, 'blue', 1).pathData}
            fill="none"
            stroke="blue"
            strokeWidth={1}
          />
        </Svg>
      </View>

      <View style={{ marginVertical: 0 }}>
        <Text>Matched Waveform (Recorded & Original)</Text>
        <Svg height={100} width={300}>
          <Path
            d={renderCombinedWaveform(audioBuffer, alarmBuffer, offset).pathData}
            fill="none"
            stroke="red"
            strokeWidth={2}
          />
          <Path
            d={renderCombinedWaveform(audioBuffer, alarmBuffer, offset).pathData2}
            fill="none"
            stroke="blue"
            strokeWidth={1}
          />
        </Svg>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 0 }}>
        Average Amplitude: {averageAmplitude}
      </Text>

      {!isLoading && (
        <>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 10 }}>
            Offset: {offset}
          </Text>
          <Slider
            style={{ width: 300, height: 40 }}
            minimumValue={-50}
            maximumValue={50}
            step={1}
            value={offset}
            onValueChange={setOffset}
          />

          {passTest !== null && (
            <Text
              style={{
                color: passTest ? 'green' : 'red',
                fontWeight: 'bold',
                fontSize: 30,
              }}
            >
              {passTest ? 'PASS' : 'FAIL'}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}