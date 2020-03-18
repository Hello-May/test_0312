import { Request, Response } from 'express';
import {
  Client, Message, FollowEvent, MessageEvent, UnfollowEvent,
  JoinEvent, LeaveEvent, PostbackEvent,
  WebhookEvent, BeaconEvent, TextEventMessage,
} from '@line/bot-sdk';
import _ from 'lodash';

interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

interface EventStack {
  eventName: string | RegExp;
  type: 'text' | 'postback';
  callback: Function;
}

export default class LineWebhook {
  private lineClient: Client;
  private eventStack: EventStack[] = [];
  public userId = '';
  public roomId = '';
  public groupId = '';

  constructor(lineConfig: LineConfig) {
    this.lineClient = new Client(lineConfig);
  }

  public async lineWebhook(req: Request, res: Response) {
    if (req.method === 'GET') {
      res.send('line webhook cold start');
      return null;
    }

    console.log('line-webhook headers:', JSON.stringify(req.headers));
    console.log('line-webhook body = ', JSON.stringify(req.body));
    this.userId = req.body.events[0].source.userId || '';
    this.roomId = req.body.events[0].source.roomId || '';
    this.groupId = req.body.events[0].source.groupId || '';
    console.log({
      userId: this.userId,
      roomId: this.roomId,
      groupId: this.groupId,
    });

    // line webhook 驗證用
    if (this.userId === 'Udeadbeefdeadbeefdeadbeefdeadbeef') {
      res.end();
    }

    return Promise.all(_.map(req.body.events, this.handleEvent))
      .then(() => {
        res.end();
      })
      .catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  }

  /**
 * 設定 text 事件
 * @param eventName 觸發文字(string 或 正規表達式)
 * @param callback 自訂的函式
 */
  public setHandleText(eventName: string | RegExp, callback: (event: MessageEvent) => void) {
    this.eventStack.push({
      eventName,
      type: 'text',
      callback,
    });
  }

  private handleEvent = async (event: WebhookEvent) => {
    console.log('event:', JSON.stringify(event));
    switch (event.type) {
      case 'message':
        const { message } = event;
        // if (this.shutUp && (message.type === 'text' && message.text !== this.talkWord)) {
        //   return;
        // }
        switch (message.type) {
          case 'text':
            return this.handleText(event);
          case 'image':
            return this.handleImage(event);
          case 'video':
            return this.handleVideo(event);
          case 'audio':
            return this.handleAudio(event);
          case 'file':
            return this.handleFile(event);
          case 'location':
            return this.handleLocation(event);
          case 'sticker':
            return this.handleSticker(event);
          default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
        }

      // 加入好友
      case 'follow':
        return this.handleFollow(event);

      // bot被封鎖
      case 'unfollow':
        return this.handleUnfollow(event);

      // 加入群組或聊天室
      case 'join':
        return this.handleJoin(event);

      // 從群組刪除
      case 'leave':
        console.log(`Left: ${JSON.stringify(event)}`);
        return this.handleLeave(event);

      // template message 回傳 action
      case 'postback':
        return this.handlePostback(event);

      case 'beacon':
        return this.handleBeacon(event);

      default:
        throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
  };

  protected handleText = async (event: MessageEvent): Promise<any> => {
    console.log('text', JSON.stringify(event));

    const message = event.message as TextEventMessage;
    const { userId } = event.source;
    if (!userId) {
      throw Error('no userId');
    }

    for (const item of this.eventStack) {
      if (item.type === 'text' && (
        typeof item.eventName === 'string' ? item.eventName === message.text
          : item.eventName.test(message.text)
      )) {
        return item.callback(event);
      }
    }
    return this.replyText(event.replyToken, '收到Text');
  };

  protected handleImage = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到Image');

  protected handleVideo = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到Video');

  protected handleAudio = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到Audio');

  protected handleFile = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到File');

  protected handleLocation = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到Location');

  protected handleSticker = async (event: MessageEvent): Promise<any> => this.replyText(event.replyToken, '收到Sticker');

  protected handleFollow = async (event: FollowEvent) => this.replyText(event.replyToken, '歡迎光臨');

  protected handleUnfollow = async (event: UnfollowEvent) => {
    console.log(`被封鎖： ${JSON.stringify(event)}`);
  };

  protected handleJoin = async (event: JoinEvent) => this.replyText(event.replyToken, `Joined ${event.source.type}`);

  protected handleLeave = async (event: LeaveEvent) => {
    console.log(`Left ${event.source.type}`);
    return null;
  };

  protected handlePostback = async (event: PostbackEvent) => {
    console.log(`postback: ${JSON.stringify(event)}`);
  };

  protected handleBeacon = async (event: BeaconEvent) => this.replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

  /**
   * 回覆文字訊息
   * @param replyToken
   * @param texts
   */
  public replyText(replyToken: string, texts: string | string[]) {
    const textArray = _.isArray(texts) ? texts : [texts];
    const messages: Message[] = _.map(textArray, (text) => (<Message>{ type: 'text', text }));
    return this.lineClient.replyMessage(replyToken, messages);
  }
}
