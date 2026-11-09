# غلاف أملاكي للمتجرين (Capacitor)
يفتح التطبيق https://amlak.wardyat.net/app (الدخول بـGoogle/Apple عبر wardyat-core). الحزمة: net.wardyat.amlak.
**البناء على GitHub فقط** (قرار المالك)، لا على السيرفر. لم يُبنَ شيء بعد.

## ما ينقص قبل أي رفع
1. معرّفات الدخول في core: googleClientId (ويب+أندرويد+iOS) وappleClientId — من الكونسول (مهمة ot5). بدونها شاشة الدخول فارغة.
2. دخول Google داخل WebView محظور من Google: يلزم إضافة إضافة دخول أصلية (مثل @codetrix-studio/capacitor-google-auth و@capacitor-community/apple-sign-in) وربطها بخطاف `onToken` في core-ui.
3. Apple: Sign in with Apple capability + حزمة مراجعة (فيديو آيفون + Notes) قبل الإرسال.
4. الاسم «أملاكي» محجوز في App Store (AmlaKey | أملاكي) — خطر رفض.
5. أيقونة وشاشة بداية وسياسة خصوصية وحذف الحساب (موجود في core).
6. Apple قد ترفض غلاف ويب بحت (Guideline 4.2)؛ يلزم ميزة أصلية (إشعارات/اختيار صورة/مشاركة).
