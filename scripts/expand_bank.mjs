import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const existingFilePath = path.join(__dirname, '../src/data/seedPrompts.json');
const existingPrompts = JSON.parse(fs.readFileSync(existingFilePath, 'utf-8'));

const existingTexts = new Set(existingPrompts.map((p) => p.text.trim()));
const existingIds = new Set(existingPrompts.map((p) => p.id));

const batch2 = [
  // Words
  { text: 'کرسی سنتی زمستانی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['نوستالژی', 'خانه'] },
  { text: 'لحاف چهل تکه مادربزرگ', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['صنایع دستی', 'خاطره'] },
  { text: 'قلک سفالی خوکچه', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['پس‌انداز', 'کودکانه'] },
  { text: 'گیوه دست دوز ملایر', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['پوشاک', 'سنتی'] },
  { text: 'کلاه شاپو مخملی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['پوشاک', 'قدیمی'] },
  { text: 'دیوان نفیس حافظ', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['کتاب', 'ادبیات'] },
  { text: 'شاهنامه کهن فردوسی', type: 'WORD', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['ادبیات', 'ملی'] },
  { text: 'نقشه کره زمین پایه دار', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['جغرافیا', 'آموزشی'] },
  { text: 'دوربین فیلمبرداری سوپر هشت', type: 'WORD', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['سینما', 'قدیمی'] },
  { text: 'جعبه مدادرنگی ۴۸ رنگ', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['نقاشی', 'مدرسه'] },
  { text: 'آکواریوم ماهی های مرجانی', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['طبیعت', 'خانه'] },
  { text: 'تیرکمان سنگی چوبی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['بازی', 'نوستالژی'] },
  { text: 'میناکاری اصفهان', type: 'WORD', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['صنایع دستی', 'هنر'] },
  { text: 'خاتم کاری شیراز', type: 'WORD', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['صنایع دستی', 'هنر'] },
  { text: 'شیشه گلاب ناب کاشان', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['سوغات', 'سنتی'] },
  { text: 'ساعت زنگ دار عقربه ای کوکی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['زمان', 'اشیا'] },
  { text: 'چادرشب گیلان', type: 'WORD', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['صنایع دستی', 'شمال'] },
  { text: 'چوب سیگار چوبی قدیمی', type: 'WORD', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['قدیمی', 'اشیا'] },
  { text: 'لنگ قرمز حمام سنتی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['سنتی', 'نوستالژی'] },
  { text: 'بادبزن حصیری رنگی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['تابستان', 'اشیا'] },

  // Phrases
  { text: 'فال حافظ گرفتن در شب یلدا', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['آیین', 'یلدا'] },
  { text: 'سبزه گره زدن در سیزده بدر', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['آیین', 'نوروز'] },
  { text: 'پرتاب دارت به هدف گرد تخته', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['ورزش', 'دقت'] },
  { text: 'انداختن توپ سنگین بولینگ', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['ورزش', 'بازی'] },
  { text: 'جوجه کباب زعفرانی به سیخ کشیدن', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3], tags: ['آشپزی', 'کباب'] },
  { text: 'لیز خوردن ناگهانی روی پوست موز', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['طنز', 'حرکتی'] },
  { text: 'رقص باباکرم با کت و شلوار و کلاه', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['نمایش', 'شادی'] },
  { text: 'چیدن توت سفید از بالای شاخه درخت', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['طبیعت', 'تابستان'] },
  { text: 'شکستن گردوی درشت با لنگه در چوبی', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['نوستالژی', 'طنز'] },
  { text: 'باز کردن درب نوشابه شیشه ای با قاشق', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['مهارت', 'نوستالژی'] },
  { text: 'زمین خوردن ناگهانی سینی چای در مهمانی', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['دستپاچگی', 'حادثه'] },
  { text: 'گرفتن تاکسی دربستی زیر رگبار شدید', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['شهری', 'باران'] },
  { text: 'چانه زدن شدید با مغازه دار سر قیمت', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['خرید', 'بازار'] },
  { text: 'بستن زیپ چمدان پر از سوغاتی با فشار پا', type: 'PHRASE', difficulty: 'MEDIUM', allowedRounds: [1, 2, 3], tags: ['سفر', 'طنز'] },
  { text: 'گم شدن در کوچه پس کوچه های بازار سرپوشیده', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['بازار', 'گردشگری'] },
  { text: 'مشت و مال دادن پهلوان در زورخانه باستانی', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['ورزش باستانی', 'زورخانه'] },
  { text: 'شیرجه زدن از روی صخره بلند به اعماق آب', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['ورزش', 'هیجان'] },
  { text: 'پختن نان تیری سنتی روی ساج عشایری', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['عشایر', 'آشپزی'] },
  { text: 'موج مکزیکی رفتن تماشاگران در استادیوم آزادی', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['فوتبال', 'هیجان'] },
  { text: 'خاموش کردن فیوز اصلی برق در تاریکی مطلق', type: 'PHRASE', difficulty: 'HARD', allowedRounds: [1, 2, 3], tags: ['برق', 'حادثه'] },

  // Proverbs (Rounds 2 & 3 only)
  { text: 'کاچی به از هیچی', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'قناعت'] },
  { text: 'دست راستت زیر سر من', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'آرزو'] },
  { text: 'از این ستون به آن ستون فرج است', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'امید'] },
  { text: 'گاو پیشانی سفید بودن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'معروفیت'] },
  { text: 'فیل و فنجان بودن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'تضاد'] },
  { text: 'شتر در خواب بیند پنبه دانه', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'خیال'] },
  { text: 'سنگ بزرگ علامت نزدن است', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'ادعا'] },
  { text: 'آب پاکی روی دست کسی ریختن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'ناامید کردن'] },
  { text: 'دم به تله ندادن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'زرنگی'] },
  { text: 'سرش بوی قرمه سبزی می دهد', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'خطرکردن'] },
  { text: 'کلاه خود را قاضی کردن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'انصاف'] },
  { text: 'چشم بسته غیب گفتن', type: 'PROVERB', difficulty: 'MEDIUM', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'طنز'] },
  { text: 'مو را از ماست کشیدن', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'دقت'] },
  { text: 'یک کلاغ چهل کلاغ کردن', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'شایعه'] },
  { text: 'ماست ها را کیسه کردن', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'ترس'] },
  { text: 'نخود هر آش بودن', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'فضولی'] },
  { text: 'کلاغ پر بازی کردن با سرنوشت', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'ریسک'] },
  { text: 'آب از آسیاب افتادن', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'آرامش'] },
  { text: 'پشت گوش انداختن کارها', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'تنبلی'] },
  { text: 'چاقو دسته خودش را نمی برد', type: 'PROVERB', difficulty: 'HARD', allowedRounds: [2, 3], tags: ['ضرب‌المثل', 'خودی'] },
];

let added = 0;
for (const item of batch2) {
  const trimmed = item.text.trim();
  if (existingTexts.has(trimmed)) continue;

  const prefix = item.type.toLowerCase();
  let candidateId = `${prefix}-${existingPrompts.length + added + 1}`;
  let counter = 1;
  while (existingIds.has(candidateId)) {
    candidateId = `${prefix}-${existingPrompts.length + added + 1}-${counter++}`;
  }

  existingTexts.add(trimmed);
  existingIds.add(candidateId);
  existingPrompts.push({
    id: candidateId,
    text: trimmed,
    type: item.type,
    difficulty: item.difficulty,
    allowedRounds: item.allowedRounds,
    tags: item.tags || [],
  });
  added++;
}

fs.writeFileSync(existingFilePath, JSON.stringify(existingPrompts, null, 2), 'utf-8');
console.log(`Added ${added} more prompts. Total now: ${existingPrompts.length}`);
