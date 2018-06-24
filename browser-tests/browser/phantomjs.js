/**
 * All browser drivers must do the following things:
 * - Open a page to ROOT_URL
 * - send all console messages to the stdout function
 * - send all errors to the stderr function, only when window.testsAreRunning is false
 * - When window.testsDone becomes true, call `done` with window.testFailures argument
 * - As a safeguard, exit with code 2 if there hasn't been console output
 *   for 30 seconds.
 */
import childProcess from 'child_process';

const PHANTOMJS_SCRIPT_FILE_NAME = 'browser-tests/browser/phantomjs_script.js';

export default function startPhantom({
  stdout,
  stderr,
  done,
}) {
  let phantomjs;
  let phantomJSBinary;
  let QtQPAPlatform = '';
  let hasOffscreen = false;

  // detect system PhantomJS installation
  try {
    const isWindows = 'win32' === process.platform;
    let whichCommand;
    let path;

    if(!isWindows) {
      whichCommand = 'which' + ' phantomjs';
      path = '/usr/local/bin:/usr/bin:/bin';
      QtQPAPlatform = 'offscreen';
    }
    else {
      // Not yet implemented for Windows
      whichCommand = 'where' + ' phantomjs.exe';
      path = 'C:\phantomjs\bin';
    }

    // use custom PATH to prevent using Meteor modified env variables,
    // containing prebuilt phantomjs
    let whichExec = childProcess.execSync(
      whichCommand,
      { env: {'PATH': path} }
    );

    if(whichExec) {
      phantomJSBinary = whichExec.toString().trim();

      console.log('Checking offscreen plugin support.');

      try {
        // check if we have a working offscreen plugin
        // QT_QPA_PLATFORM=offscreen phantomjs --version
        let offscreenCheck = childProcess.execSync(
          'phantomjs --version',
          { env: {
            'PATH': path,
            QT_QPA_PLATFORM: 'offscreen'
            }
          }
        );

        hasOffscreen = true;
        console.log('Offscreen plugin found!');
      }
      catch (error) {
        console.log('Offscreen plugin not found!');
      }

    }
  }
  catch (error) {
    console.error('Error: When detecting system PhantomJS installation.');
    console.error('Falling back to use prebuilt PhantomJS.');
  }

  try {
    phantomjs = require('phantomjs-prebuilt');
  } catch (error) {
    throw new Error('When running tests with TEST_BROWSER_DRIVER=phantomjs, you must first "npm i --save-dev phantomjs-prebuilt"');
  }

  // Fallback to use prebuilt PhantomJS
  if(!phantomJSBinary) {
    phantomJSBinary = phantomjs.path;
    QtQPAPlatform = '';
  }

  // Disable offscreen plugin
  if(!hasOffscreen) {
    QtQPAPlatform = '';
  }

  const scriptPath = Assets.absoluteFilePath(PHANTOMJS_SCRIPT_FILE_NAME);

  if (process.env.METEOR_TEST_DEBUG) {
    console.log('PhantomJS Path:', phantomjs.path);
    console.log('PhantomJS Script Path:', scriptPath);
  }

  const browserProcess = childProcess.execFile(phantomJSBinary, [scriptPath], {
    env: {
      ROOT_URL: process.env.ROOT_URL,
      QT_QPA_PLATFORM: QtQPAPlatform
    },
  });

  browserProcess.on('error', error => {
    throw error;
  });

  browserProcess.on('exit', done);

  // The PhantomJS script echoes whatever the page prints to the browser console and
  // here we echo that once again.
  browserProcess.stdout.on('data', stdout);
  browserProcess.stderr.on('data', stderr);
}
