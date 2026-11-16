#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WebviewUrl, WebviewWindowBuilder};

// Ad hosts never resolve; the first three flags are Tauri's own defaults, which a custom value replaces.
const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection \
--autoplay-policy=no-user-gesture-required \
--host-resolver-rules=\"MAP doubleclick.net 0.0.0.0, MAP *.doubleclick.net 0.0.0.0, \
MAP *.googlesyndication.com 0.0.0.0, MAP googleadservices.com 0.0.0.0, MAP *.googleadservices.com 0.0.0.0\"";

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External("https://www.youtube.com/".parse().unwrap()),
            )
            .title("Velo")
            .inner_size(1360.0, 860.0)
            .min_inner_size(480.0, 360.0)
            .initialization_script(include_str!("../inject.js"))
            .additional_browser_args(BROWSER_ARGS)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Velo");
}
