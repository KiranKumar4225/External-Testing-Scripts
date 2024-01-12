const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const yargs = require('yargs');

const argv = yargs
  .option('a', {
    describe: 'Display the list in the format ip|tcp|ports',
    type: 'boolean',
  })
  .argv;

const commands = {
  "Angular": "document.querySelector('[ng-version]').getAttribute('ng-version')",
  "AngularJS": "angular.version.full",
  "Bootstrap": "new bootstrap.Alert().VERSION",
  "BootStrap": "$.fn.tooltip.Constructor.VERSION",
  "Core-JS": "core.version",
  "Core-JS-Shared": "window['__core-js_shared__'].versions[0].version",
  "D3": "d3.version",
  "DataTables": "$.fn.dataTable.version",
  "DataTablesAlt": "$().dataTable.version",
  "Dojo": "dojo.version",
  "Dropzone": "Dropzone.version",
  "Ember": "Ember.VERSION",
  "ExtJS3": "Ext.version",
  "ExtJS4": "Ext.getVersion('extjs')",
  "ExtJS4.1+": "Ext.getVersion().version",
  "FancyBox": "jQuery.fancybox.version",
  "Highcharts": "Highcharts.version",
  "jQuery": "jQuery().jquery",
  "jQueryUI": "jQuery.ui.version",
  "jQueryUI": "$.ui.version",
  "Knockout": "ko.version",
  "Lodash": "_.VERSION",
  "Clarity": "clarity.v",
  "Migrate": "jQuery.migrateVersion",
  "Modernizr": "Modernizr._version",
  "Moment": "moment.version",
  "Prototype": "Prototype.Version",
  "React": "React.version",
  "RequireJS": "require.version",
  "TinyMCE": "tinymce.majorVersion + '.' + tinymce.minorVersion",
  "Toastr": "toastr.version",
  "WordpressEmoji": "window._wpemojiSettings?.source.concatemoji",
  "YUI": "YUI.version"
};

const packageNames = {
  "Angular": "@angular/core",
  "AngularJS": "angular",
  "Bootstrap": "bootstrap",
  "BootstrapTool": "bootstrap",
  "Core-JS": "core-js",
  "Core-JS-Shared": "core-js",
  "D3": "d3",
  "DataTables": "datatables",
  "DataTablesAlt": "datatables",
  "Dojo": "dojo",
  "Dropzone": "dropzone",
  "Ember": "ember-package",
  "ExtJS3": "@extjs/sencha-cmd",
  "ExtJS4": "@extjs/sencha-cmd",
  "ExtJS4.1+": "@extjs/sencha-cmd",
  "FancyBox": "fancybox",
  "Highcharts": "highcharts",
  "jQuery": "jquery",
  "jQueryUI": "jquery-ui",
  "jQueryUI-Alt": "jquery-ui",
  "Knockout": "knockout",
  "Lodash": "lodash",
  "Clarity": "clarity-js",
  "Migrate": "jquery-migrate",
  "Modernizr": "modernizr",
  "Moment": "moment",
  "Prototype": "prototypes",
  "React": "react",
  "RequireJS": "requirejs",
  "TinyMCE": "tinymce",
  "Toastr": "toastr",
  "WordpressEmoji": "node-emoji",
  "YUI": "yui"
};


