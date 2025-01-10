package com.ww;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;

public class RootCommandModule extends ReactContextBaseJavaModule {

    public RootCommandModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RootCommandModule";
    }

    @ReactMethod
    public void runAsRoot(String command, Promise promise) {
        try {
            Process process = Runtime.getRuntime().exec("su");  // Switch to root user
            DataOutputStream os = new DataOutputStream(process.getOutputStream());
            BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader stdError = new BufferedReader(new InputStreamReader(process.getErrorStream()));

            // Write the command to the shell
            os.writeBytes(command + "\n");
            os.writeBytes("exit\n");
            os.flush();
            os.close();

            // Capture the command output
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = stdInput.readLine()) != null) {
                output.append(line).append("\n");
            }

            // Capture any errors (stderr)
            StringBuilder errorOutput = new StringBuilder();
            while ((line = stdError.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }

            process.waitFor();

            if (errorOutput.length() > 0) {
                // If there's any error output, return that
                promise.reject("ERROR", errorOutput.toString());
            } else {
                // Otherwise, return the regular output
                promise.resolve(output.toString());
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
