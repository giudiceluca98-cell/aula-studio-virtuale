use std::{fs, path::PathBuf, sync::Mutex};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use minisign_verify::{PublicKey, Signature};
use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

#[derive(Default)]
struct PendingUpdate {
    update: Mutex<Option<Update>>,
    local_path: Mutex<Option<PathBuf>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMetadata {
    version: String,
    current_version: String,
    body: Option<String>,
    date: Option<String>,
    source: String,
}

fn metadata(update: &Update, source: &str) -> UpdateMetadata {
    UpdateMetadata {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        body: update.body.clone(),
        date: update.date.as_ref().map(|value| value.to_string()),
        source: source.to_string(),
    }
}

fn updater_public_key(app: &AppHandle) -> Result<String, String> {
    app.config()
        .plugins
        .0
        .get("updater")
        .and_then(|value| value.get("pubkey"))
        .and_then(|value| value.as_str())
        .filter(|value| !value.trim().is_empty())
        .map(str::to_owned)
        .ok_or_else(|| {
            "Questa build non contiene la chiave pubblica degli aggiornamenti.".to_string()
        })
}

fn verify_local_signature(
    bytes: &[u8],
    release_signature: &str,
    public_key: &str,
) -> Result<(), String> {
    let decoded_key = STANDARD
        .decode(public_key)
        .map_err(|_| "Chiave pubblica updater non valida.".to_string())?;
    let decoded_key = std::str::from_utf8(&decoded_key)
        .map_err(|_| "Chiave pubblica updater non leggibile.".to_string())?;
    let key = PublicKey::decode(decoded_key)
        .map_err(|_| "Chiave pubblica updater non valida.".to_string())?;

    let decoded_signature = STANDARD
        .decode(release_signature)
        .map_err(|_| "Firma dell'aggiornamento non valida.".to_string())?;
    let decoded_signature = std::str::from_utf8(&decoded_signature)
        .map_err(|_| "Firma dell'aggiornamento non leggibile.".to_string())?;
    let signature = Signature::decode(decoded_signature)
        .map_err(|_| "Firma dell'aggiornamento non valida.".to_string())?;

    key.verify(bytes, &signature, true)
        .map_err(|_| "Il file scelto non possiede la firma ufficiale richiesta.".to_string())
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

    let result = update
        .as_ref()
        .map(|available| metadata(available, "online"));
    *pending_update
        .update
        .lock()
        .map_err(|_| "Impossibile memorizzare l'aggiornamento.".to_string())? = update;
    *pending_update
        .local_path
        .lock()
        .map_err(|_| "Impossibile aggiornare la sorgente selezionata.".to_string())? = None;

    Ok(result)
}

#[tauri::command]
async fn select_local_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| format!("Impossibile verificare la release ufficiale: {error}"))?
        .ok_or_else(|| "Non risulta disponibile una versione più recente ufficiale.".to_string())?;

    let expected_suffix = format!("{}_x64-setup.exe", update.version);
    let selected = rfd::FileDialog::new()
        .set_title("Scegli l'aggiornamento ufficiale di Eve AI Studio")
        .add_filter("Installer Eve AI Studio", &["exe"])
        .pick_file();
    let Some(path) = selected else {
        return Ok(None);
    };

    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Il nome del file selezionato non è valido.".to_string())?;
    if !file_name.ends_with(&expected_suffix) {
        return Err(format!(
            "Serve l'installer ufficiale della versione {}.",
            update.version
        ));
    }

    let bytes = fs::read(&path)
        .map_err(|error| format!("Impossibile leggere il file selezionato: {error}"))?;
    let public_key = updater_public_key(&app)?;
    verify_local_signature(&bytes, &update.signature, &public_key)?;
    let result = metadata(&update, "local");

    *pending_update
        .update
        .lock()
        .map_err(|_| "Impossibile memorizzare l'aggiornamento.".to_string())? = Some(update);
    *pending_update
        .local_path
        .lock()
        .map_err(|_| "Impossibile memorizzare il file selezionato.".to_string())? = Some(path);

    Ok(Some(result))
}

#[tauri::command]
async fn install_pending_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = pending_update
        .update
        .lock()
        .map_err(|_| "Impossibile leggere l'aggiornamento.".to_string())?
        .take()
        .ok_or_else(|| "Non è presente un aggiornamento pronto.".to_string())?;
    let local_path = pending_update
        .local_path
        .lock()
        .map_err(|_| "Impossibile leggere il file selezionato.".to_string())?
        .take();

    if let Some(path) = local_path {
        let bytes = fs::read(path)
            .map_err(|error| format!("Impossibile rileggere il file selezionato: {error}"))?;
        let public_key = updater_public_key(&app)?;
        verify_local_signature(&bytes, &update.signature, &public_key)?;
        update.install(bytes).map_err(|error| error.to_string())?;
    } else {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|error| error.to_string())?;
    }

    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            check_for_update,
            select_local_update,
            install_pending_update
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di Eve AI Studio");
}
