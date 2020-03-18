import express from 'express';
// import bodyParser from 'body-parser';
import * as requestPromise from 'request-promise';
import { TextEventMessage } from '@line/bot-sdk';
import _ from 'lodash';
import LineWebhook from './line-webhook.class';
import { keyboardMap } from './keywordMap';
// import { travelWarningPayload } from './travelWarningPayload';

const disableMap: {
    [roomId: string]: boolean;
} = {};
let lineWebhook: LineWebhook;
let travelWarning: any;
// let coronavirusCaseNum: any;

export async function lineBot(req: express.Request, res: express.Response) {
    console.log('webhook start');
    if (!lineWebhook) {
        lineWebhook = new LineWebhook({
            channelAccessToken: 'jr731th3J9syZ3xJBp8J7vJObejF2faGbogKhsistC1SsBECl78wteoGGpog4Bc3enhXM5brxI98mRc2rh8TJKFJiv1VH7m/giB7XQR2SVyzQkuTxbuBVbQ2HW5zO4v1VmG/v3ENfKbQXu8z2ryG6QdB04t89/1O/w1cDnyilFU=',
            channelSecret: '2a074b84f723be77f326214548a3b472',
        });
    }

    async function initTravelWarning() {
        travelWarning = await requestPromise.get('https://us-central1-aiii-bot-platform.cloudfunctions.net/travelWarning', {
            headers:
            {
                'cache-control': 'no-cache',
                'Content-Type': 'application/json',
            },
            json: true,
        });
    }

    lineWebhook.setHandleText(/測/, async (event: any) => {
        if (disableMap[lineWebhook.roomId || lineWebhook.groupId || lineWebhook.userId] !== false) {
            const { replyToken } = event;
            lineWebhook.replyText(replyToken, 'test').catch(e => console.error(e));
        }
    });

    lineWebhook.setHandleText(/噓/, async (event: any) => {
        if (disableMap[lineWebhook.roomId || lineWebhook.groupId || lineWebhook.userId] !== false) {
            disableMap[lineWebhook.roomId || lineWebhook.groupId || lineWebhook.userId] = false;
            const { replyToken } = event;
            lineWebhook.replyText(replyToken, '886~').catch(e => console.error(e));
        }
    });

    lineWebhook.setHandleText(/嘿/, async (event: any) => {
        disableMap[lineWebhook.roomId || lineWebhook.groupId || lineWebhook.userId] = true;
        const { replyToken } = event;
        lineWebhook.replyText(replyToken, 'back~').catch(e => console.error(e));
    });

    lineWebhook.setHandleText(/.*/, async (event: any) => {
        const { replyToken } = event;
        const message = event.message as TextEventMessage;
        if (!travelWarning) {
            await initTravelWarning();
        }

        if (disableMap[lineWebhook.roomId || lineWebhook.groupId || lineWebhook.userId] !== false) {
            const payloadMessage: any = [];
            let isComplete = false;
            _.forEach(keyboardMap, (regExp, key) => {
                if (!isComplete && regExp.test(message.text)) {
                    isComplete = true;
                    // payloadMessage.push(travelWarningPayload(key, travelWarning[key].severity_level, travelWarning[key].instruction));
                    payloadMessage.push(key);
                    payloadMessage.push(travelWarning[key].instruction || '-');
                    payloadMessage.push(travelWarning[key].severity_level || '-');
                }
            });

            if (!isComplete && travelWarning[message.text]) {
                isComplete = true;
                // payloadMessage.push(
                //     travelWarningPayload(message.text, travelWarning[message.text].severity_level, travelWarning[message.text].instruction),
                // );
                payloadMessage.push(message.text);
                payloadMessage.push(travelWarning[message.text].instruction || '-');
                payloadMessage.push(travelWarning[message.text].severity_level || '-');
            }

            if (isComplete) {
                lineWebhook.replyText(replyToken, payloadMessage).catch(e => console.error(e));
            } else {
                lineWebhook.replyText(replyToken, '你說: ' + message.text).catch(e => console.error(e));
            }
        }
    });

    lineWebhook.lineWebhook(req, res).catch(e => console.error(e));

};