import UIKit
import Capacitor
import FirebaseCore
import FirebaseAuth
import GoogleSignIn

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase
        FirebaseApp.configure()
        
        // Configure Google Sign-In
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: path),
              let clientId = plist["CLIENT_ID"] as? String else {
            fatalError("GoogleService-Info.plist file not found or CLIENT_ID missing")
        }
        
        // Configure Google Sign-In with the client ID
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
        
        // Create window
        window = UIWindow(frame: UIScreen.main.bounds)
        
        // Create and configure the bridge view controller
        let bridgeViewController = CAPBridgeViewController()
        
        // Set as root view controller
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Print debug information about URL handling
        print("AppDelegate: Handling URL: \(url)")
        print("AppDelegate: URL scheme: \(url.scheme ?? "nil")")
        print("AppDelegate: URL host: \(url.host ?? "nil")")
        print("AppDelegate: URL path: \(url.path)")
        print("AppDelegate: URL query: \(url.query ?? "nil")")
        print("AppDelegate: Options: \(options)")
        
        // Firebase Auth handling (should be checked first)
        if Auth.auth().canHandle(url) {
            print("AppDelegate: Firebase Auth handled the URL")
            return true
        }
        
        // Google Sign-In handling
        if GIDSignIn.sharedInstance.handle(url) {
            print("AppDelegate: Google Sign-In handled the URL")
            return true
        }
        
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        print("AppDelegate: Delegating to ApplicationDelegateProxy")
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
