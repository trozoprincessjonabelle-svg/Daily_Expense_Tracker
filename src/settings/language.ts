import type { AppLanguage } from './storage';

const TAGALOG: Record<string, string> = {
  Home: 'Tahanan',
  Plans: 'Mga Plano',
  Planner: 'Pagpaplano',
  'Unable to load Plans': 'Hindi ma-load ang mga plano',
  Insights: 'Buod',
  'AI Coach': 'Gabay sa pera',
  'Offline Coach': 'Gabay sa pera',
  'AI Chatbot': 'AI Chatbot',
  'Recommend a budget': 'Magrekomenda ng badyet',
  'This month’s budget': 'Badyet ngayong buwan',
  'No total budget set': 'Wala pang kabuuang badyet',
  'No category limits set': 'Wala pang limitasyon kada kategorya',
  'Set budget': 'Magtakda ng badyet',
  Edit: 'I-edit',
  'Set your budget': 'Itakda ang badyet mo',
  'Total monthly budget': 'Kabuuang badyet para sa buwan',
  'Category limits': 'Mga limitasyon kada kategorya',
  'Add a limit for the categories you want to track.': 'Magdagdag ng limitasyon sa mga kategoryang gusto mong subaybayan.',
  'Add category budget': 'Magdagdag ng badyet sa kategorya',
  'Save budget': 'I-save ang badyet',
  History: 'Kasaysayan',
  Settings: 'Mga Setting',
  'Chat settings': 'Mga Setting ng Chat',
  Profile: 'Profile',
  Nickname: 'Palayaw',
  'Your nickname': 'Isulat ang pangalan mo',
  Appearance: 'Hitsura',
  Light: 'Maliwanag',
  Dark: 'Madilim',
  'Choose your language': 'Pumili ng wika',
  Tagalog: 'Tagalog',
  Data: 'Data',
  'Save your chat and settings to a file, or restore them later. Your Gemini API key and the downloaded local model are not included.':
    'I-save sa file ang iyong chat at settings, o ibalik ang mga ito sa ibang pagkakataon. Hindi kasama ang Gemini API key at na-download na local model.',
  'Ask anything. Your chat is saved on this device.': 'Magtanong ng kahit ano. Naka-save sa device na ito ang chat mo.',
  'Add an API key to see the models available to you.': 'Magdagdag ng API key para makita ang mga modelong magagamit mo.',
  'Local AI runs only in the Android app. In the browser, use Cloud AI.': 'Sa Android app lang gumagana ang Local AI. Gamitin ang Cloud AI sa browser.',
  'Offline budget answers are available now. Set up on-device AI for general questions without paid API tokens.':
    'May mga sagot tungkol sa badyet offline. I-set up ang AI sa device para sa iba’t ibang tanong nang walang bayad na API token.',
  'Budget answers work offline here. General on-device AI requires the Android app and a one-time model download.':
    'Gumagana offline ang mga sagot tungkol sa badyet. Kailangan ng Android app at minsanang pag-download ng modelo para makasagot ang AI sa iba’t ibang tanong.',
  'Ask general questions or get budget advice based on the summary shown above. Replies run on your device without paid API tokens.':
    'Magtanong ng iba’t ibang paksa o humingi ng payo sa badyet batay sa buod sa itaas. Sumasagot ang AI sa device mo nang walang bayad na API token.',
  'Set up on-device AI to answer general questions without an API key or paid AI tokens. The one-time model download is about 2.6 GB.':
    'I-set up ang AI sa device para makasagot sa iba’t ibang tanong nang walang API key o bayad na token. Minsanang 2.6 GB ang download ng modelo.',
  'Runs on this Android device after a one-time download. No API key or paid API tokens are needed.':
    'Tumatakbo ito sa Android device pagkatapos ng minsanang pag-download. Hindi kailangan ng API key o bayad na API token.',
  'Set up local AI': 'I-set up ang AI sa device',
  'Load local AI': 'I-load ang AI sa device',
  'Unable to open local AI setup': 'Hindi mabuksan ang pag-set up ng lokal na AI',
  'Model acceleration is verified when loading.': 'Sinusuri ang pagpapabilis ng modelo habang nilo-load ito.',
  'Voice message': 'Mensahe gamit ang boses',
  'Record voice message': 'Mag-record ng mensahe gamit ang boses',
  'AI memory (context window)': 'Memorya ng AI (context window)',
  'AI memory': 'Memorya ng AI',
  used: 'gamit',
  Done: 'Tapos',
  'Minimize download status': 'I-minimize ang katayuan ng pag-download',
  'Close options': 'Isara ang mga pagpipilian',
  'Retry hardware check': 'Ulitin ang pagsusuri ng hardware',
  'Refresh device resources': 'I-refresh ang resources ng device',
  'The memory size shows after the first AI reply.': 'Lalabas ang laki ng memorya pagkatapos ng unang sagot ng AI.',
  'Almost full - older messages will be forgotten. Tap the trash icon to clear the chat and reset the AI memory.': 'Halos puno na — makakalimutan ang mga lumang mensahe. Pindutin ang icon ng basurahan para burahin ang chat at i-reset ang memorya ng AI.',
  'Memory is filling up.': 'Napupuno na ang memorya.',
  'Enter 0 to turn off the warning.': 'Ilagay ang 0 para patayin ang babala.',
  'Checking hardware…': 'Sinusuri ang hardware…',
  'Refresh failed. Try again.': 'Hindi nag-refresh. Subukan muli.',
  Retry: 'Subukan muli',
  'Back up data': 'I-back up ang data',
  'Restore from backup': 'Ibalik mula sa backup',
  About: 'Tungkol sa app',
  App: 'App',
  Version: 'Bersyon',
  'Privacy Policy': 'Patakaran sa Privacy',
  'Terms & Conditions': 'Mga Tuntunin at Kundisyon',
  'Reset all data': 'I-reset ang lahat ng data',
  'Something went wrong.': 'Nagkaproblema. Subukan muli.',
  'Backup created': 'Nagawa ang backup',
  'Backup restored.': 'Naibalik ang backup.',
  'Restore backup?': 'Ibalik ang backup?',
  Restore: 'Ibalik',
  'Reset all data?': 'I-reset ang lahat ng data?',
  'Today’s balance': 'Balanse ngayong araw',
  'Includes money left from earlier days': 'Kasama rito ang perang natira noong mga nakaraang araw',
  'No available money today': 'Walang perang magagamit ngayong araw',
  'Income today': 'Perang pumasok ngayong araw',
  'Expenses today': 'Mga gastos ngayong araw',
  'Spending totals': 'Kabuuang gastos',
  'Yesterday’s money recap': 'Buod ng pera kahapon',
  'Money added': 'Nadagdag na pera',
  'Total spent': 'Kabuuang nagastos',
  'Remaining from added money': 'Natira mula sa idinagdag na pera',
  'Close and clear activity': 'Isara at i-clear ang aktibidad',
  'No expenses were recorded yesterday.': 'Walang naitalang gastos kahapon.',
  Income: 'Pumasok na pera',
  Expenses: 'Mga gastos',
  'Payment source': 'Pinanggalingan ng bayad',
  'Regular balance': 'Karaniwang balanse',
  'Tracked separately from cash flow': 'Hiwalay na sinusubaybayan sa galaw ng pera',
  'No cash income or expenses recorded this month yet.':
    'Wala pang naitatalang pumasok o lumabas na pera ngayong buwan.',
  'Emergency fund transactions cannot be edited.':
    'Hindi maaaring i-edit ang transaksyon ng pondong pang-emergency.',
  'This change would make your emergency fund balance negative.':
    'Magiging negatibo ang balanse ng pondong pang-emergency kapag ginawa ito.',
  'These transactions would make your emergency fund balance negative.':
    'Magiging negatibo ang balanse ng pondong pang-emergency sa mga transaksyong ito.',
  'Save your chat, settings, transactions, emergency fund, and events to a file, or restore them later. Your Gemini API key, downloaded local model, and media attachments are not included.':
    'I-save sa file ang chat, settings, mga transaksyon, pondong pang-emergency, at mga event, o i-restore ang mga ito sa ibang pagkakataon. Hindi kasama ang Gemini API key, na-download na local model, at mga media attachment.',
  'Emergency fund': 'Pondong pang-emergency',
  'Use emergency savings only for urgent or unexpected needs.':
    'Gamitin lang ang pondong pang-emergency para sa agarang pangangailangan o hindi inaasahang gastusin.',
  'Manage your emergency fund, activity calendar, and upcoming expenses.':
    'Pamahalaan ang pondong pang-emergency, kalendaryo ng aktibidad, at mga paparating na gastusin.',
  'Edit balance': 'I-edit ang balanse',
  'New balance (PHP)': 'Bagong balanse (PHP)',
  'Update balance': 'I-update ang balanse',
  'This updates the saved balance only and does not change transaction history.':
    'Ina-update lamang nito ang naka-save na balanse at hindi binabago ang kasaysayan ng transaksyon.',
  'Emergency fund balance must be zero or more.': 'Dapat ay zero o higit pa ang balanse ng pondong pang-emergency.',
  'Emergency fund spending': 'Paggamit ng pondong pang-emergency',
  'Savings added': 'Nadagdag sa ipon',
  'Savings activity': 'Galaw ng ipon',
  'Emergency fund used': 'Ginamit sa pondong pang-emergency',
  'Net savings': 'Netong ipon',
  'Cash flow net': 'Netong galaw ng pera',
  'Money flow': 'Galaw ng pera',
  'Money in': 'Pumasok na pera',
  'Money out': 'Lumabas na pera',
  'Add to emergency fund': 'Magdagdag sa pondong pang-emergency',
  'Add savings': 'Magdagdag sa ipon',
  'Savings goals': 'Mga layunin sa pag-iipon',
  'Available Balance': 'Puwedeng gastusin',
  'Savings goal': 'Layunin sa pag-iipon',
  'Savings goal refund': 'Ibinalik mula sa layunin sa pag-iipon',
  'Available balance will go below zero': 'Bababa sa zero ang puwedeng gastusin',
  New: 'Bago',
  'Create a savings goal': 'Gumawa ng layunin sa pag-iipon',
  'No savings goals yet': 'Wala pang layunin sa pag-iipon',
  'Set a target for something you want to save for. Add to it as you go.':
    'Magtakda ng halaga para sa bagay na iniipunan mo. Dagdagan ito kapag kaya mo.',
  'New savings goal': 'Bagong layunin sa pag-iipon',
  'Goal name': 'Pangalan ng layunin',
  'e.g. New laptop': 'hal. Bagong laptop',
  'Target amount': 'Target na halaga',
  'Target amount (PHP)': 'Target na halaga (PHP)',
  'Create goal': 'Gumawa ng layunin',
  Create: 'Gumawa',
  'Goal reached': 'Naabot na ang layunin',
  'Amount to save': 'Halagang idaragdag sa ipon',
  remaining: 'natitira',
  'Amount cannot exceed the remaining goal amount.':
    'Hindi puwedeng lumampas ang halaga sa natitira para sa layuning ito.',
  'Delete savings goal?': 'Burahin ang layunin sa pag-iipon?',
  'Use fund': 'Gumamit ng pondo',
  'Amount spent (PHP)': 'Halagang ginastos (PHP)',
  'What was it used for?': 'Para saan ito ginamit?',
  'e.g. Medicine': 'hal. Gamot',
  'Amount cannot exceed the available emergency fund.': 'Hindi puwedeng lumampas ang halaga sa natitirang pondong pang-emergency.',
  'Record spending': 'Itala ang paggastos',
  'Could not update emergency fund': 'Hindi na-update ang pondong pang-emergency',
  'Spending cannot exceed your emergency fund balance.': 'Hindi puwedeng lumampas ang gastos sa balanse ng pondong pang-emergency.',
  'Emergency fund balance changed. Please try again.': 'Nagbago ang balanse ng pondong pang-emergency. Subukan muli.',
  'Add money': 'Magdagdag ng pera',
  'Set up': 'Mag-set up',
  'saved of': 'naipon sa layuning',
  'Add a savings goal anytime.': 'Magtakda ng layunin sa pag-iipon anumang oras.',
  Events: 'Mga event',
  'Plan upcoming costs, review daily activity, and manage your emergency fund.':
    'Magplano ng mga gastusin, suriin ang galaw ng pera, at pamahalaan ang pondong pang-emergency.',
  'Manage fund': 'Pamahalaan ang pondo',
  'Manage emergency fund': 'Pamahalaan ang pondong pang-emergency',
  'Add upcoming cost': 'Magdagdag ng paparating na gastusin',
  'Add event': 'Magdagdag',
  'Add cost': 'Magdagdag ng gastusin',
  'No events yet.': 'Wala pang event.',
  'Past due': 'Lampas na sa takdang petsa',
  'No cost set': 'Walang itinakdang halaga',
  'Mark event as paid?': 'Markahang bayad na?',
  'This will not send money. It will record': 'Hindi ito magpapadala ng pera. Itatala nito ang',
  'as an expense and remove the event from your event list.': 'bilang gastos at aalisin ito sa listahan ng mga event.',
  'Mark paid': 'Markahang bayad na',
  'Every little move, all in one place': 'Nasa iisang lugar ang bawat galaw ng pera mo',
  'History tools': 'Mga tool sa kasaysayan',
  'Export CSV': 'I-export ang CSV',
  Clear: 'I-clear',
  'Working…': 'Pinoproseso…',
  'Search history': 'Maghanap sa kasaysayan',
  'Search your transactions': 'Maghanap ng mga transaksyon',
  'Clear search': 'Burahin ang paghahanap',
  SHOW: 'IPAKITA',
  All: 'Lahat',
  'Your transaction history will appear here.': 'Lalabas dito ang kasaysayan ng iyong mga transaksyon.',
  'No transactions match your search.': 'Walang transaksyong tumutugma sa paghahanap mo.',
  'Once you add an expense or income, you’ll find it here.': 'Makikita rito ang mga idinagdag mong gastos at perang pumasok.',
  'Try a different keyword or filter.': 'Sumubok ng ibang salita o filter.',
  Transactions: 'Mga transaksyon',
  'A clearer picture of your spending': 'Mas malinaw na tingin sa paggastos mo',
  'NET THIS MONTH': 'NETO NGAYONG BUWAN',
  'NET CASH FLOW THIS MONTH': 'NETONG GALAW NG PERA NGAYONG BUWAN',
  'NET CASH FLOW LAST 7 DAYS': 'NETONG GALAW NG PERA SA NAKARAANG 7 ARAW',
  'NET CASH FLOW THIS YEAR': 'NETONG GALAW NG PERA NGAYONG TAON',
  'Spending (last 7 days)': 'Gastos sa nakaraang 7 araw',
  'Choose a period; income, spending, and savings update together.':
    'Pumili ng panahon; sabay na magbabago ang perang pumasok, ginastos, at naipon.',
  'For the selected period; tracked separately from cash flow':
    'Para sa napiling panahon; hiwalay sa galaw ng pera.',
  'Based on your recorded transactions': 'Batay sa mga naitala mong transaksyon',
  'No transactions recorded this month yet.': 'Wala pang naitatalang transaksyon ngayong buwan.',
  'No cash income or expenses recorded for the selected period yet.':
    'Wala pang naitatalang perang pumasok o ginastos sa napiling panahon.',
  'Your recorded income is higher than expenses for the selected period.':
    'Mas mataas ang naitalang perang pumasok kaysa sa gastos sa napiling panahon.',
  'Your recorded expenses are higher than income for the selected period.':
    'Mas mataas ang naitalang gastos kaysa sa perang pumasok sa napiling panahon.',
  'Your recorded income and expenses are balanced for the selected period.':
    'Magkapantay ang naitalang perang pumasok at gastos sa napiling panahon.',
  'Your recorded income is higher than expenses this month.': 'Mas mataas ang naitalang pumasok na pera kaysa sa gastos ngayong buwan.',
  'Your recorded expenses are higher than income this month.': 'Mas mataas ang naitalang gastos kaysa sa pumasok na pera ngayong buwan.',
  'Your recorded income and expenses are balanced this month.': 'Magkapantay ang naitalang pumasok na pera at gastos ngayong buwan.',
  'Selected day': 'Napiling araw',
  'No activity or events for this day.': 'Walang aktibidad o gastusin sa araw na ito.',
  'Cash flow': 'Galaw ng pera',
  'Select a period for cash flow and savings; category spending below is for this month.':
    'Pumili ng panahon para sa galaw ng pera at ipon; ngayong buwan lang ang gastos ayon sa kategorya sa ibaba.',
  'This week': 'Ngayong linggo',
  'This year': 'Ngayong taon',
  '1 week': '1 linggo',
  Monthly: 'Buwanan',
  'Monthly spending': 'Gastos ngayong buwan',
  'Weekly spending': 'Gastos ngayong linggo',
  'Yearly spending': 'Gastos ngayong taon',
  'Spending by category': 'Gastos ayon sa kategorya',
  'Where your money is going': 'Kung saan napupunta ang pera mo',
  'Where your money is going this month': 'Kung saan napupunta ang pera mo ngayong buwan',
  Event: 'Gastusin',
  'Your insights will grow here': 'Lalabas dito ang buod ng iyong paggastos',
  'Record income and expenses to see your spending breakdown.': 'Magtala ng perang pumasok at mga gastos para makita ang buod ng paggastos.',
  'MONTHLY BALANCE': 'BALANSE NG BUWAN',
  'Good morning': 'Magandang umaga',
  'Good afternoon': 'Magandang hapon',
  'Good evening': 'Magandang gabi',
  'Hi, ': 'Kumusta, ',
  'there': 'kaibigan',
  'New transaction': 'Bagong transaksyon',
  'Add transaction': 'Idagdag ang transaksyon',
  'Choose what you want to record.': 'Piliin kung ano ang gusto mong itala.',
  'Income and expense forms are ready below.': 'Nasa ibaba ang mga form para sa kita at gastos.',
  'Add Income': 'Magtala ng kita',
  'Add Expense': 'Magtala ng gastos',
  'Record money received': 'Itala ang perang natanggap',
  'Record money spent': 'Itala ang perang nagastos',
  'Edit transaction': 'I-edit ang transaksyon',
  'Tap to edit this transaction': 'Pindutin para i-edit ang transaksyong ito',
  Expense: 'Gastos',
  Category: 'Kategorya',
  Source: 'Pinagmulan',
  Amount: 'Halaga',
  Date: 'Petsa',
  Description: 'Paglalarawan',
  'What was this for?': 'Para saan ito?',
  'Choose e-wallet': 'Pumili ng e-wallet',
  '+ Add another': '+ Magdagdag pa',
  Cancel: 'Kanselahin',
  Add: 'Idagdag',
  'Enter e-wallet name': 'Ilagay ang pangalan ng e-wallet',
  'Choose an e-wallet': 'Pumili ng e-wallet',
  'Select an e-wallet or add a new one before saving.': 'Pumili o magdagdag ng e-wallet bago i-save.',
  'Check the amount': 'Suriin ang halaga',
  'Enter an amount greater than zero.': 'Maglagay ng halagang higit sa zero.',
  'Choose a category': 'Pumili ng kategorya',
  'Select a category before saving.': 'Pumili ng kategorya bago i-save.',
  'Check the date': 'Suriin ang petsa',
  'Use the date format YYYY-MM-DD.': 'Gamitin ang format na YYYY-MM-DD.',
  'Could not save transaction': 'Hindi na-save ang transaksyon',
  'Could not add e-wallet': 'Hindi naidagdag ang e-wallet',
  'Unable to load e-wallet choices': 'Hindi ma-load ang mga pagpipilian sa e-wallet',
  'PHP PESO': 'PISO',
  'Warn me when balance is below': 'Babalaan ako kapag mas mababa sa',
  'Save warning': 'I-save ang babala',
  'Add income and expenses to see when your balance reaches your warning amount.': 'Magtala ng perang pumasok at mga gastos para malaman kung kailan maaabot ng balanse mo ang itinakdang babala.',
  'Device compatibility': 'Pagkakatugma ng device',
  'NPU detected': 'May nakitang NPU',
  'ARM64 Android required': 'Kailangan ng ARM64 Android',
  'More storage needed': 'Kailangan ng mas maraming storage',
  'Device compatible': 'Compatible ang device',
  'More total RAM required': 'Kailangan ng mas malaking RAM',
  'Estimated at ~4 characters per token until the AI reports real numbers.': 'Tinatayang 4 na character kada token hangga’t hindi nagbibigay ng aktuwal na bilang ang AI.',
  'Reported by the AI after its last reply.': 'Iniulat ng AI pagkatapos ng huli nitong sagot.',
  ' tokens used': ' token ang nagamit',
  'About ': 'Tinatayang ',
  'e.g. Birthday': 'hal. Kaarawan',
  'BACK to Home': 'Bumalik sa Tahanan',
  'Back to Home': 'Bumalik sa Tahanan',
  'AI Chat': 'AI na Chat',
  'Month view': 'Tanaw sa buwan',
  'Expenses this month': 'Mga gastos ngayong buwan',
  'Income this month': 'Perang pumasok ngayong buwan',
  'This month’s remaining money is ': 'Ang natitirang pera ngayong buwan ay ',
  'HISTORY': 'KASAYSAYAN',
  'Calculated on this device from transactions dated this month.': 'Kinuwenta sa device na ito mula sa mga transaksyong naitala ngayong buwan.',
  'Previous month': 'Nakaraang buwan',
  'Next month': 'Susunod na buwan',
  'Your daily money activity': 'Araw-araw mong galaw ng pera',
  'Close': 'Isara',
  'Mark all notifications as read': 'Markahang nabasa ang lahat ng abiso',
  'You’re all caught up': 'Wala ka nang hindi nababasang update',
  'No notifications yet.': 'Wala pang mga abiso.',
  'No recent activity yet.': 'Wala pang kamakailang aktibidad.',
  'Estimated cost (PHP)': 'Tinatayang halaga (PHP)',
  'You can save the estimate even if it is higher than your current wallet balance.':
    'Maaari mong i-save ang tantiya kahit mas mataas ito sa kasalukuyang laman ng wallet mo.',
  'Event name': 'Pangalan ng gastusin',
  'Cost name': 'Pangalan ng gastusin',
  ' saved of ': ' naipon sa layuning ',
  'Top spending': 'Pinakamalaking gastos',
  'Personal notes': 'Mga paalala para sa iyo',
  'This is an offline AI assistant.': 'Isa itong AI assistant na gumagana offline.',
  'Clear chat': 'Burahin ang chat',
  'Cloud AI (Gemini)': 'Cloud AI (Gemini)',
  'Local AI': 'AI sa device',
  'Needs internet and a free API key': 'Kailangan ng internet at libreng API key',
  'Runs on the phone, works offline': 'Tumatakbo sa telepono at gumagana offline',
  'Auto (best available)': 'Awtomatiko (pinakamahusay na available)',
  'Switches automatically if a model is limited.': 'Awtomatikong nagpapalit kung limitado ang modelo.',
  'Get API key': 'Kumuha ng API key',
  'Paste your API key': 'I-paste ang iyong API key',
  'Status: ': 'Katayuan: ',
  'Attach image': 'Mag-attach ng larawan',
  'Remove image': 'Alisin ang larawan',
  'Discard recording': 'Itapon ang recording',
  'Start with one small step': 'Magsimula sa maliit na hakbang',
  'Record income and expenses to get useful observations for ': 'Magtala ng perang pumasok at mga gastos para makakuha ng kapaki-pakinabang na buod para sa ',
  'Add expenses in both periods to see how your spending changes over time.': 'Magtala ng mga gastos sa dalawang panahon para makita kung paano nagbabago ang paggastos mo.',
  'These are general observations, not financial advice. Check your records and decide what works for you.': 'Pangkalahatang obserbasyon ito, hindi payong pinansyal. Suriin ang mga tala mo at piliin kung ano ang angkop sa iyo.',
  'You recorded ': 'Nagtala ka ng ',
  ' income and ': ' na perang pumasok at ',
  ' expenses ': ' na gastos ',
  ' in ': ' sa ',
  ' vs ': ' kumpara sa ',
  ' in the previous period.': ' sa nakaraang panahon.',
  ' of spending': ' ng kabuuang gastos',
  ' · ': ' · ',
  'History stays saved': 'Nananatili ang kasaysayan',
  'This deletes all chats, transactions, emergency-fund savings, upcoming events, settings, notification status, API key and the downloaded local model. The app will start again from onboarding.':
    'Buburahin nito ang lahat ng chat, transaksyon, ipon sa pondong pang-emergency, paparating na gastusin, setting, katayuan ng mga abiso, API key, at na-download na local model. Magsisimula muli ang app sa onboarding.',
  'messages).': 'mensahe).',
  'Messages': 'Mga mensahe',
  'Loading your ledger…': 'Nilo-load ang talaan ng pera mo…',
  'Income recorded': 'Naitalang perang pumasok',
  'Expense recorded': 'Naitalang gastos',
  'Your money data stays on this device': 'Nananatili sa device na ito ang datos ng pera mo',
  'Add a transaction': 'Magdagdag ng transaksyon',
  'Add expense': 'Magdagdag ng gastos',
  'Add income': 'Magtala ng perang pumasok',
  'Track your income': 'Subaybayan ang perang pumapasok',
  'Skip intro': 'Laktawan ang pagpapakilala',
  'Add your first transaction': 'Idagdag ang una mong transaksyon',
  'Record your allowance or first school expense to see your balance and insights here.':
    'Itala ang baon o unang gastos sa paaralan para makita rito ang balanse at mga buod mo.',
  'Delete all recent activity': 'Burahin ang lahat ng kamakailang aktibidad',
  'Delete all recent activity?': 'Burahin ang lahat ng kamakailang aktibidad?',
  'This permanently deletes the recent transactions shown on Home. This cannot be undone. Deleting emergency-fund entries also changes your emergency-fund balance.':
    'Permanenteng buburahin nito ang mga kamakailang transaksyong nakalista sa Home. Hindi ito maibabalik. Babaguhin din ng pagbura sa mga transaksyong mula sa pondong pang-emergency ang balanse nito.',
  'Unable to delete recent activity': 'Hindi mabura ang mga kamakailang aktibidad',
  'Permanently deletes the recent transactions shown on Home and updates your emergency-fund balance':
    'Permanenteng binubura ang mga kamakailang transaksyon sa Home at ina-update ang balanse ng pondong pang-emergency',
  'Manage your student budget': 'Pamahalaan ang badyet mo bilang estudyante',
  'Start tracking your money': 'Simulan ang pagsubaybay sa pera mo',
  'MY MONEY': 'PERA KO',
  'Track your spending': 'Subaybayan ang mga gastos mo',
  'See all': 'Tingnan lahat',
  'Your latest allowance and spending': 'Pinakahuli mong baon at mga gastos',
  'Your allowance and school spending will show up here.': 'Lalabas dito ang baon at mga gastos mo sa paaralan.',
  'No recent activity. Your transactions are still saved in History.': 'Walang kamakailang aktibidad. Naka-save pa rin sa Kasaysayan ang iyong mga transaksyon.',
  'Very low balance': 'Napakababa na ng balanse',
  'Low-cash warning': 'Babala: kaunti na ang pera',
  'Money running low': 'Kakaunti na ang natitirang pera',
  'Your income minus expenses this month': 'Perang pumasok bawas ang mga gastos ngayong buwan',
  'Delete transaction?': 'Burahin ang transaksyon?',
  Delete: 'Burahin',
  'LOW-CASH ALERT': 'BABALA: KAUNTI NA ANG PERA',
  'Money is running very low': 'Halos maubos na ang pera',
  'Got it': 'Naintindihan',
  'Alert settings': 'Mga setting ng babala',
  'Choose when to warn you that this month’s money is running low.': 'Piliin kung kailan ka bibigyan ng babala na paubos na ang pera ngayong buwan.',
  REMAINING: 'NATITIRA',
  'Saving alert…': 'Sine-save ang babala…',
  'Alert when this month’s remaining balance falls below this percentage of this month’s income.': 'Magbigay ng babala kapag bumaba sa porsiyentong ito ng kita ngayong buwan ang natitirang balanse.',
  'Notifications': 'Mga abiso',
  'Your money updates': 'Mga update tungkol sa pera mo',
  'Mark all as read': 'Markahang nabasa lahat',
  'New money updates and upcoming events will show here.': 'Lalabas dito ang mga bagong update at paparating na gastusin.',
  'On-device updates · no push notifications': 'Mga update sa device · walang push notification',
  'Money received': 'May natanggap na pera',
  'Close notifications': 'Isara ang mga abiso',
  'Current savings: ': 'Kasalukuyang ipon: ',
  'Add money (PHP)': 'Magdagdag ng pera (PHP)',
  Optional: 'Opsyonal',
  Save: 'I-save',
  'Date (YYYY-MM-DD)': 'Petsa (YYYY-MM-DD)',
  'Enter a valid date today or later.': 'Maglagay ng wastong petsa ngayon o sa hinaharap.',
  'Could not add event': 'Hindi naidagdag ang gastusin',
  'STUDENT MONEY GUIDE': 'GABAY SA PERA NG ESTUDYANTE',
  'Friendly tips to help you manage your allowance, school costs, and savings.': 'Mga payo para mapamahalaan ang baon, gastusin sa paaralan, at ipon mo.',
  'Talk through your money goals': 'Pag-usapan natin ang mga layunin mo sa pera',
  'Ask about your spending, allowance, budget, or ways to save. Your coach uses a summary of your ledger.': 'Magtanong tungkol sa mga gastos, baon, badyet, o paraan ng pag-iipon. Buod ng talaan mo ang gagamitin ng gabay.',
  'Chat with AI Coach': 'Makipag-chat sa AI Coach',
  'Back to AI Coach': 'Bumalik sa AI Coach',
  'Back to Offline Coach': 'Bumalik sa Offline Coach',
  'Let’s make your money make sense': 'Unawain natin ang galaw ng pera mo',
  'Ask about your spending, allowance, budget, or savings. Your coach can only use the summary shown above.': 'Magtanong tungkol sa mga gastos, baon, badyet, o ipon. Buod lang na nasa itaas ang magagamit ng gabay mo.',
  'Your ledger summary and chat are sent to Gemini.': 'Ipinapadala sa Gemini ang buod ng talaan at chat mo.',
  'Your ledger summary and chat stay on this device with Local AI.': 'Nananatili sa device na ito ang buod ng talaan at chat mo kapag Local AI ang gamit.',
  'The ledger summary could not load. Go back to AI Coach and reopen the chat to try again.': 'Hindi na-load ang buod ng talaan. Bumalik sa AI Coach at buksan muli ang chat para subukan ulit.',
  'Saan ako pinakamaraming gumastos?': 'Saan ako pinakamaraming gumastos?',
  'Tulungan akong mag-budget': 'Tulungan akong mag-budget',
  'Paano ako makakaipon?': 'Paano ako makakaipon?',
  'Where did I spend most?': 'Saan ako pinakamaraming gumastos?',
  'Help me make a budget': 'Tulungan akong gumawa ng badyet',
  'How can I save?': 'Paano ako makakaipon?',
  'Insights calculated on your device': 'Kinuwenta sa device mo ang buod na ito',
  'Choose a period to review your allowance and spending': 'Pumili ng panahon para makita ang baon at mga gastos mo',
  'Last 7 days': 'Nakaraang 7 araw',
  'This month': 'Ngayong buwan',
  'NET THIS WEEK': 'NETO NGAYONG LINGGO',
  'Your period comparison': 'Paghahambing ng panahon',
  'Spending is unchanged': 'Hindi nagbago ang gastos',
  'On device': 'Nasa device',
  'Track your allowance or earnings too': 'Itala rin ang baon o kinikita mo',
  'Take a closer look at recent spending': 'Suriing mabuti ang mga kamakailang gastos',
  'Nice work keeping spending in view': 'Magaling at nababantayan mo ang mga gastos',
  'Expenses exceed recorded income': 'Mas mataas ang gastos kaysa sa naitalang kita',
  'Food': 'Pagkain',
  'Transport': 'Pamasahe',
  'School supplies': 'Gamit sa paaralan',
  'Projects & printing': 'Proyekto at pagpapalimbag',
  'Tuition & school fees': 'Matrikula at bayarin sa paaralan',
  'Load & data': 'Load at data',
  'Personal care': 'Pangangalaga sa sarili',
  'Entertainment': 'Libangan',
  'Savings': 'Ipon',
  'Other': 'Iba pa',
  'Baon': 'Baon',
  'Allowance': 'Baon',
  'Part-time job': 'Part-time na trabaho',
  'E-wallet': 'E-wallet',
  'School supplies, transport, or daily food costs contributed.': 'Gamit sa paaralan, pamasahe, o pagkain araw-araw ang maaaring nakaapekto.',
  'Calendar': 'Kalendaryo',
  'result': 'resulta',
  'results': 'mga resulta',
  'Exported': 'Na-export ang',
  'transactions to CSV.': 'transaksyon sa CSV.',
  'Could not export transaction history.': 'Hindi na-export ang kasaysayan ng transaksyon.',
  'Restore transaction history?': 'Ibalik ang kasaysayan ng transaksyon?',
  'Restored': 'Naibalik ang',
  'Could not restore transaction history.': 'Hindi naibalik ang kasaysayan ng transaksyon.',
  'Could not read the CSV file.': 'Hindi mabasa ang CSV file.',
  'Clear transaction history?': 'Burahin ang kasaysayan ng transaksyon?',
  'Transaction history cleared and emergency fund reset.': 'Nabura ang kasaysayan ng transaksyon at na-reset ang pondong pang-emergency.',
  'Could not clear transaction history.': 'Hindi nabura ang kasaysayan ng transaksyon.',
  'What should we call you?': 'Anong gusto mong itawag namin sa iyo?',
  'Pick a nickname. You can change it later in Settings.': 'Ilagay ang pangalan o palayaw na gusto mo. Puwede mo itong palitan sa Mga Setting.',
  'Your student budget, made clearer': 'Mas madaling makita ang galaw ng pera mo',
  'Track your allowance, earnings, and everyday school expenses in one simple ledger.': 'Ilagay dito ang baon, kinikita, at araw-araw na gastos mo sa school.',
  'Offline first': 'Gumagana kahit walang internet',
  'Your student budget and insights stay on this phone and work without internet.': 'Nasa phone mo ang mga inilagay mong gastos at kita. Magagamit mo ang app kahit walang internet.',
  'Helpful student money insights': 'Tulong sa pag-aayos ng pera mo',
  'The offline Coach uses your saved money records for recommendations. No model download or internet is needed.': 'Gumagamit ang offline na Coach ng mga naitala mong impormasyon tungkol sa pera para magmungkahi. Hindi kailangan ng model download o internet.',
  Back: 'Bumalik',
  Skip: 'Laktawan',
  Continue: 'Magpatuloy',
  Next: 'Susunod',
  'Could not finish setup': 'Hindi natapos ang pag-set up',
  'Effective ': 'May bisa mula ',
  'Saving…': 'Sine-save…',
  Agree: 'Sumang-ayon',
  'Scroll to the bottom to agree': 'Mag-scroll sa pinakailalim para sumang-ayon',
  AI: 'AI',
  'AI provider': 'Tagapagbigay ng AI',
  Auto: 'Awtomatiko',
  'Uses detected hardware and total RAM': 'Ginagamit ang nakitang hardware at kabuuang RAM',
  'Detected accelerator; CPU backup': 'Natukoy na accelerator; may CPU backup',
  'OpenCL GPU detected; CPU backup': 'Natukoy ang OpenCL GPU; may CPU backup',
  'Compatible processor': 'Katugmang processor',
  'System prompt': 'Mga tagubilin sa AI',
  'You are a helpful assistant.': 'Ikaw ay isang matulunging assistant.',
  Saved: 'Na-save',
  'API key': 'API key',
  Model: 'Modelo',
  'Inference backend': 'Paraan ng pagproseso',
  'Ready to send': 'Handa nang ipadala',
  Image: 'Larawan',
  'Explain a topic': 'Ipaliwanag ang isang paksa',
  'Quiz me': 'Bigyan ako ng pagsusulit',
  'Plan my study week': 'Planuhin ang linggo ng pag-aaral',
  'Improve my writing': 'Pagandahin ang aking pagsulat',
  'About Expense Tracker': 'Tungkol sa Expense Tracker',
  'Track your money every day': 'Subaybayan ang pera mo araw-araw',
  'Information stored on your device': 'Impormasyong naka-save sa iyong device',
  'AI features and third-party services': 'Mga feature ng AI at serbisyo ng ibang kumpanya',
  'Exports and backups': 'Mga export at backup',
  'Your choices and data removal': 'Mga pagpipilian mo at pagbura ng data',
  'Children and policy changes': 'Mga bata at pagbabago sa patakaran',
  Acceptance: 'Pagsang-ayon',
  'What the app does': 'Mga ginagawa ng app',
  'Your records and responsibility': 'Mga tala at pananagutan mo',
  'Optional AI and external services': 'Opsyonal na AI at mga panlabas na serbisyo',
  'Acceptable use and availability': 'Tamang paggamit at availability',
  Changes: 'Mga pagbabago',
  'Expense Tracker is an offline-first budgeting app designed for students to record allowance and other income, school and everyday expenses, savings, and upcoming costs. The app does not require an account or operate its own server. Your ledger is stored on your device.':
    'Ang Expense Tracker ay isang budgeting app na maaaring gamitin offline at ginawa para sa mga estudyante. Dito maaaring itala ang baon at iba pang kita, gastusin sa paaralan at araw-araw, ipon, at mga paparating na gastusin. Hindi kailangan ng account at wala itong sariling server. Nasa iyong device ang talaan ng pera mo.',
  'Ledger records can include transaction dates, amounts, categories, and descriptions. The app also stores your emergency-fund balance and goal, upcoming event names, dates and estimated costs, and app preferences such as your nickname and theme.':
    'Maaaring kasama sa mga tala ang petsa, halaga, kategorya, at paglalarawan ng transaksyon. Naka-save din sa app ang balanse at layunin ng pondong pang-emergency, pangalan at petsa ng mga paparating na gastusin at ang tantiya ng halaga ng mga ito, pati mga pinili mo gaya ng palayaw at tema.',
  'If you use chat, your conversations and attached files are stored in the app on your device. If you choose Local AI, the downloaded model is also stored on your device.':
    'Kung gagamit ka ng chat, naka-save sa app at device mo ang mga usapan at naka-attach na file. Kung Local AI ang pipiliin mo, naka-save rin sa device ang na-download na modelo.',
  'The app does not automatically send your ledger, emergency-fund details, or upcoming events to an AI service.':
    'Hindi awtomatikong ipinapadala ng app sa AI service ang talaan mo, detalye ng pondong pang-emergency, o mga paparating na gastusin.',
  'AI Coach spending summaries and tips are calculated on your device from your ledger records.':
    'Kinukuwenta sa device mo ang mga buod at payo ng AI Coach batay sa mga tala sa ledger.',
  'If you choose Cloud AI and send a chat message, the message and information needed to generate a reply are sent to the AI provider you selected. The provider handles that information under its own privacy terms. Do not include sensitive financial or personal information in cloud chats.':
    'Kung Cloud AI ang pipiliin mo at magpadala ka ng mensahe sa chat, ipapadala sa napili mong AI provider ang mensahe at impormasyong kailangan para makasagot ito. Pinangangasiwaan ng provider ang impormasyong iyon ayon sa sarili nitong patakaran sa privacy. Huwag maglagay ng sensitibong impormasyong pinansyal o personal sa cloud chat.',
  'If you choose Local AI, chat messages are processed on your device. Downloading a local model requires an internet connection to the download host, which may receive standard connection information such as your IP address.':
    'Kung Local AI ang pipiliin mo, pinoproseso sa device mo ang mga mensahe sa chat. Kailangan ng internet para ma-download ang modelo. Maaaring makatanggap ang download host ng karaniwang impormasyon sa koneksyon gaya ng IP address mo.',
  'You can export transaction history to a CSV file or create an app backup file. Exported files may contain personal financial records. You choose where to save or share them, and anyone with access to a file may be able to read its contents.':
    'Maaari mong i-export sa CSV ang kasaysayan ng transaksyon o gumawa ng backup ng app. Maaaring maglaman ang mga file na ito ng personal na tala sa pananalapi. Ikaw ang pipili kung saan ise-save o ibabahagi ang mga ito; maaaring mabasa ng sinumang may access sa file ang laman nito.',
  'The app backup includes chat and settings data but does not include your API key, attached files, local model, or ledger transaction history. Transaction history can be exported separately as CSV.':
    'Kasama sa backup ng app ang chat at settings ngunit hindi ang API key, mga naka-attach na file, local model, o kasaysayan ng mga transaksyon sa ledger. Maaari mong i-export nang hiwalay sa CSV ang kasaysayan ng transaksyon.',
  'You can delete individual transactions, clear transaction history, reset app data, or uninstall the app. Clearing transaction history also resets the emergency-fund balance and goal. Files exported or shared outside the app must be removed separately.':
    'Maaari mong burahin ang mga piling transaksyon, buong kasaysayan ng transaksyon, lahat ng data ng app, o i-uninstall ang app. Kapag binura ang kasaysayan ng transaksyon, mare-reset din ang balanse at layunin ng pondong pang-emergency. Kailangan mong hiwalay na burahin ang mga file na na-export o ibinahagi sa labas ng app.',
  'Expense Tracker is not directed at children under 13. This policy may be updated; the effective date above shows when it was last revised.':
    'Hindi ginawa ang Expense Tracker para sa mga batang wala pang 13 taong gulang. Maaaring baguhin ang patakarang ito; ipinapakita sa itaas ang petsa ng pinakahuling pagbabago.',
  'Use of the app': 'Paggamit sa app',
  'These terms describe the app and the conditions for using it. You can review them anytime in Settings.':
    'Inilalarawan ng mga tuntuning ito ang app at ang mga kundisyon sa paggamit nito. Mababasa mo ulit ang mga ito anumang oras sa Settings.',
  'Expense Tracker helps students record allowance and other income, track school and everyday expenses, set a savings goal, plan upcoming costs, review spending summaries, and optionally use AI chat features.':
    'Tinutulungan ng Expense Tracker ang mga estudyante na magtala ng baon at iba pang kita, subaybayan ang mga gastusin sa paaralan at araw-araw, magtakda ng layunin sa pag-iipon, magplano ng mga paparating na gastusin, sumuri ng buod ng paggastos, at gumamit ng AI chat kung nanaisin.',
  'The app stores ledger information on your device. It does not connect to your bank, move money, or make payments. The Pay button for an upcoming event records the estimated cost as an expense in the ledger; you must make any real-world payment separately.':
    'Nasa device mo ang impormasyon sa ledger. Hindi kumokonekta ang app sa bangko mo, naglilipat ng pera, o nagbabayad. Itinatala lamang ng button na Pay para sa paparating na gastusin ang tinatayang halaga bilang gastos sa ledger. Ikaw mismo ang kailangang magbayad sa totoong buhay.',
  'You are responsible for entering accurate records and reviewing them before making financial decisions. Balances and summaries are calculated from the information recorded in the app and may not reflect your actual bank balance.':
    'Responsibilidad mong maglagay ng tumpak na tala at suriin ang mga ito bago magpasya tungkol sa pera. Kinukuwenta ang mga balanse at buod mula sa impormasyong inilagay sa app at maaaring hindi katumbas ng totoong balanse sa bangko mo.',
  'AI-generated tips and chat replies are informational only, may be inaccurate or incomplete, and are not financial, legal, tax, or other professional advice. Use your own judgment and consult a qualified professional when appropriate.':
    'Impormasyon lamang ang mga payo at sagot na ginawa ng AI; maaaring hindi tumpak o kumpleto ang mga ito at hindi ito propesyonal na payong pinansyal, legal, ukol sa buwis, o iba pa. Gamitin ang sarili mong pagpapasya at kumonsulta sa kwalipikadong propesyonal kung kinakailangan.',
  'You are responsible for keeping copies of any exported records you need. Deleted or lost local data and files cannot necessarily be recovered.':
    'Responsibilidad mong magtago ng kopya ng mga na-export na tala na kailangan mo. Maaaring hindi na maibalik ang nabura o nawalang data at mga file sa device.',
  'Cloud AI and local model downloads may rely on third-party services. If you use them, their availability and handling of information are governed by their own terms and policies.':
    'Maaaring umasa sa serbisyo ng ibang kumpanya ang Cloud AI at pag-download ng local model. Kung gagamitin mo ang mga ito, sarili nilang tuntunin at patakaran ang masusunod sa availability at pangangasiwa nila sa impormasyon.',
  'You are responsible for the use and security of any API key you provide and for any third-party usage limits or charges that may apply.':
    'Responsibilidad mong pangalagaan at gamitin nang maayos ang anumang API key na ibibigay mo, pati ang anumang limitasyon o singil mula sa third-party service.',
  'Use the app lawfully and do not interfere with its operation or use it to violate another person’s rights. Features may change, and the app is provided without a guarantee of uninterrupted availability or error-free calculations.':
    'Gamitin ang app ayon sa batas. Huwag gambalain ang pagpapatakbo nito o gamitin ito upang labagin ang karapatan ng iba. Maaaring magbago ang mga feature at hindi ginagarantiya na palaging gagana ang app o walang magiging pagkakamali sa mga kalkulasyon.',
  'These terms may be revised. The effective date above shows when they were last updated. If a revision requires renewed acceptance, the app will ask you to agree before continuing.':
    'Maaaring baguhin ang mga tuntuning ito. Ipinapakita sa itaas ang petsa ng pinakahuling pagbabago. Kung kailangan ng panibagong pagsang-ayon, hihilingin ito ng app bago ka magpatuloy.',
  'Recent activity': 'Kamakailang aktibidad',
  'Ask your AI Coach': 'Magtanong sa AI Coach',
  'Something went wrong': 'Nagkaproblema',
};

