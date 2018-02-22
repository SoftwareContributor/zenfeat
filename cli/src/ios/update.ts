import { checkCocoaPods, checkIOSProject, getIOSPlugins } from './common';
import { CheckFunction, log, logInfo, runCommand, runTask } from '../common';
import { writeFileAsync } from '../util/fs';
import { Config } from '../config';
import { join } from 'path';
import { getPlatformElement, getPlugins, getPluginType, Plugin, PluginType, printPlugins } from '../plugin';
import { handleCordovaPluginsJS } from '../cordova';

import * as inquirer from 'inquirer';
import { create } from 'domain';

export const updateIOSChecks: CheckFunction[] = [checkCocoaPods, checkIOSProject];
const platform = 'ios';

export async function updateIOS(config: Config, needsUpdate: boolean) {
  var chalk = require('chalk');
  log(`\n${chalk.bold('iOS Note:')} you should periodically run "pod repo update" to make sure your ` +
          `local Pod repo is up to date and can find new Pod releases.\n`);


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

  const plugins = await runTask('Fetching plugins', async () => {
    const allPlugins = await getPlugins();
    const iosPlugins = await getIOSPlugins(allPlugins);
    return iosPlugins;
  });

  printPlugins(plugins);

  const cordovaPlugins = plugins
    .filter(p => getPluginType(p, platform) === PluginType.Cordova);

  await handleCordovaPluginsJS(cordovaPlugins, config, platform);
  await autoGeneratePods(config, plugins);
  await autoGenerateResourcesPods(cordovaPlugins);
  await installCocoaPodsPlugins(config, plugins, needsUpdate);
}

export async function autoGeneratePods(config: Config, plugins: Plugin[]): Promise<void[]> {
  // Always re-generate the podspec to keep it up to date
  return Promise.all(plugins
    // .filter(p => p.ios!.type !== PluginType.Cocoapods)
    .map(async p => {
      const name = p.ios!.name = p.name;
      const content = generatePodspec(config, p);
      const path = join(p.rootPath, p.ios!.path, name + '.podspec');
      return writeFileAsync(path, content);
    }));
}

export async function autoGenerateResourcesPods(plugins: Plugin[]): Promise<void[]> {
  const pluginResourceFiles = plugins.filter(p => getPlatformElement(p, platform, 'resource-file').length > 0);
  return Promise.all(pluginResourceFiles
    .map(async p => {
      const name = p.name + 'Resources';
      const content = generateResourcesPodspec(p);
      const path = join(p.rootPath, p.ios!.path, name + '.podspec');
      return writeFileAsync(path, content);
    }));
}

export function generatePodspec(config: Config, plugin: Plugin) {
  const repo = (plugin.repository && plugin.repository.url) || 'https://github.com/ionic-team/does-not-exist.git';
  let sourceFiles = 'Plugin/Plugin/**/*.{swift,h,m}';
  let frameworksString = "";
  let dependency = 'Capacitor';
  if (plugin.ios!.type === PluginType.Cordova) {
    dependency = 'CapacitorCordova';
    sourceFiles = '*.{swift,h,m}';
    let weakFrameworks: Array<string> = [];
    let linkedFrameworks: Array<string> = [];
    let systemLibraries: Array<string> = [];
    const frameworks = getPlatformElement(plugin, platform, 'framework');
    frameworks.map((framework: any) => {
      if (!framework.$.type) {
        const name = getFrameworkName(framework);
        if (isFramework(framework)) {
          if (framework.$.weak && framework.$.weak === 'true') {
            weakFrameworks.push(name);
          } else {
            linkedFrameworks.push(name);
          }
        } else {
          systemLibraries.push(name);
        }
      }
    });
    if (weakFrameworks.length > 0) {
      frameworksString += `s.weak_frameworks = '${weakFrameworks.join("', '")}'`;
    }
    if (linkedFrameworks.length > 0) {
      if (frameworksString !== "") {
        frameworksString += '\n    ';
      }
      frameworksString += `s.frameworks = '${linkedFrameworks.join("', '")}'`;
    }
    if (systemLibraries.length > 0) {
      if (frameworksString !== "") {
        frameworksString += '\n    ';
      }
      frameworksString += `s.libraries = '${systemLibraries.join("', '")}'`;
    }
  }
  return `
  Pod::Spec.new do |s|
    s.name = '${plugin.name}'
    s.version = '${plugin.version}'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Capacitor Generator' => 'hi@example.com' }
    s.source = { :git => '${repo}', :tag => '${plugin.version}' }
    s.source_files = '${sourceFiles}'
    s.ios.deployment_target  = '${config.ios.minVersion}'
    s.dependency '${dependency}'
    ${frameworksString}
  end`;
}

export function generateResourcesPodspec(plugin: Plugin) {
  const repo = (plugin.repository && plugin.repository.url) || 'https://github.com/ionic-team/does-not-exist.git';
  const resources = getPlatformElement(plugin, platform, 'resource-file');
  let resourceFiles: Array<string> = [];
  resources.map((resource: any) => {
    resourceFiles.push (resource.$.src.replace('src/ios/', ''))
  });
  return `
  Pod::Spec.new do |s|
    s.name = '${plugin.name}Resources'
    s.version = '${plugin.version}'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Capacitor Generator' => 'hi@example.com' }
    s.source = { :git => '${repo}', :tag => '${plugin.version}' }
    s.resources = ['${resourceFiles.join("', '")}']
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
  const podfilePath = join(config.ios.name, projectName, 'Podfile');

  await writeFileAsync(podfilePath, content, 'utf8');

  if (needsUpdate) {
    await runCommand(`cd ${config.ios.name} && cd ${projectName} && pod update && xcodebuild -project App.xcodeproj clean`);
  } else {
    await runCommand(`cd ${config.ios.name} && cd ${projectName} && pod install && xcodebuild -project App.xcodeproj clean`);
  }
}

export function generatePodFile(config: Config, plugins: Plugin[]) {
  const pods = plugins
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
    if (getPlatformElement(p, platform, 'resource-file').length > 0) {
      pods.push(`pod '${p.ios!.name}Resources', :path => '../../node_modules/${p.id}/${p.ios!.path}'`);
    }
  });
  return `
# DO NOT MODIFY.
# This Podfile was autogenerated by the Capacitor CLI.
# It is used to resolve the native dependencies of Capacitor plugins.

platform :ios, '${config.ios.minVersion}'
use_frameworks!

target 'App' do
  ${config.ios.capacitorRuntimePod}
  ${pods.join('\n      ')}
  ${dependencies}
end`;
}

function getFrameworkName(framework: any) {
  if (isFramework(framework)) {
    return framework.$.src.substr(0, framework.$.src.indexOf('.'));
  } else {
    return framework.$.src.substr(0, framework.$.src.indexOf('.')).replace('lib','');
  }
}

function isFramework(framework: any) {
  return framework.$.src.split(".").pop() === 'framework';
}