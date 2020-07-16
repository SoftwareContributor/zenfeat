#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>

@class CAPBridge;
@class CAPPluginCall;
@class CAPConfig;

@interface CAPPlugin : NSObject

@property (nonatomic, weak, nullable) WKWebView *webView;
@property (nonatomic, weak, nullable) CAPBridge *bridge;
@property (nonatomic, strong, nonnull) NSString *pluginId;
@property (nonatomic, strong, nonnull) NSString *pluginName;
@property (nonatomic, strong, nullable) NSMutableDictionary<NSString *, NSMutableArray<CAPPluginCall *>*> *eventListeners;
@property (nonatomic, strong, nullable) NSMutableDictionary<NSString *, id> *retainedEventArguments;

- (instancetype _Nonnull) initWithBridge:(CAPBridge* _Nonnull) bridge pluginId:(NSString* _Nonnull) pluginId pluginName:(NSString* _Nonnull) pluginName;
- (void)addEventListener:(NSString* _Nonnull)eventName listener:(CAPPluginCall* _Nonnull)listener;
- (void)removeEventListener:(NSString* _Nonnull)eventName listener:(CAPPluginCall* _Nonnull)listener;
- (void)notifyListeners:(NSString* _Nonnull)eventName data:(NSDictionary<NSString *, id>* _Nullable)data;
- (void)notifyListeners:(NSString* _Nonnull)eventName data:(NSDictionary<NSString *, id>* _Nullable)data retainUntilConsumed:(BOOL)retain;
- (NSArray<CAPPluginCall *>* _Nullable)getListeners:(NSString* _Nonnull)eventName;
- (BOOL)hasListeners:(NSString* _Nonnull)eventName;
- (void)addListener:(CAPPluginCall* _Nonnull)call;
- (void)removeListener:(CAPPluginCall* _Nonnull)call;
- (void)removeAllListeners:(CAPPluginCall* _Nonnull)call;
/**
 * Give the plugins a chance to take control when a URL is about to be loaded in the WebView.
 * Returning true causes the WebView to abort loading the URL.
 * Returning false causes the WebView to continue loading the URL.
 * Returning nil will defer to the default Capacitor policy
 */
- (NSNumber* _Nullable)shouldOverrideLoad:(WKNavigationAction* _Nonnull)navigationAction;

// Called after init if the plugin wants to do
// some loading so the plugin author doesn't
// need to override init()
-(void)load;
-(NSString* _Nonnull)getId;
-(BOOL)getBool:(CAPPluginCall* _Nonnull) call field:(NSString* _Nonnull)field defaultValue:(BOOL)defaultValue;
-(NSString* _Nullable)getString:(CAPPluginCall* _Nonnull)call field:(NSString* _Nonnull)field defaultValue:(NSString* _Nonnull)defaultValue;
-(id _Nullable)getConfigValue:(NSString* _Nonnull)key;
-(void)setCenteredPopover:(UIViewController* _Nonnull)vc;
-(BOOL)supportsPopover;

@end
