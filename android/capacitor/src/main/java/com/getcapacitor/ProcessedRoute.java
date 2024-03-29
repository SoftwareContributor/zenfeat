package com.getcapacitor;

/**
 * An data class used in conjunction with RouteProcessor.
 *
 * @see com.getcapacitor.RouteProcessor
 */
public class ProcessedRoute {

    private String path;
    private boolean isAsset;
    private boolean ignoreAssetPath;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public boolean isAsset() {
        return isAsset;
    }

    public void setAsset(boolean asset) {
        isAsset = asset;
    }

    public boolean isIgnoreAssetPath() {
        return ignoreAssetPath;
    }

    public void setIgnoreAssetPath(boolean ignoreAssetPath) {
        this.ignoreAssetPath = ignoreAssetPath;
    }
}
