import { Config } from '../config';
import { updateAndroid } from '../android/update';
import { updateIOS, updateIOSChecks } from '../ios/update';
import { allSerial } from '../util/promise';
import { CheckFunction, check, checkPackage, log, logFatal, logInfo, writeXML } from '../common';
import { copySync, ensureDirSync, readFileAsync, removeSync, writeFileAsync } from '../util/fs';
import { join, resolve } from 'path';
import { getPluginPlatform, Plugin, PluginType } from '../plugin';
import { emoji as _e } from '../util/emoji';
import { existsAsync } from '../util/fs';
import { copy as fsCopy } from 'fs-extra';

import chalk from 'chalk';

export async function updateCommand(config: Config, selectedPlatformName: string) {
  const now = +new Date;

  const platforms = config.selectPlatforms(selectedPlatformName);
  if (platforms.length === 0) {
    logInfo(`There are no platforms to update yet. Create one with "capacitor create".`);
    return;
  }
  try {
    await check(
      config,
      [checkPackage, ...updateChecks(config, platforms)]
    );

    await allSerial(platforms.map(platformName => async () => await update(config, platformName, true)));
    const then = +new Date;

    log(`${_e('✅  ', '')}Update finished in ${(then-now)/1000}s`);
  } catch (e) {
    logFatal(e);
  }
}

export function updateChecks(config: Config, platforms: string[]): CheckFunction[] {
  const checks: CheckFunction[] = [];
  for (let platformName of platforms) {
    if (platformName === config.ios.name) {
      checks.push(...updateIOSChecks);
    } else if (platformName === config.android.name) {
      return [];
    } else if (platformName === config.web.name) {
      return [];
    } else {
      throw `Platform ${platformName} is not valid.`;
    }
  }
  return checks;
}

export async function update(config: Config, platformName: string, needsUpdate: boolean) {
  log(`${_e('📲  ', '')}Updating ${chalk.bold(platformName)}`);
  if (platformName === config.ios.name) {
    await updateIOS(config, needsUpdate);
  } else if (platformName === config.android.name) {
    await updateAndroid(config, needsUpdate);
    await copyCordovaJS(config, config.android.webDir);
  }
}

/**
 * Build the plugins/* files for each Cordova plugin installed.
 */
export async function copyPluginsJS(config: Config, cordovaPlugins: Plugin[], platform: string) {
  const webDir = getWebDir(config, platform);
  const pluginsDir = join(webDir, 'plugins');
  const cordovaPluginsJSFile = join(webDir, 'cordova_plugins.js');
  removePluginFiles(config, platform);
  cordovaPlugins.map(async p => {
    const pluginDir = join(pluginsDir, p.id, 'www');
    ensureDirSync(pluginDir);
    const jsModules = getJSModules(p, platform);
    jsModules.map(async (jsModule: any) => {
      const filePath = join(webDir, 'plugins', p.id, jsModule.$.src);
      copySync(join(p.rootPath, jsModule.$.src), filePath);
      let data = await readFileAsync(filePath, 'utf8');
      data = `cordova.define("${p.id}.${jsModule.$.name}", function(require, exports, module) { \n${data}\n});`;
      await writeFileAsync(filePath, data, 'utf8');
    });
  });
  writeFileAsync(cordovaPluginsJSFile, generateCordovaPluginsJSFile(config, cordovaPlugins, platform));
}

/**
 * Build the root cordova_plugins.js file referencing each Plugin JS file.
 */
