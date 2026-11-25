import {
  isEmergencyFundMovement,
  type EmergencyFund,
  type LedgerTransaction,
  type UpcomingEvent,
} from '@/db/ledger';
import type { MonthlyBudgetPlan } from '@/db/budgets';
import { availableBalanceThroughDate, formatDate, formatMoney, sumByType } from '@/ledger/format';
import type { AppLanguage } from '@/settings/storage';

export type OfflineCoachTopic = 'spending' | 'cashflow' | 'budget' | 'savings' | 'upcoming';

export interface OfflineCoachData {
  transactions: LedgerTransaction[];
  fund: EmergencyFund;
  events: UpcomingEvent[];
  now: Date;
  language: AppLanguage;
  budgetPlan?: MonthlyBudgetPlan;
}

export interface OfflineCoachReply {
  title: string;
  body: string;
}

export interface OfflineCoachSnapshot {
  income: number;
  expenses: number;
  monthlyNet: number;
  remaining: number;
  transactionCount: number;
  topCategory: string | null;
  topCategoryAmount: number;
  topCategoryShare: number;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthTransactions(data: OfflineCoachData): LedgerTransaction[] {
  const monthStart = dateKey(new Date(data.now.getFullYear(), data.now.getMonth(), 1));
  const nextMonthStart = dateKey(new Date(data.now.getFullYear(), data.now.getMonth() + 1, 1));
  return data.transactions.filter(
    (transaction) => transaction.transaction_date >= monthStart
      && transaction.transaction_date < nextMonthStart
  );
}

export function getOfflineCoachSnapshot(data: OfflineCoachData): OfflineCoachSnapshot {
  const monthTransactions = getMonthTransactions(data);
  const income = sumByType(monthTransactions, 'income');
  const expenses = sumByType(monthTransactions, 'expense');
  const categories = new Map<string, number>();

  for (const transaction of monthTransactions) {
    if (transaction.type === 'expense' && !isEmergencyFundMovement(transaction)) {
      categories.set(
        transaction.category,
        (categories.get(transaction.category) ?? 0) + transaction.amount
      );
    }
  }

  const [topCategory, topCategoryAmount] = [...categories]
    .sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  return {
    income,
    expenses,
    monthlyNet: income - expenses,
    remaining: availableBalanceThroughDate(data.transactions, dateKey(data.now)),
    transactionCount: monthTransactions.filter(
      (transaction) => !isEmergencyFundMovement(transaction)
    ).length,
    topCategory,
    topCategoryAmount,
    topCategoryShare: expenses > 0 ? Math.round((topCategoryAmount / expenses) * 100) : 0,
  };
}

function upcomingEvents(data: OfflineCoachData): UpcomingEvent[] {
  const today = dateKey(data.now);
  return data.events
    .filter((event) => event.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
}

export function getOfflineCoachRecommendation(data: OfflineCoachData): string {
  const snapshot = getOfflineCoachSnapshot(data);
  const events = upcomingEvents(data);
  const { language } = data;

  if (snapshot.income === 0 && snapshot.expenses === 0) {
    return language === 'tl'
      ? 'Magsimula sa pagtatala ng baon o unang gastos. Kapag may datos na, makakapagbigay ako ng mas akmang mungkahi.'
      : 'Start by recording your allowance or first expense. Once there is data, I can offer a more relevant suggestion.';
  }
  if (snapshot.income === 0) {
    return language === 'tl'
      ? `May ${formatMoney(snapshot.expenses)} kang naitalang regular na gastos ngayong buwan, pero wala pang naitalang kita. Idagdag ang baon o allowance para makita ang mas malinaw na natitira.`
      : `You have ${formatMoney(snapshot.expenses)} in regular expenses this month, but no income recorded yet. Add your baon or allowance for a clearer remaining amount.`;
  }
  if (snapshot.monthlyNet < 0) {
    return language === 'tl'
      ? `Mas mataas nang ${formatMoney(Math.abs(snapshot.monthlyNet))} ang naitalang gastos kaysa kita ngayong buwan. May ${formatMoney(snapshot.remaining)} ka pang available na regular na pera ngayon. Suriin ang pinakamalaking kategorya at mga paparating na gastusin bago magdagdag ng hindi kailangan.`
      : `Recorded expenses are ${formatMoney(Math.abs(snapshot.monthlyNet))} higher than income this month. You have ${formatMoney(snapshot.remaining)} in regular available money now. Review your largest category and upcoming costs before adding non-essential spending.`;
  }
  if (events.length > 0 && events[0].amount > 0) {
    return language === 'tl'
      ? `May paparating kang gastusin para sa ${events[0].title}, tinatayang ${formatMoney(events[0].amount)}. Isama ito sa plano bago magtakda ng halaga para sa ibang paggastos.`
      : `You have an upcoming cost for ${events[0].title}, estimated at ${formatMoney(events[0].amount)}. Include it in your plan before setting aside money for other spending.`;
  }
  if (snapshot.topCategory) {
    return language === 'tl'
      ? `${snapshot.topCategory} ang pinakamalaking kategorya ng gastos mo ngayong buwan: ${formatMoney(snapshot.topCategoryAmount)} (${snapshot.topCategoryShare}% ng naitalang regular na gastos). Suriin ang mga tala rito at pumili ng isang maliit na limitasyong susubukan.`
      : `${snapshot.topCategory} is your largest spending category this month at ${formatMoney(snapshot.topCategoryAmount)} (${snapshot.topCategoryShare}% of regular recorded expenses). Review those entries and choose one small limit to try.`;
  }
  if (data.fund.goal > data.fund.balance) {
    const remaining = data.fund.goal - data.fund.balance;
    return language === 'tl'
      ? `May ${formatMoney(data.fund.balance)} ka na sa pondong pang-emergency at ${formatMoney(remaining)} pa para maabot ang layunin. Magtabi lang ng maliit na halaga kung pasok ito sa badyet mo.`
      : `Your emergency fund has ${formatMoney(data.fund.balance)}, with ${formatMoney(remaining)} left to reach its goal. Set aside a small amount only if it fits your budget.`;
  }
  return language === 'tl'
    ? 'Positibo ang naitalang galaw ng pera mo ngayong buwan. Ipagpatuloy ang pagtatala para manatiling kapaki-pakinabang ang mga buod.'
    : 'Your recorded cash flow is positive this month. Keep tracking entries so your summaries stay useful.';
}

export function answerOfflineCoachQuestion(
  topic: OfflineCoachTopic,
  data: OfflineCoachData
): OfflineCoachReply {
  const snapshot = getOfflineCoachSnapshot(data);
  const { language } = data;

  switch (topic) {
    case 'spending':
      if (!snapshot.topCategory) {
        return language === 'tl'
          ? {
              title: 'Gastos ayon sa kategorya',
              body: 'Wala pang regular na gastos na naitala ngayong buwan. Itala ang mga gastos sa Home para makita kung saan napupunta ang pera mo.',
            }
          : {
              title: 'Spending by category',
              body: 'No regular expenses are recorded this month yet. Add expenses on Home to see where your money is going.',
            };
      }
      return language === 'tl'
        ? {
            title: 'Pinakamalaking kategorya ng gastos',
            body: `Ngayong buwan, pinakamalaki ang gastos mo sa ${snapshot.topCategory}: ${formatMoney(snapshot.topCategoryAmount)}, o ${snapshot.topCategoryShare}% ng naitalang regular na gastos. Suriin ang mga entry sa History bago magpasya kung ano ang babaguhin.`,
          }
        : {
            title: 'Your largest spending category',
            body: `This month, ${snapshot.topCategory} is your largest expense category at ${formatMoney(snapshot.topCategoryAmount)}, or ${snapshot.topCategoryShare}% of your regular recorded expenses. Review those entries in History before deciding what to change.`,
          };
    case 'cashflow':
      if (snapshot.transactionCount === 0) {
        return language === 'tl'
          ? {
              title: 'Galaw ng pera ngayong buwan',
              body: 'Wala pang kita o regular na gastos na naitala ngayong buwan. Idagdag ang baon at mga gastos para makuwenta ang natitira.',
            }
          : {
              title: 'Cash flow this month',
              body: 'No income or regular expenses are recorded this month yet. Add your baon and expenses to calculate what remains.',
            };
      }
      return language === 'tl'
        ? {
            title: 'Galaw ng pera ngayong buwan',
            body: `Naitalang kita ngayong buwan: ${formatMoney(snapshot.income)}. Regular na gastos: ${formatMoney(snapshot.expenses)}. Netong buwan: ${formatMoney(snapshot.monthlyNet)}. Magagamit ngayon: ${formatMoney(snapshot.remaining)}. Hindi kasama ang ipon sa emergency fund.`,
          }
        : {
            title: 'Cash flow this month',
          body: `This month's recorded income: ${formatMoney(snapshot.income)}. Regular expenses: ${formatMoney(snapshot.expenses)}. Monthly net: ${formatMoney(snapshot.monthlyNet)}. Available to spend today: ${formatMoney(snapshot.remaining)}. Emergency savings are excluded.`,
          };
    case 'budget': {
      const monthTransactions = getMonthTransactions(data);
      const monthlyLimit = data.budgetPlan?.totalAmount ?? null;
      const remainingLimit = monthlyLimit === null
        ? snapshot.remaining
        : Math.max(0, monthlyLimit - snapshot.expenses);
      const availableForBudget = Math.min(snapshot.remaining, remainingLimit);
      const categorySummaries = (data.budgetPlan?.categories ?? []).map(({ category, amount }) => {
        const spent = monthTransactions.reduce(
          (total, transaction) => total + (
            transaction.type === 'expense'
              && !isEmergencyFundMovement(transaction)
              && transaction.category.toLocaleLowerCase() === category.toLocaleLowerCase()
              ? transaction.amount
              : 0
          ),
          0
        );
        return language === 'tl'
          ? `${category}: ${formatMoney(Math.max(0, amount - spent))} natitira sa ${formatMoney(amount)} (nagastos ${formatMoney(spent)})`
          : `${category}: ${formatMoney(Math.max(0, amount - spent))} left of ${formatMoney(amount)} (spent ${formatMoney(spent)})`;
      });
      const budgetDetails = language === 'tl'
        ? `${monthlyLimit === null
          ? 'Wala pang naka-save na kabuuang limitasyon para sa buwan.'
          : `Naka-save na buwanang limitasyon: ${formatMoney(monthlyLimit)}; nagastos: ${formatMoney(snapshot.expenses)}; natitirang limitasyon: ${formatMoney(remainingLimit)}.`} ${
          categorySummaries.length > 0
            ? `Mga limitasyon kada kategorya: ${categorySummaries.join('; ')}.`
            : 'Wala pang naka-save na limitasyon kada kategorya.'
        }`
        : `${monthlyLimit === null
          ? 'No total monthly limit is saved.'
          : `Saved monthly limit: ${formatMoney(monthlyLimit)}; spent: ${formatMoney(snapshot.expenses)}; remaining limit: ${formatMoney(remainingLimit)}.`} ${
          categorySummaries.length > 0
            ? `Category limits: ${categorySummaries.join('; ')}.`
            : 'No category limits are saved.'
        }`;

      if (snapshot.remaining <= 0) {
        return language === 'tl'
          ? {
              title: 'Badyet para sa baon',
              body: `Wala kang available na regular na pera ngayon (${formatMoney(snapshot.remaining)}). ${budgetDetails} Suriin ang gastos bago magdagdag ng hindi kailangang bilihin.`,
            }
          : {
              title: 'Allowance budget',
              body: `You have no regular available money right now (${formatMoney(snapshot.remaining)}). ${budgetDetails} Review expenses before adding non-essential purchases.`,
            };
      }
      const daysLeft = Math.max(
        1,
        new Date(data.now.getFullYear(), data.now.getMonth() + 1, 0).getDate() - data.now.getDate() + 1
      );
      const plannedCosts = upcomingEvents(data)
        .filter((event) => event.event_date <= dateKey(new Date(data.now.getFullYear(), data.now.getMonth(), data.now.getDate() + 6)))
        .reduce((total, event) => total + event.amount, 0);
      const firstEvent = upcomingEvents(data).find((event) => event.amount > 0);
      if (firstEvent) {
        const shortfall = Math.max(0, firstEvent.amount - snapshot.remaining);
        const eventDate = new Date(`${firstEvent.event_date}T12:00:00`);
        const daysAvailable = Math.max(
          1,
          Math.ceil((eventDate.getTime() - data.now.getTime()) / 86_400_000)
        );
        if (shortfall > 0) {
          const perDay = shortfall / daysAvailable;
          return language === 'tl'
            ? {
                title: `Affordability: ${firstEvent.title}`,
                body: `Magagamit mo ngayon ay ${formatMoney(snapshot.remaining)}, pero tinatayang ${formatMoney(firstEvent.amount)} ang gastos para sa ${firstEvent.title}. Kulang ka ng ${formatMoney(shortfall)}. Kung may ${daysAvailable} araw ka pa, mag-ipon ng ${formatMoney(perDay)} kada araw upang maabot ito. Hindi kasama ang emergency savings.`,
              }
            : {
                title: `Affordability: ${firstEvent.title}`,
                body: `You have ${formatMoney(snapshot.remaining)} available now, but ${firstEvent.title} is estimated to cost ${formatMoney(firstEvent.amount)}. You are short by ${formatMoney(shortfall)}. If there are ${daysAvailable} days left, save ${formatMoney(perDay)} per day. Emergency savings are not included.`,
              };
        }
      }
      const nextPeriodBudget = availableForBudget * Math.min(7, daysLeft) / daysLeft;
      const afterPlannedCosts = nextPeriodBudget - plannedCosts;
      return language === 'tl'
        ? {
            title: 'Badyet para sa baon',
            body: `May ${formatMoney(snapshot.remaining)} kang regular na perang magagamit ngayon. ${budgetDetails} Batay sa perang magagamit at natitirang limitasyon, panatilihin sa humigit-kumulang ${formatMoney(availableForBudget / daysLeft)} bawat araw sa natitirang ${daysLeft} araw ng buwan. May ${formatMoney(plannedCosts)} na tinatayang gastusin sa Plans sa susunod na 7 araw${afterPlannedCosts < 0 ? ', kaya suriin muna ang mga iyon bago gumastos' : ''}. Tantya lang ito mula sa mga tala; isaalang-alang ang mga gastusing hindi pa nailalagay.`,
          }
        : {
            title: 'Allowance budget',
            body: `You have ${formatMoney(snapshot.remaining)} in regular money available now. ${budgetDetails} Based on your available money and remaining limit, aim for about ${formatMoney(availableForBudget / daysLeft)} per day over the remaining ${daysLeft} days of this month. Plans lists ${formatMoney(plannedCosts)} in estimated costs over the next 7 days${afterPlannedCosts < 0 ? ', so review those costs before spending' : ''}. This is an estimate from your records; account for costs you have not entered.`,
          };
    }
    case 'savings': {
      if (data.fund.goal > 0) {
        const remaining = Math.max(0, data.fund.goal - data.fund.balance);
        const progress = Math.min(100, Math.round(data.fund.balance / data.fund.goal * 100));
        return language === 'tl'
          ? {
              title: 'Pondong pang-emergency',
              body: remaining > 0
                ? `Nasa ${progress}% na ang pondong pang-emergency mo: ${formatMoney(data.fund.balance)} sa layuning ${formatMoney(data.fund.goal)}. ${formatMoney(remaining)} pa ang kailangan. Magtabi lang ng halagang kaya ng badyet mo; para ang pondong ito sa agarang pangangailangan o hindi inaasahang gastusin.`
                : `Naabot na ng pondong pang-emergency mo ang layunin nitong ${formatMoney(data.fund.goal)}. Gamitin lang ito para sa agarang pangangailangan o hindi inaasahang gastusin.`,
            }
          : {
              title: 'Emergency fund',
              body: remaining > 0
                ? `Your emergency fund is ${progress}% of its goal: ${formatMoney(data.fund.balance)} of ${formatMoney(data.fund.goal)}, with ${formatMoney(remaining)} to go. Set aside only what fits your budget; reserve this fund for urgent or unexpected needs.`
                : `Your emergency fund has reached its ${formatMoney(data.fund.goal)} goal. Reserve it for urgent or unexpected needs.`,
            };
      }
      return language === 'tl'
        ? {
            title: 'Pondong pang-emergency',
            body: `May ${formatMoney(data.fund.balance)} sa pondong pang-emergency mo. Magtakda ng layunin sa Plans para masubaybayan ang pag-ipon. Magtabi lang kung pasok sa badyet; gamitin ang pondo para sa agarang pangangailangan o hindi inaasahang gastusin.`,
          }
        : {
            title: 'Emergency fund',
            body: `Your emergency fund balance is ${formatMoney(data.fund.balance)}. Set a goal in Planner to track progress. Save only what fits your budget, and reserve the fund for urgent or unexpected needs.`,
          };
    }
    case 'upcoming': {
      const events = upcomingEvents(data).slice(0, 3);
      if (events.length === 0) {
        return language === 'tl'
          ? {
              title: 'Paparating na gastusin',
              body: 'Wala pang naka-listang paparating na gastusin sa Plans. Magdagdag ng event doon para maisama ito sa pagpaplano mo.',
            }
          : {
              title: 'Upcoming costs',
              body: 'There are no upcoming costs listed in Planner. Add an event there to include it in your planning.',
            };
      }
      const eventLines = events.map((event) => {
        const date = formatDate(event.event_date, language);
        return event.amount > 0
          ? `${event.title} · ${date} · ${formatMoney(event.amount)}`
          : `${event.title} · ${date} · ${language === 'tl' ? 'wala pang tantiyang halaga' : 'no estimate yet'}`;
      });
      return language === 'tl'
        ? {
            title: 'Paparating na gastusin',
            body: `Mga susunod na event sa Plans:\n${eventLines.join('\n')}\nIsaalang-alang ang mga ito sa badyet. Mga tantiya lang ang halagang inilagay mo.`,
          }
        : {
            title: 'Upcoming costs',
            body: `Next events in Planner:\n${eventLines.join('\n')}\nInclude these in your budget. The amounts are estimates you entered.`,
          };
    }
  }
}

export function detectOfflineCoachTopic(question: string): OfflineCoachTopic | null {
  const text = question.toLocaleLowerCase();
  if (/\b(upcoming|event|bill|paparating|bayarin|gastusin sa plans)\b/.test(text)) return 'upcoming';
  if (/\b(emergency|savings?|save|ipon|pondong|magtipid)\b/.test(text)) return 'savings';
  if (/\b(how much can i spend|what can i spend|can i spend|spend(?:ing)? today|daily spending|magkano.*(?:gastos|gastusin|gastusan)|(?:magkano|ano).*pwede.*(?:gastusin|gastusan|paggastosan)|pwede.*(?:gastusin|gastusan|paggastosan)|(?:gastusin|gastusan|paggastosan).*ngayon)\b/.test(text)) return 'budget';
  if (/\b(budget|badyet|baon|allowance|weekly|lingguhan|afford|kaya ko|bili|purchase)\b/.test(text)) return 'budget';
  if (/\b(remaining|left|balance|natira|matitira|cash flow|income|kita)\b/.test(text)) return 'cashflow';
  if (/\b(where did (?:my )?money go|spend|spending|spent|expense|expenses|gastos|gumastos|category|kategorya|saan napunta)\b/.test(text)) return 'spending';
  return null;
}

export function unsupportedOfflineCoachAnswer(language: AppLanguage): OfflineCoachReply {
  return language === 'tl'
    ? {
        title: 'Limitado ang offline na sagot',
        body: 'Makakatulong ako offline sa mga gastos, natitirang pera, badyet, ipon, at paparating na gastusin. Para sa pangkalahatang tanong, i-set up ang lokal na AI sa Android app sa pamamagitan ng minsanang pag-download ng modelo. Hindi kailangan ng API key o bayad na API tokens.',
      }
    : {
        title: 'Offline answers are limited',
        body: 'I can help offline with spending, remaining money, budgets, savings, and upcoming costs. For general questions, set up Local AI in the Android app with a one-time model download. No API key or paid API tokens are required.',
      };
}
