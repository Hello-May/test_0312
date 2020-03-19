import express from 'express';
// import rp from 'request-promise';
// import dialogflow from 'dialogflow';
// import uuid from 'uuid';
// const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

export async function dialogflowBot(req: express.Request, res: express.Response) {
  const promises = req.body.events.map(async (req,res,event) => {
    console.log('event----');
    console.log(event);
    console.log('----');

    // const msg = event.message.text;
    // const reply_token = event.replyToken;
    // const options = {
    //   method: 'POST',
    //   uri: "https://api.line.me/v2/bot/message/reply",
    //   headers: {
    //     "Content-type": "application/json; charset=UTF-8",
    //     "Authorization": `Bearer jr731th3J9syZ3xJBp8J7vJObejF2faGbogKhsistC1SsBECl78wteoGGpog4Bc3enhXM5brxI98mRc2rh8TJKFJiv1VH7m/giB7XQR2SVyzQkuTxbuBVbQ2HW5zO4v1VmG/v3ENfKbQXu8z2ryG6QdB04t89/1O/w1cDnyilFU=`
    //   },
    //   json: true,
    //   body: {
    //     replyToken: reply_token,
    //     messages: [
    //       {
    //         "type": "text",
    //         "text": msg
    //       }
    //     ]
    //   }
    // };
    // try {
    //   const response = await rp(options);
    //   console.log("Success : " + response);
    // }
    // catch (err) {
    //   console.log("Error : " + err);
    // }

    const agent = new WebhookClient({ req, res });
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

    function welcome(agent) {
      agent.add(`歡迎!`);
    }

    function fallback(agent) {
      agent.add(`說啥呢`);
      agent.add(`～“～？`);
    }

    function yourFunctionHandler(agent) {
      agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
      agent.add(new Card({
        title: `Title: this is a card title`,
        imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
        text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
        buttonText: 'This is a button',
        buttonUrl: 'https://assistant.google.com/'
      })
      );
      agent.add(new Suggestion(`Quick Reply`));
      agent.add(new Suggestion(`Suggestion`));
      agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' } });
    }

    const intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('your intent name here', yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
  });

  Promise
    .all(promises)
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.log("Error : " + err);
    });
}

//---------------------------------------------------------------------

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */

// async function runSample(projectId = 'your-project-id') {
//   // A unique identifier for the given session
//   const sessionId = uuid.v4();

//   // Create a new session
//   const sessionClient = new dialogflow.SessionsClient();
//   const sessionPath = sessionClient.sessionPath(projectId, sessionId);

//   // The text query request.
//   const request = {
//     session: sessionPath,
//     queryInput: {
//       text: {
//         // The query to send to the dialogflow agent
//         text: 'hello',
//         // The language used by the client (en-US)
//         languageCode: 'en-US',
//       },
//     },
//   };

//   // Send request and log result
//   const responses = await sessionClient.detectIntent(request);
//   console.log('Detected intent');
//   const result = responses[0].queryResult;
//   console.log(`  Query: ${result.queryText}`);
//   console.log(`  Response: ${result.fulfillmentText}`);
//   if (result.intent) {
//     console.log(`  Intent: ${result.intent.displayName}`);
//   } else {
//     console.log(`  No intent matched.`);
//   }
// }
