use std::process::Command;
use tauri_plugin_shell::ShellExt;
use tauri::Emitter;
use tauri::Manager;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::io::{AsyncWriteExt, AsyncBufReadExt, BufReader};
use interprocess::local_socket::traits::tokio::Stream;
use interprocess::local_socket::{ToFsName, GenericFilePath};
use std::fs;
use std::path::PathBuf;

// We store the IPC writer channel here so the frontend can send commands.
// A simple mpsc channel to send JSON strings to the IPC writer task.
struct MpvState {
    tx: Arc<Mutex<Option<tokio::sync::mpsc::Sender<String>>>>,
}

// Helper: extract the Win32 HWND from the main window (Windows only).
// Returns None on all other platforms.
fn get_hwnd(window: &tauri::Window) -> Option<isize> {
    #[cfg(target_os = "windows")]
    {
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        if let Ok(handle) = window.window_handle() {
            if let RawWindowHandle::Win32(h) = handle.as_raw() {
                return Some(h.hwnd.get() as isize);
            }
        }
    }
    let _ = window; // suppress unused-variable warning on non-Windows
    None
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test_mpv_path(path: &str) -> Result<String, String> {
    match Command::new(path).arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                Ok(stdout.lines().next().unwrap_or("MPV found but no version output").to_string())
            } else {
                Err(format!("MPV command failed: {}", String::from_utf8_lossy(&output.stderr)))
            }
        }
        Err(e) => Err(format!("Failed to execute MPV: {}", e)),
    }
}

#[tauri::command]
fn launch_mpv(path: &str, args: Vec<String>) -> Result<(), String> {
    match Command::new(path).args(&args).spawn() {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to launch custom MPV: {}", e)),
    }
}

#[tauri::command]
async fn test_bundled_mpv(app: tauri::AppHandle) -> Result<String, String> {
    let sidecar = app.shell().sidecar("mpv")
        .map_err(|e| format!("Failed to find bundled mpv sidecar: {}", e))?;
    
    let output = sidecar.arg("--version").output().await
        .map_err(|e| format!("Failed to execute bundled MPV: {}", e))?;
        
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.lines().next().unwrap_or("MPV found but no version output").to_string())
    } else {
        Err(format!("MPV command failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

/// Returns the inner size of the named window so the frontend can pass
/// exact geometry to mpv when launching in embedded (--wid) mode.
#[tauri::command]
fn get_window_size(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let window = app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    let size = window.inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    Ok(serde_json::json!({ "width": size.width, "height": size.height }))
}

/// Shared IPC connection helper — spawns reader+writer tasks and stores the
/// sender in global state. Call after mpv has had time to create the socket.
async fn connect_ipc(
    ipc_path: String,
    app_clone: tauri::AppHandle,
    tx_clone: Arc<Mutex<Option<tokio::sync::mpsc::Sender<String>>>>,
) {
    tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;

    if let Ok(name) = ipc_path.to_fs_name::<GenericFilePath>() {
        match interprocess::local_socket::tokio::Stream::connect(name).await {
            Ok(stream) => {
                let (reader, mut writer) = stream.split();
                let mut buf_reader = BufReader::new(reader);
                let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(32);

                {
                    let mut global_tx = tx_clone.lock().await;
                    *global_tx = Some(tx);
                }

                // Writer task: forward commands from frontend → mpv
                tokio::spawn(async move {
                    while let Some(cmd) = rx.recv().await {
                        let mut payload = cmd.clone();
                        payload.push('\n');
                        let _ = writer.write_all(payload.as_bytes()).await;
                    }
                });

                // Reader task: forward mpv events → frontend
                let mut line = String::new();
                while let Ok(bytes) = buf_reader.read_line(&mut line).await {
                    if bytes == 0 { break; }
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line) {
                        let _ = app_clone.emit("mpv-event", json);
                    }
                    line.clear();
                }
            }
            Err(e) => {
                println!("[WuCinema] Failed to connect to MPV IPC socket: {}", e);
            }
        }
    }
}

#[tauri::command]
async fn launch_bundled_mpv_ipc(
    app: tauri::AppHandle,
    window: tauri::Window,
    state: tauri::State<'_, MpvState>,
    mut args: Vec<String>,
    embed: bool,
) -> Result<(), String> {
    let sidecar = app.shell().sidecar("mpv")
        .map_err(|e| format!("Failed to find bundled mpv sidecar: {}", e))?;
        
    let ipc_path = if cfg!(windows) {
        "\\\\.\\pipe\\wucinema-mpv".to_string()
    } else {
        "/tmp/wucinema-mpv.sock".to_string()
    };

    args.push(format!("--input-ipc-server={}", ipc_path));

    // On Windows: embed mpv inside the Tauri window using its Win32 HWND.
    if embed {
        if let Some(hwnd) = get_hwnd(&window) {
            // Size mpv to match the window's inner area
            if let Ok(size) = window.inner_size() {
                args.push(format!("--geometry={}x{}", size.width, size.height));
            }
            args.push(format!("--wid={}", hwnd));
            args.push("--no-border".to_string());
            args.push("--no-osc".to_string());
        }
    }

    match sidecar.args(&args).spawn() {
        Ok(_) => {
            let app_clone = app.clone();
            let tx_clone = state.tx.clone();
            tokio::spawn(connect_ipc(ipc_path, app_clone, tx_clone));
            Ok(())
        }
        Err(e) => Err(format!("Failed to launch bundled MPV IPC: {}", e)),
    }
}

#[tauri::command]
async fn mpv_command(
    state: tauri::State<'_, MpvState>,
    command: Vec<serde_json::Value>,
) -> Result<(), String> {
    let tx_guard = state.tx.lock().await;
    if let Some(tx) = &*tx_guard {
        let payload = serde_json::json!({ "command": command });
        let _ = tx.send(payload.to_string()).await;
        Ok(())
    } else {
        Err("MPV IPC not connected".to_string())
    }
}

#[tauri::command]
fn save_temp_subtitle(text: String, filename: String) -> Result<String, String> {
    use std::fs::File;
    use std::io::Write;

    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(&filename);

    let mut file = File::create(&file_path)
        .map_err(|e| format!("Failed to create subtitle file: {}", e))?;

    file.write_all(text.as_bytes())
        .map_err(|e| format!("Failed to write subtitle content: {}", e))?;

    let path_str = file_path.to_string_lossy().into_owned();
    Ok(path_str)
}

// Helper function to get the cache path for a key.
fn get_cache_file_path(app: &tauri::AppHandle, key: &str) -> Result<PathBuf, String> {
    let mut cache_dir = app.path().app_local_data_dir()
        .map_err(|e| format!("Failed to get app local data dir: {}", e))?;
    cache_dir.push("wucine_cache");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    }
    // Sanitize the key to be a safe filename.
    let safe_key = key.chars().map(|c| {
        if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
            c
        } else {
            '_'
        }
    }).collect::<String>();
    cache_dir.push(safe_key);
    Ok(cache_dir)
}

