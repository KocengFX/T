const fs = require("fs");
const path = require("path");
const { firefox } = require("playwright");

const REPLY_DENGAN_FOTO = false;
const FOTO_FOLDER = "photos";
const LOOP = 50;

// =========================
// EMOJI RANDOM
// =========================
function getEmoji() {
    const e = ["🔥","✨","🎉","⭐","😄","😁","💫","🥳","🚀"];
    return e[Math.floor(Math.random() * e.length)];
}

// =========================
// DELAY RANDOM
// =========================
function delay(min, max) {
    return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

// =========================
// SUPERSCRIPT NUMBER
// =========================
function toSuperscript(num) {
    const normal = "0123456789";
    const superScript = "⁰¹²³⁴⁵⁶⁷⁸⁹";

    return num.toString().split("").map(d => {
        const i = normal.indexOf(d);
        return superScript[i] || d;
    }).join("");
}

// =========================
// VARIASI NOMOR (ANTI TEMPLATE)
// =========================
function generateUniqueTag(num) {
    const s = toSuperscript(num);

    const styles = [
        `~${s}`,
        `#${s}`,
        `(${s})`,
        `• ${s}`,
        `ID:${s}`,
        `No.${s}`
    ];

    return styles[Math.floor(Math.random() * styles.length)];
}

// =========================
// SCREENSHOT
// =========================
async function safeScreenshot(page, name) {
    try {
        if (!page.isClosed()) {
            const file = `screenshots/${name}_${Date.now()}.png`;
            await page.screenshot({ path: file });
            console.log("📸", file);
        }
    } catch {}
}

// =========================
// BEHAVIOR MANUSIA
// =========================
async function humanBehavior(page) {
    try {
        await page.mouse.move(
            200 + Math.random() * 400,
            200 + Math.random() * 400
        );

        await delay(1000, 2500);

        await page.mouse.wheel(0, 300 + Math.random() * 500);

        await delay(1500, 3000);
    } catch {}
}

// =========================
// KLIK TEXTBOX
// =========================
async function clickReplyBox(page) {
    try {
        await page.click('[data-testid="tweetTextarea_0RichTextInputContainer"]', { timeout: 10000 });
    } catch {
        await page.click('div[role="textbox"][contenteditable="true"]', { timeout: 10000 }).catch(() => {});
    }
}

// =========================
// ENSURE READY
// =========================
async function ensureReady(page) {
    await humanBehavior(page);
    await clickReplyBox(page);

    await page.waitForSelector('div[contenteditable="true"]', {
        timeout: 15000
    });
}

// =========================
// MAIN
// =========================
(async () => {

    if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots");

    console.log("🚀 BOT FIREFOX + UNIQUE START");

    const browser = await firefox.launch({
        headless: false
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0"
    });

    // blok gambar biar ringan
    await context.route("**/*", (route) => {
        if (route.request().resourceType() === "image") return route.abort();
        route.continue();
    });

    // COOKIE LOGIN
    const cookies = JSON.parse(fs.readFileSync("lis.json", "utf8"));
    await context.addCookies(cookies);

    const page = await context.newPage();

    const targetURL = "https://x.com/samsungID/status/2050533598583799917";
    const fileTarget = "2050533598583799917.txt";

    await page.goto(targetURL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 });

    let total = fs.existsSync(fileTarget)
        ? fs.readFileSync(fileTarget, "utf8").split("\n").filter(Boolean).length
        : 0;

    console.log("Total sebelumnya:", total);

    // =========================
    // LOOP
    // =========================
    while (true) {

        console.log("\n=== BATCH BARU ===\n");

        for (let i = 1; i <= LOOP; i++) {

            const nomor = total + 1;
            console.log(`Reply ke-${nomor}`);

            try {
                await ensureReady(page);

                await delay(1500, 3000);

                const uniqueTag = generateUniqueTag(nomor);

                const comment = `“Let’s uncover the trurth with Syifa🔍✨ Ketik ‘hilangkan kumis & rambut’ di Photo Assist feature. Uncover make it easy, keren banget!😎 #S26UncoverMission #S26vsZombie #GalaxyS26 Series #YouandAICan”

${uniqueTag}`;

                await page.fill('div[contenteditable="true"]', comment);

                if (REPLY_DENGAN_FOTO) {
                    const files = fs.readdirSync(FOTO_FOLDER).filter(f => /\.(jpg|png|jpeg)$/i.test(f));
                    if (files.length > 0) {
                        await page.setInputFiles('input[type="file"]', path.join(FOTO_FOLDER, files[0]));
                    }
                }

                await delay(1000, 2500);

                const [response] = await Promise.all([
                    page.waitForResponse(r =>
                        r.url().includes("CreateTweet") &&
                        r.request().method() === "POST"
                    ),
                    page.click('button[data-testid="tweetButtonInline"]')
                ]);

                let json = {};
                try { json = await response.json(); } catch {}

                const result =
                    json?.data?.create_tweet?.tweet_results?.result ||
                    json?.data?.notetweet_create?.tweet_results?.result;

                const id =
                    result?.rest_id ||
                    result?.legacy?.id_str ||
                    result?.edit_control?.edit_tweet_ids?.[0];

                if (!id) throw new Error("ID gagal");

                fs.appendFileSync("logs.txt", id + "\n");
                fs.appendFileSync(fileTarget, id + "\n");

                total++;

                console.log("✅ SUKSES:", id);

                await delay(12000, 20000);

            } catch (err) {
                console.log("❌ ERROR, retry...");
                await safeScreenshot(page, "error");

                await delay(15000, 30000);

                if (i % 3 === 0) {
                    console.log("🔄 Reload...");
                    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
                    await delay(5000, 8000);
                }

                i--;
            }
        }

        const rest = 30 + Math.random() * 30;
        console.log(`😴 Istirahat ${Math.round(rest)} menit`);

        await delay(rest * 60000, rest * 60000 + 10000);
    }

})();
