import Foundation
import SafariServices

@objc(Browser)
public class Browser : AVCPlugin, SFSafariViewControllerDelegate {
  var vc: SFSafariViewController?
  
  @objc func open(_ call: AVCPluginCall) {
    guard let urlString = call.getString("url") else {
      call.error("Must provide a URL to open")
      return
    }
    
    let toolbarColor = call.getString("toolbarColor")
    let url = URL(string: urlString)
    
    DispatchQueue.main.async {
      self.vc = SFSafariViewController.init(url: url!)
      self.vc!.delegate = self
      self.vc!.modalPresentationStyle = .popover
      
      if toolbarColor != nil {
        self.vc!.preferredBarTintColor = UIColor(fromHex: toolbarColor!)
      }
      
      self.setCenteredPopover(self.vc)
      self.bridge.viewController.present(self.vc!, animated: true, completion: {
        call.success()
      })
    }
  }
  
  @objc func close(_ call: AVCPluginCall) {
    if vc == nil {
      call.success()
    }
    self.bridge.viewController.dismiss(animated: true) {
      call.success()
    }
  }
  
  @objc func prefetch(_ call: AVCPluginCall) {
    // no-op
    call.success()
  }
  
  public func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
    self.notifyListeners("browserFinished", data: [:])
  }
  
  public func safariViewController(_ controller: SFSafariViewController, didCompleteInitialLoad didLoadSuccessfully: Bool) {
    self.notifyListeners("browserPageLoaded", data: [:])
  }
}

