package com.ww

import android.content.ContentValues
import android.net.Uri
import android.provider.DocumentsContract
import android.content.ContentResolver
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.*
import java.io.OutputStream
import java.io.InputStreamReader
import java.io.BufferedReader
import kotlin.coroutines.CoroutineContext

class ContentResolverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val ioScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String {
        return "ContentResolverModule"
    }

    @ReactMethod
    fun saveTxtFile(directoryUriString: String, fileName: String, fileContent: String, promise: Promise) {
        if (!isValidUri(directoryUriString) || fileName.isEmpty()) {
            promise.reject("INVALID_INPUT", "Invalid directory URI or empty file name.")
            return
        }

        if (fileName.length > 255) {
            promise.reject("INVALID_INPUT", "File name too long.")
            return
        }

        ioScope.launch {
            try {
                val directoryUri = Uri.parse(directoryUriString)
                val contentResolver: ContentResolver = reactApplicationContext.contentResolver

                Log.d("ContentResolverModule", "Directory URI: $directoryUri")
                Log.d("ContentResolverModule", "File Name: $fileName")

                val existingFileUri = findFile(directoryUri, fileName, contentResolver)
                if (existingFileUri != null) {
                    Log.d("ContentResolverModule", "File already exists: $existingFileUri")
                    contentResolver.openOutputStream(existingFileUri, "wt")?.use { outputStream ->
                        outputStream.write(fileContent.toByteArray())
                        withContext(Dispatchers.Main) {
                            promise.resolve("File overwritten successfully.")
                        }
                    } ?: throw Exception("Failed to open output stream for overwriting.")
                    return@launch
                }

                val contentValues = ContentValues().apply {
                    put(DocumentsContract.Document.COLUMN_DISPLAY_NAME, fileName)
                    put(DocumentsContract.Document.COLUMN_MIME_TYPE, "text/plain")
                }

                val documentId = DocumentsContract.getTreeDocumentId(directoryUri)
                val newFileUri = DocumentsContract.createDocument(
                    contentResolver,
                    DocumentsContract.buildDocumentUriUsingTree(directoryUri, documentId),
                    "text/plain",
                    fileName
                ) ?: throw Exception("Failed to create the file in the directory.")

                Log.d("ContentResolverModule", "New File URI: $newFileUri")

                contentResolver.openOutputStream(newFileUri)?.use { outputStream ->
                    outputStream.write(fileContent.toByteArray())
                    withContext(Dispatchers.Main) {
                        promise.resolve("File saved successfully.")
                    }
                } ?: throw Exception("Failed to open output stream for writing.")
            } catch (e: CancellationException) {
                Log.w("ContentResolverModule", "Coroutine was canceled", e)
                throw e
            } catch (e: Exception) {
                Log.e("ContentResolverModule", "Error saving file to URI: $directoryUriString with name: $fileName", e)
                withContext(Dispatchers.Main) {
                    promise.reject("SAVE_ERROR", "Error saving file to content:// URI.", e)
                }
            }
        }
    }

    @ReactMethod
    fun readTxtFile(directoryUriString: String, fileName: String, promise: Promise) {
        if (!isValidUri(directoryUriString) || fileName.isEmpty()) {
            promise.reject("INVALID_INPUT", "Invalid directory URI or empty file name.")
            return
        }

        ioScope.launch {
            try {
                val directoryUri = Uri.parse(directoryUriString)
                val contentResolver: ContentResolver = reactApplicationContext.contentResolver

                Log.d("ContentResolverModule", "Reading file: $fileName from Directory URI: $directoryUri")

                val fileUri = findFile(directoryUri, fileName, contentResolver)
                    ?: throw Exception("File not found in the specified directory.")

                val content = contentResolver.openInputStream(fileUri)?.bufferedReader()?.use { it.readText() }
                    ?: throw Exception("Failed to read file content.")

                withContext(Dispatchers.Main) {
                    promise.resolve(content)
                }
            } catch (e: CancellationException) {
                Log.w("ContentResolverModule", "Coroutine was canceled", e)
                throw e
            } catch (e: Exception) {
                Log.e("ContentResolverModule", "Error reading file from URI: $directoryUriString with name: $fileName", e)
                withContext(Dispatchers.Main) {
                    promise.reject("READ_ERROR", "Error reading file from content:// URI.", e)
                }
            }
        }
    }

    @ReactMethod
    fun deleteFile(directoryUriString: String, fileName: String, promise: Promise) {
        if (!isValidUri(directoryUriString) || fileName.isEmpty()) {
            promise.reject("INVALID_INPUT", "Invalid directory URI or empty file name.")
            return
        }

        ioScope.launch {
            try {
                val directoryUri = Uri.parse(directoryUriString)
                val contentResolver: ContentResolver = reactApplicationContext.contentResolver

                val fileUri = findFile(directoryUri, fileName, contentResolver)
                    ?: throw Exception("File not found in the directory.")

                val deleted = DocumentsContract.deleteDocument(contentResolver, fileUri)
                if (deleted) {
                    Log.d("ContentResolverModule", "File deleted successfully: $fileName")
                    withContext(Dispatchers.Main) {
                        promise.resolve("File deleted successfully.")
                    }
                } else {
                    throw Exception("Failed to delete the file.")
                }
            } catch (e: CancellationException) {
                Log.w("ContentResolverModule", "Coroutine was canceled", e)
                throw e
            } catch (e: Exception) {
                Log.e("ContentResolverModule", "Error deleting file from URI: $directoryUriString with name: $fileName", e)
                withContext(Dispatchers.Main) {
                    promise.reject("DELETE_ERROR", "Error deleting file.", e)
                }
            }
        }
    }

    private fun findFile(directoryUri: Uri, fileName: String, contentResolver: ContentResolver): Uri? {
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(
            directoryUri, DocumentsContract.getTreeDocumentId(directoryUri)
        )

        val cursor = contentResolver.query(
            childrenUri,
            arrayOf(DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME),
            null, null, null
        )

        cursor?.use {
            while (it.moveToNext()) {
                val documentId = it.getString(0)
                val displayName = it.getString(1)
                if (fileName == displayName) {
                    return DocumentsContract.buildDocumentUriUsingTree(directoryUri, documentId)
                }
            }
        }
        return null
    }

    private fun isValidUri(uriString: String): Boolean {
        return try {
            Uri.parse(uriString) != null
        } catch (e: Exception) {
            false
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        ioScope.cancel()
    }
}
