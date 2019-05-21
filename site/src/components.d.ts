/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */


import '@stencil/core';

import '@stencil/state-tunnel';
import '@stencil/router';
import {
  MarkdownContent,
  MarkdownHeading,
  SiteStructureItem,
} from './global/definitions';


export namespace Components {

  interface AnchorLink {
    'to': string;
  }
  interface AnchorLinkAttributes extends StencilHTMLAttributes {
    'to'?: string;
  }

  interface AppBurger {}
  interface AppBurgerAttributes extends StencilHTMLAttributes {
    'onBurgerClick'?: (event: CustomEvent) => void;
  }

  interface AppIcon {
    'name': string;
  }
  interface AppIconAttributes extends StencilHTMLAttributes {
    'name'?: string;
  }

  interface AppMarked {
    'fetchPath'?: string;
    'renderer'?: (doc: MarkdownContent) => JSX.Element;
  }
  interface AppMarkedAttributes extends StencilHTMLAttributes {
    'fetchPath'?: string;
    'renderer'?: (doc: MarkdownContent) => JSX.Element;
  }

  interface AvcCodeType {
    'typeId': string;
  }
  interface AvcCodeTypeAttributes extends StencilHTMLAttributes {
    'typeId'?: string;
  }

  interface BlogPage {}
  interface BlogPageAttributes extends StencilHTMLAttributes {}

  interface CapacitorSite {
    'isLandingPage': boolean;
  }
  interface CapacitorSiteAttributes extends StencilHTMLAttributes {
    'isLandingPage'?: boolean;
  }

  interface ContributorList {
    'contributors': string[];
    'link': any;
  }
  interface ContributorListAttributes extends StencilHTMLAttributes {
    'contributors'?: string[];
    'link'?: any;
  }

  interface DemosPage {}
  interface DemosPageAttributes extends StencilHTMLAttributes {}

  interface DocSnippet {}
  interface DocSnippetAttributes extends StencilHTMLAttributes {}

  interface DocumentComponent {
    'page': string;
    'pages': string[];
  }
  interface DocumentComponentAttributes extends StencilHTMLAttributes {
    'page'?: string;
    'pages'?: string[];
  }

  interface InPageNavigation {
    'currentPageUrl': string;
    'pageLinks': MarkdownHeading[];
    'srcUrl': string;
  }
  interface InPageNavigationAttributes extends StencilHTMLAttributes {
    'currentPageUrl'?: string;
    'pageLinks'?: MarkdownHeading[];
    'srcUrl'?: string;
  }

  interface LandingPage {}
  interface LandingPageAttributes extends StencilHTMLAttributes {}

  interface LowerContentNav {
    'next'?: SiteStructureItem;
    'prev'?: SiteStructureItem;
  }
  interface LowerContentNavAttributes extends StencilHTMLAttributes {
    'next'?: SiteStructureItem;
    'prev'?: SiteStructureItem;
  }

  interface NewsletterSignup {}
  interface NewsletterSignupAttributes extends StencilHTMLAttributes {}

  interface PluginApi {
    'index': boolean;
    'name': string;
  }
  interface PluginApiAttributes extends StencilHTMLAttributes {
    'index'?: boolean;
    'name'?: string;
  }

  interface PluginPlatforms {
    'platforms': string;
  }
  interface PluginPlatformsAttributes extends StencilHTMLAttributes {
    'platforms'?: string;
  }

  interface SiteBar {}
  interface SiteBarAttributes extends StencilHTMLAttributes {}

  interface SiteHeader {}
  interface SiteHeaderAttributes extends StencilHTMLAttributes {}

  interface SiteMenu {
    'selectedParent': SiteStructureItem;
    'siteStructureList': SiteStructureItem[];
  }
  interface SiteMenuAttributes extends StencilHTMLAttributes {
    'selectedParent'?: SiteStructureItem;
    'siteStructureList'?: SiteStructureItem[];
  }
}

