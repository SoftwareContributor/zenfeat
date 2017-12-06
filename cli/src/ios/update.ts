import { checkCocoaPods, checkIOSProject, getIOSPlugins } from './common';
import { check, checkPackage, logInfo, runCommand, runTask, writeFileAsync } from '../common';
import { Config } from '../config';
import { join } from 'path';
import { Plugin, PluginType, getPlugins } from '../plugin';


export async function updateIOS(config: Config, needsUpdate: boolean) {
  await runTask('Checking environment', () => (check(
    config,
    [checkCocoaPods, checkPackage, checkIOSProject]
  )));

  const plugins = await runTask('Fetching plugins', async () => {
    const allplugins = await getPlugins();
    const iosPlugins = await getIOSPlugins(allplugins);
    return iosPlugins;
  });

  if (plugins.length > 0) {
    logInfo('found', plugins.length, 'native modules\n',
      plugins.map(p => `          - ${p.id}\n`).join(''));
  } else {
    logInfo('no avocado plugin was found, that\'s ok, you can add more plugins later');
  }

  await autoGeneratePods(plugins);
  await installCocoaPodsPlugins(config, plugins, needsUpdate);
}


export async function autoGeneratePods(plugins: Plugin[]): Promise<void[]> {
  return Promise.all(plugins
    .filter(p => p.ios!.type === PluginType.Code)
    .map(async p => {
      const name = p.ios!.name = p.name;
      p.ios!.type = PluginType.Cocoapods;

      const content = generatePodspec(name);
      const path = join(p.ios!.path, name + '.podspec');
      return writeFileAsync(path, content);
    }));
}


export function generatePodspec(name: string) {
  return `
  Pod::Spec.new do |s|
    s.name = '${name}'
    s.version = '0.0.1'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Avocado generator' => 'hi@ionicframework.com' }
    s.source = { :git => 'https://github.com/ionic-team/avocado.git', :tag => '0.0.1' }
    s.source_files = '*.{swift,h,m}'
  end`;
}


export async function installCocoaPodsPlugins(config: Config, plugins: Plugin[], needsUpdate: boolean) {
  const pods = plugins
    .filter(p => p.ios!.type === PluginType.Cocoapods);

  await runTask('Updating iOS native dependencies', () => {
    return updatePodfile(config, pods, needsUpdate);
  });
}


export async function updatePodfile(config: Config, plugins: Plugin[], needsUpdate: boolean) {
  const content = generatePodFile(config, plugins);
  const podfilePath = join(config.ios.name, 'Podfile');

  await writeFileAsync(podfilePath, content, 'utf8');

  if (needsUpdate) {
    await runCommand(`cd ${config.ios.name} && pod update`);
  } else {
    await runCommand(`cd ${config.ios.name} && pod install`);
  }
}


export function generatePodFile(config: Config, plugins: Plugin[]) {
  const pods = plugins
    .map((p) => `pod '${p.ios!.name}', :path => '${p.ios!.path}'`);

  return `
    # DO NOT MODIFY.
    # This Podfile was autogenerated by avocado CLI.
    # It is used to resolve the native dependencies of the avocado plugins.

    platform :ios, '${config.ios.minVersion}'
    use_frameworks!

    target 'AvocadoApp' do
      ${config.ios.avocadoRuntimePod}
      ${pods.join('\n')}
    end`;
}
