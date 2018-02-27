import { checkCocoaPods, checkIOSProject, getIOSPlugins } from './common';
import { CheckFunction, log, logInfo, logWarn, runCommand, runTask } from '../common';
import { copySync, removeSync, writeFileAsync } from '../util/fs';
import { Config } from '../config';
import { join, resolve } from 'path';
import { getPlatformElement, getPluginPlatform, getPlugins, getPluginType, Plugin, PluginType, printPlugins } from '../plugin';
import { handleCordovaPluginsJS } from '../cordova';

import * as inquirer from 'inquirer';
import { create } from 'domain';

export const updateIOSChecks: CheckFunction[] = [checkCocoaPods, checkIOSProject];
const platform = 'ios';

export async function updateIOS(config: Config, needsUpdate: boolean) {
  var chalk = require('chalk');
  /*
  log(`\n${chalk.bold('iOS Note:')} you should periodically run "pod repo update" to make sure your ` +
          `local Pod repo is up to date and can find new Pod releases.\n`);
  */


  /*
  var answers = await inquirer.prompt([{
    type: 'input',
    name: 'updateRepo',
    message: `Run "pod repo update" to make sure you have the latest Pods available before updating (takes a few minutes)?`,
    default: 'n'
  }]);

  if (answers.updateRepo === 'y') {
    await runTask(`Running pod repo update to update CocoaPods`, () => {
      return runCommand(`pod repo update`);
    });
  }
  */

  const plugins = await runTask('Fetching installed plugins', async () => {
    const allPlugins = await getPlugins(config);
    const iosPlugins = await getIOSPlugins(config, allPlugins);
    return iosPlugins;
  });
  console.log('iOS found these plugins: ', plugins);

  printPlugins(plugins);

  removePluginsNativeFiles(config);
  const cordovaPlugins = plugins
    .filter(p => getPluginType(p, platform) === PluginType.Cordova);
  if (cordovaPlugins.length > 0) {
    copyPluginsNativeFiles(config, cordovaPlugins);
  }
  await handleCordovaPluginsJS(cordovaPlugins, config, platform);
  await autoGeneratePods(config, plugins);
  await generateCordovaPodspec(cordovaPlugins, config);
  await installCocoaPodsPlugins(config, plugins, needsUpdate);

  logWarn(`${chalk.bold('iOS Note:')} you should periodically run "pod repo update" to make sure your ` +
          `local Pod repo is up to date and can find new Pod releases.`);
}

export async function autoGeneratePods(config: Config, plugins: Plugin[]): Promise<void[]> {
  // Always re-generate the podspec to keep it up to date
  return Promise.all(plugins.filter(p => p.ios!.type !== PluginType.Cordova)
    .map(async p => {
      const name = p.ios!.name = p.name;
      const content = generatePodspec(config, p);
      const path = join(p.rootPath, p.ios!.path, name + '.podspec');
      return writeFileAsync(path, content);
    }));
}

export function generatePodspec(config: Config, plugin: Plugin) {
  const repo = (plugin.repository && plugin.repository.url) || 'https://github.com/ionic-team/does-not-exist.git';
  return `
  Pod::Spec.new do |s|
    s.name = '${plugin.name}'
    s.version = '${plugin.version}'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Capacitor Generator' => 'hi@example.com' }
    s.source = { :git => '${repo}', :tag => '${plugin.version}' }
    s.source_files = 'Plugin/Plugin/**/*.{swift,h,m}'
    s.ios.deployment_target  = '${config.ios.minVersion}'
    s.dependency 'Capacitor'
  end`;
}

export async function installCocoaPodsPlugins(config: Config, plugins: Plugin[], needsUpdate: boolean) {
  await runTask('Updating iOS native dependencies', () => {
    return updatePodfile(config, plugins, needsUpdate);
  });
}

export async function updatePodfile(config: Config, plugins: Plugin[], needsUpdate: boolean) {
  const content = generatePodFile(config, plugins);
  const projectName = config.ios.nativeProjectName;
  const podfilePath = resolve(config.app.rootDir, config.ios.name, projectName, 'Podfile');

  await writeFileAsync(podfilePath, content, 'utf8');

  if (needsUpdate) {
    await runCommand(`cd ${config.app.rootDir} && cd ${config.ios.name} && cd ${projectName} && pod update && xcodebuild -project App.xcodeproj clean`);
  } else {
    await runCommand(`cd ${config.app.rootDir} && cd ${config.ios.name} && cd ${projectName} && pod install && xcodebuild -project App.xcodeproj clean`);
  }
}

