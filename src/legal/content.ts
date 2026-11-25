export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  effective: string;
  sections: LegalSection[];
}

const EFFECTIVE = 'November 7, 2026';

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  effective: EFFECTIVE,
  sections: [
    {
      heading: 'About Expense Tracker',
      body: [
        'Expense Tracker is an offline-first budgeting app designed for students to record allowance and other income, school and everyday expenses, savings, and upcoming costs. The app does not require an account or operate its own server. Your ledger is stored on your device.',
      ],
    },
    {
      heading: 'Information stored on your device',
      body: [
        'Ledger records can include transaction dates, amounts, categories, and descriptions. The app also stores monthly total and category budgets, your emergency-fund balance and goal, upcoming event names, dates and estimated costs, and app preferences such as your nickname and theme.',
        'If you use chat, your conversations and attached files are stored in the app on your device. If you choose Local AI, the downloaded model is also stored on your device.',
        'The AI Budget Chatbot sends data only when you choose a provider and send a message. Its ledger-aware mode includes an aggregate summary and your current monthly budget limits, not the full transaction history. The chat screen shows whether this context will be sent to Gemini or kept on-device with Local AI.',
      ],
    },
    {
      heading: 'AI features and third-party services',
      body: [
        'AI Budget Chatbot recommendations are generated using the provider selected in Chat settings. Its context includes aggregate ledger totals, leading expense categories, and the current monthly total and category budgets.',
        'If you choose Cloud AI and send a chat message, the message and chatbot context are sent to the AI provider you selected. The provider handles that information under its own privacy terms. Do not include sensitive financial or personal information in cloud chats.',
        'If you choose Local AI, chat messages are processed on your device. Downloading a local model requires an internet connection to the download host, which may receive standard connection information such as your IP address.',
      ],
    },
    {
      heading: 'Exports and backups',
      body: [
        'You can export transaction history to a CSV file or create an app backup file. Exported files may contain personal financial records. You choose where to save or share them, and anyone with access to a file may be able to read its contents.',
        'The JSON app backup includes chat, portable settings, transactions, monthly budgets, emergency-fund balance and goal, and upcoming events. It does not include your API key, attached files, or downloaded local model. History CSV contains transactions only; restoring a CSV adjusts the emergency-fund balance for imported fund activity, while the current goal and events remain unchanged.',
      ],
    },
    {
      heading: 'Your choices and data removal',
      body: [
        'You can delete individual transactions, clear transaction history, reset app data, or uninstall the app. Deleting a fund transaction also adjusts the emergency-fund balance. Clearing transaction history resets the emergency-fund balance and goal. Files exported or shared outside the app must be removed separately.',
      ],
    },
    {
      heading: 'Children and policy changes',
      body: [
        'Expense Tracker is not directed at children under 13. This policy may be updated; the effective date above shows when it was last revised.',
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms & Conditions',
  effective: EFFECTIVE,
  sections: [
    {
      heading: 'Use of the app',
      body: [
        'These terms describe the app and the conditions for using it. You can review them anytime in Settings.',
      ],
    },
    {
      heading: 'What the app does',
      body: [
        'Expense Tracker helps students record allowance and other income, track school and everyday expenses, set monthly and category budgets, set a savings goal, plan upcoming costs, review spending summaries, and optionally use AI chat features.',
        'The app stores ledger information on your device. It does not connect to your bank, move money, or make payments. The Pay button for an upcoming event records the estimated cost as an expense in the ledger; you must make any real-world payment separately.',
      ],
    },
    {
      heading: 'Your records and responsibility',
      body: [
        'You are responsible for entering accurate records and reviewing them before making financial decisions. Balances and summaries are calculated from the information recorded in the app and may not reflect your actual bank balance.',
        'AI-generated tips and chat replies are informational only, may be inaccurate or incomplete, and are not financial, legal, tax, or other professional advice. Use your own judgment and consult a qualified professional when appropriate.',
        'You are responsible for keeping copies of any exported records you need. Deleted or lost local data and files cannot necessarily be recovered.',
      ],
    },
    {
      heading: 'Optional AI and external services',
      body: [
        'Cloud AI and local model downloads may rely on third-party services. If you use them, their availability and handling of information are governed by their own terms and policies.',
        'You are responsible for the use and security of any API key you provide and for any third-party usage limits or charges that may apply.',
      ],
    },
    {
      heading: 'Acceptable use and availability',
      body: [
        'Use the app lawfully and do not interfere with its operation or use it to violate another person’s rights. Features may change, and the app is provided without a guarantee of uninterrupted availability or error-free calculations.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'These terms may be revised. The effective date above shows when they were last updated. If a revision requires renewed acceptance, the app will ask you to agree before continuing.',
      ],
    },
  ],
};
