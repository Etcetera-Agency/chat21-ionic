import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { MAX_WIDTH_IMAGES, MIN_WIDTH_IMAGES } from 'src/chat21-core/utils/constants';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { isFile, isFrame, isImage } from 'src/chat21-core/utils/utils-message';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { TranslateService } from '@ngx-translate/core';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
import * as moment from 'moment';
import { CreateCannedResponsePage } from 'src/app/pages/create-canned-response/create-canned-response.page'
import { ModalController } from '@ionic/angular';
@Component({
  selector: 'chat-bubble-message',
  templateUrl: './bubble-message.component.html',
  styleUrls: ['./bubble-message.component.scss']
})
export class BubbleMessageComponent implements OnInit, OnChanges {

  @Input() message: MessageModel;
  @Input() textColor: string;
  @Input() areVisibleCAR: boolean;
  @Input() supportMode: boolean;
  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();
  isImage = isImage;
  isFile = isFile;
  isFrame = isFrame;
  @Input() addAsCannedResponseTooltipText : string;
  public browserLang: string;

  tooltipOptions = {
    'show-delay': 500,
    'tooltip-class': 'chat-tooltip',
    'theme': 'light',
    'shadow': false,
    'hide-delay-mobile': 0,
    'hideDelayAfterClick': 3000,
    'hide-delay': 200
  };
  sizeImage : { width: number, height: number}

  private logger: LoggerService = LoggerInstance.getInstance()
 
  constructor(
    public sanitizer: DomSanitizer,
    public translate: TranslateService,
    public tiledeskAuthService: TiledeskAuthService,
    public modalController: ModalController,
    ) {
    // console.log('BUBBLE-MSG Hello !!!!')
  }

  ngOnInit() {
    // this.setMomentLocale()
  }


  setMomentLocale() {
    this.browserLang = this.translate.getBrowserLang();
    const currentUser = this.tiledeskAuthService.getCurrentUser();
    let currentUserId = ''
    if (currentUser) {
      currentUserId = currentUser.uid
    }

    const stored_preferred_lang = localStorage.getItem(currentUserId + '_lang');

    let chat_lang = ''
    if (this.browserLang && !stored_preferred_lang) {
      chat_lang = this.browserLang
    } else if (this.browserLang && stored_preferred_lang) {
      chat_lang = stored_preferred_lang
    }
    moment.updateLocale(chat_lang , {
      calendar: {
        sameElse: 'LLLL'
      }
    });
  }

  ngOnChanges() {
    if (this.message && this.message.metadata && typeof this.message.metadata === 'object') {
      this.sizeImage = this.getMetadataSize(this.message.metadata)
    }
  }


  /**
   *
   * @param message
   */
  // getMetadataSize(metadata): any {
  //   if(metadata.width === undefined){
  //     metadata.width= MAX_WIDTH_IMAGES
  //   }
  //   if(metadata.height === undefined){
  //     metadata.height = MAX_WIDTH_IMAGES
  //   }
  //   // const MAX_WIDTH_IMAGES = 300;
  //   const sizeImage = {
  //       width: metadata.width,
  //       height: metadata.height
  //   };
  //   //   that.g.wdLog(['message::: ', metadata);
  //   if (metadata.width && metadata.width > MAX_WIDTH_IMAGES) {
  //       const rapporto = (metadata['width'] / metadata['height']);
  //       sizeImage.width = MAX_WIDTH_IMAGES;
  //       sizeImage.height = MAX_WIDTH_IMAGES / rapporto;
  //   }
  //   return sizeImage; // h.toString();
  // }

  getMetadataSize(metadata): any {
    // if (metadata.width === undefined) {
    //   metadata.width = MAX_WIDTH_IMAGES
    // }
    // if (metadata.height === undefined) {
    //   metadata.height = MAX_WIDTH_IMAGES
    // }

    const sizeImage = {
      width: metadata.width,
      height: metadata.height
    };

    if (metadata.width && metadata.width < MAX_WIDTH_IMAGES) {
      if (metadata.width <= 55) {
        const ratio = (metadata['width'] / metadata['height']);
        sizeImage.width = MIN_WIDTH_IMAGES;
        sizeImage.height = MIN_WIDTH_IMAGES / ratio;
      } else if (metadata.width > 55) {
        sizeImage.width = metadata.width;
        sizeImage.height = metadata.height
      }
      
    } else if (metadata.width && metadata.width > MAX_WIDTH_IMAGES) {
      const ratio = (metadata['width'] / metadata['height']);
      sizeImage.width = MAX_WIDTH_IMAGES;
      sizeImage.height = MAX_WIDTH_IMAGES / ratio;
    }
    return sizeImage
  }

  /**
  * function customize tooltip
  */
  handleTooltipEvents(event) {
    const that = this;
    const showDelay = this.tooltipOptions['show-delay'];
    setTimeout(function () {
      try {
        const domRepresentation = document.getElementsByClassName('chat-tooltip');
        if (domRepresentation) {
          const item = domRepresentation[0] as HTMLInputElement;
          if (item && !item.classList.contains('tooltip-show')) {
            item.classList.add('tooltip-show');
          }
          setTimeout(function () {
            if (item && item.classList.contains('tooltip-show')) {
              item.classList.remove('tooltip-show');
            }
          }, that.tooltipOptions['hideDelayAfterClick']);
        }
      } catch (err) {
        that.logger.error('[BUBBLE-MESSAGE] handleTooltipEvents >>>> Error :' + err);
      }
    }, showDelay);
  }

  // ========= begin:: event emitter function ============//

  // returnOpenAttachment(event: String) {
  //   this.onOpenAttachment.emit(event)
  // }

  // /** */
  // returnClickOnAttachmentButton(event: any) {
  //   this.onClickAttachmentButton.emit(event)
  // }

  returnOnBeforeMessageRender(event) {
    const messageOBJ = { message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component }
    this.onBeforeMessageRender.emit(messageOBJ)
  }

  returnOnAfterMessageRender(event) {
    const messageOBJ = { message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component }
    this.onAfterMessageRender.emit(messageOBJ)
  }

  onElementRenderedFN(event){
    this.onElementRendered.emit({element: event.element, status: event.status})
  }

  async presentCreateCannedResponseModal(): Promise<any> {
    this.logger.log('[BUBBLE-MESSAGE] PRESENT CREATE CANNED RESPONSE MODAL ')
    const attributes = {
       message: this.message,
    }
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: CreateCannedResponsePage,
      componentProps: attributes,
      swipeToClose: false,
      backdropDismiss: false,
    })
    modal.onDidDismiss().then((dataReturned: any) => {
      // 
      this.logger.log('[BUBBLE-MESSAGE] ', dataReturned.data)
    })

    return await modal.present()
  }


  // printMessage(message, messageEl, component) {
  //   const messageOBJ = { message: message, sanitizer: this.sanitizer, messageEl: messageEl, component: component}
  //   this.onBeforeMessageRender.emit(messageOBJ)
  //   const messageText = message.text;
  //   this.onAfterMessageRender.emit(messageOBJ)
  //   // this.triggerBeforeMessageRender(message, messageEl, component);
  //   // const messageText = message.text;
  //   // this.triggerAfterMessageRender(message, messageEl, component);
  //   return messageText;
  // }

  // ========= END:: event emitter function ============//


}
