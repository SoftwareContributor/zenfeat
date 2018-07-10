import { Config } from '../config';
import { buildXmlElement, log, logInfo, parseXML, runTask } from '../common';
import { getAllElements, getFilePath, getPlatformElement, getPluginPlatform, getPlugins, getPluginType, printPlugins, Plugin, PluginType } from '../plugin';
import { getAndroidPlugins } from './common';
import { checkAndInstallDependencies, handleCordovaPluginsJS } from '../cordova';
import { copySync, readFileAsync, removeSync, writeFileAsync } from '../util/fs';
import { join, resolve } from 'path';

const platform = 'android';

export async function updateAndroid(config: Config) {
  let plugins = await getPluginsTask(config);

  const capacitorPlugins = plugins.filter(p => getPluginType(p, platform) === PluginType.Core);

  let cordovaPlugins: Array<Plugin> = [];
  let needsPluginUpdate = true;
  while (needsPluginUpdate) {
    cordovaPlugins = plugins
      .filter(p => getPluginType(p, platform) === PluginType.Cordova);
    needsPluginUpdate = await checkAndInstallDependencies(config, cordovaPlugins, platform);
    if (needsPluginUpdate) {
      plugins = await getPluginsTask(config);
    }
  }

  printPlugins(capacitorPlugins, 'android');

  removePluginsNativeFiles(config);
  if (cordovaPlugins.length > 0) {
    copyPluginsNativeFiles(config, cordovaPlugins);
  }
  await handleCordovaPluginsJS(cordovaPlugins, config, platform);
  await installGradlePlugins(config, capacitorPlugins, cordovaPlugins);
  await handleCordovaPluginsGradle(config, cordovaPlugins);
  await writeCordovaAndroidManifest(cordovaPlugins, config);

  const incompatibleCordovaPlugins = plugins
  .filter(p => getPluginType(p, platform) === PluginType.Incompatible);
  printPlugins(incompatibleCordovaPlugins, platform, 'incompatible');

}

function getGradlePackageName(id: string): string {
    return id.replace('@', '').replace('/', '-');
}

export async function installGradlePlugins(config: Config, capacitorPlugins: Plugin[], cordovaPlugins: Plugin[]) {
  const settingsLines = `// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN
${capacitorPlugins.map(p => {
  return `
include ':${getGradlePackageName(p.id)}'
project(':${getGradlePackageName(p.id)}').projectDir = new File('../node_modules/${p.id}/android/${p.id}')
`;
}).join('')}`;

  let applyArray: Array<any> = [];
  let frameworksArray: Array<any> = [];
  let prefsArray: Array<any> = [];
  cordovaPlugins.map( p => {
    const frameworks = getPlatformElement(p, platform, 'framework');
    frameworks.map((framework: any) => {
      if (framework.$.custom && framework.$.custom === 'true' && framework.$.type && framework.$.type === 'gradleReference') {
        applyArray.push(`apply from: "../../node_modules/${p.id}/${framework.$.src}"`);
      } else if (!framework.$.type && !framework.$.custom) {
        frameworksArray.push(`    implementation "${framework.$.src}"`);
      }
    });
    prefsArray = prefsArray.concat(getAllElements(p, platform, 'preference'));
  });
  let frameworkString = frameworksArray.join('\n');
  prefsArray.map((preference: any) => {
    frameworkString = frameworkString.replace(new RegExp(('$'+preference.$.name).replace('$', '\\$&'), 'g'), preference.$.default);
  });
  const dependencyLines = `// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN

dependencies {
${capacitorPlugins.map(p => {
    return `    implementation project(':${getGradlePackageName(p.id)}')`;
  }).join('\n')}
${frameworkString}
}
${applyArray.join('\n')}

if (hasProperty('postBuildExtras')) {
  postBuildExtras()
}
`;

  await writeFileAsync(join(config.app.rootDir, 'android/capacitor.settings.gradle'), settingsLines);
  await writeFileAsync(join(config.app.rootDir, 'android/app/capacitor.build.gradle'), dependencyLines);
}

export async function handleCordovaPluginsGradle(config: Config,  cordovaPlugins: Plugin[]) {
  const pluginsFolder = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-android-plugins');
  const pluginsGradlePath = join(pluginsFolder, 'build.gradle');
  let frameworksArray: Array<any> = [];
  let prefsArray: Array<any> = [];
  let applyArray: Array<any> = [];
  cordovaPlugins.map( p => {
    const frameworks = getPlatformElement(p, platform, 'framework');
    frameworks.map((framework: any) => {
      if (!framework.$.type && !framework.$.custom) {
        frameworksArray.push(framework.$.src);
      } else if (framework.$.custom && framework.$.custom === 'true' && framework.$.type && framework.$.type === 'gradleReference') {
        applyArray.push(`apply from: "../../../../${p.id}/${framework.$.src}"`);
      }
    });
    prefsArray = prefsArray.concat(getAllElements(p, platform, 'preference'));
  });
  let frameworkString = frameworksArray.map(f => {
    return `    implementation "${f}"`;
  }).join('\n');
  prefsArray.map((preference: any) => {
    frameworkString = frameworkString.replace(new RegExp(('$'+preference.$.name).replace('$', '\\$&'), 'g'), preference.$.default);
  });
  let applyString = applyArray.join('\n');
  let buildGradle = await readFileAsync(pluginsGradlePath, 'utf8');
  buildGradle = buildGradle.replace(/(SUB-PROJECT DEPENDENCIES START)[\s\S]*(\/\/ SUB-PROJECT DEPENDENCIES END)/, '$1\n' + frameworkString.concat('\n') + '    $2');
  buildGradle = buildGradle.replace(/(PLUGIN GRADLE EXTENSIONS START)[\s\S]*(\/\/ PLUGIN GRADLE EXTENSIONS END)/, '$1\n' + applyString.concat('\n') + '$2');
  await writeFileAsync(pluginsGradlePath, buildGradle);
}