export function generatePodFile(config: Config, plugins: Plugin[]) {
  const capacitorPlugins = plugins.filter(p => p.ios!.type !== PluginType.Cordova);
  const pods = capacitorPlugins
    .map((p) => `pod '${p.ios!.name}', :path => '../../node_modules/${p.id}/${p.ios!.path}'`);
  const cordovaPlugins = plugins.filter(p => p.ios!.type === PluginType.Cordova);
  let dependencies = '';
  cordovaPlugins.map((p: any) => {
    const frameworks = getPlatformElement(p, platform, 'framework');
    frameworks.map((framework: any) => {
      if (framework.$.type && framework.$.type === 'podspec') {
        dependencies += `pod '${framework.$.src}', '${framework.$.spec}'\n      `;
      }
    });
  });
  return `
# DO NOT MODIFY.
# This Podfile was autogenerated by the Capacitor CLI.
# It is used to resolve the native dependencies of Capacitor plugins.

platform :ios, '${config.ios.minVersion}'
use_frameworks!

target 'App' do
  ${config.ios.capacitorRuntimePod}
  pod 'CordovaPlugins', :path => '../../node_modules/@capacitor/cli/assets/capacitor-cordova-ios-plugins'
  pod 'CordovaPluginsResources', :path => '../../node_modules/@capacitor/cli/assets/capacitor-cordova-ios-plugins'
  ${pods.join('\n      ')}
  ${dependencies}
end`;
}

function getFrameworkName(framework: any) {
  if (isFramework(framework)) {
    if (framework.$.custom && framework.$.custom === 'true') {
      return framework.$.src;
    }
    return framework.$.src.substr(0, framework.$.src.indexOf('.'));
  }
  return framework.$.src.substr(0, framework.$.src.indexOf('.')).replace('lib','');
}

function isFramework(framework: any) {
  return framework.$.src.split(".").pop() === 'framework';
}

async function generateCordovaPodspec(cordovaPlugins: Plugin[], config: Config) {
  const pluginsPath = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-cordova-ios-plugins');
  let weakFrameworks: Array<string> = [];
  let linkedFrameworks: Array<string> = [];
  let customFrameworks: Array<string> = [];
  let systemLibraries: Array<string> = [];
  cordovaPlugins.map((plugin: any) => {
    const frameworks = getPlatformElement(plugin, platform, 'framework');
    frameworks.map((framework: any) => {
      if (!framework.$.type) {
        const name = getFrameworkName(framework);
        if (isFramework(framework)) {
          if (framework.$.weak && framework.$.weak === 'true') {
            if (!weakFrameworks.includes(name)) {
              weakFrameworks.push(name);
            }
          } if (framework.$.custom && framework.$.custom === 'true') {
            if (!customFrameworks.includes(name)) {
              customFrameworks.push(name);
            }
          } else {
            if (!linkedFrameworks.includes(name)) {
              linkedFrameworks.push(name);
            }
          }
        } else {
          if (!systemLibraries.includes(name)) {
            systemLibraries.push(name);
          }
        }
      }
    });
  });
  let frameworkDeps: Array<string> = [];
  if (weakFrameworks.length > 0) {
    frameworkDeps.push(`s.weak_frameworks = '${weakFrameworks.join("', '")}'`);
  }
  if (linkedFrameworks.length > 0) {
    frameworkDeps.push(`s.frameworks = '${linkedFrameworks.join("', '")}'`);
  }
  if (systemLibraries.length > 0) {
    frameworkDeps.push(`s.libraries = '${systemLibraries.join("', '")}'`);
  }
  if (customFrameworks.length > 0) {
    frameworkDeps.push(`s.vendored_frameworks = '${customFrameworks.join("', '")}'`);
  }
  const frameworksString = frameworkDeps.join("\n    ");
  const content = `
  Pod::Spec.new do |s|
    s.name = 'CordovaPlugins'
    s.version = '${config.cli.package.version}'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Capacitor Generator' => 'hi@example.com' }
    s.source = { :git => 'https://github.com/ionic-team/does-not-exist.git', :tag => '${config.cli.package.version}' }
    s.source_files = 'sources/**/*.{swift,h,m}'
    s.ios.deployment_target  = '${config.ios.minVersion}'
    s.dependency 'CapacitorCordova'
    ${frameworksString}
  end`;
  await writeFileAsync(join(pluginsPath,'CordovaPlugins.podspec'), content);
}

function copyPluginsNativeFiles(config: Config, cordovaPlugins: Plugin[]) {
  const pluginsPath = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-cordova-ios-plugins');
  cordovaPlugins.map( p => {
    const sourceFiles = getPlatformElement(p, platform, 'source-file');
    const headerFiles = getPlatformElement(p, platform, 'header-file');
    const codeFiles = sourceFiles.concat(headerFiles);
    codeFiles.map( (codeFile: any) => {
      const fileName = codeFile.$.src.split("/").pop();
      copySync(join(p.rootPath, codeFile.$.src), join(pluginsPath, 'sources', p.name, fileName));
    });
    const resourceFiles = getPlatformElement(p, platform, 'resource-file');
    resourceFiles.map( (resourceFile: any) => {
      const fileName = resourceFile.$.src.split("/").pop();
      copySync(join(p.rootPath, resourceFile.$.src), join(pluginsPath, 'resources', fileName));
    });
    const frameworks = getPlatformElement(p, platform, 'framework');
    frameworks.map((framework: any) => {
      if (framework.$.custom && framework.$.custom === 'true') {
        copySync(join(p.rootPath, framework.$.src),  join(pluginsPath, framework.$.src));
      }
    });
  });
}

function removePluginsNativeFiles(config: Config) {
  const pluginsPath = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-cordova-ios-plugins');
  removeSync(join(pluginsPath, 'sources'));
  removeSync(join(pluginsPath, 'resources'));
}