async function getLatestVersionFromNpm(packageName) {
  const registryUrl = `https://registry.npmjs.org/${packageName}`;
  try {
    const response = await fetch(registryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch package information: ${response.statusText}`);
    }

    const data = await response.json();
    const latestVersion = data['dist-tags']['latest'];
    return latestVersion;
  } catch (error) {
    console.error(`Error fetching package information: ${error.message}`);
    return null;
  }
}

async function navigateToWebpage(ip, port, protocol) {
  const url = `${protocol}://${ip}:${port}`;
  const browser = await puppeteer.launch({ headless: "new", ignoreHTTPSErrors: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    await page.waitForSelector('body', { timeout: 15000 });

    const finalUrl = page.url();

    return finalUrl;
  } catch (error) {
    console.error(`Error navigating to ${url}: ${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

async function getVersions(url) {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: "new", });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const finalUrl = page.url();

    const results = {};

    for (const [packageName, command] of Object.entries(commands)) {
      try {
        const result = await page.evaluate(command => eval(command), command);
        results[packageName] = {
          discoveredVersion: result,
          latestVersion: await getLatestVersionFromNpm(packageNames[packageName])
        };
      } catch (error) {
        results[packageName] = {
          discoveredVersion: `Error: ${error.message}`,
          latestVersion: null
        };
      }
    }

    return { finalUrl, results };
  } finally {
    await browser.close();
  }
}

async function processLines(lines, displayFormat) {
  const results = [];

  for (const line of lines) {
    const [ip, port, info] = line.split(',');

    if (!ip) {
      continue;
    }

    const ports = info ? info.split(':').map(p => p.trim()).join(',') : port;

    const httpProtocol = 'http';
    const httpsProtocol = 'https';

    const redirectedUrlHttp = await navigateToWebpage(ip, port, httpProtocol);
    const redirectedUrlHttps = await navigateToWebpage(ip, port, httpsProtocol);

    let finalUrl = null;
    let versions = null;
    let finalip = null;
    let finalport = null;

    if (redirectedUrlHttp) {
      const result = await getVersions(redirectedUrlHttp);
      if (result && result.results && Object.values(result.results).some(v => v.discoveredVersion)) {
        finalUrl = result.finalUrl;
        versions = result.results;
        finalip = ip;
        finalport = port;
        results.push({ finalip, finalport, url: finalUrl, versions });
      }
    } 
    if (redirectedUrlHttps) {
      const result = await getVersions(redirectedUrlHttps);
      if (result && result.results && Object.values(result.results).some(v => v.discoveredVersion)) {
        finalUrl = result.finalUrl;
        versions = result.results;
        finalip = ip;
        finalport = port;
        results.push({ finalip, finalport, url: finalUrl, versions });
      }
    }
  }

  return results;
}




async function readAndProcessFile(inputFilePath, displayFormat) {
  try {
    const content = await fs.readFile(inputFilePath, 'utf-8');
    const lines = content.split('\n');
    const results = await processLines(lines, displayFormat);
    const processedIPs = new Map();

    if (displayFormat === 'a') {
      console.log("| IP | TCP | Ports |");
      console.log("|-----|-----|-------|");

      for (const { finalip, finalport, url, versions } of results) {
        for (const [library, versionInfo] of Object.entries(versions)) {
          if (
            versionInfo.discoveredVersion &&
            !versionInfo.discoveredVersion.startsWith('Error') &&
            versionInfo.discoveredVersion !== versionInfo.latestVersion
          ) {
            const key = `${finalip}`;
            const port = `${finalport}`;

            if (processedIPs.has(key)) {
              // IP already exists, check if the port is not already present
              const ports = processedIPs.get(key);
              if (!ports.includes(port)) {
                ports.push(port);
              }
            } else {
              // IP is not present, add a new result
              processedIPs.set(key, [port]);
            }
          }
        }
      }
      
      // Print unique IPs with their ports
      processedIPs.forEach((ports, ip) => {
        const portsString = ports.join(',');
        console.log(`${ip}|tcp|${portsString}`);
      });
      
    } else {
      console.log("| **URL** | **Library** | **Discovered Version** | **Latest Version** |");
      console.log("|----------------------|--------------|---------------------|----------------|");
      
      for (const { url, versions } of results) {
        for (const [library, versionInfo] of Object.entries(versions)) {
          
          if (
            versionInfo.discoveredVersion &&
            !versionInfo.discoveredVersion.startsWith('Error') &&
            versionInfo.discoveredVersion !== versionInfo.latestVersion
          ) {
            console.log(`| ${url} | ${library} | ${versionInfo.discoveredVersion} | ${versionInfo.latestVersion || 'N/A'} |`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
}

const inputFile = process.argv[2];

if (!inputFile) {
  console.error('Please provide the input file path as a command-line argument.');
  process.exit(1);
}

readAndProcessFile(inputFile, argv.a ? 'a' : 'default');

