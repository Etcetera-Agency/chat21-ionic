import { TYPE_DIRECT, TYPE_SUPPORT_GROUP } from 'src/chat21-core/utils/constants';
import { tranlatedLanguage, URL_SOUND_CONVERSATION_ADDED, URL_SOUND_LIST_CONVERSATION } from './../chat21-core/utils/constants';
import { ArchivedConversationsHandlerService } from 'src/chat21-core/providers/abstract/archivedconversations-handler.service';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';

import { Component, ViewChild, NgZone, OnInit, HostListener, ElementRef, Renderer2, AfterViewInit, isDevMode} from '@angular/core';
import { Config, Platform, IonRouterOutlet, IonSplitPane, NavController, MenuController, AlertController, IonNav, ToastController } from '@ionic/angular';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Subscription, VirtualTimeScheduler } from 'rxjs';
import { ModalController } from '@ionic/angular';

// import * as firebase from 'firebase/app';
import firebase from "firebase/app";
import 'firebase/auth'; // nk in watch connection status

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { TranslateService } from '@ngx-translate/core';

// services
import { AppConfigProvider } from './services/app-config';
// import { UserService } from './services/user.service';
// import { CurrentUserService } from './services/current-user/current-user.service';
import { EventsService } from './services/events-service';
import { MessagingAuthService } from '../chat21-core/providers/abstract/messagingAuth.service';
import { PresenceService } from '../chat21-core/providers/abstract/presence.service';
import { TypingService } from '../chat21-core/providers/abstract/typing.service';
import { UploadService } from '../chat21-core/providers/abstract/upload.service';
// import { ChatPresenceHandler} from './services/chat-presence-handler';
import { NavProxyService } from './services/nav-proxy.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
// import { ChatConversationsHandler } from './services/chat-conversations-handler';
import { ConversationsHandlerService } from 'src/chat21-core/providers/abstract/conversations-handler.service';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';

// pages
import { LoginPage } from './pages/authentication/login/login.page';
import { ConversationListPage } from './pages/conversations-list/conversations-list.page';

// utils
import { checkPlatformIsMobile, isGroup, getParameterByName, searchIndexInArrayForUid, compareValues } from '../chat21-core/utils/utils';
import { STORAGE_PREFIX, PLATFORM_MOBILE, PLATFORM_DESKTOP, CHAT_ENGINE_FIREBASE, AUTH_STATE_OFFLINE, AUTH_STATE_ONLINE } from '../chat21-core/utils/constants';
import { environment } from '../environments/environment';
import { UserModel } from '../chat21-core/models/user';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
// FCM
import { NotificationsService } from 'src/chat21-core/providers/abstract/notifications.service';
import { getImageUrlThumbFromFirebasestorage } from 'src/chat21-core/utils/utils-user';

// import { Network } from '@ionic-native/network/ngx';
// import { Observable, Observer, fromEvent, merge, of } from 'rxjs';
// import { mapTo } from 'rxjs/operators';
import { TiledeskService } from './services/tiledesk/tiledesk.service';
import { NetworkService } from './services/network-service/network.service';
import * as PACKAGE from 'package.json';
import { filter } from 'rxjs/operators'
import { WebSocketJs } from './services/websocket/websocket-js';
import { Location } from '@angular/common'

// import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})

export class AppComponent implements OnInit {
  @ViewChild('sidebarNav', { static: false }) sidebarNav: IonNav;
  @ViewChild('detailNav', { static: false }) detailNav: IonRouterOutlet;

  // public appIsOnline$: Observable<boolean> = undefined;
  checkInternet: boolean;

  private BSAuthStateChangedSubscriptionRef: Subscription;
  public sidebarPage: any;
  public notificationsEnabled: boolean;
  public zone: NgZone;
  public platformIs: string;
  private doitResize: any;
  private timeModalLogin: any;
  public tenant: string;
  public persistence: string;
  public authModal: any;

  private audio: any;
  private audio_NewConv: any;
  private setIntervalTime: any;
  private setTimeoutSound: any;
  private isTabVisible: boolean = true;
  public isSoundEnabled: boolean;
  private hasPlayed: boolean;
  private hasPlayedConversation: boolean;
  private tabTitle: string;
  private setTimeoutConversationsEvent: any;
  private logger: LoggerService = LoggerInstance.getInstance();
  public toastMsgErrorWhileUnsubscribingFromNotifications: string;
  public toastMsgCloseToast: string;
  public toastMsgWaitingForNetwork: string;
  private modalOpen: boolean = false;
  private hadBeenCalledOpenModal: boolean = false;
  public missingConnectionToast: any
  public executedInitializeAppByWatchConnection: boolean = false;
  private isInitialized: boolean = false;
  private version: string;
  IS_ONLINE: boolean;
  IS_ON_MOBILE_DEVICE: boolean;
  SUPPORT_MODE: boolean;
  // private isOnline: boolean = false;

  wsService: WebSocketJs;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private appConfigProvider: AppConfigProvider,
    public events: EventsService,
    public config: Config,
    public chatManager: ChatManager,
    public translate: TranslateService,
    public alertController: AlertController,
    public navCtrl: NavController,
    // public userService: UserService,
    // public currentUserService: CurrentUserService,
    public modalController: ModalController,
    public messagingAuthService: MessagingAuthService,
    public tiledeskAuthService: TiledeskAuthService,
    public presenceService: PresenceService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private navService: NavProxyService,
    // public chatPresenceHandler: ChatPresenceHandler,
    public typingService: TypingService,
    public uploadService: UploadService,
    public appStorageService: AppStorageService,

