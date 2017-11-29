import { NativePlugin, Plugin } from '../plugin';

export interface SplashScreenShowOptions {
  autoHide?: boolean;
  fadeDuration?: number;
  showDuration?: number;
}

@NativePlugin({
  name: 'SplashScreen',
  id: 'com.avocadojs.plugin.splashscreen'
})
export class SplashScreen extends Plugin {

  show(options?: SplashScreenShowOptions, callback?: Function) {
    this.nativeCallback('show', options, callback);
  }

  hide(options?: SplashScreenHideOptions, callback?: Function) {
    this.nativeCallback('hide', options, callback);
  }
}