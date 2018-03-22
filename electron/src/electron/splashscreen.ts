import {
  WebPlugin, SplashScreenPlugin,
  SplashScreenHideOptions, SplashScreenShowOptions
} from "@capacitor/core";

export class SplashScreenPluginElectron extends WebPlugin implements SplashScreenPlugin {

  ipc:any = null;

  constructor() {
    super({
      name: 'SplashScreen',
      platforms: ['electron']
    });

    this.ipc = require('electron').ipcRenderer;

  }

  show(options?: SplashScreenShowOptions, callback?: Function): void {
    this.ipc.send('showCapacitorSplashScreen', {...options});
    callback();
  }

  hide(options?: SplashScreenHideOptions, callback?: Function): void {
    this.ipc.send('hideCapacitorSplashScreen', {...options});
    callback();
  }

}

const SplashScreen = new SplashScreenPluginElectron();

export { SplashScreen };
