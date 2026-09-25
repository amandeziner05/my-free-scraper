const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

// This creates the link Automatr will talk to
app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    let browser;
    try {
        // 1. Open the invisible browser
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });

        // 2. Put on the disguise (Pretend to be a real human laptop browser)
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();
        
        // 3. Go to the defensive website and wait for it to load
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 4. Read the data
        const pageTitle = await page.title();
        const bodyContent = await page.evaluate(() => document.body.innerText.substring(0, 1000));

        // 5. Turn off the browser to save memory
        await browser.close();

        // 6. Give the data back to Automatr
        res.json({
            success: true,
            title: pageTitle,
            data: bodyContent
        });

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start listening for Automatr's call
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Your assistant is awake and ready on port ${PORT}!`));
