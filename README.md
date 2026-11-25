# Expense Tracker

An offline student budget and expense tracker built with Expo for Android and
the web.
Students can track baon, allowances, part-time earnings, school costs,
and everyday spending, then review helpful on-device insights. Transactions
are stored locally in SQLite; no internet connection is needed for the ledger,
insights, or coach. In a browser, data stays in that browser's local storage.

The interface is available in English and Tagalog. Change the language in
**Settings → Choose your language**.

The AI tab combines cash-flow insights with an AI Budget Chatbot. The chatbot
uses the provider selected in **Chat settings** and can recommend a total
monthly budget and category limits from saved ledger and budget data. Budget
plans remain stored locally; when using Gemini Cloud, the chatbot sends its
aggregate ledger and budget context with your messages. The Android app uses
native modules, so run it in a development build; Expo Go is not supported.

Before publishing a release, replace the example Android package ID in
`app.json` with the app owner's permanent reverse-domain package ID.

## Documentation

See **[docs/README.md](docs/README.md)** for the documentation index.

- [Student setup and project guide](docs/GUIDE.md)
- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Local AI, attachments, and device requirements](docs/LOCAL-AI.md)
- [Cloud Gemini provider and fallback](docs/CLOUD-AI.md)
- [Android hardware detector module](docs/LOCAL-DEVICE.md)
- [Full project overview](docs/PROJECT-OVERVIEW.md)

## Quick start

Start the website at `http://localhost:8081`:

```bash
npm run web
```

To run the Android development build on an ARM phone:

```bash
SKIP_IOS_FRAMEWORK_DOWNLOAD=1 npm install
npx expo run:android
```

For the Expo tunnel, install a development APK first, then run:

```bash
npx expo start --dev-client --tunnel
```

The local Gemma model is downloaded separately from Chat settings. Setup,
cloud build and device requirements are in the [student guide](docs/GUIDE.md).
