*Capacitor is being actively developed and is not currently ready for public use. See our [Timeline](#timeline) for our upcoming plans and tentatively timeline*

# ⚡️ Capacitor: Cross-platform apps with JavaScript and the Web ⚡️

Capacitor is a cross-platform API and code execution layer that makes it easy to call Native SDKs from web code and to write custom Native plugins that your app might need.  Additionally, Capacitor provides first-class Progressive Web App support so you can write one app and deploy it to the app stores, _and_ the mobile web.

Capacitor is being designed by the Ionic Framework team as an eventual alternative to Cordova, though backwards compatibility with Cordova plugins is a priority and is actively being worked on. Capacitor can be used without Ionic Framework, but soon it'll become a core part of the Ionic developer experience.

Capacitor also comes with a Plugin API for building native plugins. On iOS, first-class Swift support is available, and much of the iOS Capacitor runtime is written in Swift. Plugins may also be written in Objective-C. On Android, support for writing plugins with Java and Kotlin is supported.

Capacitor is still a work in progress and is not quite ready for use. Stay tuned for a public release in early 2018.

### Timeline

_Disclaimer_: These dates are tentative. "It'll be ready when it's ready!"

*Short term milestones*

 - November 2017 - Project Start
 - January/Feb 2018 - Private alpha testing
 - Feb 2018 - Public alpha
 
### Roadmap

_Disclaimer_: These features and plans may change at any time, we are not making any specific promises around new features

2018

 - Cordova Plugin Integration
   - Preliminary support for using plugins from the existing Cordova community
 - Native Shell Add-ons
   - Support for interacting with Native UI shell elements, such as native menus, tabs, and navigation, with 1-1 fallbacks to the web for first-class Progressive Web App and Electron support.
 - Electron support
   - Support for building Electron apps and interacting with Node.js libraries


### Directory Structure

* `cli`: Capacitor CLI
* `core`: Capacitor Core JS library
* `ios`: Capacitor iOS Runtime
* `ios-template`: Default iOS App installed by the CLI
* `android`: Capacitor Android Runtime
* `android-template`: Default Android App installed by the CLI
* `example`: iOS Example for development
