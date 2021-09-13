// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup

// self.addEventListener('notificationclick', function (event) {
//   console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  +++ event ', event);

//   let url = event.notification.data.url;
//   // let url = "http://localhost:8101/#/conversation-detail/support-group-60aa0ffd1482fe00346854be-8ff54a0e11674e269fab981603b16745/WALTER/active"
//   event.preventDefault();
//   console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  ++++ event url', url);
//   console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  ++++ event notification actions > action', event.notification.actions[0]['action']);

//   // Android doesn’t close the notification when you click on it
//   // See: http://crbug.com/463146
//   event.notification.close();

// // This looks to see if the current is already open and
//   // focuses if it is
// event.waitUntil(self.clients.matchAll(
//   {
//     includeUncontrolled: true,
//     type: 'window'
//   }).then(function (clientList) {
//     for (var i = 0; i < clientList.length; i++) {
//       var client = clientList[i];
//       console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick client ', client);
//       if (client.url.startsWith(url) && 'focus' in client) {

//         // -----------------------------------------------
//         // Post message
//         // -----------------------------------------------
//         client.postMessage({
//           message: 'Received a push message.',
//           data: event.notification.actions[0]['action']
//         });

//         // console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES 1 ');
//         return client.focus();
//       }
//     }
//     if (clients.openWindow) {
//       console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2');
//       console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  notification  actions ', event.notification.actions[0]['action']);
//        const  actioObjct = JSON.parse(event.notification.actions[0]['action']);
//       console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  notification  actioObjct ', actioObjct);
//       // 
//       const url = event.notification.data.url + '#/conversation-detail/' +  actioObjct.recipient + "/" + actioObjct.recipient_fullname + '/active'
//       console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  built url ', url);


//       return clients.openWindow(url);

//     }
//   }));
// });


self.addEventListener('notificationclick', event => {
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  +++ event ', event);

  let baseurl = ''
  if (event.notification && event.notification.data && event.notification.data.url) {
    baseurl = event.notification.data.url;
  } else if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data && event.notification.data.FCM_MSG.data.click_action) {
    baseurl = event.notification.data.FCM_MSG.data.click_action;
  }

  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  ++++ event baseurl', baseurl);

  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();


  event.waitUntil(async function () {
    const allClients = await clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });

    let chatClient;
    console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES ');
    // Let's see if we already have a chat window open:
    for (const client of allClients) {
      console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  1B client.url', client.url);
      // const url = new URL(client.url);
      // console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  1C url.pathname' ,url.pathname);
      // if (url.pathname == '/chat/') {
      if (client.url.startsWith(baseurl)) {
        // Excellent, let's use it!
        client.focus();
        // windowClient.focus();

        chatClient = client;

        if (event.notification && event.notification.actions && event.notification.actions.length > 0) {
          console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  CALLING POSTMESSAGE USECASE event.notification.actions[0][action]', event.notification.actions[0]['action']);

          chatClient.postMessage({
            message: 'Received a push message.',
            data: event.notification.actions[0]['action']
          });

        } else if (event.notification.data.FCM_MSG.data.channel_type === 'group') {
          if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data && event.notification.data.FCM_MSG.data.recipient) {
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  CALLING POSTMESSAGE USECASE event.notification.data.FCM_MSG.data.recipient', event.notification.data.FCM_MSG.data.recipient);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  CALLING POSTMESSAGE USECASE event.notification.data.FCM_MSG.data.channel_type', event.notification.data.FCM_MSG.data.channel_type);

            chatClient.postMessage({
              message: 'Received a push message.',
              data: event.notification.data.FCM_MSG.data.recipient
            });
          }

        } else if (event.notification.data.FCM_MSG.data.channel_type === 'direct') {
          if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data && event.notification.data.FCM_MSG.data.sender) {

            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  CALLING POSTMESSAGE USECASE event.notification.data.FCM_MSG.data.sender', event.notification.data.FCM_MSG.data.sender);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick  CALLING POSTMESSAGE USECASE event.notification.data.FCM_MSG.data.channel_type', event.notification.data.FCM_MSG.data.channel_type);

            chatClient.postMessage({
              message: 'Received a push message.',
              data: event.notification.data.FCM_MSG.data.sender
            });
          }
        }


        console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  1C chatClient', chatClient);
        break;
      }
    }

    // If we didn't find an existing chat window,
    // open a new one:
    if (!chatClient) {
      if (clients.openWindow) {
        console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2');


        // console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2  notification action recipient ', event.notification.actions[0]['action']);
        //  const  actioObjct = JSON.parse(event.notification.actions[0]['action']);
        // console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  notification  actioObjct ', actioObjct);
        // 
        // const url = event.notification.data.url + '#/conversation-detail/' + actioObjct.recipient + "/" + actioObjct.recipient_fullname + '/active'

        if (event.notification && event.notification.actions && event.notification.actions.length > 0) {
          console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2A event.notification.actions  ', event.notification.actions);

          const url = baseurl + '#/conversation-detail/' +  event.notification.actions[0]['action'] + "/" + event.notification.actions[0]['title'] + '/active'
          console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  built url ', url);
          chatClient = await clients.openWindow(url);

        } else if (event.notification.data.FCM_MSG.data.channel_type === "direct") {
          if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data) {
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data  ', event.notification.data.FCM_MSG.data);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.channel_type  ', event.notification.data.FCM_MSG.data.channel_type);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.sender_fullname  ', event.notification.data.FCM_MSG.data.sender_fullname);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.channel_type  ', event.notification.data.FCM_MSG.data.sender);

            const url = baseurl + '#/conversation-detail/' +  event.notification.data.FCM_MSG.data.sender + "/" + event.notification.data.FCM_MSG.data.sender_fullname + '/active'
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  built url ', url);
            chatClient = await clients.openWindow(url);


          }
        } else if (event.notification.data.FCM_MSG.data.channel_type === "group") {
          if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data) {
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data  ', event.notification.data.FCM_MSG.data);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.channel_type  ', event.notification.data.FCM_MSG.data.channel_type);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.sender_fullname  ', event.notification.data.FCM_MSG.data.sender_fullname);
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) notificationclick HERE YES  2B  event.notification.data.FCM_MSG.data.recipient  ', event.notification.data.FCM_MSG.data.recipient);

            const url = baseurl + '#/conversation-detail/' +  event.notification.data.FCM_MSG.data.recipient + "/" + event.notification.data.FCM_MSG.data.sender_fullname + '/active'
            console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) HERE YES  2  built url ', url);
            chatClient = await clients.openWindow(url);
          }
        }
      }

      // Message the client:
      // chatClient.postMessage("New chat messages!");



    }
  }());
});


