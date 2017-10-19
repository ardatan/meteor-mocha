Package.describe({
  name: 'ardatan:mocha',
  summary: 'Run Meteor package or app tests with Mocha',
  git: 'https://github.com/ardatan/meteor-mocha.git',
  documentation: './README.md',
  version: '1.0.0',
  testOnly: true,
});

Package.onUse(function onUse(api) {
  Npm.depends({
    'mocha': '3.1.2'
  })
  api.use([
    'ecmascript@0.3.0',
  ]);

  api.use([
    'meteortesting:browser-tests@0.1.1'
  ], 'server');

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');
});
