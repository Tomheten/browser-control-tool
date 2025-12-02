const { firefox, webkit, chromium, Browser, Page } = require('playwright')
const { test, expect } = require('playwright')

const GIFEncoder = require('gifencoder')
const PNG = require('png-js')
const puppeteer = require('puppeteer')
const fs = require('fs')

function decode(png) {
  return new Promise(r => {
    png.decode(pixels => r(pixels))
  })
}

async function gifAddFrame(page, encoder) {
  const pngBuffer = await page.screenshot({ clip: { width: 1024, height: 768, x: 0, y: 0 } })
  const png = new PNG(pngBuffer)
  await decode(png).then(pixels => encoder.addFrame(pixels))
}


const run = async () => {
  let browser = await firefox.launch({
    // executablePath: './chrome-win/chrome.exe',
    headless: false
  })
  //console.log(browser);
  // const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await browser.newPage()

  const timeout = 5000
  page.setDefaultTimeout(timeout)

  {
    const targetPage = page
    const promises = []
    const startWaitingForEvents = () => {
      promises.push(targetPage.waitForNavigation())
    }
    startWaitingForEvents()
    await targetPage.goto('https://translate.yandex.ru/')
    await Promise.all(promises)
  }

  const encoder = new GIFEncoder(1024, 768)
  encoder.createWriteStream()
    .pipe(fs.createWriteStream('test.gif'))

  // setting gif encoder
  encoder.start()
  encoder.setRepeat(0)
  encoder.setDelay(150)
  encoder.setQuality(10) // default

  await gifAddFrame(page, encoder)
  for (let i = 0; i < 10; i++) {
    await gifAddFrame(page, encoder)
  }

  {
    await page.screenshot({
      path: 'screenshot.jpg'
    })
  }
  await gifAddFrame(page, encoder)

  {
    await page.screenshot({
      path: 'screenshot.jpg'
    })
  }


  encoder.finish()
  await browser.close()

}

run()
