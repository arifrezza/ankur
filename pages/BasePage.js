class BasePage {
    constructor(page) {
        this.page = page;
    }

    async setUp() {
        // Any setup logic
    }

    async waitForElement(selector, timeout = 30000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
        } catch (error) {
            console.log(`Element not found: ${selector}`);
            throw error;
        }
    }

    async waitForTimeout(ms) {
        await this.page.waitForTimeout(ms);
    }
}

module.exports = BasePage;