export function translate(language: AppLanguage, text: string): string {
  if (language !== 'tl') return text;
  const exact = TAGALOG[text];
  if (exact) return exact;
  const normalized = text.trim().replace(/\s+/g, ' ');
  const normalizedTranslation = TAGALOG[normalized];
  if (normalizedTranslation) {
    const leading = text.match(/^\s*/)?.[0] ?? '';
    const trailing = text.match(/\s*$/)?.[0] ?? '';
    return `${leading}${normalizedTranslation}${trailing}`;
  }

  let match = text.match(/^Spending is up (\d+)%$/);
  if (match) return `Tumaas ng ${match[1]}% ang gastos`;
  match = text.match(/^Spending is down (\d+)%$/);
  if (match) return `Bumaba ng ${match[1]}% ang gastos`;
  match = text.match(/^(.+) is your top expense$/);
  if (match) return `${TAGALOG[match[1]] ?? match[1]} ang pinakamalaki mong gastos`;
  match = text.match(/^(\d+)% of recorded income remains$/);
  if (match) return `${match[1]}% ng naitalang kita ang natitira`;
  match = text.match(/^Exported (\d+) transactions? to CSV\.$/);
  if (match) return `Na-export ang ${match[1]} transaksyon sa CSV.`;
  match = text.match(/^Restored (\d+) transactions?\.$/);
  if (match) return `Naibalik ang ${match[1]} transaksyon.`;
  match = text.match(/^Backup created \((\d+) messages?\)\.$/);
  if (match) return `Nagawa ang backup (${match[1]} mensahe).`;
  match = text.match(/^ It’s at or below your (\d+)% alert level\.$/);
  if (match) return ` Nasa o mas mababa ito sa antas ng babala mong ${match[1]}%.`;
  match = text.match(/^ Your monthly alert is set for (\d+)%\.$/);
  if (match) return ` Nakatakda ang buwanang babala mo sa ${match[1]}%.`;
  match = text.match(/^You have (.+) left this month \((\d+)% of this month’s income\)\. Consider checking your remaining expenses\.$/);
  if (match) return `May natitira kang ${match[1]} ngayong buwan (${match[2]}% ng kita ngayong buwan). Suriin ang mga natitira mong gastusin.`;
  match = text.match(/^Current savings: (.+?)(?: of (.+) goal)?$/);
  if (match) return `Kasalukuyang ipon: ${match[1]}${match[2] ? ` sa layuning ${match[2]}` : ''}`;
  match = text.match(/^Your current balance is (.+), which is at or below your warning amount\.$/);
  if (match) return `Ang kasalukuyan mong balanse ay ${match[1]}, na kapantay o mas mababa sa itinakdang halaga ng babala.`;
  match = text.match(/^Your current balance is (.+)\. You’ll be warned when it reaches your limit\.$/);
  if (match) return `Ang kasalukuyan mong balanse ay ${match[1]}. Bibigyan ka ng babala kapag umabot ito sa limitasyon mo.`;
  match = text.match(/^Default warning amount: (.+)$/);
  if (match) return `Default na halaga ng babala: ${match[1]}`;
  match = text.match(/^Room left: (.+) tokens$/);
  if (match) return `Natitirang espasyo: ${match[1]} token`;
  match = text.match(/^About (.+)$/);
  if (match) return `Tinatayang ${match[1]}`;
  match = text.match(/^(.+) · (₱.+)\. This cannot be undone\.$/);
  if (match) return `${TAGALOG[match[1]] ?? match[1]} · ${match[2]}. Hindi na ito maibabalik.`;
  match = text.match(/^(.+) · ([+-].+) · (.+)$/);
  if (match) return `${TAGALOG[match[1]] ?? match[1]} · ${match[2]} · ${match[3]}`;
  match = text.match(/^Remove (.+) from your event list\?$/);
  if (match) return `Alisin ang ${match[1]} sa listahan ng mga event?`;
  match = text.match(/^This will not send money\. It will record (.+) for (.+) as an expense and remove the event from your event list\.$/);
  if (match) return `Hindi ito magpapadala ng pera. Itatala nito ang ${match[1]} para sa ${match[2]} bilang gastos at aalisin ito sa listahan ng mga event.`;
  match = text.match(/^This permanently deletes all (\d+) transactions and resets your emergency fund balance and goal\. Events will remain\. This cannot be undone\.$/);
  if (match) return `Permanenteng buburahin nito ang lahat ng ${match[1]} transaksyon at ire-reset ang balanse at layunin ng pondong pang-emergency. Mananatili ang mga event. Hindi na ito maibabalik.`;
  match = text.match(/^This replaces your current chat and settings with the backup from (.+) \((\d+) messages\)\.$/);
  if (match) return `Papalitan nito ang kasalukuyan mong chat at settings ng backup mula ${match[1]} (${match[2]} mensahe).`;
  match = text.match(/^Savings goal · current (.+)$/);
  if (match) return `Layunin sa pag-iipon · kasalukuyan: ${match[1]}`;
  match = text.match(/^ of (.+) goal$/);
  if (match) return ` sa layuning ${match[1]}`;
  match = text.match(/^ of (.+)$/);
  if (match) return ` mula sa ${match[1]}`;
  match = text.match(/^Effective (.+)$/);
  if (match) return `May bisa mula ${match[1]}`;
  match = text.match(/^Based on (the last 7 days|this month)$/);
  if (match) return `Batay sa ${match[1] === 'this month' ? 'buwang ito' : 'nakaraang 7 araw'}`;
  match = text.match(/^(.+) in (the last 7 days|this month) vs (.+) in the previous period\.$/);
  if (match) return `${match[1]} sa ${match[2] === 'this month' ? 'buwang ito' : 'nakaraang 7 araw'} kumpara sa ${match[3]} noong nakaraang panahon.`;
  match = text.match(/^Record income and expenses to get useful observations for (the last 7 days|this month)\.$/);
  if (match) return `Magtala ng perang pumasok at mga gastos para makakuha ng kapaki-pakinabang na buod para sa ${match[1] === 'this month' ? 'buwang ito' : 'nakaraang 7 araw'}.`;
  match = text.match(/^(.+) is (\d+)% of your spending (the last 7 days|this month)\. Reviewing a few entries in this category may help find patterns\.$/);
  if (match) return `${match[1]} ay ${match[2]}% ng gastos mo nitong ${match[3] === 'this month' ? 'buwan' : 'nakaraang 7 araw'}. Makakatulong ang pagsusuri sa ilang tala para makita ang mga pattern.`;
  match = text.match(/^You recorded (.+) income and (.+) expenses (the last 7 days|this month)\. The remaining amount is (.+)\.$/);
  if (match) return `Nagtala ka ng ${match[1]} na perang pumasok at ${match[2]} na gastos nitong ${match[3] === 'this month' ? 'buwan' : 'nakaraang 7 araw'}. ${match[4]} ang natitira.`;
  match = text.match(/^You have (.+) in recorded spending (the last 7 days|this month)\. Add your baon, part-time earnings, or e-wallet income to see what remains\.$/);
  if (match) return `May ${match[1]} kang naitalang gastos nitong ${match[2] === 'this month' ? 'buwan' : 'nakaraang 7 araw'}. Idagdag ang baon, kita sa part-time na trabaho, o kita sa e-wallet para makita ang matitira.`;
  match = text.match(/^Spending is (.+) higher than the previous period\. Check whether school supplies, transport, or daily food costs contributed\.$/);
  if (match) return `Mas mataas ng ${match[1]} ang gastos kaysa noong nakaraang panahon. Suriin kung may naiambag dito ang gamit sa paaralan, pamasahe, o pagkain araw-araw.`;
  match = text.match(/^Spending is (.+) lower than the previous period\. Keep tracking your school and daily costs to see whether the pattern continues\.$/);
  if (match) return `Mas mababa ng ${match[1]} ang gastos kaysa noong nakaraang panahon. Ipagpatuloy ang pagtatala ng gastusin sa paaralan at araw-araw para makita kung magpapatuloy ito.`;
  return text;
}
