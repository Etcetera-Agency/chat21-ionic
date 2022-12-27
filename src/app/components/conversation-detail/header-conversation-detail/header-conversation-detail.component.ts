import { TYPE_GROUP } from './../../../../chat21-core/utils/constants';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service'

// Logger
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service'
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance'
import { Platform } from '@ionic/angular'

import { ModalController } from '@ionic/angular'
import { EventsService } from 'src/app/services/events-service'
import { CreateTicketPage } from 'src/app/modals/create-ticket/create-ticket.page'
import { TiledeskService } from 'src/app/services/tiledesk/tiledesk.service'
import { TYPE_DIRECT, TYPE_SUPPORT_GROUP } from 'src/chat21-core/utils/constants'

@Component({
  selector: 'app-header-conversation-detail',
  templateUrl: './header-conversation-detail.component.html',
  styleUrls: ['./header-conversation-detail.component.scss'],
})
export class HeaderConversationDetailComponent implements OnInit, OnChanges {

  @Input() conversationAvatar: any
  @Input() idLoggedUser: string
  @Input() conversationUid: string
  @Input() conv_type: string
  @Input() liveInfo: {sourcePage: string, sourceTitle: string}
  @Input() isMobile: boolean
  @Input() translationsMap: Map<string, string>
  conversationWithFullname: string
  openInfoConversation = true
  
  isDirect = false
  borderColor = '#ffffff'
  fontColor = '#949494'
  platformName: string
  // conv_closed: boolean = false;
  IS_ON_IOS_MOBILE_DEVICE: boolean
  private logger: LoggerService = LoggerInstance.getInstance()

  TYPE_SUPPORT_GROUP = TYPE_SUPPORT_GROUP
  TYPE_GROUP = TYPE_GROUP

  constructor(
    public imageRepoService: ImageRepoService,
    private route: ActivatedRoute,
    public platform: Platform,
    private router: Router,
    public tiledeskService: TiledeskService,
    public events: EventsService,
    public modalController: ModalController,
  ) {
    
  }

  // ----------------------------------------------------
  // @ Lifehooks
  // ----------------------------------------------------
  ngOnInit() {

    this.logger.log('[CONVS-DETAIL][HEADER] - (ngOnInit) - idLoggedUser', this.idLoggedUser,)
    this.logger.log('[CONVS-DETAIL][HEADER] - (ngOnInit) - conversationAvatar', this.conversationAvatar,)
    this.logger.log('[CONVS-DETAIL][HEADER] - (ngOnInit) -  conv_type', this.conv_type)
    // this.listenToConversationHasBeenClosed()
    // this.isOniOSMobileDevice()
  }

  isOniOSMobileDevice() {
    this.IS_ON_IOS_MOBILE_DEVICE = false;
    if (/iPad|iPhone|iPod/i.test(window.navigator.userAgent)) {
      this.IS_ON_IOS_MOBILE_DEVICE = true;

    }
    // console.log('[CONVS-DETAIL][HEADER] IS_ON_IOS_MOBILE_DEVICE ', this.IS_ON_IOS_MOBILE_DEVICE)
    return this.IS_ON_IOS_MOBILE_DEVICE;
  }

  ngOnChanges() {
    this.logger.log('[CONVS-DETAIL][HEADER] - (ngOnChanges) -  conversationAvatar', this.conversationAvatar)
    if (this.conversationAvatar) {
      this.conversationAvatar.imageurl = this.imageRepoService.getImagePhotoUrl(this.conversationAvatar.uid)
      this.initialize()
    }
  }

  // ----------------------------------------------------
  // @ Initialize (called in ngOnInit)
  // ----------------------------------------------------
  initialize() {
    this.getPlatformName()
    if ( this.conversationAvatar && this.conversationAvatar.channelType === TYPE_DIRECT ) {
      this.isDirect = true
    }
  }

  getPlatformName() {
    this.logger.log('getPlatformName this.platform', this.platform)
    if (this.platform.is('ios')) {
      this.platformName = 'ios'
      this.logger.log('getPlatformName platformName', this.platformName)
    } else if (this.platform.is('android')) {
      this.platformName = 'android'
      this.logger.log('getPlatformName platformName', this.platformName)
    }
  }

  // closeConversation() {
  //   this.logger.log('[CONVS-DETAIL][HEADER] click on RESOLVE this.events', this.events) 
  //   this.events.publish('conversation:closed', this.conversationUid)
  // }

  // listenToConversationHasBeenClosed() {
  //   this.events.subscribe('conversationhasbeenclosed', (convId) => {
  //     // console.log('[CONVS-DETAIL][HEADER] conversationhasbeenclosed  convId', convId)
  //     if (convId === this.conversationUid) {
  //       this.logger.log('[CONVS-DETAIL][HEADER] the conversation was closed',)
  //       this.conv_closed = true;
  //     }
  //   });
  // }

  /** */
  pushPage(event) { }

  goBackToConversationList() {
    this.router.navigateByUrl('/conversations-list')
  }

  // -----------------------------------------------------------------
  // PRESENT MODAL CREATE TICKET (MOVED IN ddp-deader.component.ts)
  // -----------------------------------------------------------------
  // async presentCreateTicketModal(e: any): Promise<any>{

  //   // const attributes = {  enableBackdropDismiss: false };
  //   const modal: HTMLIonModalElement =
  //     await this.modalController.create({
  //       component: CreateTicketPage,
  //       // componentProps: attributes,
  //       swipeToClose: false,
  //       backdropDismiss: false
  //     });
  //   modal.onDidDismiss().then((detail: any) => {
  //     this.logger.log('[CONVS-DETAIL][HEADER] ', detail.data);
  //   });
  //   return await modal.present();
  // }
}
