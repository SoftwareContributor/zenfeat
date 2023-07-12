package com.getcapacitor.plugin;

import android.webkit.JavascriptInterface;
import androidx.annotation.Nullable;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginConfig;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.CookieHandler;
import java.net.HttpCookie;
import java.net.URI;

@CapacitorPlugin
public class CapacitorCookies extends Plugin {

    CapacitorCookieManager cookieManager;

    @Override
    public void load() {
        this.bridge.getWebView().addJavascriptInterface(this, "CapacitorCookiesAndroidInterface");
        this.cookieManager = new CapacitorCookieManager(null, java.net.CookiePolicy.ACCEPT_ALL, this.bridge);
        CookieHandler.setDefault(this.cookieManager);
        super.load();
    }

    @JavascriptInterface
    public boolean isEnabled() {
        PluginConfig pluginConfig = getBridge().getConfig().getPluginConfiguration("CapacitorCookies");
        return pluginConfig.getBoolean("enabled", false);
    }

    @JavascriptInterface
    public String getCookies() {
        String cookieString = cookieManager.getCookieString(null);
        return (null == cookieString) ? "" : cookieString;
    }

    @JavascriptInterface
    public void setCookie(String domain, String action) {
        cookieManager.setCookie(domain, action);
    }

    @PluginMethod
    public void getCookies(PluginCall call) {
        String url = call.getString("url");
        JSObject cookiesMap = new JSObject();
        HttpCookie[] cookies = cookieManager.getCookies(url);
        for (HttpCookie cookie : cookies) {
            cookiesMap.put(cookie.getName(), cookie.getValue());
        }
        call.resolve(cookiesMap);
    }

    @PluginMethod
    public void setCookie(PluginCall call) {
        String key = call.getString("key");
        if (null == key) {
            call.reject("Must provide key");
        }
        String value = call.getString("value");
        if (null == value) {
            call.reject("Must provide value");
        }
        String url = call.getString("url");
        String expires = call.getString("expires", "");
        String path = call.getString("path", "/");
        cookieManager.setCookie(url, key, value, expires, path);
        call.resolve();
    }

    @PluginMethod
    public void deleteCookie(PluginCall call) {
        String key = call.getString("key");
        if (null == key) {
            call.reject("Must provide key");
        }
        String url = call.getString("url");
        cookieManager.setCookie(url, key + "=; Expires=Wed, 31 Dec 2000 23:59:59 GMT");
        call.resolve();
    }

    @PluginMethod
    public void clearCookies(PluginCall call) {
        String url = call.getString("url");
        HttpCookie[] cookies = cookieManager.getCookies(url);
        for (HttpCookie cookie : cookies) {
            cookieManager.setCookie(url, cookie.getName() + "=; Expires=Wed, 31 Dec 2000 23:59:59 GMT");
        }
        call.resolve();
    }

    @PluginMethod
    public void clearAllCookies(PluginCall call) {
        cookieManager.removeAllCookies();
        call.resolve();
    }
}
