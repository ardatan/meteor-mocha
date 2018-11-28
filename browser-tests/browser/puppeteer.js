/**
 * All browser drivers must do the following things:
 * - Open a page to ROOT_URL
 * - send all console messages to the stdout function
 * - send all errors to the stderr function, only when window.testsAreRunning is false
 * - When window.testsDone becomes true, call `done` with window.testFailures argument
 * - As a safeguard, exit with code 2 if there hasn't been console output
 *   for 30 seconds.
 */
const util = require('util');

export default function startPuppeteer({
  stdout,
  stderr,
  done,
}) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (error) {
    console.error(error);
    throw new Error(
      'When running app tests with TEST_BROWSER_DRIVER=puppeteer, you must first ' +
      '"npm i --save-dev puppeteer@^1.5.0"'
    );
  }

  async function runTests() {
    // --no-sandbox and --disable-setuid-sandbox allow this to easily run in docker
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    console.log(await browser.version());
    const page = await browser.newPage();

    // console message args come in as handles, use this to evaluate them all
    async function evaluateHandles (msg) {
      return (await Promise.all(msg.args().map(arg => page.evaluate(h => h.toString(), arg))))
        .join(' ');
    }

    let consolePromise = Promise.resolve();
    page.on('console', (msg) => {
      consolePromise = consolePromise.then(async () => {
        // this is racy but how else to do it?
        const testsAreRunning = await page.evaluate('window.testsAreRunning');
        if (msg.type() === 'error' && !testsAreRunning) {
          stderr(await evaluateHandles(msg));
        } else {
          stdout(await evaluateHandles(msg));
        }
      });
    });

    await page.goto(process.env.ROOT_URL);

    await page.waitFor(() => window.testsDone, { timeout: 0 });
    const testFailures = await page.evaluate('window.testFailures');

    await consolePromise;

    await page.close();
    await browser.close();

    done(testFailures);
  }

  runTests();
}