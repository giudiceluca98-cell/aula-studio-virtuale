use std::sync::Mutex;

use serde::Serialize;
use tauri::{webview::PageLoadEvent, AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

#[derive(Default)]
struct PendingUpdate(Mutex<Option<Update>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMetadata {
    version: String,
    current_version: String,
    body: Option<String>,
    date: Option<String>,
}

#[tauri::command]
async fn check_for_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let metadata = update.as_ref().map(|available| UpdateMetadata {
        version: available.version.clone(),
        current_version: available.current_version.clone(),
        body: available.body.clone(),
        date: available.date.as_ref().map(|value| value.to_string()),
    });

    *pending_update
        .0
        .lock()
        .map_err(|_| "Impossibile memorizzare l'aggiornamento.".to_string())? = update;

    Ok(metadata)
}

#[tauri::command]
async fn install_pending_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "Impossibile leggere l'aggiornamento.".to_string())?
        .take()
        .ok_or_else(|| "Non è presente un aggiornamento pronto.".to_string())?;

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())?;

    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .on_page_load(|webview, payload| {
            if payload.event() == PageLoadEvent::Finished {
                let version = env!("CARGO_PKG_VERSION");
                let cleanup = format!(r#"
                    (() => {{
                      const marker = "aula-desktop-cache-reset";
                      if (localStorage.getItem(marker) === "{version}") return;
                      Promise.all([
                        "serviceWorker" in navigator
                          ? navigator.serviceWorker.getRegistrations().then(items => Promise.all(items.map(item => item.unregister())))
                          : Promise.resolve(),
                        "caches" in window
                          ? caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
                          : Promise.resolve()
                      ]).finally(() => {{
                        localStorage.setItem(marker, "{version}");
                        location.reload();
                      }});
                    }})();
                "#);
                let _ = webview.eval(&cleanup);
            }
        })
        .manage(PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            check_for_update,
            install_pending_update
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di Aula Studio Virtuale");
}
