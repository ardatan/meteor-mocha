Package.describe({
  name: 'ardatan:mocha',
  summary: 'Run Meteor package or app tests with Mocha',
  git: 'https://github.com/ardatan/meteor-mocha.git',
  documentation: './README.md',
  version: '1.0.6',
  testOnly: true,
});

Package.onUse(function onUse(api) {
  api.use([
    'ecmascript@0.3.0',
  ]);

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.addAssets(['browser-tests/browser/phantomjs_script.js'], ['server']);
});