exports.getElementInnerText = async (page, selector) => {
    return page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.innerText.trim() : null;
    }, selector);
};

exports.getElementsInnerTexts = async (page, selector) => {
    return page.evaluate((sel) => [...document.querySelectorAll(sel)]
        .map((element) => element.innerText.trim()), selector);
};