    // public chatConversationsHandler: ChatConversationsHandler,
    public conversationsHandlerService: ConversationsHandlerService,
    public archivedConversationsHandlerService: ArchivedConversationsHandlerService,
    private translateService: CustomTranslateService,
    public notificationsService: NotificationsService,
    public toastController: ToastController,
    // private network: Network,
    // private tiledeskService: TiledeskService,
    private networkService: NetworkService,
    public webSocketJs: WebSocketJs,
    public location: Location
  ) {


    this.saveInStorageNumberOfOpenedChatTab();
    this.listenChatAlreadyOpenWithoutParamsInMobileMode()
    this.isOnMobileDevice()
    // this.listenToUrlChanges();
    // this.getPageState();
  }

  isOnMobileDevice() {
    this.IS_ON_MOBILE_DEVICE = false;
    if (/Android|iPhone/i.test(window.navigator.userAgent)) {
      this.IS_ON_MOBILE_DEVICE = true;
    }
    this.logger.log('[APP-COMP] IS_ON_MOBILE_DEVICE', this.IS_ON_MOBILE_DEVICE)
    return this.IS_ON_MOBILE_DEVICE;
  }



  listenChatAlreadyOpenWithoutParamsInMobileMode() {
    this.events.subscribe('noparams:mobile', (isAlreadyOpenInMobileMode) => {
      // console.log('[APP-COMP] Chat is Already Open In Mobile Mode ', isAlreadyOpenInMobileMode)
      if (isAlreadyOpenInMobileMode === true) {
        this.checkPlatform()
      }
    });
  }

  // listenToUrlChanges() {
  //   const self = this;
  //   // window.addEventListener('hashchange', function () {
  //   window.addEventListener('locationchange', function () {

  //     console.log('location changed!');

  //     const convId = getParameterByName('convId')
  //     console.log('[APP-COMP] getParameterByName convId ', convId)
  //     if (convId) {
  //       setTimeout(() => {
  //         self.events.publish('supportconvid:haschanged', convId);
  //       }, 0);
  //     }

  //     const contact_id = getParameterByName('contact_id')
  //     console.log('[APP-COMP] getParameterByName contact_id ', contact_id)
  //     const contact_fullname = getParameterByName('contact_fullname')
  //     console.log('[APP-COMP] getParameterByName contact_fullname ', contact_fullname)
  //     if (contact_id && contact_fullname) {
  //       setTimeout(() => {
  //         self.router.navigateByUrl('conversation-detail/' + contact_id + '/' + contact_fullname + '/new');
  //         self.events.publish('directconvid:haschanged', contact_id);
  //       }, 0);

  //     } else {
  //       // console.log('[APP-COMP] contact_id and contact_fullname are null')
  //     }

  //     const conversation_detail = getParameterByName('conversation_detail')
  //     // console.log('[APP-COMP] getParameterByName conversation_detail ', conversation_detail)
  //     if (conversation_detail) {
  //       setTimeout(() => {
  //         self.router.navigate(['conversation-detail/'])
  //       }, 0);
  //     }
  //   });
  // }

  // getPageState() {
  //   const getState = () => {

  //     console.log('[APP-COMP] getState')
  //     // localStorage.setItem('visibilityState', document.visibilityState)
  //     if (document.visibilityState === 'hidden') {
  //       return 'hidden';
  //     }
  //     if (document.hasFocus()) {
  //       return 'active';
  //     }
  //     return 'passive';
  //   };

  //   let state = getState();

  //   const logStateChange = (nextState) => {

  //     const prevState = state;
  //     if (nextState !== prevState) {
  //       console.log(`State change: ${prevState} >>> ${nextState}`);
  //       state = nextState;

  //     }
  //   };

  //   ['pageshow', 'focus', 'blur', 'visibilitychange', 'resume'].forEach((type) => {
  //     window.addEventListener(type, () => logStateChange(getState()), { capture: true });
  //   });

  //   // The next two listeners, on the other hand, can determine the next
  //   // state from the event itself.
  //   window.addEventListener('freeze', () => {
  //     // In the freeze event, the next state is always frozen.
  //     logStateChange('frozen');
  //   }, { capture: true });

  //   window.addEventListener('pagehide', (event) => {
  //     if (event.persisted) {
  //       // If the event's persisted property is `true` the page is about
  //       // to enter the Back-Forward Cache, which is also in the frozen state.
  //       logStateChange('frozen');
  //       localStorage.setItem('state', 'frozen')
  //     } else {
  //       // If the event's persisted property is not `true` the page is
  //       // about to be unloaded.
  //       logStateChange('terminated');
  //       localStorage.setItem('state', 'terminated')
  //       localStorage.setItem('terminated', 'true')
  //     }
  //   }, { capture: true });

  // }


  saveInStorageNumberOfOpenedChatTab() {
    // this.logger.log('Calling saveInStorageChatOpenedTab!');
    // https://jsfiddle.net/jjjs5wd3/3/å
    if (+localStorage.tabCount > 0) {
      this.logger.log('Chat IONIC Already open!');
    } else {
      localStorage.tabCount = 0;

      localStorage.tabCount = +localStorage.tabCount + 1;
    }
    const terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
    window.addEventListener(terminationEvent, (event) => {
      if (localStorage.tabCount > 0) {
        localStorage.tabCount = +localStorage.tabCount - 1;
      }
    }, { capture: true });
  }



  // param() {
  //   // PARAM
  //   const url: URL = new URL(window.top.location.href);
  //   const params: URLSearchParams = url.searchParams;
  //   return params;
  // }
  /**
   */
  ngOnInit() {
    const appconfig = this.appConfigProvider.getConfig();
    this.logger.log('[APP-COMP] ngOnInit  appconfig', appconfig)
    if (appconfig && appconfig.supportMode && (appconfig.supportMode === true || appconfig.supportMode === 'true')) {
      this.SUPPORT_MODE = true;
      this.logger.log('[APP-COMP] appconfig > SUPPORT_MODE', this.SUPPORT_MODE)
    } else {
      this.SUPPORT_MODE = false;
      this.logger.log('[APP-COMP] appconfig > SUPPORT_MODE', this.SUPPORT_MODE)
    }
    this.persistence = appconfig.authPersistence;
    this.appStorageService.initialize(environment.storage_prefix, this.persistence, '')
    // this.logger.log('[APP-COMP] HELLO ngOnInit !!!!!!!')
    // this.logger.log('[APP-COMP] ngOnInit this.route.snapshot.params -->', this.route.snapshot.params);
    // this.initializeApp('oninit');
    const token = getParameterByName('jwt')
    // this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN token get with getParameterByName -->', token);
    if (token) {
      // this.isOnline = false;
      // this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN token get with this.isOnline  ', this.isOnline)
      this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN token get with getParameterByName  ', token)
      // save token in local storage then 

      const storedToken = this.appStorageService.getItem('tiledeskToken');
      this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN storedToken ', storedToken)
      this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN SAVE THE PARAMS TOKEN ', token)
      if (storedToken !== token) {
        this.appStorageService.setItem('tiledeskToken', token);
      } else {
        this.logger.log('[APP-COMP] ngOnInit AUTOLOGIN the current user already exist DON\'T SAVE ')
      }
    }


    this.initializeApp('oninit');
    this.listenToPostMsgs();
  }


  listenToPostMsgs() {
    window.addEventListener("message", (event) => {
      this.logger.log("[APP-COMP] message event ", event);

      if (event && event.data && event.data.action && event.data.parameter) {
        if (event.data.action === 'openJoinConversationModal') {
          this.presentAlertConfirmJoinRequest(event.data.parameter, event.data.calledBy)
        }
      }
      // if (event && event.data && event.data.action && event.data.parameter) {
      //   if (event.data.action === 'hasArchived') {
      //     var iframeWin = <HTMLIFrameElement>document.getElementById("unassigned-convs-iframe")
      //     const isIFrame = (input: HTMLElement | null): input is HTMLIFrameElement =>
      //     input !== null && input.tagName === 'IFRAME';
      //     if (isIFrame(iframeWin) && iframeWin.contentWindow) {
      //       const msg = { action: "hasArchived", parameter: event.data.parameter, calledBy: event.data.calledBy }
      //       iframeWin.contentWindow.postMessage(msg, '*');
      //     }

      //   }
      // }
      if (event && event.data && event.data.action && event.data.text) {
        if (event.data.action === "display_toast_join_complete") {
          this.presentToastJoinComplete(event.data.text)
        }
      }
    })
  }

  async presentToastJoinComplete(text) {
    const toast = await this.toastController.create({
      message: text,
      duration: 2000,
      color: "success"
    });
    toast.present();
  }

  async presentAlertConfirmJoinRequest(requestid, calledby) {
    var iframeWin = <HTMLIFrameElement>document.getElementById("unassigned-convs-iframe")

    const isIFrame = (input: HTMLElement | null): input is HTMLIFrameElement =>
      input !== null && input.tagName === 'IFRAME';

    const keys = ['YouAreAboutToJoinThisChat', 'Cancel', 'AreYouSure'];
    const translationMap = this.translateService.translateLanguage(keys);

    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: translationMap.get('AreYouSure'),
      message: translationMap.get('YouAreAboutToJoinThisChat'),
      buttons: [
        {
          text: translationMap.get('Cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'Ok',
          handler: () => {

            if (isIFrame(iframeWin) && iframeWin.contentWindow) {
              const msg = { action: "joinConversation", parameter: requestid, calledBy: calledby }
              iframeWin.contentWindow.postMessage(msg, '*');
            }
          }
        }
      ]
    });

    await alert.present();
  }




  signInWithCustomToken(token) {
    // this.isOnline = false;
    this.logger.log('[APP-COMP] SIGNINWITHCUSTOMTOKEN  token', token)
    this.tiledeskAuthService.signInWithCustomToken(token).then((user: any) => {
        this.logger.log('[APP-COMP] SIGNINWITHCUSTOMTOKEN AUTLOGIN user', user)
        this.messagingAuthService.createCustomToken(token)
    }).catch(error => {
        this.logger.error('[APP-COMP] SIGNINWITHCUSTOMTOKEN error::', error)
    })
  }

  /** */
  initializeApp(calledby: string) {
    // this.logger.log('[APP-COMP] - X - initializeApp !!! CALLED-BY: ', calledby);
    // console.log('[APP-COMP] appconfig platform is cordova: ', this.platform.is('cordova'))

    if (!this.platform.is('desktop')) {
      this.splashScreen.show();
    }
    this.tabTitle = document.title;

    this.getRouteParamsAndSetLoggerConfig();

    const appconfig = this.appConfigProvider.getConfig();
    // this.logger.info('[APP-COMP] appconfig: ', appconfig)
    this.version = PACKAGE.version;
    this.logger.info('[APP-COMP] version: ', this.version)

    this.logger.setLoggerConfig(true, appconfig.logLevel)
    this.logger.info('[APP-COMP] logLevel: ', appconfig.logLevel);

    this.tenant = appconfig.firebaseConfig.tenant;
    this.logger.info('[APP-COMP] appconfig firebaseConfig tenant: ', this.tenant);
    this.notificationsEnabled = true;
    this.zone = new NgZone({}); // a cosa serve?

    // ------------------------------------------
    // Platform ready
    // ------------------------------------------
    this.platform.ready().then(() => {
      // console.log("Check platform");
      this.getPlatformName();

      // this.setLanguage();

      if (this.splashScreen) {
        this.splashScreen.hide();
      }
      this.statusBar.styleDefault();
      this.navService.init(this.sidebarNav, this.detailNav);
      // this.persistence = appconfig.authPersistence;
      // this.appStorageService.initialize(environment.storage_prefix, this.persistence, '')
      this.tiledeskAuthService.initialize(this.appConfigProvider.getConfig().apiUrl);
      this.messagingAuthService.initialize();

      // this.currentUserService.initialize();
      this.chatManager.initialize();
      this.presenceService.initialize(this.tenant);
      this.typingService.initialize(this.tenant);

      const pushEngine = this.appConfigProvider.getConfig().pushEngine
      const vap_id_Key = this.appConfigProvider.getConfig().firebaseConfig.vapidKey

      if (pushEngine && pushEngine !== 'none') {
        this.notificationsService.initialize(this.tenant, vap_id_Key)
      }
      this.uploadService.initialize();

      this.setLanguage(null)
      this.initAuthentication();
      this.initSubscriptions();
      this.initAudio();

      this.logger.debug('[APP-COMP] initializeApp:: ', this.sidebarNav, this.detailNav);

      this.translateToastMsgs();

      // ---------------------------------------
      // Watch to network status
      // ---------------------------------------
      this.watchToConnectionStatus();
    });
  }

  getPlatformName() {
    if (this.platform.is('cordova')) {
      this.logger.log("the device running Cordova");
    }
    if (!this.platform.is('cordova')) {
      this.logger.log("the device Not running Cordova");
    }

    if (this.platform.is('android')) {
      this.logger.log("running on Android device!");
    }
    if (this.platform.is('ios')) {
      this.logger.log("running on iOS device!");
    }
    if (this.platform.is('mobileweb')) {
      this.logger.log("running in a browser on mobile!");
    }
    if (this.platform.is('desktop')) {
      this.logger.log("running on desktop!");
    }
  }


  getRouteParamsAndSetLoggerConfig() {
    const appconfig = this.appConfigProvider.getConfig();
    this.route.queryParams.subscribe(params => {
      // this.logger.log('[APP-COMP] getRouteParamsAndSetLoggerConfig - queryParams params: ', params)
      if (params.logLevel) {
        this.logger.log('[APP-COMP] getRouteParamsAndSetLoggerConfig - log level get from queryParams: ', params.logLevel)
        this.logger.setLoggerConfig(true, params.logLevel)
      } else {
        this.logger.info('[APP-COMP] getRouteParamsAndSetLoggerConfig - log level get from appconfig: ', appconfig.logLevel)
        this.logger.setLoggerConfig(true, appconfig.logLevel)
      }
    });
  }

  /** */
  setLanguage(currentUser) {
    // const currentUser = JSON.parse(this.appStorageService.getItem('currentUser'));
    this.logger.log('[APP-COMP] - setLanguage current_user uid: ', currentUser);

    let currentUserId = ''
    if (currentUser) {
      currentUserId = currentUser.uid;
      this.logger.log('[APP-COMP] - setLanguage current_user uid: ', currentUserId);
    }
    // this.translate.setDefaultLang('en');
    //   this.translate.use('en');

    const browserLang = this.translate.getBrowserLang();
    this.logger.log('[APP-COMP] browserLang: ', browserLang);
    const stored_preferred_lang = localStorage.getItem(currentUserId + '_lang');
    this.logger.log('[APP-COMP] stored_preferred_lang: ', stored_preferred_lang);

    let chat_lang = ''
    if (browserLang && !stored_preferred_lang) {
      chat_lang = browserLang
    } else if (browserLang && stored_preferred_lang) {
      chat_lang = stored_preferred_lang
    }

    if (tranlatedLanguage.includes(chat_lang)) {
      this.logger.log('[APP-COMP] tranlatedLanguage includes', chat_lang, ': ', tranlatedLanguage.includes(chat_lang))
      this.translate.setDefaultLang(chat_lang)
      this.translate.use(chat_lang);
    }
    else {
      this.logger.log('[APP-COMP] tranlatedLanguage not includes', chat_lang, ': ', tranlatedLanguage.includes(chat_lang))
      this.translate.setDefaultLang('en');
      this.translate.use('en');
    }

  }


  watchToConnectionStatus() {
    this.networkService.checkInternetFunc().subscribe(isOnline => {
      this.checkInternet = isOnline
      this.logger.log('[APP-COMP] - watchToConnectionStatus - isOnline', this.checkInternet)

      // checking internet connection
      if (this.checkInternet == true) {
        // this.events.publish('internetisonline', true);
        // show success alert if internet is working
        // alert('Internet is working.')
        this.logger.log('[APP-COMP] - watchToConnectionStatus - Internet is working.')
        // this.logger.log('[APP-COMP] - watchToConnectionStatus - this.missingConnectionToast', this.missingConnectionToast)
        if (!checkPlatformIsMobile()) {
          const elemIonNav = <HTMLElement>document.querySelector('ion-nav');
          this.logger.log('[APP-COMP] - watchToConnectionStatus - desktop * elemIonNav *', elemIonNav)

          if (this.executedInitializeAppByWatchConnection === false) {
            setTimeout(() => {
              const elemIonNavchildNodes = elemIonNav.childNodes;
              this.logger.log('[APP-COMP] - watchToConnectionStatus - elemIonNavchildNodes ', elemIonNavchildNodes);

              if (elemIonNavchildNodes.length === 0) {
                this.logger.log('[APP-COMP] - watchToConnectionStatus - elemIonNavchildNodes  HERE YES', elemIonNavchildNodes);

                // this.initializeApp('checkinternet');
                this.executedInitializeAppByWatchConnection = true;
              }
            }, 2000);
          }
        } else if (checkPlatformIsMobile()) {
          this.logger.log('[APP-COMP] - watchToConnectionStatus - mobile ')
          const elemIonRouterOutlet = <HTMLElement>document.querySelector('ion-router-outlet');
          this.logger.log('[APP-COMP] - watchToConnectionStatus - mobile * elemIonRouterOutlet *', elemIonRouterOutlet)
          if (this.executedInitializeAppByWatchConnection === false) {
            setTimeout(() => {
              const childElementCount = elemIonRouterOutlet.childElementCount;
              this.logger.log('[APP-COMP] - watchToConnectionStatus - mobile * childElementCount *', childElementCount)
              if (childElementCount === 1) {
                // this.initializeApp('checkinternet');
                this.executedInitializeAppByWatchConnection = true;
              }
            }, 2000);
          }
        }
      }
      else {
        this.logger.log('[APP-COMP] - watchToConnectionStatus - Internet is slow or not working.');
      }
    });
  }


  translateToastMsgs() {
    this.translate.get('AnErrorOccurredWhileUnsubscribingFromNotifications').subscribe((text: string) => {
        this.toastMsgErrorWhileUnsubscribingFromNotifications = text;
      });
    this.translate.get('CLOSE_TOAST').subscribe((text: string) => {
        this.toastMsgCloseToast = text;
      });
    this.translate.get('WAITING_FOR_NETWORK').subscribe((text: string) => {
        this.toastMsgWaitingForNetwork = text;
      });
  }


  updateStoredCurrentUser() {
    const storedCurrentUser = this.appStorageService.getItem('currentUser')
    const storedDshbrdUser = localStorage.getItem('user')
    this.logger.log('[APP-COMP] updateStoredCurrentUser - stored currentUser', storedCurrentUser)
    this.logger.log('[APP-COMP] updateStoredCurrentUser - stored dshbrdUser', storedDshbrdUser)
    if ((storedCurrentUser && storedCurrentUser !== 'undefined') && (storedDshbrdUser && storedDshbrdUser !== 'undefined')) {
      const currentUser = JSON.parse(storedCurrentUser);
      const dshbrdUser = JSON.parse(storedDshbrdUser);
      if (currentUser && dshbrdUser) {
        if (currentUser.color !== dshbrdUser.fillColour) {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.color !== dshbrdUser.fillColour')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.color ', currentUser.color)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fillColour ', dshbrdUser.fillColour)
          currentUser.color = dshbrdUser.fillColour;
        } else {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.color === dshbrdUser.fillColour')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.color ', currentUser.color)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fillColour ', dshbrdUser.fillColour)
        }
        if (currentUser.firstname !== dshbrdUser.firstname) {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.firstname !== dshbrdUser.firstname')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.firstname ', currentUser.firstname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.firstname ', dshbrdUser.firstname)
          currentUser.firstname = dshbrdUser.firstname;
        } else {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.firstname === dshbrdUser.firstname')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.firstname ', currentUser.firstname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.firstname ', dshbrdUser.firstname)
        }
        if (currentUser.lastname !== dshbrdUser.lastname) {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.lastname !== dshbrdUser.lastname')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.lastname ', currentUser.lastname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.lastname ', dshbrdUser.lastname)
          currentUser.lastname = dshbrdUser.lastname;
        } else {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.lastname === dshbrdUser.lastname')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.lastname ', currentUser.lastname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.lastname ', dshbrdUser.lastname)
        }
        if (currentUser.avatar !== dshbrdUser.fullname_initial) {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.avatar !== dshbrdUser.fullname_initial')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.avatar ', currentUser.avatar)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fullname_initial ', dshbrdUser.fullname_initial)
          currentUser.avatar = dshbrdUser.fullname_initial
        } else {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.avatar === dshbrdUser.fullname_initial')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.avatar ', currentUser.avatar)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fullname_initial ', dshbrdUser.fullname_initial)
        }
        let fullname = ""
        if (dshbrdUser.firstname && !dshbrdUser.lastname) {
          fullname = dshbrdUser.firstname
        } else if (dshbrdUser.firstname && dshbrdUser.lastname) {
          fullname = dshbrdUser.firstname + ' ' + dshbrdUser.lastname
          this.logger.log('[APP-COMP] updateStoredCurrentUser - fullname ', fullname)
        }
        if (fullname !== currentUser.fullname) {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.fullname !== dshbrdUser.fullname ')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.fullname  ', fullname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fullname ', currentUser.fullname)
          currentUser.fullname = fullname
        } else {
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.fullname === dshbrdUser.fullname ')
          this.logger.log('[APP-COMP] updateStoredCurrentUser - currentUser.fullname  ', fullname)
          this.logger.log('[APP-COMP] updateStoredCurrentUser - dshbrdUser.fullname ', currentUser.fullname)
        }
        this.appStorageService.setItem('currentUser', JSON.stringify(currentUser));
        this.tiledeskAuthService.setCurrentUser(currentUser);
      }
    } else {
      this.logger.error('[APP-COMP] updateStoredCurrentUser - currentuser or dashboarduser not found in storage')
    }
  }

  /***************************************************+*/
  /**------- AUTHENTICATION FUNCTIONS --> START <--- +*/
  private initAuthentication() {
    const tiledeskToken = this.appStorageService.getItem('tiledeskToken')

    this.logger.log('[APP-COMP] >>> INIT-AUTHENTICATION !!! ')
    this.logger.log('[APP-COMP] >>> initAuthentication tiledeskToken ', tiledeskToken)
    // const currentUser = JSON.parse(this.appStorageService.getItem('currentUser'));
    // this.logger.log('[APP-COMP] >>> initAuthentication currentUser ', currentUser)
    if (tiledeskToken) {
      this.logger.log('[APP-COMP] >>> initAuthentication I LOG IN WITH A TOKEN EXISTING IN THE LOCAL STORAGE OR WITH A TOKEN PASSED IN THE URL PARAMETERS <<<')
      this.tiledeskAuthService.signInWithCustomToken(tiledeskToken).then(user => {
        this.logger.log('[APP-COMP] >>> initAuthentication user ', user)

        this.updateStoredCurrentUser()

        this.messagingAuthService.createCustomToken(tiledeskToken)
      }).catch(error => {
        this.logger.error('[APP-COMP] initAuthentication SIGNINWITHCUSTOMTOKEN error::', error)
      })
    } else {
      this.logger.warn('[APP-COMP] >>> I AM NOT LOGGED IN <<<')
      this.IS_ONLINE = false;
      // clearTimeout(this.timeModalLogin);
      // this.timeModalLogin = setTimeout(() => {
      if (!this.hadBeenCalledOpenModal) {
        this.authModal = this.presentModal('initAuthentication');
        this.hadBeenCalledOpenModal = true;
      }
      // }, 1000);
    }
  }

  // checkTokenAndGoOffline() {
  //   let token = this.appStorageService.getItem('tiledeskToken');
  //   this.logger.info('[APP-COMP] ***** checkTokenAndGoOffline - stored token *****', token);
  //   if (!token) {
  //     this.goOffLine()
  //   }
  // }


  /**------- AUTHENTICATION FUNCTIONS --> END <--- +*/
  /***************************************************+*/

  checkPlatform() {
    if (checkPlatformIsMobile()) {
      this.chatManager.startApp();

      this.logger.log('[APP-COMP] checkPlatformIsMobile', checkPlatformIsMobile());
      this.platformIs = PLATFORM_MOBILE;
      this.logger.log('[APP-COMP] this.platformIs', this.platformIs);
      const IDConv = this.route.snapshot.firstChild.paramMap.get('IDConv');

      // console.log('[APP-COMP]  platformIs', this.platformIs);
      // console.log('[APP-COMP] PLATFORM', PLATFORM_MOBILE, 'route.snapshot', this.route.snapshot);
      if (!IDConv) {
        this.router.navigateByUrl('conversations-list')
      }
      // this.router.navigateByUrl(pageUrl);
      // this.navService.setRoot(ConversationListPage, {});
    } else {
      this.chatManager.startApp();
      this.logger.log('[APP-COMP] checkPlatformIsMobile', checkPlatformIsMobile());
      this.platformIs = PLATFORM_DESKTOP;
      this.logger.log('[APP-COMP]  platformIs', this.platformIs);
      // console.log('[APP-COMP] PLATFORM', PLATFORM_DESKTOP, 'route.snapshot',  this.route.snapshot);
      this.logger.log('[APP-COMP] PLATFORM_DESKTOP ', this.navService);

      this.navService.setRoot(ConversationListPage, {});

      const IDConv = this.route.snapshot.firstChild.paramMap.get('IDConv');

      const FullNameConv = this.route.snapshot.firstChild.paramMap.get('FullNameConv');
      const Convtype = this.route.snapshot.firstChild.paramMap.get('Convtype');


      let pageUrl = 'conversation-detail/'
      if (IDConv && FullNameConv) {
        pageUrl += IDConv + '/' + FullNameConv + '/' + Convtype
      }
      // replace(/\(/g, '%28').replace(/\)/g, '%29') -> used for the encoder of any round brackets
      this.router.navigateByUrl(pageUrl.replace(/\(/g, '%28').replace(/\)/g, '%29').replace( /#/g, "%23" ));


      // const DASHBOARD_URL = this.appConfigProvider.getConfig().DASHBOARD_URL;
      // createExternalSidebar(this.renderer, DASHBOARD_URL);

      // // FOR REALTIME TESTING
      // createExternalSidebar(this.renderer, 'http://localhost:4204');

    }
  }

  /** */
  // showNavbar() {
  //   let TEMP = location.search.split('navBar=')[1];
  //   if (TEMP) { this.isNavBar = TEMP.split('&')[0]; }
  // }

  /** */
  hideAlert() {
    this.logger.debug('[APP-COMP] hideAlert');
    this.notificationsEnabled = true;
  }

  private initAudio() {
    // SET AUDIO
    const href = window.location.href;
    const hrefArray = href.split('/#/');
    const chatBaseUrl = hrefArray[0]

    this.audio = new Audio();
    this.audio.src = chatBaseUrl + URL_SOUND_LIST_CONVERSATION;
    this.audio.load();

    this.audio_NewConv = new Audio();
    this.audio_NewConv.src = chatBaseUrl + URL_SOUND_CONVERSATION_ADDED;
    this.audio_NewConv.load();

    const sound_status = localStorage.getItem('dshbrd----sound')
    if(sound_status && sound_status !== 'undefined'){
      this.isSoundEnabled = sound_status === 'enabled'? true: false
    }else{
      this.isSoundEnabled = true
    }

  }

  onSoundChange(event){
    if(event && event !== undefined){
      localStorage.setItem('dshbrd----sound', event)
      this.isSoundEnabled = event === 'enabled'? true: false
    }
  }

  private manageTabNotification(sound_type: string, badgeNotificationCount?: number) {
    if (!this.isTabVisible) {
      // TAB IS HIDDEN --> manage title and SOUND
      let badgeNewConverstionNumber = badgeNotificationCount? badgeNotificationCount : this.conversationsHandlerService.countIsNew()
      badgeNewConverstionNumber > 0 ? badgeNewConverstionNumber : badgeNewConverstionNumber = 1
      document.title = "(" + badgeNewConverstionNumber + ") " + this.tabTitle

      clearInterval(this.setIntervalTime)
      const that = this
      this.setIntervalTime = setInterval(function () {
        if (document.title.charAt(0) === '(') {
          document.title = that.tabTitle
        } else {
          document.title = "(" + badgeNewConverstionNumber + ") " + that.tabTitle;
        }
      }, 1000);
      // if(this.isSoundEnabled) this.soundMessage()
    }

    const sound_status = localStorage.getItem('dshbrd----sound')
    if(sound_status && sound_status !== 'undefined'){
      this.isSoundEnabled = sound_status === 'enabled'? true: false
    }
    this.logger.debug('[APP-COMP] manageTabNotification can saund?', this.isInitialized, this.isSoundEnabled)
    if(this.isInitialized && this.isSoundEnabled) {
      sound_type === 'conv_added'? this.soundConversationAdded(): this.soundMessage();
    }
  }

  soundMessage() {
    const that = this;
    // this.logger.debug('[APP-COMP] conversation play', this.audio);
    // clearTimeout(this.setTimeoutSound);
    // this.setTimeoutSound = setTimeout(function () {
    //   that.audio.play().then(() => {
    //     that.logger.debug('[APP-COMP] ****** soundMessage played *****');
    //   }).catch((error: any) => {
    //     that.logger.error('[APP-COMP] ***soundMessage error*', error);
    //   });
    // }, 4000);

    //play sound every 4s from the fist time you receive a conversation added/changed
    if(!this.hasPlayed && !this.hasPlayedConversation){
      that.audio.play().then(() => {
        that.hasPlayed = true
        that.logger.debug('[APP-COMP] ****** soundMessage played *****');
        setTimeout(() => {
          that.hasPlayed = false
        }, 4000);
      }).catch((error: any) => {
        that.logger.error('[APP-COMP] ***soundMessage error*', error);
      });
    }
  }

  soundConversationAdded(){
    const that = this;
    if(!this.hasPlayedConversation ){
      that.audio_NewConv.play().then(() => {
        that.hasPlayedConversation = true
        that.logger.debug('[APP-COMP] ****** soundConversationAdded played *****');
        setTimeout(() => {
          that.hasPlayedConversation = false
        }, 4000);
      }).catch((error: any) => {
        that.logger.error('[APP-COMP] ***soundConversationAdded error*', error);
      });
    }
  }
  /**---------------- SOUND FUNCTIONS --> END <--- +*/
  /***************************************************+*/


  // BEGIN SUBSCRIPTIONS //
  /**      .pipe(
        takeUntil(this.unsubscribe$)
      ) */
  initSubscriptions() {
    this.logger.log('initialize FROM [APP-COMP] - initSubscriptions');

    // ---------------------------------------------------------------------------------------------------
    // Protecting from multiple subsciptions due to multiple app initializations (call to initializeApp())
    // Only one subscriber x application allowed
    // ---------------------------------------------------------------------------------------------------
    if (this.BSAuthStateChangedSubscriptionRef) {
      this.logger.log('initialize FROM [APP-COMP] - BSAuthStateChanged ALREADY SUBSCRIBED');
      return;
    }

    this.BSAuthStateChangedSubscriptionRef = this.messagingAuthService.BSAuthStateChanged.pipe(filter((state) => state !== null)).subscribe((state: any) => {
        this.logger.log('initialize FROM [APP-COMP] - [APP-COMP] ***** BSAuthStateChanged  state', state);

        if (state && state === AUTH_STATE_ONLINE) {
          // const user = this.tiledeskAuthService.getCurrentUser();
          // if (this.isOnline === false) {
          // if (AUTH_STATE_ONLINE) {
          this.IS_ONLINE = true;
          // console.log('[APP-COMP] IS_ONLINE', this.IS_ONLINE)
          this.goOnLine();
          // }
        } else if (state === AUTH_STATE_OFFLINE) {
          // this.checkTokenAndGoOffline() //se c'è un tiledeskToken salvato, allora aspetta, altrimenti vai offline
          this.IS_ONLINE = false;
          // console.log('[APP-COMP] IS_ONLINE', this.IS_ONLINE)
          this.goOffLine()
        }
      }, error => {
        this.logger.error('initialize FROM [APP-COMP] - [APP-COMP] ***** BSAuthStateChanged * error * ', error)
      }, () => {
        this.logger.log('initialize FROM [APP-COMP] - [APP-COMP] ***** BSAuthStateChanged *** complete *** ')
      });


    this.events.subscribe('uidConvSelected:changed', this.subscribeChangedConversationSelected);
    this.events.subscribe('profileInfoButtonClick:logout', this.subscribeProfileInfoButtonLogOut);
    this.events.subscribe('unservedRequest:count', this.subscribeUnservedRequestCount)

    this.conversationsHandlerService.conversationAdded.subscribe((conversation: ConversationModel) => {
      // this.logger.log('[APP-COMP] ***** subscribeConversationAdded *****', conversation);
      if (conversation && conversation.is_new === true) {
        this.manageTabNotification('conv_added')
      }
      if(conversation) this.updateConversationsOnStorage()
    });

    this.conversationsHandlerService.conversationChanged.subscribe((conversation: ConversationModel) => {
      // console.log('[APP-COMP] ***** subscribeConversationChanged conversation: ', conversation);
      if(conversation)  this.updateConversationsOnStorage();
      const currentUser = this.tiledeskAuthService.getCurrentUser()
    });

    this.conversationsHandlerService.conversationChangedDetailed.subscribe((changes: {value: ConversationModel, previousValue: ConversationModel}) => {
      // console.log('[APP-COMP] ***** subscribeConversationChangedDetailed conversation: ', changes);
      const currentUser = this.tiledeskAuthService.getCurrentUser()
      if (currentUser && currentUser !== null) {
        this.logger.log('[APP-COMP] ***** subscribeConversationChangedDetailed currentUser: ', currentUser);
        if (changes.value && changes.value.sender !== currentUser.uid) {
          if(changes.value.is_new === changes.previousValue.is_new){
            this.manageTabNotification('new_message');
          }
        }
      }
    });

    this.conversationsHandlerService.conversationRemoved.subscribe((conversation: ConversationModel) => {
      this.logger.log('[APP-COMP] ***** conversationRemoved *****', conversation);
      if(conversation) { 
        this.updateConversationsOnStorage();
        isDevMode()? null: this.segmentResolved(conversation)
      }
    });
  }

  /**
  * goOnLine:
  * 1 - nascondo splashscreen
  * 2 - recupero il tiledeskToken e lo salvo in chat manager
  * 3 - carico in d
  * @param user
  */
  goOnLine = () => {
    this.logger.log('[APP-COMP]- GO-ONLINE ');
    // this.isOnline = true;
    // this.logger.info('initialize FROM [APP-COMP] - [APP-COMP] - GO-ONLINE isOnline ', this.isOnline);
    // clearTimeout(this.timeModalLogin);
    const tiledeskToken = this.tiledeskAuthService.getTiledeskToken();

    // const supportmode = this.appConfigProvider.getConfig().supportMode;
    // this.logger.log('[APP-COMP] - GO-ONLINE - supportmode ', supportmode);
    // if (supportmode === true) {
    //   this.connetWebsocket() // moved in the comp project-item
    // }
    this.events.publish('go:online', true);
    const currentUser = this.tiledeskAuthService.getCurrentUser();
    this.setLanguage(currentUser);
    // this.logger.printDebug('APP-COMP - goOnLine****', currentUser);
    this.logger.log('[APP-COMP] - GO-ONLINE - currentUser ', currentUser);
    this.chatManager.setTiledeskToken(tiledeskToken);
    this.chatManager.setCurrentUser(currentUser);
    // this.chatManager.startApp();

    // ----------------------------------------------
    // PUSH NOTIFICATIONS
    // ----------------------------------------------
    const pushEngine = this.appConfigProvider.getConfig().pushEngine

    if (currentUser) {
      if (pushEngine && pushEngine !== 'none') {
        this.notificationsService.getNotificationPermissionAndSaveToken(currentUser.uid);
      }
      this.presenceService.setPresence(currentUser.uid);

      this.initConversationsHandler(currentUser.uid);
      this.initArchivedConversationsHandler(currentUser.uid);
      isDevMode()? null: this.segmentSignIn()
    }
    this.checkPlatform();
    try {
      this.logger.debug('[APP-COMP] ************** closeModal', this.authModal);
      if (this.authModal) {
        this.closeModal();
      }
    } catch (err) {
      this.logger.error('[APP-COMP] -> error:', err);
    }
  }




  goOffLine = () => {
    this.logger.log('[APP-COMP] - GO-OFFLINE');
    this.logger.log('[APP-COMP] - GO-OFFINE - supportmode ', this.SUPPORT_MODE);
    if (this.SUPPORT_MODE === true) {
      this.webSocketClose()
    }
    // this.isOnline = false;
    // this.conversationsHandlerService.conversations = [];
    this.chatManager.setTiledeskToken(null);
    this.chatManager.setCurrentUser(null);
    this.chatManager.goOffLine();

    this.router.navigateByUrl('conversation-detail/'); //redirect to basePage
    // this.goToDashboardLogin()
    
    // clearTimeout(this.timeModalLogin);
    // this.timeModalLogin = setTimeout(() => {
    if (!this.hadBeenCalledOpenModal) {
      this.authModal = this.presentModal('goOffLine');
      this.hadBeenCalledOpenModal = true
    }
    // }, 1000);

    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
    
  }

  goToDashboardLogin(){
    let DASHBOARD_URL = this.appConfigProvider.getConfig().dashboardUrl + '/index.html'
    const myWindow = window.open(DASHBOARD_URL, '_self');
    myWindow.focus();
  }


  webSocketClose() {
    this.logger.log('[APP-COMP] - GO-OFFLINE - webSocketClose');
    this.webSocketJs.close()
    this.events.publish('go:offline', true);
  }

  // BEGIN RESIZE FUNCTIONS //
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const that = this;
    // this.logger.debug('this.doitResize)', this.doitResize)
    // clearTimeout(this.doitResize);
    // this.doitResize = setTimeout(() => {
    let platformIsNow = PLATFORM_DESKTOP;
    if (checkPlatformIsMobile()) {
      platformIsNow = PLATFORM_MOBILE;
      this.logger.log('onResize platformIsNow ', platformIsNow)
    }
    if (!this.platformIs || this.platformIs === '') {
      this.platformIs = platformIsNow;
    }
    this.logger.debug('[APP-COMP] onResize width::::', window.innerWidth);
    this.logger.debug('[APP-COMP] onResize width:::: platformIsNow', platformIsNow);
    this.logger.debug('[APP-COMP] onResize width:::: this.platformIs', this.platformIs);
    this.logger.debug('[APP-COMP] onResize width:::: platformIsNow', platformIsNow);
    if (platformIsNow !== this.platformIs) {
      window.location.reload();
      // this.checkPlatform();
      // this.initializeApp('onresize')
      this.checkPlatform();
      // this.goOnLine()
      // // this.initSubscriptions();

    }

    // }, 0);
  }
  // END RESIZE FUNCTIONS //

  /**
   * ::: subscribeChangedConversationSelected :::
   * evento richiamato quando si seleziona un utente nell'elenco degli user
   * apro dettaglio conversazione
   */
  subscribeChangedConversationSelected = (user: UserModel, type: string) => {
    this.logger.log('[APP-COMP] subscribeUidConvSelectedChanged navigateByUrl', user, type);
    // this.router.navigateByUrl('conversation-detail/' + user.uid + '?conversationWithFullname=' + user.fullname);
    this.router.navigateByUrl('conversation-detail/' + user.uid + '/' + user.fullname + '/' + type);
  }

  subscribeProfileInfoButtonLogOut = (hasClickedLogout) => {
    this.logger.log('[APP-COMP] FIREBASE-NOTIFICATION >>>>  subscribeProfileInfoButtonLogOut ');
    // if (hasClickedLogout === true) {
    //   this.removePresenceAndLogout()
    // }


    if (hasClickedLogout === true) {
      this.appStorageService.removeItem('conversations')
      this.isInitialized = false;
      // ----------------------------------------------
      // PUSH NOTIFICATIONS
      // ----------------------------------------------
      const that = this;
      const pushEngine = this.appConfigProvider.getConfig().pushEngine
      if (pushEngine && pushEngine !== 'none') {
        this.notificationsService.removeNotificationsInstance(function (res) {
          that.logger.log('[APP-COMP] FIREBASE-NOTIFICATION >>>>  removeNotificationsInstance > CALLBACK RES', res);

          if (res === 'success') {
            that.removePresenceAndLogout();
            isDevMode()? null: that.segmentSignedOut()
          } else {
            that.removePresenceAndLogout();
            // that.presentToast();
          }
        });
      } else {
        this.removePresenceAndLogout()
      }
    }
  }

  subscribeUnservedRequestCount = (unservedRequestCount) => {
    if(unservedRequestCount && unservedRequestCount > 0){
      this.logger.debug("appIsInitialized::::",this.isInitialized)
      if(this.isInitialized){
        this.manageTabNotification(unservedRequestCount) //sound and alternate title
      }
    }
  }

  private async presentModal(calledby): Promise<any> {
    this.logger.log('[APP-COMP] presentModal calledby', calledby, '- hadBeenCalledOpenModal: ', this.hadBeenCalledOpenModal);
    const attributes = { tenant: this.tenant, enableBackdropDismiss: false };
    const modal: HTMLIonModalElement =
      await this.modalController.create({
        component: LoginPage,
        componentProps: attributes,
        swipeToClose: false,
        backdropDismiss: false
      });
    modal.onDidDismiss().then((detail: any) => {
      this.hadBeenCalledOpenModal = false
      this.logger.log('[APP-COMP] presentModal onDidDismiss detail.data ', detail.data);
      // this.checkPlatform();
      if (detail !== null) {
        //  this.logger.debug('The result: CHIUDI!!!!!', detail.data);
      }
    });
    // await modal.present();
    // modal.onDidDismiss().then((detail: any) => {
    //    this.logger.debug('The result: CHIUDI!!!!!', detail.data);
    //   //  this.checkPlatform();
    //    if (detail !== null) {
    //     //  this.logger.debug('The result: CHIUDI!!!!!', detail.data);
    //    }
    // });
    return await modal.present();
  }

  private async closeModal() {
    this.logger.debug('[APP-COMP] closeModal', this.modalController);
    this.logger.debug('[APP-COMP] closeModal .getTop()', this.modalController.getTop());
    await this.modalController.getTop();
    this.modalController.dismiss({ confirmed: true });
  }


  async presentToast() {
    const toast = await this.toastController.create({
      message: this.toastMsgErrorWhileUnsubscribingFromNotifications,
      duration: 2000
    });
    toast.present();
  }

  removePresenceAndLogout() {
    this.logger.debug('[APP-COMP] FIREBASE-NOTIFICATION >>>> calling removePresenceAndLogout');
    this.presenceService.removePresence();
    this.tiledeskAuthService.logOut()
    this.messagingAuthService.logout()
  }

  private initConversationsHandler(userId: string) {
    const keys = ['YOU', 'INFO_A_NEW_SUPPORT_REQUEST_HAS_BEEN_ASSIGNED_TO_YOU'];
    const translationMap = this.translateService.translateLanguage(keys);

    this.logger.log('[APP-COMP] initConversationsHandler ------------->', userId, this.tenant);
    // 1 - init chatConversationsHandler and  archviedConversationsHandler
    this.conversationsHandlerService.initialize(this.tenant, userId, translationMap);
    // this.subscribeToConvs()
    this.conversationsHandlerService.subscribeToConversations(null, () => {
      // this.logger.log('[APP-COMP] - CONVS - INIT CONV')
      const conversations = this.conversationsHandlerService.conversations;
      this.logger.info('initialize FROM [APP-COMP] - [APP-COMP]-CONVS - INIT CONV CONVS', conversations)
      // this.logger.printDebug('SubscribeToConversations (convs-list-page) - conversations')
      if (!conversations || conversations.length === 0) {
        // that.showPlaceholder = true;
        this.logger.debug('[APP-COMP]-CONVS - INIT CONV CONVS 2', conversations)
        this.events.publish('appcompSubscribeToConvs:loadingIsActive', false);
      }
    });

  }

  private updateConversationsOnStorage(){
    const that = this
    // reset timer and save conversation on storage after 2s
    clearTimeout(this.setTimeoutConversationsEvent);
    this.setTimeoutConversationsEvent = setTimeout(() => {
      that.logger.debug('[APP-COMP] updateConversationsOnStorage: reset timer and save conversations -> ', this.conversationsHandlerService.conversations.length)
      that.appStorageService.setItem('conversations', JSON.stringify(that.conversationsHandlerService.conversations))
      that.isInitialized = true;
      this.events.publish('appComp:appIsInitialized', true)
    }, 10000);
  }

  private initArchivedConversationsHandler(userId: string) {
    const keys = ['YOU'];
    const translationMap = this.translateService.translateLanguage(keys);

    this.logger.debug('[APP-COMP] initArchivedConversationsHandler ------------->', userId, this.tenant);
    // 1 - init  archviedConversationsHandler
    this.archivedConversationsHandlerService.initialize(this.tenant, userId, translationMap);
  }

  checkAndRemoveDashboardForegroundCount(){
    try {
      const dashboardForegroundCount = localStorage.getItem('dshbrd----foregroundcount')
      this.logger.log('[SIDEBAR] - THERE IS DASHBOARD FOREGROUND COUNT', dashboardForegroundCount)
      if (dashboardForegroundCount && dashboardForegroundCount !== 'undefined') {
        localStorage.setItem('dshbrd----foregroundcount', '0')
      }
    } catch (err) {
      this.logger.error('Get local storage dshbrd----foregroundcount ', err)
    }
  }

  private segmentSignIn(){
    let user = this.tiledeskAuthService.getCurrentUser()
    try {
      window['analytics'].page("Chat Auth Page, Signin", {});
    } catch (err) {
      this.logger.error('Event:Signed In [page] error', err);
    }

    try {
      window['analytics'].identify(user.uid, {
        name: user.firstname + ' ' + user.lastname,
        email: user.email,
        logins: 5,

      });
    } catch (err) {
      this.logger.error('Event:Signed In [identify] error', err);
    }
    // Segments
    try {
      window['analytics'].track('Signed In', {
        "username": user.firstname + ' ' + user.lastname,
        "userId": user.uid
      });
    } catch (err) {
      this.logger.error('Event:Signed In [track] error', err);
    }
  }


  private segmentSignedOut(){
    let user = this.tiledeskAuthService.getCurrentUser()
    try {
      window['analytics'].page("Chat Auth Page, Signed Out", {});
    } catch (err) {
      this.logger.error('Event:Signed Out [page] error', err);
    }

    try {
      window['analytics'].identify(user.uid, {
        name: user.firstname + ' ' + user.lastname,
        email: user.email,
        logins: 5,

      });
    } catch (err) {
      this.logger.error('Event:Signed Out [identify] error', err);
    }

    try {
      window['analytics'].track('Signed Out', {
        "username": user.firstname + ' ' + user.lastname,
        "userId": user.uid
      });
    } catch (err) {
      this.logger.error('Event:Signed Out [track] error', err);
    }

    try {
      // setTimeout(() => {
      window['analytics'].reset()
      // }, 0);
    } catch (err) {
      this.logger.error('Event:reset error', err);
    }
  }

  private segmentResolved(conversation: ConversationModel){
    let user = this.tiledeskAuthService.getCurrentUser();
    try {
      window['analytics'].page("Chat List Conversations Page, Chat Resolved", {});
    } catch (err) {
      this.logger.error('Event:Chat Resolved [page] error', err);
    }

    try {
      window['analytics'].identify(user.uid, {
        name: user.firstname + ' ' + user.lastname,
        email: user.email,
        logins: 5,

      });
    } catch (err) {
      this.logger.error('Event:Chat Resolved [identify] error', err);
    }

    try {
      window['analytics'].track('Chat Resolved', {
        "username": user.firstname + ' ' + user.lastname,
        "userId": user.uid,
        "conversation_id": conversation.uid,
        "channel_type": conversation.channel_type,
        "conversation_with":(conversation.channel_type !== TYPE_DIRECT)? null: conversation.conversation_with,
        "conversation_with_fullname": (conversation.channel_type !== TYPE_DIRECT)? null: conversation.conversation_with_fullname,
        "department_name":(conversation.channel_type !== TYPE_DIRECT)? conversation.attributes.departmentName: null,
        "department_id":(conversation.channel_type !== TYPE_DIRECT)? conversation.attributes.departmentId: null,
      },
      { "context": {
          "groupId": (conversation.channel_type !== TYPE_DIRECT)? conversation.attributes.projectId: null
        }
      });
    } catch (err) {
      this.logger.error('Event:Chat Resolved [track] error', err);
    }

    try {
      window['analytics'].group(conversation.attributes.projectId, {
        name: (conversation.attributes.project_name)? conversation.attributes.project_name : null,
        // plan: projectProfileName,
      });
    } catch (err) {
      this.logger.error('Event:Chat Resolved [group] error', err);
    }
  }


  @HostListener('document:visibilitychange', [])
  visibilitychange() {
    // this.logger.debug("document TITLE", document.hidden, document.title);
    if (document.hidden) {
      this.isTabVisible = false
    } else {
      // TAB IS ACTIVE --> restore title and DO NOT SOUND
      clearInterval(this.setIntervalTime)
      this.isTabVisible = true;
      document.title = this.tabTitle;
      this.checkAndRemoveDashboardForegroundCount()
    }
  }

  // Storage event not firing: This won't work on the same page that is making the changes
  // https://stackoverflow.com/questions/35865481/storage-event-not-firing
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
  @HostListener('window:storage', ['$event'])
  onStorageChanged(event: any) {

    if (event.key !== 'chat_sv5__tiledeskToken' && event.key !== 'dshbrd----sound') {
      return;
    }

    if (this.appStorageService.getItem('tiledeskToken') === null) {
      // console.log('[APP-COMP] - onStorageChanged tiledeskToken is null - RUN LOGOUT')
      this.tiledeskAuthService.logOut()
      this.messagingAuthService.logout();
      this.events.publish('profileInfoButtonClick:logout', true);
      // this.isOnline = false;
    }
    else {
      const currentUser = this.tiledeskAuthService.getCurrentUser();
      // console.log('[APP-COMP] - X - onStorageChanged currentUser', currentUser)

      const currentToken = this.tiledeskAuthService.getTiledeskToken();
      // console.log('[APP-COMP] - onStorageChanged currentToken', currentToken)
      if (this.appStorageService.getItem('tiledeskToken') !== null && currentToken !== this.appStorageService.getItem('tiledeskToken')) {

        // console.log('[APP-COMP] - onStorageChanged wentOnline 2')
        // DEALLOCO RISORSE OCCUPATE
        this.messagingAuthService.logout();
        this.appStorageService.removeItem('currentUser')
        this.tiledeskAuthService.setCurrentUser(null);
        // this.unsubscribe$.next();
        // this.unsubscribe$.complete();
        this.initializeApp('onstoragechanged');



        // console.log('[APP-COMP]  onAuthStateChanged HERE !!! ')
        // firebase.auth().onAuthStateChanged(user => {
        //   console.log('[APP-COMP]  onAuthStateChanged', user)
        // })

      }
    }

    if(event.key === 'dshbrd----sound'){
      this.events.publish('storage:sound', event.newValue);
      this.isSoundEnabled = event.newValue === 'enabled'? true: false
    }
  }


  // @HostListener('mouseenter', ['$event']) 
  // onMouseEnter(event: any) {
  //   console.log('HostListener onMouseEnter-->', event)
  // }

  // @HostListener('mouseleave', ['$event']) 
  // onMouseLeave(event: any) {
  //   console.log('HostListener onMouseLeave-->', event)
  // }

  // @HostListener('focus', ['$event']) 
  // onFocus(event: any) {
  //   console.log('HostListener onFocus-->', event)
  // }

  // @HostListener('blur', ['$event']) 
  // onBlur(event: any) {
  //   console.log('HostListener onBlur-->', event)
  // }
}