#[tauri::command]
fn save_cached_text(app: tauri::AppHandle, key: String, content: String) -> Result<String, String> {
    let path = get_cache_file_path(&app, &key)?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write cached text file: {}", e))?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn save_cached_binary(app: tauri::AppHandle, key: String, data: Vec<u8>) -> Result<String, String> {
    let path = get_cache_file_path(&app, &key)?;
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write cached binary file: {}", e))?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn get_cached_text(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let path = get_cache_file_path(&app, &key)?;
    if !path.exists() {
        return Err("File not found in cache".to_string());
    }
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read cached text file: {}", e))
}

#[tauri::command]
fn get_cached_path(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let path = get_cache_file_path(&app, &key)?;
    if path.exists() {
        Ok(path.to_string_lossy().into_owned())
    } else {
        Err("File not found in cache".to_string())
    }
}

#[tauri::command]
fn delete_cached_file(app: tauri::AppHandle, key: String) -> Result<(), String> {
    let path = get_cache_file_path(&app, &key)?;
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete cached file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn clear_cache(app: tauri::AppHandle) -> Result<(), String> {
    let mut cache_dir = app.path().app_local_data_dir()
        .map_err(|e| format!("Failed to get app local data dir: {}", e))?;
    cache_dir.push("wucine_cache");
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir)
            .map_err(|e| format!("Failed to remove cache directory: {}", e))?;
    }
    fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    Ok(())
}

#[tauri::command]
fn list_cached_files(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let mut cache_dir = app.path().app_local_data_dir()
        .map_err(|e| format!("Failed to get app local data dir: {}", e))?;
    cache_dir.push("wucine_cache");
    
    let mut files = Vec::new();
    if cache_dir.exists() {
        let entries = fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache directory: {}", e))?;
            
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let metadata = entry.metadata().ok();
                    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let modified = metadata.as_ref().and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::SystemTime::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);
                    let filename = entry.file_name().to_string_lossy().into_owned();
                    files.push(serde_json::json!({
                        "key": filename,
                        "size": size,
                        "modified": modified,
                        "path": path.to_string_lossy().into_owned()
                    }));
                }
            }
        }
    }
    Ok(serde_json::json!(files))
}

#[tauri::command]
async fn launch_mpv_ipc(
    app: tauri::AppHandle,
    window: tauri::Window,
    state: tauri::State<'_, MpvState>,
    path: String,
    mut args: Vec<String>,
    embed: bool,
) -> Result<(), String> {
    let ipc_path = if cfg!(windows) {
        "\\\\.\\pipe\\wucinema-mpv".to_string()
    } else {
        "/tmp/wucinema-mpv.sock".to_string()
    };

    args.push(format!("--input-ipc-server={}", ipc_path));

    // On Windows: embed mpv inside the Tauri window using its Win32 HWND.
    if embed {
        if let Some(hwnd) = get_hwnd(&window) {
            if let Ok(size) = window.inner_size() {
                args.push(format!("--geometry={}x{}", size.width, size.height));
            }
            args.push(format!("--wid={}", hwnd));
            args.push("--no-border".to_string());
            args.push("--no-osc".to_string());
        }
    }

    match Command::new(&path).args(&args).spawn() {
        Ok(_) => {
            let app_clone = app.clone();
            let tx_clone = state.tx.clone();
            tokio::spawn(connect_ipc(ipc_path, app_clone, tx_clone));
            Ok(())
        }
        Err(e) => Err(format!("Failed to launch custom MPV IPC: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(MpvState { tx: Arc::new(Mutex::new(None)) })
        .invoke_handler(tauri::generate_handler![
            greet,
            test_mpv_path,
            launch_mpv,
            test_bundled_mpv,
            get_window_size,
            launch_bundled_mpv_ipc,
            launch_mpv_ipc,
            mpv_command,
            save_temp_subtitle,
            save_cached_text,
            save_cached_binary,
            get_cached_text,
            get_cached_path,
            delete_cached_file,
            clear_cache,
            list_cached_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
