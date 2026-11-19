// اختبار غلاف أندرويد على المحاكي: يتحكم بالـWebView عبر CDP ويضغط زر الرجوع الحقيقي
const http = require('http'), WebSocket = require('ws'), { execSync } = require('child_process'), fs = require('fs');
const PKG = 'net.wardyat.idaratamlak', OUT = process.env.OUT || 'out';
fs.mkdirSync(OUT, { recursive: true });
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch (e) { return String(e.stdout || '') + String(e.stderr || ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = []; const rec = (name, ok, detail = '') => { R.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + String(detail).slice(0, 200) : '')); };
const shot = (n) => sh(`adb exec-out screencap -p > ${OUT}/${n}.png`);
const alive = () => !!sh(`adb shell pidof ${PKG}`).match(/\d+/);
const top = () => sh('adb shell dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity" | head -2');
const getJ = (u) => new Promise((ok, no) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { ok(JSON.parse(d)); } catch (e) { no(e); } }); }).on('error', no));
let ws, id = 0; const pend = {};
async function connect() {
  const pid = sh(`adb shell pidof ${PKG}`).split(/\s+/)[0]; if (!pid) throw new Error('no pid');
  sh(`adb forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
  const t = (await getJ('http://127.0.0.1:9222/json')).find((x) => x.type === 'page'); if (!t) throw new Error('no page target');
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.on('open', ok); ws.on('error', no); });
  ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } });
  rec('webview-attached', true, t.url);
}
const ev = (expression) => new Promise((ok) => { const i = ++id; const tm = setTimeout(() => { delete pend[i]; ok('__timeout__'); }, 8000); pend[i] = (d) => { clearTimeout(tm); ok(d.result && d.result.result ? d.result.result.value : undefined); }; ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); });
(async () => {
  await sleep(3000); rec('app-process-alive-at-launch', alive()); shot('01-launch');
  let ok = false; for (let i = 0; i < 25 && !ok; i++) { try { await connect(); ok = true; } catch (e) { await sleep(3000); } }
  if (!ok) { rec('webview-attached', false, 'تعذّر الاتصال'); fs.writeFileSync(OUT + '/results.json', JSON.stringify(R, null, 1)); process.exit(1); }
  let ready = false; for (let i = 0; i < 40 && !ready; i++) { ready = await ev('typeof S!=="undefined"&&!!S&&!!S.b'); if (!ready) await sleep(2000); }
  rec('owner-page-loaded', ready, await ev('location.href')); shot('02-home');
  rec('native-platform', await ev('!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())'));
  for (const pl of ['Share', 'Browser', 'PushNotifications']) rec('plugin-' + pl, await ev(`!!(Capacitor.Plugins&&Capacitor.Plugins.${pl})`));
  rec('lead-step-exists', await ev('!!LEAD&&!!LEAD.t'), await ev('LEAD&&LEAD.t'));
  // الرجوع من تبويب إلى الرئيسية
  await ev("go('docs')"); await sleep(500); sh('adb shell input keyevent 4'); await sleep(1200);
  const al1 = alive(); shot('02b-after-back'); rec('back-from-tab-returns-home', (await ev('TAB')) === 'home' && al1, `TAB=${await ev('TAB')} alive=${al1} hist=${await ev('history.length')} top=${top()}`);
  if (!al1) { sh('adb shell am start -n net.wardyat.idaratamlak/.MainActivity'); await sleep(8000); try { ws.close(); } catch (e) {} for (let i = 0; i < 10; i++) { try { await connect(); break; } catch (e) { await sleep(2000); } } await sleep(6000); }
  // الرجوع يغلق النافذة السفلية فقط
  await ev("sheet('<h1>اختبار</h1>')"); await sleep(600); shot('03-sheet'); sh('adb shell input keyevent 4'); await sleep(1200);
  rec('back-closes-sheet-not-app', alive() && !(await ev("!!document.querySelector('#sh.on')")));
  // الخزنة والمقارنة والنافذة الذكية
  await ev("SEG='vault';go('docs')"); await sleep(600); rec('vault-ring-renders', await ev("!!document.querySelector('svg circle')&&document.body.innerText.includes('جاهزية')")); shot('04-vault');
  await ev("SEG='stmt';go('docs')"); await sleep(1500); shot('05-stmt');
  rec('stmt-card-renders', await ev("document.body.innerText.includes('دخلك في ستة أشهر')||document.body.innerText.includes('المحصّل')"));
  // فتح صفحة العمارة في متصفح التطبيق ثم الرجوع
  await ev("go('home')"); await sleep(500);
  await ev("(function(){var a=document.createElement('a');a.href=location.origin+'/b/'+S.b.slug;a.target='_blank';document.body.appendChild(a);a.click();})()"); await sleep(4000); shot('06-browser');
  const t1 = top(); rec('building-opens-in-browser-overlay', !t1.includes('MainActivity') || /Browser|CustomTab|chrome/i.test(t1), t1);
  sh('adb shell input keyevent 4'); await sleep(2000); const t2 = top(); shot('07-after-back');
  rec('back-from-browser-returns-to-app', alive() && /MainActivity/.test(t2), t2);
  rec('app-alive-at-end', alive());
  fs.writeFileSync(OUT + '/results.json', JSON.stringify(R, null, 1)); fs.writeFileSync(OUT + '/logcat.txt', sh('adb logcat -d -t 400'));
  process.exit(R.every((x) => x.ok) ? 0 : 1);
})().catch((e) => { rec('script-error', false, e.message); fs.writeFileSync(OUT + '/results.json', JSON.stringify(R, null, 1)); process.exit(1); });