importScripts('https://www.gstatic.com/firebasejs/8.6.7/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.7/firebase-messaging.js');


firebase.initializeApp({
  apiKey: 'AIzaSyCoWXHNvP1-qOllCpTshhC6VjPXeRTK0T4"',
  authDomain: 'chat21-pre-01.firebaseapp.com',
  databaseURL: 'https://chat21-pre-01.firebaseio.com',
  projectId: 'chat21-pre-01',
  storageBucket: 'chat21-pre-01.appspot.com',
  messagingSenderId: '269505353043',
  appId: '1:269505353043:web:b82af070572669e3707da6'
});
// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();//.useServiceWorker(registration);

// [END initialize_firebase_in_sw]



// ----- new -------
messaging.onBackgroundMessage(function (payload) {
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message ', payload);
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message payload recipient', payload.data.recipient);
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message payload sender', payload.data.sender);
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message payload channel_type', payload.data.channel_type);
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message payload recipient_fullname', payload.data.recipient_fullname);
  console.log('FIREBASE-NOTIFICATION (FIREBASE-MESSAGING-SW) Received background message payload sender_fullname', payload.data.sender_fullname);
  // data = `{ "recipient": "${payload.data.recipient}", "recipient_fullname": "${payload.data.recipient_fullname}", "status": "${payload.data.status}" }`



  conv_id = ""
  if (payload.data.channel_type === "direct") {
    conv_id = payload.data.sender
  } else if (payload.data.channel_type === "group") {
    conv_id = payload.data.recipient
  }


  let sender_fullname = payload.data.sender_fullname
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './assets/images/tiledesk_logo_50x50.png',
    data: { url: payload.data.click_action }, //the url which we gonna use later
    actions: [{
      "action": conv_id, "title": sender_fullname
    }]
  };
  // /Users/nicola/CHAT21_IONIC/src/assets/images/tiledesk_logo_no_text_72x72.png
  // self.registration.showNotification(notificationTitle, notificationOptions);
});
// [END background_handler]




