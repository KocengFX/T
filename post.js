// ===================================================
//  PLAYWRIGHT AUTO REPLY - FULL FIX (NO FEATURE REMOVED)
// ===================================================

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const REPLY_DENGAN_FOTO = false;
const FOTO_FOLDER = "photos";
const LOOP = 300;

// Random Emoji
function getEmoji() {
    const e = ["🔥","✨","🎉","⭐","😄","😁","💫","🥳","🚀"];
    return e[Math.floor(Math.random() * e.length)];
}

// Screenshot ringan
async function safeScreenshot(page, name) {
    try {
        if (!page.isClosed()) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const file = `screenshots/${name}_${timestamp}.png`;

            await page.screenshot({
                path: file,
                fullPage: true,
                clip: { x: 0, y: 0, width: 300, height: 200 }
            });

            console.log(`📸 Screenshot: ${file}`);
        }
    } catch (e) {}
}

// Klik reply
async function clickReplyBox(page) {
    try {
        await page.click('[data-testid="tweetTextarea_0RichTextInputContainer"]', { timeout: 8000 });
    } catch {
        await page.click('div[role="textbox"][contenteditable="true"]', { timeout: 5000 }).catch(() => {});
    }
}

// Pastikan siap
async function ensureReady(page) {
    await clickReplyBox(page);
    await page.waitForSelector('div[data-testid="tweetTextarea_0"][contenteditable="true"]', {
        state: "visible",
        timeout: 10000
    });
}

(async () => {
    if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots");

    console.log("🚀 BOT STARTED");

    const browser = await chromium.launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process",
            "--no-zygote",
            "--disable-software-rasterizer"
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 500, height: 900 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    });

    // blok gambar
    await context.route("**/*", (route) => {
        if (route.request().resourceType() === "image") return route.abort();
        route.continue();
    });

    const cookies = JSON.parse(fs.readFileSync("tia.json", "utf8"));
    await context.addCookies(cookies);

    const page = await context.newPage();
    const targetURL = "https://x.com/samsungID/status/2050533598583799917";
    const fileTarget = "2050533598583799917.txt";

    await page.goto(targetURL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 });

    let total = fs.existsSync(fileTarget)
        ? fs.readFileSync(fileTarget, "utf8").trim().split("\n").filter(Boolean).length
        : 0;

    console.log(`Total sebelumnya: ${total}`);

    // =========================
    // LOOP BATCH TERUS MENERUS
    // =========================
    while (true) {

        console.log("\n=== MULAI BATCH BARU ===\n");

        for (let i = 1; i <= LOOP; i++) {

            const nomor = total + 1;
            console.log(`LOOP ${i}/${LOOP} | Reply ke-${nomor}`);

            try {
                await ensureReady(page);

                const comment = `Let’s uncover the trurth with Syifa🔍✨ Ketik ‘hilangkan kumis & rambut’ di Photo Assist feature. Uncover make it easy, keren banget!😎 #S26UncoverMission #S26vsZombie #GalaxyS26 Series #YouandAICan

 
#${nomor}`;

                await page.fill('div[data-testid="tweetTextarea_0"]', comment);

                // Upload foto (tetap ada)
                if (REPLY_DENGAN_FOTO) {
                    const files = fs.readdirSync(FOTO_FOLDER).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
                    if (files.length > 0) {
                        await page.setInputFiles('input[type="file"]', path.join(FOTO_FOLDER, files[0]));
                    }
                }

                // Kirim
                const [response] = await Promise.all([
                    page.waitForResponse(r =>
                        r.url().includes("CreateNoteTweet") &&
                        r.request().method() === "POST" &&
                        r.status() === 200
                    ),
                    page.click('button[data-testid="tweetButtonInline"]')
                ]);

                const json = await response.json();

                const result =
                    json?.data?.create_tweet?.tweet_results?.result ||
                    json?.data?.notetweet_create?.tweet_results?.result;

                let id =
                    result?.rest_id ||
                    result?.legacy?.id_str ||
                    result?.edit_control?.edit_tweet_ids?.[0];

                // VALIDASI
                if (!id || typeof id !== "string") {
                    console.log("❌ ID gagal diambil");
                    console.log(JSON.stringify(json, null, 2));
                    throw new Error("ID invalid");
                }

                // simpan
                fs.appendFileSync("logs.txt", id + "\n");
                fs.appendFileSync(fileTarget, id + "\n");

                total++;
                console.log(`✅ SUKSES ID: ${id} | Total: ${total}`);

                // delay sukses
                const delaySuccess = 3000 + Math.random() * 6000;
                console.log(`⏳ Tunggu ${Math.round(delaySuccess/1000)} detik`);
                await new Promise(r => setTimeout(r, delaySuccess));

            } catch (err) {
                console.log("❌ GAGAL, retry...");
                await safeScreenshot(page, `FAIL_${i}`);

                const delay = 15000 + Math.random() * 15000;
                await new Promise(r => setTimeout(r, delay));

                if (i % 3 === 0) {
                    console.log("🔄 Reload...");
                    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
                    await new Promise(r => setTimeout(r, 8000));
                }

                i--; // ulangi
            }
        }

        // =========================
        // ISTIRAHAT
        // =========================
        const restTime = (30 * 60 * 1000) + Math.random() * (30 * 60 * 1000);

        console.log(`\n😴 Istirahat ${Math.round(restTime/60000)} menit...`);
        await new Promise(r => setTimeout(r, restTime));
    }

})();