function copyPluginsNativeFiles(config: Config, cordovaPlugins: Plugin[]) {
  const pluginsRoot = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-android-plugins');
  const pluginsPath = join(pluginsRoot, 'src', 'main');
  cordovaPlugins.map(p => {
    const androidPlatform = getPluginPlatform(p, platform);
    if (androidPlatform) {
      const sourceFiles = androidPlatform['source-file'];
      if (sourceFiles) {
        sourceFiles.map((sourceFile: any) => {
          const fileName = sourceFile.$.src.split('/').pop();
          const target = sourceFile.$['target-dir'].replace('app/src/main/', '').replace('src/', 'java/');
          copySync(getFilePath(config, p, sourceFile.$.src), join(pluginsPath, target, fileName));
        });
      }
      const resourceFiles = androidPlatform['resource-file'];
      if (resourceFiles) {
        resourceFiles.map((resourceFile: any) => {
          const target = resourceFile.$['target'];
          if (resourceFile.$.src.split('.').pop() === 'aar') {
            copySync(getFilePath(config, p, resourceFile.$.src), join(pluginsPath, 'libs', target.split('/').pop()));
          } else if (target !== ".") {
            copySync(getFilePath(config, p, resourceFile.$.src), join(pluginsPath, target));
          }
        });
      }
      const libFiles = getPlatformElement(p, platform, 'lib-file');
      libFiles.map((libFile: any) => {
        copySync(getFilePath(config, p, libFile.$.src), join(pluginsPath, 'libs', libFile.$.src.split('/').pop()));
      });
    }
  });
}

function removePluginsNativeFiles(config: Config) {
  const pluginsRoot = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-android-plugins');
  const pluginsPath = join(pluginsRoot, 'src', 'main');
  removeSync(join(pluginsPath, 'java'));
  removeSync(join(pluginsPath, 'res'));
  removeSync(join(pluginsPath, 'libs'));
}

async function getPluginsTask(config: Config) {
  return await runTask('Updating Android plugins', async () => {
    const allPlugins = await getPlugins(config);
    const androidPlugins = await getAndroidPlugins(config, allPlugins);
    return androidPlugins;
  });
}

async function writeCordovaAndroidManifest(cordovaPlugins: Plugin[], config: Config) {
  const pluginsFolder = resolve(config.app.rootDir, 'node_modules', '@capacitor/cli', 'assets', 'capacitor-android-plugins');
  const manifestPath = join(pluginsFolder, 'src', 'main', 'AndroidManifest.xml');
  let rootXMLEntries: Array<any> = [];
  let applicationXMLEntries: Array<any> = [];
  cordovaPlugins.map(async p => {
    const editConfig = getPlatformElement(p, platform, 'edit-config');
    const configFile = getPlatformElement(p, platform, 'config-file');
    editConfig.concat(configFile).map(async (configElement: any) => {
      if (configElement.$.target.includes('AndroidManifest.xml')) {
        const keys = Object.keys(configElement).filter(k  => k !== '$');
        keys.map(k => {
          configElement[k].map((e: any) => {
            const xmlElement = buildXmlElement(e, k);
            const pathParts = getPathParts(configElement.$.parent);
            if(pathParts.length > 1) {
              if (pathParts.pop() === 'application') {
                if (!applicationXMLEntries.includes(xmlElement) && !contains(applicationXMLEntries, xmlElement, k)) {
                  applicationXMLEntries.push(xmlElement);
                }
              } else {
                logInfo(`plugin ${p.id} requires to add \n  ${xmlElement} to your Info.plist to work`);
              }
            } else {
              if (!rootXMLEntries.includes(xmlElement) && !contains(rootXMLEntries, xmlElement, k)) {
                rootXMLEntries.push(xmlElement);
              }
            }
          });
        });
      }
    });
  });
  let content = `<?xml version='1.0' encoding='utf-8'?>
<manifest package="capacitor.android.plugins" xmlns:android='http://schemas.android.com/apk/res/android'>
<application>
${applicationXMLEntries.join('\n')}
</application>
${rootXMLEntries.join('\n')}
</manifest>`;
  await writeFileAsync(manifestPath, content);
}

function getPathParts(path: string) {
  const rootPath = 'manifest';
  path = path.replace('/*', rootPath);
  let parts = path.split('/').filter(part => part !== '');
  if (parts.length > 1 || parts.includes(rootPath)) {
    return parts;
  }
  return [rootPath, path];
}

function contains(a: Array<any>, obj: any, k: string) {
  const element = parseXML(obj);
  for (var i = 0; i < a.length; i++) {
    const current = parseXML(a[i]);
    if (element && current && current[k]  && element[k] && current[k].$ && element[k].$ && element[k].$["android:name"] === current[k].$["android:name"]){
      return true;
    }
  }
  return false;
}