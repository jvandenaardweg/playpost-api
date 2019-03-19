import { Request, Response } from 'express';
import { JSDOM } from 'jsdom';
import readability from 'readability';
import got from 'got';
import mercuryParser from '@postlight/mercury-parser';
import puppeteer from 'puppeteer';
import apify from 'apify';
import { generate } from 'modern-random-ua';

export const crawlUsingReadability = async (req: Request, res: Response) => {
  const { url } = req.query;

  const response = await got(url, {
    followRedirect: true,
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });

  const document = new JSDOM(response.body);
  const data = new readability(document.window.document).parse();
  return res.json(data);
}

export const crawlUsingMercury = async (req: Request, res: Response) => {
  const { url } = req.query;

  const data = await mercuryParser.parse(url);
  return res.json(data);
}

export const crawlUsingHeadlessChrome = async (req: Request, res: Response) => {
  const { url } = req.query;

  const blockedResources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset', 'iframe'];

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      "--proxy-server='direct://",
      '--proxy-bypass-list=*',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (blockedResources.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');

  await page.setViewport({
    width: 1200,
    height: 720
  });

  await page.goto(url);

  const body = await page.evaluate(() => document.body.innerHTML);

  await browser.close();

  const document = new JSDOM(body);
  const data = new readability(document.window.document).parse();

  return res.json(data);
}

// https://kb.apify.com/tips-and-tricks/several-tips-how-to-bypass-website-anti-scraping-protections
export const crawlUsingApify = async (req: Request, res: Response) => {
  const { url } = req.query;

  const blockedResources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset', 'iframe', 'eventsource', 'websocket'];

  const browser = await apify.launchPuppeteer({
    userAgent: generate(),
    useChrome: true,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      "--proxy-server='direct://",
      '--proxy-bypass-list=*',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  await apify.utils.puppeteer.hideWebDriver(page);

  await page.setRequestInterception(true);

  // Block all resources except for the main HTML document
  await apify.utils.puppeteer.blockResources(page, blockedResources);

  // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
  await page.setUserAgent(generate());

  await page.viewport({
    width: 1024 + Math.floor(Math.random() * 100),
    height: 768 + Math.floor(Math.random() * 100),
  });

  await page.goto(url, {
    waitUntil: 'domcontentloaded'
  });

  const body = await page.evaluate(() => document.documentElement.outerHTML);

  await page.close();
  await browser.close();

  const document = new JSDOM(body);
  const data = new readability(document.window.document).parse();

  return res.json({
    ...data,
    html: body
  });
};
