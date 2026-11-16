# Velo

A small Windows app that opens YouTube in its own window and adds the things you would otherwise need a patched phone app for. Sign in with your Google account as usual to see your subscriptions and feed.

- Skips video ads and hides ad slots
- Skips sponsors, self-promotion, subscribe reminders, intros and more (timestamps from [SponsorBlock](https://sponsor.ajay.app)), each type set to Auto, Ask or Off
- Shows dislike counts ([Return YouTube Dislike](https://returnyoutubedislike.com))
- 13 keyboard shortcuts you can rebind: play/pause, jump back and forward, volume, mute, speed, fullscreen, loop and more
- Small notices in the video when something is skipped, with an Undo button
- Default speed and quality, volume with the mouse wheel, no "are you still watching" pause
- Hide Shorts, comments, suggestions, end cards, info cards, live chat and merch shelves
- Settings in German, English and Turkish

Open the settings with the slider button in the top bar, or with `Ctrl+Shift+S`.

## Install

Download the setup file or the portable `.exe` from the [latest release](../../releases/latest). Windows 10 or 11 with the WebView2 runtime (already part of Windows 11).

## Build

```
npx @tauri-apps/cli@2 build
```

Needs Rust and Node. All of the app's logic is in [`src-tauri/inject.js`](src-tauri/inject.js); the window itself is in [`src-tauri/src/main.rs`](src-tauri/src/main.rs).

## Notes

- Your Google sign-in happens on Google's own page inside the window. Velo never sees your password and sends nothing to its own servers. Only SponsorBlock (a 4-character hash prefix of the video id) and Return YouTube Dislike (the video id) are contacted.
- This is an independent project, not affiliated with or endorsed by YouTube or Google. Using a modified client may go against YouTube's terms of service. Use it at your own risk.

## License

MIT