export function generateCordovaPluginsJSFile(config: Config, plugins: Plugin[], platform: string) {
  let pluginModules: Array<string> = [];
  let pluginExports: Array<string> = [];
  plugins.map((p) => {
    const jsModules = getJSModules(p, platform);
    jsModules.map((jsModule: any) => {
      let clobbers: Array<string> = [];
      let merges: Array<string> = [];
      let clobbersModule = '';
      let mergesModule = '';
      if (jsModule.clobbers) {
        jsModule.clobbers.map((clobber: any) => {
          clobbers.push(clobber.$.target);
        });
        clobbersModule = `,
        "clobbers": [
          "${clobbers.join('",\n          "')}"
        ]`;
      }
      if (jsModule.merges) {
        jsModule.merges.map((merge: any) => {
          merges.push(merge.$.target);
        });
        mergesModule = `,
        "merges": [
          "${merges.join('",\n          "')}"
        ]`;
      }
      pluginModules.push(`{
        "id": "${p.id}.${jsModule.$.name}",
        "file": "plugins/${p.id}/${jsModule.$.src}",
        "pluginId": "${p.id}"${clobbersModule}${mergesModule}
      }`
      );
    });
    pluginExports.push(`"${p.id}": "${p.xml.$.version}"`);
  });
  return `
  cordova.define('cordova/plugin_list', function(require, exports, module) {
    module.exports = [
      ${pluginModules.join(',\n      ')}
    ];
    module.exports.metadata =
    // TOP OF METADATA
    {
      ${pluginExports.join(',\n      ')}
    };
    // BOTTOM OF METADATA
    });
    `;
}

/**
 * Get each JavaScript Module for the give nplugin
 */
function getJSModules(p: Plugin, platform: string) {
  let modules: Array<string> = [];
  if (p.xml['js-module']) {
    modules = modules.concat(p.xml['js-module']);
  }
  const platformModules = getPluginPlatform(p, platform);
  if (platformModules && platformModules['js-module']) {
    modules = modules.concat(platformModules['js-module']);
  }
  return modules;
}


function getWebDir(config: Config, platform: string): string {
  if (platform === 'ios') {
    return config.ios.webDir;
  }
  if (platform === 'android') {
    return config.android.webDir;
  }
  return '';
}

export async function copyCordovaJS(config: Config, platform: string) {
  const cordovaPath = resolve('node_modules', '@capacitor/core', 'cordova.js');
  if (!await existsAsync(cordovaPath)) {
    logFatal(`Unable to find node_modules/@capacitor/core/cordova.js. Are you sure`,
    '@capacitor/core is installed? This file is currently required for Capacitor to function.');
    return;
  }

  return fsCopy(cordovaPath, join(getWebDir(config, platform), 'cordova.js'));
}

export function createEmptyCordovaJS(config: Config, platform: string) {
  writeFileAsync(join(getWebDir(config, platform), 'cordova.js'), '');
  writeFileAsync(join(getWebDir(config, platform), 'cordova_plugins.js'), '');
}

export function removePluginFiles(config: Config, platform: string) {
  const webDir = getWebDir(config, platform);
  const pluginsDir = join(webDir, 'plugins');
  const cordovaPluginsJSFile = join(webDir, 'cordova_plugins.js');
  removeSync(pluginsDir);
  removeSync(cordovaPluginsJSFile);
}

export async function autoGenerateConfig(config: Config, cordovaPlugins: Plugin[], platform: string) {
  let xmlDir = join(config.android.resDir, 'xml');
  let target = 'res/xml/config.xml';
  if (platform === 'ios') {
    xmlDir = join(config.ios.platformDir, config.ios.nativeProjectName, config.ios.nativeProjectName);
    target = 'config.xml';
  }
  ensureDirSync(xmlDir);
  const cordovaConfigXMLFile = join(xmlDir, 'config.xml');
  removeSync(cordovaConfigXMLFile);
  let pluginEntries: Array<any> = [];
  cordovaPlugins.map( p => {
    const currentPlatform = getPluginPlatform(p, platform);
    if (currentPlatform) {
      const configFiles = currentPlatform['config-file'];
      if (configFiles) {
        const configXMLEntries = configFiles.filter(function(item: any) { return item.$.target === target; });
        configXMLEntries.map(  (entry: any)  => {
          const feature = { feature: entry.feature };
          pluginEntries.push(feature);
        });
      }
    }
  });

  const pluginEntriesString: Array<string> = await Promise.all(pluginEntries.map(async (item): Promise<string> => {
    const xmlString = await writeXML(item);
    return xmlString;
  }));
  const content = `<?xml version='1.0' encoding='utf-8'?>
  <widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  ${pluginEntriesString.join('\n')}
  </widget>`;
  writeFileAsync(cordovaConfigXMLFile, content);
}