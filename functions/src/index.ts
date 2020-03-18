import * as functions from 'firebase-functions';
import rp from 'request-promise';
import { lineBot } from './line-bot';
import { dialogflowBot } from './dialogflow-bot';

export const chat = functions.https.onRequest(lineBot);
export const dialog = functions.https.onRequest(dialogflowBot);

export const helloWorld = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase!");
});

export const justReply = functions.https.onRequest((req, res) => {
    const promises = req.body.events.map(async (event: any) => {
        console.log('event----');
        console.log(event);
        console.log('----');

        const msg = event.message.text;
        const reply_token = event.replyToken;
        const options = {
            method: 'POST',
            uri: "https://api.line.me/v2/bot/message/reply",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": `Bearer jr731th3J9syZ3xJBp8J7vJObejF2faGbogKhsistC1SsBECl78wteoGGpog4Bc3enhXM5brxI98mRc2rh8TJKFJiv1VH7m/giB7XQR2SVyzQkuTxbuBVbQ2HW5zO4v1VmG/v3ENfKbQXu8z2ryG6QdB04t89/1O/w1cDnyilFU=`
            },
            json: true,
            body: {
                replyToken: reply_token,
                messages: [
                    {
                        "type": "text",
                        "text": msg
                    }
                ]
            }
        };
        try {
            const response = await rp(options);
            console.log("Success : " + response);
        }
        catch (err) {
            console.log("Error : " + err);
        }
    });

    Promise
        .all(promises)
        .then(() => res.json({ success: true }))
        .catch((err) => {
            console.log("Error : " + err);
        });
});
