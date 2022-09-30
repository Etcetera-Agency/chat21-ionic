import { EventsService } from './../../services/events-service';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket/websocket.service';
import { Subject } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
import { TiledeskService } from 'src/app/services/tiledesk/tiledesk.service';
import { WebSocketJs } from 'src/app/services/websocket/websocket-js';
import { AppConfigProvider } from 'src/app/services/app-config';

@Component({
  selector: 'app-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit {
  private logger: LoggerService = LoggerInstance.getInstance();

  @Output() projectIdEvent = new EventEmitter<string>()
  @Output() openUnsevedConvsEvent = new EventEmitter<any>()

  private unsubscribe$: Subject<any> = new Subject<any>();
  project: any;
  tiledeskToken: string;

  unservedRequestCount: number = 0;
  currentUserRequestCount: number;
  ROLE_IS_AGENT: boolean;
  currentUserId: string;
  public translationMap: Map<string, string>;
 
  window_width_is_60: boolean;
  newInnerWidth: any;
  avaialble_status_for_tooltip: string;
  tooltipOptions = {
    'show-delay': 500,
    'tooltip-class': 'chat-tooltip',
    'theme': 'light',
    'shadow': false,
    'hide-delay-mobile': 0,
    'hideDelayAfterClick': 3000,
    'hide-delay': 200
  };
  IS_ON_MOBILE_DEVICE: boolean;
  constructor(
    public wsService: WebsocketService,
    public appStorageService: AppStorageService,
    private translateService: CustomTranslateService,
    public tiledeskAuthService: TiledeskAuthService,
    public tiledeskService: TiledeskService,
    public webSocketJs: WebSocketJs,
    private appConfigProvider: AppConfigProvider,
    public events: EventsService
  ) { }

  ngOnInit() {
    this.getStoredTokenAndConnectWS();
    this.getStoredCurrenUser();
    this.translations();
    this.listenToPostMsgs();
    this.onInitWindowWidth();
    this.isOnMobileDevice();
  }

  ngOnDestroy() {
    this.logger.log('[PROJECT-ITEM] > ngOnDestroy')
    this.unsubscribe$.next()
    this.unsubscribe$.complete()

  }

  isOnMobileDevice() {
    this.IS_ON_MOBILE_DEVICE = false;
    if (/Android|iPhone/i.test(window.navigator.userAgent)) {
      this.IS_ON_MOBILE_DEVICE = true;
    }
    return this.IS_ON_MOBILE_DEVICE;
  }

  openUnservedConvs() {
    this.openUnsevedConvsEvent.emit('notificationsorprjctbtn')
  }
  openUnservedConvsAndGoToProjectList() {
    this.openUnsevedConvsEvent.emit('pinbtn')
  }

  getStoredTokenAndConnectWS() {
    this.tiledeskToken = this.appStorageService.getItem('tiledeskToken');
    this.logger.log('[PROJECT-ITEM] - STORED TILEDEK TOKEN ', this.tiledeskToken)
    this.connetWebsocket(this.tiledeskToken)
  }

  connetWebsocket(tiledeskToken) {

    this.logger.log('[WEBSOCKET-JS] connetWebsocket called in [PROJECT-ITEM] tiledeskToken ', tiledeskToken)
    const appconfig = this.appConfigProvider.getConfig();
    this.logger.log('[WEBSOCKET-JS] connetWebsocket called in [PROJECT-ITEM] wsUrl ', appconfig.wsUrl)
    const WS_URL = appconfig.wsUrl + '?token=' + tiledeskToken
    this.logger.log('[WEBSOCKET-JS] connetWebsocket called in [PROJECT-ITEM] wsUrl ', WS_URL)
    this.webSocketJs.init(
      WS_URL,
      undefined,
      undefined,
      undefined
    );

    this.getLastProjectStoredAndSubscToWSAvailabilityAndConversations();
  }

  listenToPostMsgs() {
    window.addEventListener("message", (event) => {
      if (event && event.data) {
        if (event.data === 'hasChangedProject') {
          this.unservedRequestCount = 0;
          if (this.project) {
            this.webSocketJs.unsubscribe('/' + this.project.id_project._id + '/requests');
          }
          this.getLastProjectStoredAndSubscToWSAvailabilityAndConversations();
        }
      }
    })
  }


  public translations() {
    const keys = [
      'LABEL_AVAILABLE',
      'LABEL_NOT_AVAILABLE',
      'LABEL_BUSY',
      'VIEW_ALL_CONVERSATIONS',
      'UnassignedConversations',
      // 'CONVERSATIONS_IN_QUEUE',
      // 'CONVERSATION_IN_QUEUE',
      // 'NO_CONVERSATION_IN_QUEUE',
      'PINNED_PROJECT',
      'CHANGE_PINNED_PROJECT',
      "CHANGE_TO_YOUR_STATUS_TO_AVAILABLE",
      "CHANGE_TO_YOUR_STATUS_TO_UNAVAILABLE"
    ];
    this.translationMap = this.translateService.translateLanguage(keys);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.newInnerWidth = event.target.innerWidth;
    this.logger.log('[PROJECT-ITEM] - INNER WIDTH ', this.newInnerWidth)

    // if (this.newInnerWidth <= 150) {
    //   this.window_width_is_60 = true;
    // } else {
    //   this.window_width_is_60 = false;
    // }
  }

  onInitWindowWidth(): any {
    const actualWidth = window.innerWidth;
    this.logger.log('[PROJECT-ITEM] - ACTUAL Width ', actualWidth);

  }

  getStoredCurrenUser() {
    const storedCurrentUser = this.appStorageService.getItem('currentUser');
    this.logger.log('[PROJECT-ITEM] - STORED CURRENT USER ', storedCurrentUser)
    if (storedCurrentUser && storedCurrentUser !== 'undefined') {
      const currentUser = JSON.parse(storedCurrentUser)
      this.logger.log('[PROJECT-ITEM] - STORED CURRENT USER OBJCT', currentUser);
      this.currentUserId = currentUser.uid
      this.logger.log('[PROJECT-ITEM] - CURRENT USER ID', this.currentUserId);
    } else {
      this.logger.error('[PROJECT-ITEM] - STORED CURRENT USER OBJCT NOT FOUND IN STORAGE');
    }
  }

  getLastProjectStoredAndSubscToWSAvailabilityAndConversations() {
    let stored_project = ''
    try {
      stored_project = localStorage.getItem('last_project')
      this.logger.log('PROJECT-ITEM - THERE IS A STORED PROJECT ', stored_project)
    } catch (err) {
      this.logger.error('Get local storage LAST PROJECT ', err)
    }


    if (!stored_project || stored_project === 'undefined') {
      this.logger.log('PROJECT-ITEM - THERE IS NOT STORED LAST PROJECT OR IS UNDEFINED ', stored_project)
      const tiledeskToken = this.appStorageService.getItem('tiledeskToken');
      this.logger.log('[PROJECT-ITEM] - GET PROJECTS - tiledeskToken', tiledeskToken);
      this.tiledeskService.getProjects(tiledeskToken).subscribe(projects => {
        this.logger.log('[PROJECT-ITEM - GET PROJECTS - RES', projects);

        this.logger.log('[INFO-CONTENT-COMP] - GET PROJECTS - RES this.project', this.project);

        localStorage.setItem('last_project', JSON.stringify(projects[0]))
        if (projects[0]) {
          this.project = projects[0];
          this.doProjectSubscriptions(this.project)
        }

      }, (error) => {
        this.logger.error('[PROJECT-ITEM] - GET PROJECTS - ERROR  ', error);

      }, () => {
        this.logger.log('[INFO-CONTENT-COMP] - GET PROJECTS * COMPLETE *');

      });
    }


    if (stored_project && stored_project !== 'undefined') {
      this.logger.log('PROJECT-ITEM - THERE IS STORED LAST PROJECT ', stored_project)
      if (stored_project) {
        this.project = JSON.parse(stored_project)
      }
      this.doProjectSubscriptions(this.project)
      this.logger.log('[PROJECT-ITEM] - LAST PROJECT PARSED ', this.project)
    }

    


  }

  doProjectSubscriptions(project) {
    this.events.publish('storage:last_project', project)
    this.logger.log('[PROJECT-ITEM] doProjectSubscriptions project ', project)
    if (project) {
      const user_role = this.project.role
      this.logger.log('[PROJECT-ITEM] - user_role ', user_role)
      this.projectIdEvent.emit(project.id_project._id)

      if (user_role === 'agent') {
        this.ROLE_IS_AGENT = true;

      } else {
        this.ROLE_IS_AGENT = false;
      }


      this.logger.log('[PROJECT-ITEM] - LAST PROJECT PARSED > user_role ', user_role)
      this.wsService.subscriptionToWsCurrentProjectUserAvailability(project.id_project._id, this.project._id);
      this.listenTocurrentProjectUserUserAvailability$(project)

      this.wsService.subscriptionToWsConversations(project.id_project._id)
      this.updateUnservedRequestCount();

    }
  }

  listenTocurrentProjectUserUserAvailability$(project) {
    this.wsService.currentProjectUserAvailability$.pipe(takeUntil(this.unsubscribe$)).subscribe((projectUser) => {
        this.logger.log('[PROJECT-ITEM] - $UBSC TO WS USER AVAILABILITY & BUSY STATUS RES ', projectUser);

        if (project.id_project._id === projectUser['id_project']) {
          project['ws_projct_user_available'] = projectUser['user_available'];
          project['ws_projct_user_isBusy'] = projectUser['isBusy']
          if (this.translationMap) {
            if (projectUser['user_available'] === true) {
              this.avaialble_status_for_tooltip = this.translationMap.get('CHANGE_TO_YOUR_STATUS_TO_UNAVAILABLE')
            } else {
              this.avaialble_status_for_tooltip = this.translationMap.get('CHANGE_TO_YOUR_STATUS_TO_AVAILABLE')
            }
          }
        }

      }, (error) => {
        this.logger.error('[PROJECT-ITEM] - $UBSC TO WS USER AVAILABILITY & BUSY STATUS error ', error);
      }, () => {
        this.logger.log('[PROJECT-ITEM] - $UBSC TO WS USER AVAILABILITY & BUSY STATUS * COMPLETE *');
      })
  }

  changeAvailabilityState(projectid, available) {
    this.logger.log('[PROJECT-ITEM] - changeAvailabilityState projectid', projectid, ' available: ', available);

    available = !available
    this.logger.log('[PROJECT-ITEM] - changeAvailabilityState projectid', projectid, ' available: ', available);

    this.wsService.updateCurrentUserAvailability(this.tiledeskToken, projectid, available, "").subscribe((projectUser: any) => {

        this.logger.log('[PROJECT-ITEM] - PROJECT-USER UPDATED ', projectUser)
        // NOTIFY TO THE USER SERVICE WHEN THE AVAILABLE / UNAVAILABLE BUTTON IS CLICKED
        // this.usersService.availability_btn_clicked(true)

        if (this.project['id_project']._id === projectUser.id_project) {
          this.project['ws_projct_user_available'] = projectUser.user_available;
          // this.project['ws_projct_user_isBusy'] = projectUser['isBusy']
        }

      }, (error) => {
        this.logger.error('[PROJECT-ITEM] - PROJECT-USER UPDATED - ERROR  ', error);

      }, () => {
        this.logger.log('[PROJECT-ITEM] - PROJECT-USER UPDATED  * COMPLETE *');

      });
  }

  updateUnservedRequestCount() {

    this.wsService.wsRequestsList$.pipe(takeUntil(this.unsubscribe$)).pipe(skip(1)).subscribe((requests) => {
      if (requests) {
        let count = 0;
        requests.forEach(r => {
          if (r['status'] === 100) {
            if (this.hasmeInAgents(r['agents']) === true) {
              count = count + 1;
            }
          }
        });
        //not sound if unservedRequest is already chached and web-sk is closed and restart again
        if(count > this.unservedRequestCount ){  
          this.events.publish('unservedRequest:count', this.unservedRequestCount)
        }
        this.unservedRequestCount = count;

      }
    }, error => {
      this.logger.error('[PROJECT-ITEM] UNSERVED REQUEST COUNT * error * ', error)
    }, () => {
      this.logger.log('[PROJECT-ITEM] UNSERVED REQUEST COUNT */* COMPLETE */*')
    })
  }

  hasmeInAgents(agents) {
    if (agents) {
      for (let j = 0; j < agents.length; j++) {
        if (this.currentUserId === agents[j].id_user) {
          return true
        }
      }
    } else {
      this.logger.log('[PROJECT-ITEM] hasmeInAgents OOPS!!! AGENTS THERE ARE NOT ')
    }
  }




}