declare global {
  interface StencilElementInterfaces {
    'AnchorLink': Components.AnchorLink;
    'AppBurger': Components.AppBurger;
    'AppIcon': Components.AppIcon;
    'AppMarked': Components.AppMarked;
    'AvcCodeType': Components.AvcCodeType;
    'BlogPage': Components.BlogPage;
    'CapacitorSite': Components.CapacitorSite;
    'ContributorList': Components.ContributorList;
    'DemosPage': Components.DemosPage;
    'DocSnippet': Components.DocSnippet;
    'DocumentComponent': Components.DocumentComponent;
    'InPageNavigation': Components.InPageNavigation;
    'LandingPage': Components.LandingPage;
    'LowerContentNav': Components.LowerContentNav;
    'NewsletterSignup': Components.NewsletterSignup;
    'PluginApi': Components.PluginApi;
    'PluginPlatforms': Components.PluginPlatforms;
    'SiteBar': Components.SiteBar;
    'SiteHeader': Components.SiteHeader;
    'SiteMenu': Components.SiteMenu;
  }

  interface StencilIntrinsicElements {
    'anchor-link': Components.AnchorLinkAttributes;
    'app-burger': Components.AppBurgerAttributes;
    'app-icon': Components.AppIconAttributes;
    'app-marked': Components.AppMarkedAttributes;
    'avc-code-type': Components.AvcCodeTypeAttributes;
    'blog-page': Components.BlogPageAttributes;
    'capacitor-site': Components.CapacitorSiteAttributes;
    'contributor-list': Components.ContributorListAttributes;
    'demos-page': Components.DemosPageAttributes;
    'doc-snippet': Components.DocSnippetAttributes;
    'document-component': Components.DocumentComponentAttributes;
    'in-page-navigation': Components.InPageNavigationAttributes;
    'landing-page': Components.LandingPageAttributes;
    'lower-content-nav': Components.LowerContentNavAttributes;
    'newsletter-signup': Components.NewsletterSignupAttributes;
    'plugin-api': Components.PluginApiAttributes;
    'plugin-platforms': Components.PluginPlatformsAttributes;
    'site-bar': Components.SiteBarAttributes;
    'site-header': Components.SiteHeaderAttributes;
    'site-menu': Components.SiteMenuAttributes;
  }


  interface HTMLAnchorLinkElement extends Components.AnchorLink, HTMLStencilElement {}
  var HTMLAnchorLinkElement: {
    prototype: HTMLAnchorLinkElement;
    new (): HTMLAnchorLinkElement;
  };

  interface HTMLAppBurgerElement extends Components.AppBurger, HTMLStencilElement {}
  var HTMLAppBurgerElement: {
    prototype: HTMLAppBurgerElement;
    new (): HTMLAppBurgerElement;
  };

  interface HTMLAppIconElement extends Components.AppIcon, HTMLStencilElement {}
  var HTMLAppIconElement: {
    prototype: HTMLAppIconElement;
    new (): HTMLAppIconElement;
  };

  interface HTMLAppMarkedElement extends Components.AppMarked, HTMLStencilElement {}
  var HTMLAppMarkedElement: {
    prototype: HTMLAppMarkedElement;
    new (): HTMLAppMarkedElement;
  };

  interface HTMLAvcCodeTypeElement extends Components.AvcCodeType, HTMLStencilElement {}
  var HTMLAvcCodeTypeElement: {
    prototype: HTMLAvcCodeTypeElement;
    new (): HTMLAvcCodeTypeElement;
  };

  interface HTMLBlogPageElement extends Components.BlogPage, HTMLStencilElement {}
  var HTMLBlogPageElement: {
    prototype: HTMLBlogPageElement;
    new (): HTMLBlogPageElement;
  };

  interface HTMLCapacitorSiteElement extends Components.CapacitorSite, HTMLStencilElement {}
  var HTMLCapacitorSiteElement: {
    prototype: HTMLCapacitorSiteElement;
    new (): HTMLCapacitorSiteElement;
  };

  interface HTMLContributorListElement extends Components.ContributorList, HTMLStencilElement {}
  var HTMLContributorListElement: {
    prototype: HTMLContributorListElement;
    new (): HTMLContributorListElement;
  };

  interface HTMLDemosPageElement extends Components.DemosPage, HTMLStencilElement {}
  var HTMLDemosPageElement: {
    prototype: HTMLDemosPageElement;
    new (): HTMLDemosPageElement;
  };

  interface HTMLDocSnippetElement extends Components.DocSnippet, HTMLStencilElement {}
  var HTMLDocSnippetElement: {
    prototype: HTMLDocSnippetElement;
    new (): HTMLDocSnippetElement;
  };

  interface HTMLDocumentComponentElement extends Components.DocumentComponent, HTMLStencilElement {}
  var HTMLDocumentComponentElement: {
    prototype: HTMLDocumentComponentElement;
    new (): HTMLDocumentComponentElement;
  };

  interface HTMLInPageNavigationElement extends Components.InPageNavigation, HTMLStencilElement {}
  var HTMLInPageNavigationElement: {
    prototype: HTMLInPageNavigationElement;
    new (): HTMLInPageNavigationElement;
  };

  interface HTMLLandingPageElement extends Components.LandingPage, HTMLStencilElement {}
  var HTMLLandingPageElement: {
    prototype: HTMLLandingPageElement;
    new (): HTMLLandingPageElement;
  };

  interface HTMLLowerContentNavElement extends Components.LowerContentNav, HTMLStencilElement {}
  var HTMLLowerContentNavElement: {
    prototype: HTMLLowerContentNavElement;
    new (): HTMLLowerContentNavElement;
  };

  interface HTMLNewsletterSignupElement extends Components.NewsletterSignup, HTMLStencilElement {}
  var HTMLNewsletterSignupElement: {
    prototype: HTMLNewsletterSignupElement;
    new (): HTMLNewsletterSignupElement;
  };

  interface HTMLPluginApiElement extends Components.PluginApi, HTMLStencilElement {}
  var HTMLPluginApiElement: {
    prototype: HTMLPluginApiElement;
    new (): HTMLPluginApiElement;
  };

  interface HTMLPluginPlatformsElement extends Components.PluginPlatforms, HTMLStencilElement {}
  var HTMLPluginPlatformsElement: {
    prototype: HTMLPluginPlatformsElement;
    new (): HTMLPluginPlatformsElement;
  };

  interface HTMLSiteBarElement extends Components.SiteBar, HTMLStencilElement {}
  var HTMLSiteBarElement: {
    prototype: HTMLSiteBarElement;
    new (): HTMLSiteBarElement;
  };

  interface HTMLSiteHeaderElement extends Components.SiteHeader, HTMLStencilElement {}
  var HTMLSiteHeaderElement: {
    prototype: HTMLSiteHeaderElement;
    new (): HTMLSiteHeaderElement;
  };

  interface HTMLSiteMenuElement extends Components.SiteMenu, HTMLStencilElement {}
  var HTMLSiteMenuElement: {
    prototype: HTMLSiteMenuElement;
    new (): HTMLSiteMenuElement;
  };

  interface HTMLElementTagNameMap {
    'anchor-link': HTMLAnchorLinkElement
    'app-burger': HTMLAppBurgerElement
    'app-icon': HTMLAppIconElement
    'app-marked': HTMLAppMarkedElement
    'avc-code-type': HTMLAvcCodeTypeElement
    'blog-page': HTMLBlogPageElement
    'capacitor-site': HTMLCapacitorSiteElement
    'contributor-list': HTMLContributorListElement
    'demos-page': HTMLDemosPageElement
    'doc-snippet': HTMLDocSnippetElement
    'document-component': HTMLDocumentComponentElement
    'in-page-navigation': HTMLInPageNavigationElement
    'landing-page': HTMLLandingPageElement
    'lower-content-nav': HTMLLowerContentNavElement
    'newsletter-signup': HTMLNewsletterSignupElement
    'plugin-api': HTMLPluginApiElement
    'plugin-platforms': HTMLPluginPlatformsElement
    'site-bar': HTMLSiteBarElement
    'site-header': HTMLSiteHeaderElement
    'site-menu': HTMLSiteMenuElement
  }

  interface ElementTagNameMap {
    'anchor-link': HTMLAnchorLinkElement;
    'app-burger': HTMLAppBurgerElement;
    'app-icon': HTMLAppIconElement;
    'app-marked': HTMLAppMarkedElement;
    'avc-code-type': HTMLAvcCodeTypeElement;
    'blog-page': HTMLBlogPageElement;
    'capacitor-site': HTMLCapacitorSiteElement;
    'contributor-list': HTMLContributorListElement;
    'demos-page': HTMLDemosPageElement;
    'doc-snippet': HTMLDocSnippetElement;
    'document-component': HTMLDocumentComponentElement;
    'in-page-navigation': HTMLInPageNavigationElement;
    'landing-page': HTMLLandingPageElement;
    'lower-content-nav': HTMLLowerContentNavElement;
    'newsletter-signup': HTMLNewsletterSignupElement;
    'plugin-api': HTMLPluginApiElement;
    'plugin-platforms': HTMLPluginPlatformsElement;
    'site-bar': HTMLSiteBarElement;
    'site-header': HTMLSiteHeaderElement;
    'site-menu': HTMLSiteMenuElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
